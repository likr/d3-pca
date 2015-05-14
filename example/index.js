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
    var pca = new PCA()
      .size([400, 400]);

    d3.select('#display1')
      .datum(data)
      .call(pca.render());

    d3.select('#display2')
      .datum(data)
      .call(pca.index2(2).render());

    d3.select('#display3')
      .datum(data)
      .call(pca.index1(1).render());
  });
