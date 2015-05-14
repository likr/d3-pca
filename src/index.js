'use strict';

import d3 from 'd3';
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

const render = ({width, height, margin, scoreColor, loadingColor, leadColor, loadingOpacity, textSize, circleR}) => {
  return (selection) => {
    selection.each(function (data) {
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

      var ev = eig(x, n, m);

      const pca1 = new Float64Array(m),
            pca2 = new Float64Array(m);
      for (let i = 0; i < m; ++i) {
        const j1 = m - 1,
              j2 = m - 2;
        pca1[i] = ev.E[j1 * m + i];
        pca2[i] = ev.E[j2 * m + i];
      }

      var loadings = keys.map(function(key, i) {
        return {
          key: key,
          value: {
            x: pca1[i],
            y: pca2[i]
          }
        };
      });
      var scores = data.map(function(d) {
        var xd = 0;
        var yd = 0;
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

      var svg = d3.select(this)
        .attr({
          width: width + 2 * margin + 100,
          height: height + 2 * margin
        });
      svg
        .append('defs')
        .append('marker')
        .attr({
          id: 'arrowhead',
          refX: 0,
          refY: 6,
          markerWidth: 12,
          markerHeight: 12,
          orient: 'auto'
        })
        .append('path')
        .attr({
          d: 'M 0,0 V 12 L12,6 Z',
          fill: loadingColor
        });

      var g = svg.append('g')
        .classed('plot-area', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')');

      var drag = d3.behavior.drag()
        .on('dragstart', function(d) {
          var mouse = d3.mouse(g.node());
          d.x0 = mouse[0];
          d.y0 = mouse[1];
        })
        .on('drag', function(d) {
          var mouse = d3.mouse(g.node());
          var text = d3.select(this);
          var xd = +text.attr('x') + mouse[0] - d.x0;
          var yd = +text.attr('y') + mouse[1] - d.y0;
          text
            .attr({
              x: xd,
              y: yd
            });
          g
            .selectAll('line.lead')
            .filter(function(d2) {
              return d === d2;
            })
            .attr({
              x2: xd,
              y2: yd
            });
          d.x0 = mouse[0];
          d.y0 = mouse[1];
        })
        .on('dragend', function(d) {
        });

      var scoreXMax = d3.max(scores, function(d) {
        return Math.abs(d.value.x);
      });
      var scoreXScale = d3.scale.linear()
        .domain([-scoreXMax, scoreXMax])
        .range([0, width])
        .nice();
      var scoreYMax = d3.max(scores, function(d) {
        return Math.abs(d.value.y);
      });
      var scoreYScale = d3.scale.linear()
        .domain([-scoreYMax, scoreYMax])
        .range([height, 0])
        .nice();
      var scoresSelection = g.append('g')
        .classed('scores', true);
      var scoresEnterSelection = scoresSelection
        .selectAll('g.score')
        .data(scores)
        .enter()
        .append('g')
        .classed('score', true);
      scoresEnterSelection
        .append('line')
        .classed('lead', true)
        .attr({
          x1: function(d) {
            return scoreXScale(d.value.x);
          },
          y1: function(d) {
            return scoreYScale(d.value.y);
          },
          x2: function(d) {
            return scoreXScale(d.value.x);
          },
          y2: function(d) {
            return scoreYScale(d.value.y);
          },
          stroke: leadColor
        });
      scoresEnterSelection
        .append('circle')
        .attr({
          cx: function(d) {
            return scoreXScale(d.value.x);
          },
          cy: function(d) {
            return scoreYScale(d.value.y);
          },
          r: circleR,
          fill: scoreColor
        });
      scoresEnterSelection
        .append('text')
        .text(function(d) {
          return d.key;
        })
        .attr({
          x: function(d) {
            return scoreXScale(d.value.x);
          },
          y: function(d) {
            return scoreYScale(d.value.y);
          },
          dx: circleR,
          stroke: scoreColor,
          'font-size': textSize
        })
        .style('cursor', 'move')
        .call(drag);

      var loadingXMax = Math.abs(d3.max(loadings, function(d) {
        return Math.abs(d.value.x);
      }));
      var loadingXScale = d3.scale.linear()
        .domain([-loadingXMax, loadingXMax])
        .range([0, width])
        .nice();
      var loadingYMax = Math.abs(d3.max(loadings, function(d) {
        return Math.abs(d.value.y);
      }));
      var loadingYScale = d3.scale.linear()
        .domain([-loadingYMax, loadingYMax])
        .range([height, 0])
        .nice();
      var loadingsSelection = g.append('g')
        .classed('loadings', true);
      var loadingsEnterSelection = loadingsSelection
        .selectAll('g.loading')
        .data(loadings)
        .enter()
        .append('g')
        .classed('loading', true);
      loadingsEnterSelection
        .append('line')
        .classed('lead', true)
        .attr({
          x1: function(d) {
            return loadingXScale(d.value.x);
          },
          y1: function(d) {
            return loadingYScale(d.value.y);
          },
          x2: function(d) {
            return loadingXScale(d.value.x);
          },
          y2: function(d) {
            return loadingYScale(d.value.y);
          },
          stroke: leadColor
        });
      loadingsEnterSelection
        .append('line')
        .classed('arrow', true)
        .attr({
          x1: loadingXScale(0),
          y1: loadingYScale(0),
          x2: function(d) {
            return loadingXScale(d.value.x);
          },
          y2: function(d) {
            return loadingYScale(d.value.y);
          },
          stroke: loadingColor,
          opacity: loadingOpacity,
          'marker-end': 'url(#arrowhead)'
        });
      loadingsEnterSelection
        .append('text')
        .text(function(d) {
          return d.key;
        })
        .attr({
          x: function(d) {
            return loadingXScale(d.value.x);
          },
          y: function(d) {
            return loadingYScale(d.value.y);
          },
          dx: 8,
          dy: 4,
          stroke: loadingColor,
          opacity: loadingOpacity,
          'font-size': textSize
        })
        .style('cursor', 'move')
        .call(drag);

      var loadingXAxis = d3.svg.axis()
        .orient('bottom')
        .scale(loadingXScale);
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
        .call(loadingXAxis);
      var loadingYAxis = d3.svg.axis()
        .orient('left')
        .scale(loadingYScale);
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(loadingYAxis);
      var scoreXAxis = d3.svg.axis()
        .orient('top')
        .scale(scoreXScale);
      svg.append('g')
        .classed('score-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(scoreXAxis);
      var scoreYAxis = d3.svg.axis()
        .orient('right')
        .scale(scoreYScale);
      svg.append('g')
        .classed('score-axis', true)
        .attr('transform', 'translate(' + (margin + width) + ',' + margin + ')')
        .call(scoreYAxis);
      svg.selectAll('g.loading-axis g.tick line')
        .attr('stroke', loadingColor);
      svg.selectAll('g.loading-axis g.tick text')
        .attr('fill', loadingColor);
      svg.selectAll('g.score-axis g.tick line, g.score-axis g.tick text')
        .attr('stroke', scoreColor);
      svg.selectAll('g.score-axis g.tick text')
        .attr('fill', scoreColor);
      svg.selectAll('g.loading-axis path.domain')
        .attr({
          fill: 'none',
          stroke: loadingColor
        });
      svg.selectAll('g.score-axis path.domain')
        .attr({
          fill: 'none',
          stroke: scoreColor
        });
    });
  };
};

const privates = new WeakMap();

class PCA {
  constructor() {
    privates.set(this, {
    });
  }

  render() {
    return render({
      width: 800,
      height: 700,
      margin: 50,
      scoreColor: 'skyblue',
      loadingColor: 'orange',
      leadColor: 'lightgray',
      loadingOpacity: 0.8,
      textSize: 9,
      circleR: 5
    });
  }
}

export default PCA;
