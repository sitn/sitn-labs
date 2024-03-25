
import Map from 'ol/Map.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
// import View from 'ol/View.js';
import { Draw, Modify, Snap } from 'ol/interaction.js';
// import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
// import { LineString, Polygon } from 'ol/geom.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import * as d3 from "d3";

// https://xoor.io/blog/mastering-d3-js-part-1-using-canvas-to-better-scale-charts
// https://qmachard.github.io/d3js-examples/examples/multiseries-line.html
// https://stackoverflow.com/questions/41591430/d3-multi-series-line-chart-with-zoom
// https://www.datamake.io/blog/d3-zoom
// https://xoor-io.github.io/d3-canvas-example/02_scatterplot_with_zoom/index.html



// EVENT LISTENERS

// Listen for keyboard arrow key down events
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        shiftProfile([0.0, 0.5])
    } else if (e.key === 'ArrowDown') {
        shiftProfile([0.0, -0.5])
    } else if (e.key === 'ArrowLeft') {
        shiftProfile([-0.5, 0.0])
    } else if (e.key === 'ArrowRight') {
        shiftProfile([0.5, 0.0])
    }
})

// CHART
class Chart {

    constructor(height, width, margins, data) {
        this.height = height
        this.width = width
        this.margins = margins
        this.data = data
        this.bbox = { xmin: 0, xmax: 100, ymin: 0, ymax: 100 }
    }

    get filteredData() {
        return this.data.filter(x => (x[0] >= this.bbox.xmin) & (x[0] <= this.bbox.xmax) & (x[1] >= this.bbox.ymin) & (x[1] <= this.bbox.ymax))
    }

    get timeLine() {
        layerIndex = parseInt(document.getElementById("layer-selector").value)
    }

    get maxHeight() {
        return 250
    }

    get innerWidth() {
        return this.width - this.margins.left - this.margins.right
    }

    get innerHeight() {
        return this.height - this.margins.top - this.margins.bottom
    }

    get xExtent() {

        /*
        let x_data = this.data.map(x => x[0]).filter(x => (x >= 12.0) & (x <= 25))
        let x_extent = d3.extent(x_data)
        let x_extent2 = d3.extent(this.data, d => d[0])

        console.log(this.data.map(x => x[0]))
        console.log(x_data)

        console.log(`x_extent: ${x_extent}`)
        console.log(`x_extent2: ${x_extent2}`)
        */

        // console.log('x_extent')
        // console.log(x_extent)

        let x_extent = d3.extent(this.data, d => d[0])
        // let x_extent = d3.extent(this.filteredData, d => d[0])
        // let x_extent = [this.bbox.xmin, this.bbox.xmax]
        return x_extent
    }

    get yExtent() {

        let y_extent = d3.extent(this.data, d => d[1])
        // let y_extent = d3.extent(this.filteredData, d => d[1])
        //let y_extent = [this.bbox.ymin, this.bbox.ymax]
        return y_extent
    }

    get dataWidth() {
        return this.xExtent[1] - this.xExtent[0]
    }

    get dataHeight() {
        return this.yExtent[1] - this.yExtent[0]
    }

    get dataAspectRatio() {
        return this.dataWidth / this.dataHeight
    }

    get chartAspectRatio() {
        return this.innerWidth / this.innerHeight
    }

    get xExtentAdjust() {
        if (this.dataAspectRatio <= this.chartAspectRatio) {
            return [this.xExtent[0], this.chartAspectRatio * this.dataHeight + this.xExtent[0]]
        } else {
            return this.xExtent
        }
    }

    get yExtentAdjust() {
        if (this.dataAspectRatio > this.chartAspectRatio) {
            return [this.yExtent[0], this.dataWidth / this.chartAspectRatio + this.yExtent[0]]
        } else {
            return this.yExtent
        }
    }

    get xRange() {
        return [this.margins.left, this.width - this.margins.right]
    }

    get yRange() {
        return [this.height - this.margins.bottom, this.margins.top]
    }

    get xScale() {
        return d3.scaleLinear(this.xExtentAdjust, this.xRange) // .nice()
    }

    set xScale(newXScale) {
        this._name = newXScale
    }

