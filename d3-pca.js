d3.pca = (function() {
  'use strict';

  return function pca() {
    var width = 800;
    var height = 700;
    var margin = 50;
    var scoreColor = 'skyblue';
    var loadingColor = 'orange';
    var leadColor = 'lightgray';
    var loadingOpacity = 0.8;
    var textSize = 9;
    var circleR = 5;

    return function(selection) {
      selection.each(function(data) {
        var keys = Object.keys(data[0].values);
        var xBar = keys.map(function(key) {
          return data.reduce(function(sum, d) {
            return sum + d.values[key];
          }, 0) / data.length;
        });
        var sigma = cov(keys.map(function(key) {
          return data.map(function(d) {
            return d.values[key];
          });
        }));

        var ev = numeric.eig(sigma);
        var indices = ev.lambda.x.map(function(_, i) {
          return i;
        });
        indices.sort(function(a, b) {
          return ev.lambda.x[b] - ev.lambda.x[a];
        });
        var pca1 = ev.E.x.map(function(xi) {
          return xi[indices[0]];
        });
        var pca2 = ev.E.x.map(function(xi) {
          return xi[indices[1]];
        });
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
          var x = 0;
          var y = 0;
          var i, n;
          for (i = 0, n = keys.length; i < n; ++i) {
            x += (d.values[keys[i]] - xBar[i]) * pca1[i];
            y += (d.values[keys[i]] - xBar[i]) * pca2[i];
          }
          return {
            key: d.name,
            value: {
              x: x,
              y: y
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

        var selection = svg.append('g')
          .classed('plot-area', true)
          .attr('transform', 'translate(' + margin + ',' + margin + ')');

        var drag = d3.behavior.drag()
          .on('dragstart', function(d) {
            var mouse = d3.mouse(selection.node());
            d.x0 = mouse[0];
            d.y0 = mouse[1];
          })
          .on('drag', function(d) {
            var mouse = d3.mouse(selection.node());
            var text = d3.select(this);
            var x = +text.attr('x') + mouse[0] - d.x0;
            var y = +text.attr('y') + mouse[1] - d.y0;
            text
              .attr({
                x: x,
                y: y
              });
            selection
              .selectAll('line.lead')
              .filter(function(d2) {
                return d === d2;
              })
              .attr({
                x2: x,
                y2: y
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
        var scoresSelection = selection.append('g')
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
        var loadingsSelection = selection.append('g')
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

  function cov(x) {
    var i, j, k, val;
    var n = x.length;
    var m = x[0].length;
    var xBar = x.map(function(xi) {
      return xi.reduce(function(a, b) {
        return a + b;
      }) / m;
    });
    var sigma = new Array(n);
    for (i = 0; i < n; ++i) {
      sigma[i] = new Array(n);
      for (j = 0; j < n; ++j) {
        sigma[i][j] = 0;
      }
    }
    for (i = 0; i < n; ++i) {
      for (j = i; j < n; ++j) {
        val = 0;
        for (k = 0; k < m; ++k) {
          val += (x[i][k] - xBar[i]) * (x[j][k] - xBar[j]);
        }
        val /= m - 1;
        sigma[i][j] = sigma[j][i] = val;
      }
    }

    return sigma;
  }
})();
