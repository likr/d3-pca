import emlapack from 'emlapack';

const dsyrk = emlapack.cwrap('f2c_dsyrk', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      dsyev = emlapack.cwrap('dsyev_', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);

const cov = (x, n, m) => {
  var puplo = emlapack._malloc(1),
      ptrans = emlapack._malloc(1),
      pm = emlapack._malloc(4),
      pn = emlapack._malloc(4),
      palpha = emlapack._malloc(8),
      plda = emlapack._malloc(4),
      pbeta = emlapack._malloc(8),
      pc = emlapack._malloc(m * m * 8),
      pldc = emlapack._malloc(4),
      c = new Float64Array(emlapack.HEAPF64.buffer, pc, m * m);

  emlapack.setValue(puplo, 'U'.charCodeAt(0), 'i8');
  emlapack.setValue(ptrans, 'N'.charCodeAt(0), 'i8');
  emlapack.setValue(pm, m, 'i32');
  emlapack.setValue(pn, n, 'i32');
  emlapack.setValue(palpha, 1 / n, 'double');
  emlapack.setValue(pbeta, 0, 'double');
  emlapack.setValue(plda, m, 'i32');
  emlapack.setValue(pldc, m, 'i32');

  dsyrk(puplo, ptrans, pm, pn, palpha, x.byteOffset, plda, pbeta, pc, pldc);

  return c;
};

const eig = (x, n, m) => {
  const E = cov(x, n, m),
        pjobz = emlapack._malloc(1),
        puplo = emlapack._malloc(1),
        pn = emlapack._malloc(4),
        plda = emlapack._malloc(4),
        pw = emlapack._malloc(m * 8),
        plwork = emlapack._malloc(4),
        pinfo = emlapack._malloc(4),
        pworkopt = emlapack._malloc(4),
        lambda = new Float64Array(emlapack.HEAPF64.buffer, pw, m);

  emlapack.setValue(pjobz, 'V'.charCodeAt(0), 'i8');
  emlapack.setValue(puplo, 'U'.charCodeAt(0), 'i8');
  emlapack.setValue(pn, m, 'i32');
  emlapack.setValue(plda, m, 'i32');
  emlapack.setValue(plwork, -1, 'i32');

  dsyev(pjobz, puplo, pn, E.byteOffset, plda, pw, pworkopt, plwork, pinfo);

  var workopt = emlapack.getValue(pworkopt, 'double'),
      pwork = emlapack._malloc(workopt * 8);
  emlapack.setValue(plwork, workopt, 'i32');

  dsyev(pjobz, puplo, pn, E.byteOffset, plda, pw, pwork, plwork, pinfo);

  return {lambda, E};
};

const privates = new WeakMap();

class PCA {
  constructor(data) {
    const keys = Object.keys(data[0].values),
          n = data.length,
          m = keys.length,
          px = emlapack._malloc(n * m * 8),
          x = new Float64Array(emlapack.HEAPF64.buffer, px, n * m),
          xBar = new Float64Array(m);
    for (let i = 0; i < m; ++i) {
      let sum = 0;
      for (let j = 0; j < n; ++j) {
        const value = data[j].values[keys[i]];
        sum += value;
        x[j * m + i] = value;
      }
      xBar[i] = sum / n;
      for (let j = 0; j < n; ++j) {
        x[j * m + i] -= xBar[i];
      }
    }

    const {lambda, E} = eig(x, n, m);
    privates.set(this, {
      data,
      keys,
      m,
      xBar,
      E,
      lambda
    });
  }

  get(index1, index2) {
    const {data, keys, m, xBar, E} = privates.get(this);
    const pca1 = new Float64Array(m),
          pca2 = new Float64Array(m);
    for (let i = 0; i < m; ++i) {
      const j1 = m - 1 - index1,
            j2 = m - 1 - index2;
      pca1[i] = E[j1 * m + i];
      pca2[i] = E[j2 * m + i];
    }

    const loadings = keys.map((key, i) => {
      return {
        key: key,
        value: {
          x: pca1[i],
          y: pca2[i]
        }
      };
    });
    const scores = data.map((d) => {
      let xd = 0,
          yd = 0;
      for (let i = 0, n = keys.length; i < n; ++i) {
        xd += (d.values[keys[i]] - xBar[i]) * pca1[i];
        yd += (d.values[keys[i]] - xBar[i]) * pca2[i];
      }
      return {
        key: d.name,
        value: {
          x: xd,
          y: yd
        }
      };
    });

    return {loadings, scores};
  }

  lambda() {
    const arr = Array.from(privates.get(this).lambda);
    arr.sort((x, y) => y - x);
    return arr;
  }
}

export default PCA;