    get yScale() {
        // const xStep = Math.abs((this.xExtent[1] - this.xExtent[0]) / (this.xRange[1] - this.xRange[0]))
        // const yStep = Math.abs((this.yExtent[1] - this.yExtent[0]) / (this.yRange[1] - this.yRange[0]))
        // const ratio = yStep / xStep
        // const yRangeAdj = [this.yRange[0], this.yRange[0] - (this.yExtent[1] - this.yExtent[0]) / xStep]
        return d3.scaleLinear(this.yExtentAdjust, this.yRange) // .nice()
    }

    get xAxis() {
        return d3.axisBottom(this.xScale).ticks(this.width / 100) // .tickSizeOuter(0)
    }

    get yAxis() {
        return d3.axisLeft(this.yScale).ticks(this.height / 30) // .tickSizeOuter(0)
    }

    get xAxisGrid() {
        return d3.axisBottom(this.xScale).tickSize(-this.innerHeight).tickFormat('').ticks(this.width / 80)
    }

    get yAxisGrid() {
        return d3.axisLeft(this.yScale).tickSize(-this.innerWidth).tickFormat('').ticks(this.height / 60)
    }

    get line() {
        return d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
    }

    // UPDATE VIEWBOX
    updateViewbox() {
        d3.select('#svg-chart')
            .attr("width", '100%') // .attr("width", this.width) 
            .attr("height", '100%') // .attr("height", this.height)
            .attr("viewBox", `0,0,${this.width},${this.height}`)
    }

    updateClipPath() {
        d3.select('#clipRegion')
            .attr("x", this.margins.left)
            .attr("y", 0.0)
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight)
    }

    // UPDATE X-AXIS
    updateXAxis() {
        d3.select('#svg-x-axis')
            .attr("transform", `translate(0, ${this.height - this.margins.bottom})`)
            .style("font-size", "11pt")
            .call(this.xAxis)
    }

    // UPDATE Y-AXIS
    updateYAxis() {
        d3.select('#svg-y-axis')
            .attr("transform", `translate(${this.margins.left}, 0)`)
            .style("font-size", "11pt")
            .call(this.yAxis)
    }

    // UPDATE X-AXIS GRID
    updateXAxisGrid() {
        d3.select('#svg-x-grid')
            .attr("transform", `translate(${0}, ${this.height - this.margins.bottom})`)
            .call(this.xAxisGrid)
    }

    // UPDATE Y-AXIS GRID
    updateYAxisGrid() {
        d3.select('#svg-y-grid')
            .attr("transform", `translate(${this.margins.left}, ${0})`)
            .call(this.yAxisGrid)
    }

    // UPDATE X-AXIS LABEL
    updateXAxisLabel() {
        d3.select('#svg-x-label')
            .style("font-size", "11pt")
            .attr("x", this.margins.left + this.innerWidth / 2)
            .attr("y", 50)
    }

    // UPDATE Y-AXIS LABEL
    updateYAxisLabel() {
        d3.select('#svg-y-label')
            /* .style("font", "24px sans-serif") */
            .style("font-size", "11pt")
            .attr("x", -this.margins.top - this.innerHeight / 2)
            .attr("y", -50)
    }

    // UPDATE LINE
    updateLine() {
        d3.select('#svg-dataline')
            // .attr("d", this.line(this.filteredData))
            .attr("d", this.line(this.data))
    }

    // UPDATE SCALE
    updateScale(transform) {

        var newXScale = transform.rescaleX(this.xScale)
        var newYScale = transform.rescaleY(this.yScale)

        this.xAxis.call(d3.axisBottom(newXScale).ticks(this.width / 100))
        // this.yAxis.call(d3.axisLeft(newYScale))

    }

    // UPDATE DATA
    updateData(vals) {
        this.data = vals.filter(x => !isNaN(x[1]))
    }

    updatePlot() {
        this.width = document.getElementById("chart").clientWidth
        this.height = Math.min(Math.max(document.getElementById("chart").clientHeight, this.maxHeight + 0.0), this.maxHeight + 0.0) // add 32 to compensate for section padding (if there is any padding)

        console.log(`width: ${this.width}, height: ${this.height}`)
        console.log(`innerWidth: ${this.innerWidth}, innerHeight: ${this.innerHeight}`)
        console.log(`xRange: ${this.xRange}`)
        console.log(`yRange: ${this.yRange}`)
        console.log(`xExtent: ${this.xExtent}`)
        console.log(`yExtent: ${this.yExtent}`)
        console.log(`xExtentAdjust: ${this.xExtentAdjust}`)
        console.log(`yExtentAdjust: ${this.yExtentAdjust}`)
        console.log(`dataAspectRatio: ${this.dataAspectRatio}`)
        console.log(`chartAspectRatio: ${this.chartAspectRatio}`)

        this.updateViewbox()
        this.updateClipPath()
        this.updateXAxis()
        this.updateYAxis()
        this.updateXAxisGrid()
        this.updateYAxisGrid()
        this.updateXAxisLabel()
        this.updateYAxisLabel()
        this.updateLine()

    }

}

