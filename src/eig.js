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
  const sigma = cov(x, n, m),
        pjobz = emlapack._malloc(1),
        puplo = emlapack._malloc(1),
        pn = emlapack._malloc(4),
        plda = emlapack._malloc(4),
        pw = emlapack._malloc(m * 8),
        plwork = emlapack._malloc(4),
        pinfo = emlapack._malloc(4),
        pworkopt = emlapack._malloc(4),
        w = new Float64Array(emlapack.HEAPF64.buffer, pw, m);

  emlapack.setValue(pjobz, 'V'.charCodeAt(0), 'i8');
  emlapack.setValue(puplo, 'U'.charCodeAt(0), 'i8');
  emlapack.setValue(pn, m, 'i32');
  emlapack.setValue(plda, m, 'i32');
  emlapack.setValue(plwork, -1, 'i32');

  dsyev(pjobz, puplo, pn, sigma.byteOffset, plda, pw, pworkopt, plwork, pinfo);

  var workopt = emlapack.getValue(pworkopt, 'double'),
      pwork = emlapack._malloc(workopt * 8);
  emlapack.setValue(plwork, workopt, 'i32');

  dsyev(pjobz, puplo, pn, sigma.byteOffset, plda, pw, pwork, plwork, pinfo);

  return {
    E: sigma,
    lambda: w
  };
};

export default eig;
