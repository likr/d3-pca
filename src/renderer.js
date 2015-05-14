import d3 from 'd3';

const render = ({index1, index2, width, height, margin, scoreColor, loadingColor, leadColor, loadingOpacity, textSize, circleR}) => {
  return (selection) => {
    selection.each(function ({loadings, scores}) {
      const svg = d3.select(this)
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

      const g = svg.append('g')
        .classed('plot-area', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')');

      const drag = d3.behavior.drag()
        .on('dragstart', (d) => {
          const mouse = d3.mouse(g.node());
          d.x0 = mouse[0];
          d.y0 = mouse[1];
        })
        .on('drag', function (d) {
          const mouse = d3.mouse(g.node()),
                text = d3.select(this),
                xd = +text.attr('x') + mouse[0] - d.x0,
                yd = +text.attr('y') + mouse[1] - d.y0;
          text
            .attr({
              x: xd,
              y: yd
            });
          g
            .selectAll('line.lead')
            .filter((d2) => d === d2)
            .attr({
              x2: xd,
              y2: yd
            });
          d.x0 = mouse[0];
          d.y0 = mouse[1];
        });

      const scoreXMax = d3.max(scores, (d) => Math.abs(d.value.x));
      const scoreXScale = d3.scale.linear()
        .domain([-scoreXMax, scoreXMax])
        .range([0, width])
        .nice();
      const scoreYMax = d3.max(scores, (d) => Math.abs(d.value.y));
      const scoreYScale = d3.scale.linear()
        .domain([-scoreYMax, scoreYMax])
        .range([height, 0])
        .nice();
      const scoresSelection = g.append('g')
        .classed('scores', true);
      const scoresEnterSelection = scoresSelection
        .selectAll('g.score')
        .data(scores)
        .enter()
        .append('g')
        .classed('score', true);
      scoresEnterSelection
        .append('line')
        .classed('lead', true)
        .attr({
          x1: (d) => scoreXScale(d.value.x),
          y1: (d) => scoreYScale(d.value.y),
          x2: (d) => scoreXScale(d.value.x),
          y2: (d) => scoreYScale(d.value.y),
          stroke: leadColor
        });
      scoresEnterSelection
        .append('circle')
        .attr({
          cx: (d) => scoreXScale(d.value.x),
          cy: (d) => scoreYScale(d.value.y),
          r: circleR,
          fill: scoreColor
        });
      scoresEnterSelection
        .append('text')
        .text((d) => d.key)
        .attr({
          x: (d) => scoreXScale(d.value.x),
          y: (d) => scoreYScale(d.value.y),
          dx: circleR,
          stroke: scoreColor,
          'font-size': textSize
        })
        .style('cursor', 'move')
        .call(drag);

      const loadingXMax = Math.abs(d3.max(loadings, (d) => Math.abs(d.value.x)));
      const loadingXScale = d3.scale.linear()
        .domain([-loadingXMax, loadingXMax])
        .range([0, width])
        .nice();
      const loadingYMax = Math.abs(d3.max(loadings, (d) => Math.abs(d.value.y)));
      const loadingYScale = d3.scale.linear()
        .domain([-loadingYMax, loadingYMax])
        .range([height, 0])
        .nice();
      const loadingsSelection = g.append('g')
        .classed('loadings', true);
      const loadingsEnterSelection = loadingsSelection
        .selectAll('g.loading')
        .data(loadings)
        .enter()
        .append('g')
        .classed('loading', true);
      loadingsEnterSelection
        .append('line')
        .classed('lead', true)
        .attr({
          x1: (d) => loadingXScale(d.value.x),
          y1: (d) => loadingYScale(d.value.y),
          x2: (d) => loadingXScale(d.value.x),
          y2: (d) => loadingYScale(d.value.y),
          stroke: leadColor
        });
      loadingsEnterSelection
        .append('line')
        .classed('arrow', true)
        .attr({
          x1: loadingXScale(0),
          y1: loadingYScale(0),
          x2: (d) => loadingXScale(d.value.x),
          y2: (d) => loadingYScale(d.value.y),
          stroke: loadingColor,
          opacity: loadingOpacity,
          'marker-end': 'url(#arrowhead)'
        });
      loadingsEnterSelection
        .append('text')
        .text((d) => d.key)
        .attr({
          x: (d) => loadingXScale(d.value.x),
          y: (d) => loadingYScale(d.value.y),
          dx: 8,
          dy: 4,
          stroke: loadingColor,
          opacity: loadingOpacity,
          'font-size': textSize
        })
        .style('cursor', 'move')
        .call(drag);

      const loadingXAxis = d3.svg.axis()
        .orient('bottom')
        .scale(loadingXScale);
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
        .call(loadingXAxis);
      const loadingYAxis = d3.svg.axis()
        .orient('left')
        .scale(loadingYScale);
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(loadingYAxis);
      const scoreXAxis = d3.svg.axis()
        .orient('top')
        .scale(scoreXScale);
      svg.append('g')
        .classed('score-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(scoreXAxis);
      const scoreYAxis = d3.svg.axis()
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

const accessor = (self, key, value=null) => {
  if (value === null) {
    return privates.get(self)[key];
  }
  privates.get(self)[key] = value;
  return self;
};

class Renderer {
  constructor() {
    privates.set(this, {
      index1: 0,
      index2: 1,
      size: [800, 700],
      margin: 50,
      scoreColor: 'skyblue',
      loadingColor: 'orange',
      leadColor: 'lightgray',
      loadingOpacity: 0.8,
      textSize: 9,
      circleR: 5
    });
  }

  render() {
    const [width, height] = this.size();
    return render({
      width: width,
      height: height,
      margin: this.margin(),
      scoreColor: this.scoreColor(),
      loadingColor: this.loadingColor(),
      leadColor: this.leadColor(),
      loadingOpacity: this.loadingOpacity(),
      textSize: this.textSize(),
      circleR: this.circleR()
    });
  }

  size(arg=null) {
    return accessor(this, 'size', arg);
  }

  margin(arg=null) {
    return accessor(this, 'margin', arg);
  }

  scoreColor(arg=null) {
    return accessor(this, 'scoreColor', arg);
  }

  loadingColor(arg=null) {
    return accessor(this, 'loadingColor', arg);
  }

  leadColor(arg=null) {
    return accessor(this, 'leadColor', arg);
  }

  loadingOpacity(arg=null) {
    return accessor(this, 'loadingOpacity', arg);
  }

  textSize(arg=null) {
    return accessor(this, 'textSize', arg);
  }

  circleR(arg=null) {
    return accessor(this, 'circleR', arg);
  }
}

export default Renderer;