/* INITIALIZE PROFILE CHART */
// height, width, margins, data
var profile = new Chart(300, 650, { left: 85, right: 60, top: 0, bottom: 0 }, [])
profile.updatePlot()


let zoom = d3.zoom()
    .on('zoom', handleZoom)

/*
.scaleExtent([0.5, 10])
.extent([[0, 0], [profile.innerWidth, profile.innerHeight]])
.on('zoom', handleZoom)
*/

function handleZoom(e) {

    // profile.updateScale(e.transform)

    /*
    var newXScale = e.transform.rescaleX(profile.xScale)
    var newYScale = e.transform.rescaleY(profile.yScale)

    profile.xAxis.call(d3.axisBottom(newXScale).ticks(profile.width / 100))
    profile.yAxis.call(d3.axisLeft(newYScale))
    */

    /*
    // recover the new scale
    var newX = event.transform.rescaleX(profile.xScale);
    var newY = event.transform.rescaleY(profile.yScale);

    // update axes with these new boundaries
    profile.xAxis.call(d3.axisBottom(newX))
    profile.yAxis.call(d3.axisLeft(newY))
    */

    // update X scale

    // update Y scale

    //x2 = e.transform.rescaleX(chart.xAxis); 
    // xAxisG.call(xAxis.scale(x2));
    // path.attr("d", line);

    /*
    d3.selectAll('svg g')
        .attr('transform', e.transform)

    d3.select('svg #svg-dataline')
        .attr('transform', e.transform)
    */

    let tr = e.transform
    console.log(`transform`)
    console.log(tr)

    // new x and y scales
    const newScaleX = tr.rescaleX(profile.xScale)
    const newScaleY = tr.rescaleY(profile.yScale)

    /*
    profile.xScale = newScaleX
    profile.yScale = newScaleY
    profile.updateLine()
    */
    console.log('newScaleX.domain()')
    console.log(newScaleX.domain())

    console.log('newScaleY.domain()')
    console.log(newScaleY.domain())

    const newXDomain = newScaleX.domain()
    const newYDomain = newScaleY.domain()

    profile.bbox = { xmin: newXDomain[0], xmax: newXDomain[1], ymin: newYDomain[0], ymax: newYDomain[1] }

    console.log(profile.filteredData)

    // profile.updateLine()

    profile.updatePlot()

    // rescale x and y axes using the current zoom transform
    d3.select('svg').select('#svg-x-axis').call(profile.xAxis.scale(newScaleX))
    d3.select('svg').select('#svg-y-axis').call(profile.yAxis.scale(newScaleY))

    // rescale line
    var line2 = d3.line()
        .x(d => newScaleX(d[0]))
        .y(d => newScaleY(d[1]))

    console.log(`d3.select('#svg-dataline')`)
    console.log(d3.select('#svg-dataline'))

    d3.select('#svg-dataline')
        .attr("d", line2(profile.data))



    // zoom.scaleTo(d3.select('svg'), 2)
    // call(zoom).call(zoom.scaleTo, 0, 7)

    // d3.select('svg').select('#svg-dataline').call(zoom.transform, d3.zoomIdentity)

    // Geometric zoom (this does not re-render the line)
    // d3.select('svg').select('#svg-dataline').attr("transform", tr)
    // console.log(d3.select('svg').select('#svg-dataline').attr("d"))

    /*
    d3.select('svg').select('#svg-dataline')
        .attr("d",
            d3.line()
                .x(d => newScaleX(d[0]))
                .y(d => newScaleY(d[1]))
        )
    */


    /*
    d3.line()
    .x(d => this.xScale(d[0]))
    .y(d => this.yScale(d[1]))
*/

    // profile.updateLine()
    // profile.updatePlot()

    // d3.select('svg').select('#svg-x-grid').call(profile.xAxis.scale(newScaleY))
    // d3.select('svg').select('#svg-y-grid').call(profile.yAxis.scale(newScaleY))


}

