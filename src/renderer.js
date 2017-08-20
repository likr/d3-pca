const d3 = require('d3')

const render = ({index1, index2, width, height, margin, scoreColor, loadingColor, leadColor, loadingOpacity, textSize, circleR}) => {
  return (selection) => {
    selection.each(function ({loadings, scores}) {
      const svg = d3.select(this)
        .attr('width', width + 2 * margin + 100)
        .attr('height', height + 2 * margin)
      svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('refX', 0)
        .attr('refY', 6)
        .attr('markerWidth', 12)
        .attr('markerHeight', 12)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0,0 V 12 L12,6 Z')
        .attr('fill', loadingColor)

      const g = svg.append('g')
        .classed('plot-area', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')

      const drag = d3.drag()
        .on('start', (d) => {
          const mouse = d3.mouse(g.node())
          d.x0 = mouse[0]
          d.y0 = mouse[1]
        })
        .on('drag', function (d) {
          const mouse = d3.mouse(g.node())
          const text = d3.select(this)
          const xd = +text.attr('x') + mouse[0] - d.x0
          const yd = +text.attr('y') + mouse[1] - d.y0
          text
            .attr('x', xd)
            .attr('y', yd)
          g
            .selectAll('line.lead')
            .filter((d2) => d === d2)
            .attr('x2', xd)
            .attr('y2', yd)
          d.x0 = mouse[0]
          d.y0 = mouse[1]
        })

      const scoreXMax = d3.max(scores, (d) => Math.abs(d.value.x))
      const scoreXScale = d3.scaleLinear()
        .domain([-scoreXMax, scoreXMax])
        .range([0, width])
        .nice()
      const scoreYMax = d3.max(scores, (d) => Math.abs(d.value.y))
      const scoreYScale = d3.scaleLinear()
        .domain([-scoreYMax, scoreYMax])
        .range([height, 0])
        .nice()
      const scoresSelection = g.append('g')
        .classed('scores', true)
      const scoresEnterSelection = scoresSelection
        .selectAll('g.score')
        .data(scores)
        .enter()
        .append('g')
        .classed('score', true)
      scoresEnterSelection
        .append('line')
        .classed('lead', true)
        .attr('x1', (d) => scoreXScale(d.value.x))
        .attr('y1', (d) => scoreYScale(d.value.y))
        .attr('x2', (d) => scoreXScale(d.value.x))
        .attr('y2', (d) => scoreYScale(d.value.y))
        .attr('stroke', leadColor)
      scoresEnterSelection
        .append('circle')
        .attr('cx', (d) => scoreXScale(d.value.x))
        .attr('cy', (d) => scoreYScale(d.value.y))
        .attr('r', circleR)
        .attr('fill', scoreColor)
      scoresEnterSelection
        .append('text')
        .text((d) => d.key)
        .attr('x', (d) => scoreXScale(d.value.x))
        .attr('y', (d) => scoreYScale(d.value.y))
        .attr('dx', circleR)
        .attr('stroke', scoreColor)
        .attr('font-size', textSize)
        .style('cursor', 'move')
        .call(drag)

      const loadingXMax = Math.abs(d3.max(loadings, (d) => Math.abs(d.value.x)))
      const loadingXScale = d3.scaleLinear()
        .domain([-loadingXMax, loadingXMax])
        .range([0, width])
        .nice()
      const loadingYMax = Math.abs(d3.max(loadings, (d) => Math.abs(d.value.y)))
      const loadingYScale = d3.scaleLinear()
        .domain([-loadingYMax, loadingYMax])
        .range([height, 0])
        .nice()
      const loadingsSelection = g.append('g')
        .classed('loadings', true)
      const loadingsEnterSelection = loadingsSelection
        .selectAll('g.loading')
        .data(loadings)
        .enter()
        .append('g')
        .classed('loading', true)
      loadingsEnterSelection
        .append('line')
        .classed('lead', true)
        .attr('x1', (d) => loadingXScale(d.value.x))
        .attr('y1', (d) => loadingYScale(d.value.y))
        .attr('x2', (d) => loadingXScale(d.value.x))
        .attr('y2', (d) => loadingYScale(d.value.y))
        .attr('stroke', leadColor)
      loadingsEnterSelection
        .append('line')
        .classed('arrow', true)
        .attr('x1', loadingXScale(0))
        .attr('y1', loadingYScale(0))
        .attr('x2', (d) => loadingXScale(d.value.x))
        .attr('y2', (d) => loadingYScale(d.value.y))
        .attr('stroke', loadingColor)
        .attr('opacity', loadingOpacity)
        .attr('marker-end', 'url(#arrowhead)')
      loadingsEnterSelection
        .append('text')
        .text((d) => d.key)
        .attr('x', (d) => loadingXScale(d.value.x))
        .attr('y', (d) => loadingYScale(d.value.y))
        .attr('dx', 8)
        .attr('dy', 4)
        .attr('stroke', loadingColor)
        .attr('opacity', loadingOpacity)
        .attr('font-size', textSize)
        .style('cursor', 'move')
        .call(drag)

      const loadingXAxis = d3.axisBottom()
        .scale(loadingXScale)
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
        .call(loadingXAxis)
      const loadingYAxis = d3.axisLeft()
        .scale(loadingYScale)
      svg.append('g')
        .classed('loading-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(loadingYAxis)
      const scoreXAxis = d3.axisTop()
        .scale(scoreXScale)
      svg.append('g')
        .classed('score-axis', true)
        .attr('transform', 'translate(' + margin + ',' + margin + ')')
        .call(scoreXAxis)
      const scoreYAxis = d3.axisRight()
        .scale(scoreYScale)
      svg.append('g')
        .classed('score-axis', true)
        .attr('transform', 'translate(' + (margin + width) + ',' + margin + ')')
        .call(scoreYAxis)
      svg.selectAll('g.loading-axis g.tick line')
        .attr('stroke', loadingColor)
      svg.selectAll('g.loading-axis g.tick text')
        .attr('fill', loadingColor)
      svg.selectAll('g.score-axis g.tick line, g.score-axis g.tick text')
        .attr('stroke', scoreColor)
      svg.selectAll('g.score-axis g.tick text')
        .attr('fill', scoreColor)
      svg.selectAll('g.loading-axis path.domain')
        .attr({
          fill: 'none',
          stroke: loadingColor
        })
      svg.selectAll('g.score-axis path.domain')
        .attr('fill', 'none')
        .attr('stroke', scoreColor)
    })
  }
}

const privates = new WeakMap()

const accessor = (self, key, value = null) => {
  if (value === null) {
    return privates.get(self)[key]
  }
  privates.get(self)[key] = value
  return self
}

class Renderer {
  constructor () {
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
    })
  }

  render () {
    const [width, height] = this.size()
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
    })
  }

  size (arg = null) {
    return accessor(this, 'size', arg)
  }

  margin (arg = null) {
    return accessor(this, 'margin', arg)
  }

  scoreColor (arg = null) {
    return accessor(this, 'scoreColor', arg)
  }

  loadingColor (arg = null) {
    return accessor(this, 'loadingColor', arg)
  }

  leadColor (arg = null) {
    return accessor(this, 'leadColor', arg)
  }

  loadingOpacity (arg = null) {
    return accessor(this, 'loadingOpacity', arg)
  }

  textSize (arg = null) {
    return accessor(this, 'textSize', arg)
  }

  circleR (arg = null) {
    return accessor(this, 'circleR', arg)
  }
}

exports.Renderer = Renderer
