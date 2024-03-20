
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

var parseTime = d3.timeParse("%d.%m.%Y")


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
        let x_extent = d3.extent(this.data, d => d[0])
        // console.log('x_extent')
        // console.log(x_extent)
        return x_extent
    }

    get yExtent() {
        let y_extent = d3.extent(this.data, d => d[1]) // [0, 60] 
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

    get yScale() {
        // scaleLinear(domain, range)

        const xStep = Math.abs((this.xExtent[1] - this.xExtent[0]) / (this.xRange[1] - this.xRange[0]))
        const yStep = Math.abs((this.yExtent[1] - this.yExtent[0]) / (this.yRange[1] - this.yRange[0]))

        const ratio = yStep / xStep
        const yRangeAdj = [this.yRange[0], this.yRange[0] - (this.yExtent[1] - this.yExtent[0]) / xStep]
        return d3.scaleLinear(this.yExtentAdjust, this.yRange) // .nice()
    }

    get xAxis() {
        return d3.axisBottom(this.xScale).ticks(this.width / 100) // .tickSizeOuter(0) d3.time.format("%b %Y") d3.format("d")
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
        // this.line = d3.line()
        return d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
    }


    updateViewbox() {
        d3.select('#svg-chart')
            .attr("width", '100%') // .attr("width", this.width) 
            .attr("height", '100%') // .attr("height", this.height)
            .attr("viewBox", `0,0,${this.width},${this.height}`)
    }

    updateXAxis() {
        d3.select('#svg-x-axis')
            .attr("transform", `translate(0, ${this.height - this.margins.bottom})`)
            .style("font-size", "11pt")
            .call(this.xAxis)
    }

    updateYAxis() {
        d3.select('#svg-y-axis')
            .attr("transform", `translate(${this.margins.left}, 0)`)
            .style("font-size", "11pt")
            .call(this.yAxis)
    }

    updateXAxisGrid() {
        d3.select('#svg-x-grid')
            .attr("transform", `translate(${0}, ${this.height - this.margins.bottom})`)
            .call(this.xAxisGrid)
    }

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

    updateLine() {
        d3.select('#svg-dataline')
            .attr("d", this.line(this.data))
    }

    updateData(vals) {
        this.data = vals.filter(x => !isNaN(x[1]))
    }

    updateTimeLine() {

        if (this.data.length > 0) {

            let gaga = this.xScale(this.data[layerIndex][0])

            d3.select('#svg-timeline')
                .attr("x1", gaga)
                .attr("x2", gaga)
                .attr("visibility", "visible")

        }

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

        // adjust yRange to control x/y axis aspect ratio

        // this.height = this.width

        this.updateViewbox()
        this.updateXAxis()
        this.updateYAxis()
        this.updateXAxisGrid()
        this.updateYAxisGrid()
        this.updateXAxisLabel()
        this.updateYAxisLabel()
        this.updateLine()
        // this.updateTimeLine()
    }


}

// height, width, margins, data
var didi = new Chart(300, 650, { left: 85, right: 60, top: 0, bottom: 0 }, [])
didi.updatePlot()

window.addEventListener('resize', function () {
    didi.updatePlot()
})


/* GEOTIFF SOURCE */
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

//console.log(source)
//console.log(source.sourceInfo_)
//console.log(source.sources)
//console.log(source.getProperties())

var layerIndex = 0

//console.log(`layerIndex: ${layerIndex}`)

/* UPDATE LAYER */
function update() {
    layerIndex = parseInt(document.getElementById("layer-selector").value)
    raster.updateStyleVariables({ bandno: layerIndex + 1 })
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


/* INTERACTIONS */

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

function drawProfile(feature) {

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

    didi.updateData(rawdata)
    didi.updatePlot()

}


function getPixelValue(event) {

    //console.log(event)

    //console.log('event.pixel')
    //console.log(event.pixel)
    const data = raster.getData(event.pixel)
    //console.log(data)
    //console.log(event.coordinate)

    // let cr_center = map.getPixelFromCoordinate(event.coordinate)
    //console.log(map.getEventCoordinate(event))
    //console.log(map.getEventPixel(event))

    // getCoordinateFromPixel(pixel)
    // console.log(event.pixel_)

    //console.log(cr_center)

    //console.log('values:')

    let n = 12000
    let col = Array(n)
    let row = Array(n)
    let val = Array(n)

    for (let i = 0; i < n; i++) {
        col[i] = 328
        row[i] = 250
        val[i] = raster.getData([col[i], row[i]])[0]
    }

    //console.log(val)
    // 388-160 - 615-324

    //console.log(raster.getData(cr_center))
    // getPixelFromCoordinate
    // getCoordinateFromPixel(pixel)

    if (!data) {
        return
    }

}


// const output = document.getElementById('output')

// DISPLAY PIXEL VALUE AND UPDATE CHART
function displayPixelValue() {
    // function displayPixelValue(event) {

    let xy_center = map.getView().getCenter()
    let cr_center = map.getPixelFromCoordinate(xy_center)

    console.log(xy_center)
    console.log(cr_center)
    // console.log(event.pixel)

    // const data = layer.getData(event.pixel)
    const data = raster.getData(cr_center)
    // console.log(data)
    if (!data) {
        return
    }

    // document.getElementById("height-indicator").textContent = data[layerIndex].toFixed(1)

    // update chart data
    let rawdata = source.sourceInfo_.map((x, i) => [parseTime(x.date), data[i]])
    console.log(rawdata[layerIndex])

    didi.updateData(rawdata)
    didi.updatePlot()

}

// map.on(['pointerdrag'], displayPixelValue) // 'pointermove', 'click', 'moveend'
// map.on(['click'], getPixelValue)

/* map.getView().on('change:resolution', (event) => {
    console.log(event)
})
 */