function initZoom() {
    d3.select('svg')
        .call(zoom)
}

function resetZoom() {
    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
}

initZoom()

window.addEventListener('resize', function () {
    profile.updatePlot()
})

/* MAP GEOTIFF SOURCE */
const source = new GeoTIFF({
    normalize: false,
    interpolate: false,
    sources: [
        {
            name: 'DHM 2001',
            date: "01.06.2001",
            url: 'data/dhm_2001.cog.tif',
            bands: [1]
        },
        {
            name: 'DHM 2010',
            date: "15.06.2010",
            url: 'data/dhm_2010.cog.tif',
            bands: [1]
        },
        {
            name: 'DHM 2016',
            date: "01.05.2016",
            url: 'data/dhm_2016.cog.tif',
            bands: [1]
        },
        {
            name: 'DHM 2019',
            date: "01.01.2019",
            url: 'data/dhm_2019.cog.tif',
            bands: [1]
        },

        {
            name: 'DHM 2022',
            date: "01.01.2022",
            url: 'data/dhm_2022.cog.tif',
            bands: [1]
        },
        {
            name: 'DHM 2023',
            date: "01.01.2023",
            url: 'data/dhm_2023.cog.tif',
            bands: [1]
        },
    ],
})

var layerIndex = 0

/* UPDATE MAP AND PROFILE DISPLAY */
function update() {

    layerIndex = parseInt(document.getElementById("layer-selector").value)

    // update raster layer
    raster.updateStyleVariables({ bandno: layerIndex + 1 })

    // update profile layer
    shiftProfile()
    // drawProfile(feature)
}

var select = document.getElementById("layer-selector")

// LAYER SELECTOR EVENT LISTENER
select.addEventListener('change', update)

source.sourceInfo_.forEach((element, index) => {
    var option = document.createElement("option")
    option.text = element.name
    option.value = index
    select.add(option)
})

/* VECTOR LAYER */
const vsource = new VectorSource()
const vector = new VectorLayer({
    source: vsource,
    style: {
        'fill-color': 'rgba(255, 255, 255, 0.2)',
        'stroke-color': '#ff0000',
        'stroke-width': 2,
        'circle-radius': 7,
        'circle-fill-color': '#ffcc33',
    },
})

/* TILE LAYER */
const raster = new TileLayer({

    style: {
        variables: {
            bandno: 1,
        },
        color: [
            'case',
            ['between', ['band', ['var', 'bandno']], 0, 2],
            [255, 255, 255],
            ['between', ['band', ['var', 'bandno']], 2, 5],
            [255, 231, 132],
            ['between', ['band', ['var', 'bandno']], 5, 10],
            [206, 247, 123],
            ['between', ['band', ['var', 'bandno']], 10, 15],
            [140, 207, 99],
            ['between', ['band', ['var', 'bandno']], 15, 20],
            [33, 113, 0],
            ['between', ['band', ['var', 'bandno']], 20, 25],
            [74, 85, 0],
            ['between', ['band', ['var', 'bandno']], 25, 30],
            [57, 146, 123],
            ['between', ['band', ['var', 'bandno']], 30, 35],
            [16, 65, 115],
            ['between', ['band', ['var', 'bandno']], 35, 40],
            [255, 142, 0], // [255, 142, 0]
            ['between', ['band', ['var', 'bandno']], 40, 99999999],
            [255, 0, 0],
            [255, 255, 255]
        ],
    },
    source: source,
})

