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
import {Choropleth} from "./app/choropleth";
import Grouping = CrossFilter.Grouping;
import Dimension = CrossFilter.Dimension;
import Group = CrossFilter.Group;

// Measures
const svgHeight = 800;
const svgWidth = 1200;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];
const mapWidth = 500, mapHeight = 500, mapX = 0, mapY = 0;
const typeHistogramWidth = 300, typeHistogramHeight = 300, typeHistogramX = 400, typeHistogramY = 0;
const hourHistogramWidth = 300, hourHistogramHeight = 300, hourHistogramX = 700, hourHistogramY = 0;
const linechartWidth = 1000, linechartHeight = 300, linechartX = 0, linechartY = 500;
const gridSize = 10;

// Crossfilter
let crimes: CrossFilter.CrossFilter<Crime>;
let crimesOriginal; //: CrossFilter<Crime>;

// Crossfilter Dimensions
let crimesByTypeDimension: Dimension<Crime, string>;
let crimesByDateDimension: Dimension<Crime, Date>;
let crimesByYearDimension: Dimension<Crime, number>;
let crimesByHourDimension: Dimension<Crime, number>;
let crimesByGridDimension: CrossFilter.Dimension<Crime, number[]>;
let crimesByNeighbourhoodDimension: CrossFilter.Dimension<Crime, string>;
let crimesOriginalByDate: Dimension<Crime, Date>;

// Crossfilter Groups
let crimesByTypeGroup: Group<Crime, string, string>;
let crimesByDateGroup: Group<Crime, Date, Date>;
let crimesByYearGroup: Group<Crime, number, number>;
let crimesByHourGroup: Group<Crime, number, number>;
let crimesByGridGroup: Group<Crime, number[], number[]>;
let crimesByNeighbourhoodGroup: Group<Crime, string, string>;

// Plot objects
let typeHistogram: Histogram;
let hourHistogram: Histogram;
let linechart: LineChart;
let heatmap: HeatMap;
let choropleth: Choropleth;

// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/output.csv", d => new Crime(d))
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
    typeHistogram = new Histogram(svg, typeHistogramX, typeHistogramY, typeHistogramWidth, typeHistogramHeight);
    hourHistogram = new Histogram(svg, hourHistogramX, hourHistogramY, hourHistogramWidth, hourHistogramHeight);
    linechart = new LineChart(svg, linechartX, linechartY, linechartWidth, linechartHeight);
    heatmap = new HeatMap(svg, mapX, mapY, mapWidth, mapHeight, gridSize, geoData);
    choropleth = new Choropleth(svg, mapX, mapY, mapWidth, mapHeight, gridSize, geoData);

    // Initializing crossfilter objects
    crimes = crossfilter(crimeData);

    // crimesOriginal = crossfilter(crimeData);

    crimesByTypeDimension = crimes.dimension(d => d.TYPE);
    crimesByDateDimension = crimes.dimension(d => d.DATE);
    crimesByYearDimension = crimes.dimension(d => d.YEAR);
    crimesByHourDimension = crimes.dimension(d => d.HOUR);
    crimesByNeighbourhoodDimension = crimes.dimension(d => d.NEIGHBOURHOOD);
    crimesByGridDimension = heatmap.createGridDimension(crimes);

    // crimesOriginalByDate = crimesOriginal.dimension(d => d.DATE);

    crimesByTypeGroup = crimesByTypeDimension.group();
    crimesByDateGroup = crimesByDateDimension.group();
    crimesByYearGroup = crimesByYearDimension.group();
    crimesByHourGroup = crimesByHourDimension.group();
    crimesByGridGroup = crimesByGridDimension.group();
    crimesByNeighbourhoodGroup = crimesByNeighbourhoodDimension.group();


    // Add dispatches
    let typeHistogramDispatch = d3.dispatch("selectionChanged");
    typeHistogramDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByTypeDimension));
    typeHistogram.dispatch = typeHistogramDispatch;

    let hourHistogramDispatch = d3.dispatch("selectionChanged");
    hourHistogramDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByHourDimension));
    hourHistogram.dispatch = hourHistogramDispatch;

    let choroplethDispatch = d3.dispatch("selectionChanged");
    choroplethDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByNeighbourhoodDimension));
    choropleth.dispatch = choroplethDispatch;

    // Applying initial filters
    // crimesByYearDimension.filter(d => d == 2017);

    // Initial plot
    update();

}

function updateFilter(selection: any, dimension: Dimension<Crime, any>) {
    dimension.filterFunction(key => {
        return !selection.hasOwnProperty(key);
    });
    update();
}

function update() {
    typeHistogram.plotData(crimesByTypeGroup.reduceCount().top(Infinity));
    hourHistogram.plotData(crimesByHourGroup.reduceCount().all());
    linechart.plotData(crimesByDateGroup.reduceCount().all());
    heatmap.update(crimesByGridGroup.reduceCount().all());
    choropleth.update(crimesByNeighbourhoodGroup.reduceCount().all());
}
