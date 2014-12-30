(function() {
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
      var pca = d3.pca();

      d3.select('#display')
        .datum(data)
        .call(pca);
    });
})();
