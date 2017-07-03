/**
 * Created by Gio on 28/05/2017.
 */
/**
 * Created by Pedro Sereno on 28/05/2017.
 */
import * as d3 from "d3";
import * as proj4x from "proj4";
import * as crossfilter from "crossfilter";
import {Crime} from "./app/crime";
import {Histogram} from "./app/histogram";
import {LineChart} from "./app/lineChart";
import {HeatMap} from "./app/heatmap";
import {BaseType} from "d3-selection";
import Grouping = CrossFilter.Grouping;
import Dimension = CrossFilter.Dimension;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

// Measures
const svgHeight = 800;
const svgWidth = 1200;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];
const mapWidth = 500, mapHeight = 500, mapX = 0, mapY = 0;
const histogramWidth = 500, histogramHeight = 300, histogramX = 500, histogramY = 0;
const linechartWidth = 1000, linechartHeight = 300, linechartX = 0, linechartY = 500;
const gridSize = 10;

// Crossfilter Dimensions
let crimes; //: CrossFilter<Crime>;
let crimesByType: Dimension<Crime, string>;
let crimesByYear: Dimension<Crime, number>;
let crimesByDate: Dimension<Crime, Date>;
let crimesOriginal; //: CrossFilter<Crime>;
let crimesOriginalByDate: Dimension<Crime, Date>;

// Plot objects
let histogram: Histogram;
let linechart: LineChart;
let heatmap: HeatMap;


// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/vancouver_crimes.csv", d => new Crime(d))
    .await(main);

function main(err, geoData, crimeData: Crime[]) {
    if (err) {
        console.log(err);
        return;
    }

    // Creating svg elements
    let svg: d3.Selection<BaseType, {}, HTMLElement, any> = d3.select("body").append("svg")
        .attr("height", svgHeight)
        .attr("width", svgWidth);

    // let body = d3.select("body");

    console.log("crimeData", crimeData);

    // Initializing crossfilter Dimensions
    crimes = crossfilter(crimeData);
    crimesByType = crimes.dimension(d => d.TYPE);
    crimesByYear = crimes.dimension(d => d.YEAR);
    crimesByDate = crimes.dimension(d => d.DATE);
    crimesOriginal = crossfilter(crimeData);
    crimesOriginalByDate = crimesOriginal.dimension(d => d.DATE);

    // Initializing plot objects
    histogram = new Histogram(svg, histogramX, histogramY, histogramWidth, histogramHeight);
    linechart = new LineChart(svg, linechartX, linechartY, linechartWidth, linechartHeight);
    heatmap = new HeatMap(svg, mapX, mapY, mapWidth, mapHeight, gridSize, geoData);

    // Add dispatch
    let histogramDispatch = d3.dispatch("selectionChanged");
    // histogramDispatch.on("selectionChanged", ids => scatterplot.setSelectableIds(ids));
    histogramDispatch.on("selectionChanged", selectedBars => {
        console.log("histogram dispatch:", selectedBars);

        crimesByType.filterFunction(key => {
            return !selectedBars.hasOwnProperty(key);
        });
        update();
    });
    histogram.dispatch = histogramDispatch;

    // Applying initial filters
    crimesByYear.filter(d => d == 2017);

    // Initial plot
    update();
}

function update() {
    histogram.plotData(crimesByType.group().reduceCount().top(Infinity));
    linechart.plotData(crimesOriginalByDate.group().reduceCount().all());
    //linechart.plotData(crimesByDate.group().reduceCount().all());
    heatmap.update(crimesByYear.top(Infinity));
}