/* MAP */
const map = new Map({
    target: 'map',
    layers: [raster, vector],
    view: source.getView().then(function (options) {
        return {
            projection: options.projection,
            center: options.center,
            resolution: options.resolutions[options.zoom],
        }
    }),
    // view, // source.getView(),
})


/* MAP INTERACTIONS */

// const modify = new Modify({ source: vsource })
// map.addInteraction(modify)

let draw, snap;

function addInteractions() {
    draw = new Draw({
        source: vsource,
        type: 'LineString', // typeSelect.value,
        freehand: false,
    })

    draw.on(['drawstart'], x => {
        console.log('drawstart')
        // clear features
        vsource.clear()

    })
    draw.on(['drawend'], e => drawProfile(e.feature))

    map.addInteraction(draw)
    snap = new Snap({ source: vsource })
    map.addInteraction(snap)
}

addInteractions()


// MODIFY FEATURE GEOMETRY
function shiftProfile(shift = [0.0, 0.0]) {

    let featureList = vsource.getFeatures()

    if (featureList.length > 0) {

        let feature = featureList[0]
        let geom = feature.getGeometry()
        let coords = geom.getCoordinates()

        // add offset to coordinates
        geom.setCoordinates(coords.map(x => [x[0] + shift[0], x[1] + shift[1]]))

        // render profile
        drawProfile(feature)

    }

}

function getLinearCoordinates(xy) {

    let n = xy.length
    let d = Array(n).fill(0.0)

    for (let i = 1; i < n; i++) {
        let dx = xy[i][0] - xy[i - 1][0]
        let dy = xy[i][1] - xy[i - 1][1]
        d[i] = d[i - 1] + Math.sqrt(dx * dx + dy * dy)
    }

    return d

}

/* function interpolateCoordinates(xy) {
    let n = xy.length
    let xi, yi

    for (let i = 1; i < n; i++) {
        let dx = xy[i][0] - xy[i - 1][0]
        let dy = xy[i][1] - xy[i - 1][1]
        xi.push()
    }
} */

function interpolateLinestring(feature) {

    let dl = 0.5
    let L = feature.getLength()

    let f = dl / L
    let n = Math.floor(1 / f)

    // let n = 40
    // let f = 1 / n

    let coords = Array(n)
    for (let i = 0; i < n; i++) {
        coords[i] = feature.getCoordinateAt(i * f)
    }

    /*
    feature.forEachSegment(
        x => {
            console.log('segment')
            console.log(x)
        }
    )
    */
    return coords

}

function getValuesAtCoordinates(coordinates) {

    let n = coordinates.length
    let data = Array(n)
    let cr

    for (const [i, xy] of coordinates.entries()) {
        cr = map.getPixelFromCoordinate(xy)
        data[i] = raster.getData(cr)[layerIndex]
    }

    return data

}

function drawProfile(feature, shift = [0.0, 0.0]) {

    // get curvilinear coordinates from cartesian coordinates
    // console.log('drawend')
    // console.log(event)

    // let currentFeature = event.feature
    let geom = feature.getGeometry()

    let xy_i = interpolateLinestring(geom)
    console.log('xy_i')
    console.log(xy_i)

    /*
    let xy_coords = geom.getCoordinates()
    let line = new LineString(xy_coords)

    let coord_m = line.getCoordinateAt(0.5)
    console.log('coord_m')
    console.log(coord_m)
    let d = getLinearCoordinates(xy_coords)
      let cr_coords = xy_coords.map(el => { return map.getPixelFromCoordinate(el) })
    */

    let d = getLinearCoordinates(xy_i)

    // let cr_coords = xy_i.map(el => { return map.getPixelFromCoordinate(el) })
    // const data = cr_coords.map(x => raster.getData(x)[1])

    const z = getValuesAtCoordinates(xy_i)

    // console.log(xy_coords)
    // console.log(cr_coords)
    console.log(d)
    console.log(z)

    // update chart data
    let n = z.length
    let rawdata = Array(n)
    for (let i = 0; i < n; i++) {
        rawdata[i] = [d[i], z[i]]
    }

    // [d, z] = source.sourceInfo_.map((x, i) => [parseTime(x.date), data[i]])
    // console.log(rawdata[layerIndex])

    profile.updateData(rawdata)
    profile.updatePlot()

}