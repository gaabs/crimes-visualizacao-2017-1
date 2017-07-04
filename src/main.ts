/**
 * Created by Gio on 28/05/2017.
 */
/**
 * Created by Pedro Sereno on 28/05/2017.
 */
import * as d3 from "d3";
import * as crossfilter from "crossfilter";
import {Crime} from "./app/crime";
import {Histogram} from "./app/histogram";
import {LineChart} from "./app/lineChart";
import {HeatMap} from "./app/heatmap";
import {BaseType} from "d3-selection";
import Grouping = CrossFilter.Grouping;
import Dimension = CrossFilter.Dimension;
import Group = CrossFilter.Group;

// Measures
const svgHeight = 800;
const svgWidth = 1200;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];
const mapWidth = 500, mapHeight = 500, mapX = 0, mapY = 0;
const histogramWidth = 500, histogramHeight = 300, histogramX = 500, histogramY = 0;
const linechartWidth = 1000, linechartHeight = 300, linechartX = 0, linechartY = 500;
const gridSize = 10;

// Crossfilter
let crimes: CrossFilter.CrossFilter<Crime>;
let crimesOriginal; //: CrossFilter<Crime>;

// Crossfilter Dimensions
let crimesByTypeDimension: Dimension<Crime, string>;
let crimesByYearDimension: Dimension<Crime, number>;
let crimesByDateDimension: Dimension<Crime, Date>;
let crimesByGridDimension: CrossFilter.Dimension<Crime, number[]>;
let crimesOriginalByDate: Dimension<Crime, Date>;

// Crossfilter Groups
let crimesByTypeGroup: Group<Crime, string, string>;
let crimesByYearGroup: Group<Crime, number, number>;
let crimesByDateGroup: Group<Crime, Date, Date>;
let crimesByGridGroup: CrossFilter.Group<Crime, number[], number[]>;

// Plot objects
let histogram: Histogram;
let linechart: LineChart;
let heatmap: HeatMap;

// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/vancouver_crimes_filtered.csv", d => new Crime(d))
    .await(main);

function main(err, geoData, crimeData: Crime[]) {
    if (err) {
        console.log(err);
        return;
    }
    console.log("crimeData", crimeData);

    // Creating svg elements
    let svg: d3.Selection<BaseType, {}, HTMLElement, any> = d3.select("body").append("svg")
        .attr("height", svgHeight)
        .attr("width", svgWidth);

    // Initializing plot objects
    histogram = new Histogram(svg, histogramX, histogramY, histogramWidth, histogramHeight);
    linechart = new LineChart(svg, linechartX, linechartY, linechartWidth, linechartHeight);
    heatmap = new HeatMap(svg, mapX, mapY, mapWidth, mapHeight, gridSize, geoData);

    // Initializing crossfilter objects
    crimes = crossfilter(crimeData);

    crimesOriginal = crossfilter(crimeData);

    crimesByTypeDimension = crimes.dimension(d => d.TYPE);
    crimesByYearDimension = crimes.dimension(d => d.YEAR);
    crimesByDateDimension = crimes.dimension(d => d.DATE);

    crimesByGridDimension = heatmap.createGridDimension(crimes);

    crimesOriginalByDate = crimesOriginal.dimension(d => d.DATE);

    crimesByTypeGroup = crimesByTypeDimension.group();
    crimesByYearGroup = crimesByYearDimension.group();
    crimesByDateGroup = crimesByDateDimension.group();
    crimesByGridGroup = crimesByGridDimension.group();


    // Add dispatch
    let histogramDispatch = d3.dispatch("selectionChanged");
    histogramDispatch.on("selectionChanged", selectedBars => {
        console.log("histogram dispatch:", selectedBars);

        crimesByTypeDimension.filterFunction(key => {
            return !selectedBars.hasOwnProperty(key);
        });
        update();
    });
    histogram.dispatch = histogramDispatch;

    // Applying initial filters
    // crimesByYearDimension.filter(d => d == 2017);

    // Initial plot
    update();

}

function update() {
    histogram.plotData(crimesByTypeGroup.reduceCount().top(Infinity));
    linechart.plotData(crimesByDateGroup.reduceCount().all());
    heatmap.update(crimesByGridGroup.reduceCount().all());
}
