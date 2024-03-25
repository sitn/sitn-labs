import GeoTIFF from 'ol/source/GeoTIFF.js';
import Map from 'ol/Map.js';
import Projection from 'ol/proj/Projection'
import proj4 from 'proj4'

import {
    DragRotate, DoubleClickZoom, DragPan, PinchRotate, PinchZoom, KeyboardPan, KeyboardZoom, MouseWheelZoom, DragZoom,
    defaults as defaultInteractions
} from 'ol/interaction.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import { createEmpty, extend, getCenter } from 'ol/extent.js';
import * as d3 from "d3";

// References
// https://gis.stackexchange.com/questions/450725/render-multiple-cog-files-using-openlayers


// CRS definitions
proj4.defs(
    "EPSG:2056",
    "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
)

register(proj4);

const extent = [2420000, 976000.0000000001, 2932000, 1360000]
const projection = new Projection({
    code: 'EPSG:2056',
    extent: extent,
});
//const projection = getProjection('EPSG:2056');
const projectionExtent = projection.getExtent()

const resolutions = [
    249.99999999999994,
    99.99999999999999,
    49.99999999999999,
    19.999999999999996,
    9.999999999999998,
    4.999999999999999,
    2.4999999999999996,
    1.9999999999999996,
    1.4999999999999998,
    0.9999999999999998,
    0.4999999999999999,
    0.24999999999999994,
    0.12499999999999997,
    0.062499999999999986,
    0.031249999999999993,
    0.015624999999999997,
    0.007812499999999998
]

var matrixIds = [];
for (var i = 0; i < resolutions.length; i++) {
    matrixIds.push(i);
}


// sources
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