import d3 from 'd3';
import PCA from '../src'

d3.csv('data.csv')
  .row(function(d) {
    var obj = {
      name: d.name,
      values: {}
    };
    var key;
    for (key in d) {
      if (key !== 'name') {
        obj.values[key] = +d[key];
      }
    }
    return obj;
  })
  .get(function(errors, data) {
    var pca = new PCA();

    d3.select('#display')
      .datum(data)
      .call(pca.render());
  });
