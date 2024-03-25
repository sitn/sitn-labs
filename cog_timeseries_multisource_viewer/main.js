import GeoTIFF from 'ol/source/GeoTIFF.js';
import Map from 'ol/Map.js';
import {
    DragRotate, DoubleClickZoom, DragPan, PinchRotate, PinchZoom, KeyboardPan, KeyboardZoom, MouseWheelZoom, DragZoom,
    defaults as defaultInteractions
} from 'ol/interaction.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import { createEmpty, extend, getCenter } from 'ol/extent.js';
import * as d3 from "d3";

var parseTime = d3.timeParse("%d.%m.%Y")

/*
proj4.defs(
    'EPSG:2056',
    '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
);

register(proj4);
*/

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
        x_extent[0] = x_extent[0] - 0.05
        x_extent[1] = x_extent[1] + 0.05
        return x_extent
    }

    get yExtent() {
        let y_extent = [0, 60]
        y_extent[0] = y_extent[0] - 0.05
        y_extent[1] = y_extent[1] + 0.05
        return y_extent
    }

    get xScale() {
        var mindate = new Date(2001, 0, 1),
            maxdate = new Date(2024, 0, 31);
        return d3.scaleTime([mindate, maxdate], [this.margins.left, this.width - this.margins.right]).nice()
    }

    get yScale() {
        return d3.scaleLinear(this.yExtent, [this.height - this.margins.bottom, this.margins.top]).nice()
    }

    get xAxis() {
        return d3.axisBottom(this.xScale).ticks(this.width / 100).tickFormat(d3.timeFormat("%Y"))
    }

    get yAxis() {
        return d3.axisLeft(this.yScale).ticks(this.height / 30)
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
            let xcaling = this.xScale(this.data[layerIndex][0])

            d3.select('#svg-timeline')
                .attr("x1", xcaling)
                .attr("x2", xcaling)
                .attr("visibility", "visible")

        }
    }

    updatePlot() {
        this.width = document.getElementById("chart").clientWidth
        this.height = Math.min(Math.max(document.getElementById("chart").clientHeight, this.maxHeight + 0.0), this.maxHeight + 0.0) // add 32 to compensate for section padding (if there is any padding)

        this.updateViewbox()
        this.updateXAxis()
        this.updateYAxis()
        this.updateXAxisGrid()
        this.updateYAxisGrid()
        this.updateXAxisLabel()
        this.updateYAxisLabel()
        this.updateLine()
        this.updateTimeLine()
    }

}

// height, width, margins, data
var lineplot = new Chart(200, 650, { left: 85, right: 60, top: 0, bottom: 0 }, [])
lineplot.updatePlot()

window.addEventListener('resize', function () {
    lineplot.updatePlot()
})

// https://gis.stackexchange.com/questions/450725/render-multiple-cog-files-using-openlayers
const sources = [
    new GeoTIFF({
        normalize: false,
        interpolate: false,
        sources: [{
            name: 'DHM 2001',
            date: "01.06.2001",
            url: 'https://sitn.ne.ch/lidar/pointclouds/mnc/mnc2001_1m_cog.tif',
            bands: [1],
        }]
    }),
    new GeoTIFF({
        normalize: false,
        interpolate: false,
        sources: [{
            name: 'DHM 2010',
            date: "15.06.2010",
            url: 'https://sitn.ne.ch/lidar/pointclouds/mnc/mnc2010_1m_cog.tif',
            bands: [1],
        }]
    }),
]

/*
const source11 = new GeoTIFF({
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
*/

console.log(sources)

var layerIndex = 0

function update() {
    layerIndex = parseInt(document.getElementById("layer-selector").value)
    displayPixelValue()
    layer.updateStyleVariables({ bandno: layerIndex + 1 })
}

var select = document.getElementById("layer-selector")

select.addEventListener(
    'change',
    update
)


sources.forEach((element, index) => {
    console.log(element)
    console.log(element.sourceInfo_[0].name)
    console.log(index)
    var option = document.createElement("option")
    option.text = element.sourceInfo_[0].name
    option.value = index
    select.add(option)
})


/*
source.sourceInfo_.forEach((element, index) => {
    var option = document.createElement("option")
    option.text = element.name
    option.value = index
    select.add(option)
})
*/

const layer = new TileLayer({
    source: sources,
    style: {

        /*
        variables: {
            bandno: 1,
        },
        color: [
            'palette',
            [
                'interpolate',
                ['linear'],
                ['band', ['var', 'bandno']],
                0,
                5,
                10,
                15,
                20,
                25,
                30,
                35,
                40,
            ],
            ['#ffffff', '#ffe784', '#cef77b', '#8ccf63', '#217100', '#4a5500', '#39927b', '#104173', '#ff8e00', '#ff0000'],
        ],
        */


        variables: {
            bandno: parseInt(1),
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
})

const mouseWheelZoom = new MouseWheelZoom
mouseWheelZoom.setMouseAnchor(false)

/*
const map = new Map({
    target: 'map',
    layers: [layer],
    view: source.getView().then(function (options) {
        return {
            projection: options.projection,
            center: options.center,
            resolution: options.resolutions[options.zoom],
        }
    }),
    interactions: [
        new DragRotate,
        new DoubleClickZoom,
        new DragPan,
        new PinchRotate,
        new PinchZoom,
        new KeyboardPan,
        new KeyboardZoom,
        new DragZoom,
        mouseWheelZoom,
    ],
})
*/


const map = new Map({
    target: 'map',
    layers: [layer],
    view: Promise.all(
        sources.map(function (source) {
            return source.getView()
        }),
    ).then(function (options) {
        const projection = options.projection // 'EPSG:3857';
        const extent = createEmpty()
        options.forEach(function (options) {
            extend(
                extent,
                // transformExtent(options.extent, options.projection, projection),
                transformExtent(options.extent, options.projection, options.projection),
            )
        })
        return {
            projection: projection,
            center: getCenter(extent),
            zoom: 0,
            extent: extent,
        }
    }),
    interactions: [
        new DragRotate,
        new DoubleClickZoom,
        new DragPan,
        new PinchRotate,
        new PinchZoom,
        new KeyboardPan,
        new KeyboardZoom,
        new DragZoom,
        mouseWheelZoom,
    ],
})


/*
const interactions = map.getInteractions()
console.log(interactions)
console.log(interactions.getArray())
console.log(defaultInteractions)
*/

/*
map.getInteractions().getArray().forEach(function (interaction) {
    if (interaction instanceof MouseWheelZoom) {
        interaction.setMouseAnchor(false)
    }
});
*/

// DISPLAY PIXEL VALUE AND UPDATE CHART
function displayPixelValue() {

    let xy_center = map.getView().getCenter()
    let cr_center = map.getPixelFromCoordinate(xy_center)

    const data = layer.getData(cr_center)
    if (!data) {
        return
    }

    document.getElementById("height-indicator").textContent = data[layerIndex].toFixed(1)

    // update chart data
    // let rawdata = sources.sourceInfo_.map((x, i) => [parseTime(x.date), data[i]])

    // lineplot.updateData(rawdata)
    // lineplot.updatePlot()

}

map.on(['pointerdrag'], displayPixelValue) 