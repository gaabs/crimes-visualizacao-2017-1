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
import {Choropleth} from "./app/choropleth";
import * as L from "leaflet";
import Grouping = CrossFilter.Grouping;
import Dimension = CrossFilter.Dimension;
import Group = CrossFilter.Group;

const linechartDiv = document.getElementById("linechart");
const filtersDiv = document.getElementById("filters");

// Measures
const svgFiltersHeight = filtersDiv.clientHeight;
const svgFiltersWidth = filtersDiv.clientWidth;
const typeHistogramWidth = svgFiltersWidth / 2, typeHistogramHeight = svgFiltersHeight / 2, typeHistogramX = 0,
    typeHistogramY = 0;
const hourHistogramWidth = svgFiltersWidth / 2, hourHistogramHeight = svgFiltersHeight / 2,
    hourHistogramX = svgFiltersWidth / 2, hourHistogramY = 0;
const weekdayHistogramWidth = svgFiltersWidth / 2, weekdayHistogramHeight = svgFiltersHeight / 2, weekdayHistogramX = 0,
    weekdayHistogramY = svgFiltersHeight / 2;
const monthHistogramWidth = svgFiltersWidth / 2, monthHistogramHeight = svgFiltersHeight / 2,
    monthHistogramX = svgFiltersWidth / 2, monthHistogramY = svgFiltersHeight / 2;
const linechartWidth = linechartDiv.clientWidth, linechartHeight = linechartDiv.clientHeight, linechartX = 0,
    linechartY = 0;
const gridSize = 100;

const margin = {top: 10, right: 20, bottom: 30, left: 40};
const zeroMargin = {top: 0, right: 0, bottom: 0, left: 0};

// Crossfilter
let crimes: CrossFilter.CrossFilter<Crime>;

// Crossfilter Dimensions
let crimesByTypeDimension: Dimension<Crime, string>;
let crimesByDateDimension: Dimension<Crime, Date>;
let crimesByYearDimension: Dimension<Crime, number>;
let crimesByHourDimension: Dimension<Crime, number>;
let crimesByWeekdayDimension: Dimension<Crime, number>;
let crimesByMonthDimension: Dimension<Crime, number>;
let crimesByGridDimension: CrossFilter.Dimension<Crime, number[]>;
let crimesByNeighbourhoodDimension: CrossFilter.Dimension<Crime, string>;

// Crossfilter Groups
let crimesByTypeGroup: Group<Crime, string, string>;
let crimesByDateGroup: Group<Crime, Date, Date>;
let crimesByYearGroup: Group<Crime, number, number>;
let crimesByHourGroup: Group<Crime, number, number>;
let crimesByWeekdayGroup: Group<Crime, number, number>;
let crimesByMonthGroup: Group<Crime, number, number>;
let crimesByGridGroup: Group<Crime, number[], number[]>;
let crimesByNeighbourhoodGroup: Group<Crime, string, string>;

// AbstractPlot objects
let typeHistogram: Histogram;
let hourHistogram: Histogram;
let weekdayHistogram: Histogram;
let monthHistogram: Histogram;
let linechart: LineChart;
let heatmap: HeatMap;
let choropleth: Choropleth;

const map = L.map('map', {zoomControl: false, minZoom: 11, maxZoom: 21}).setView([49.248239, -123.118418], 11);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.svg().addTo(map);

const transform = d3.geoTransform({point: projectPoint});
const path = d3.geoPath().projection(transform);

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver-neighbourhoods.json")
    .defer(d3.csv, "assets/data/vancouver_crimes_filtered.csv", d => new Crime(d))
    .await(main);

function main(err, geoData, crimeData: Crime[]) {
    if (err) {
        console.log(err);
        return;
    }
    console.log("crimeData", crimeData);

    const mapSVG = d3.select("#map").select("svg").attr("pointer-events", "auto");
    const choroplethG = mapSVG.select("g").attr("class", "leaflet-zoom-hide");

    const test = L.rectangle([[49.248239, -123.118418], [49.268239, -123.098418]]);
    test.options.color = "transparent";
    test.options.opacity = 0;
    test.addTo(map);

    const linechartSVG = d3.select("#linechart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const filtersSVG = d3.select("#filters")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const heatmapLegendSVG = d3.select("#linearscale")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const choroplethLegendSVG = d3.select("#linearscale")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // Initializing plot objects
    typeHistogram = new Histogram(filtersSVG, typeHistogramX, typeHistogramY, typeHistogramWidth, typeHistogramHeight, margin, "type histogram");
    typeHistogram.addAxesTitles("Occurrences", "Crime Type");
    hourHistogram = new Histogram(filtersSVG, hourHistogramX, hourHistogramY, hourHistogramWidth, hourHistogramHeight, margin, "hour histogram");
    hourHistogram.addAxesTitles("Occurrences", "Hour");
    hourHistogram.setColorRange(["#9f6700"]);
    weekdayHistogram = new Histogram(filtersSVG, weekdayHistogramX, weekdayHistogramY, weekdayHistogramWidth, weekdayHistogramHeight, margin, "weekday histogram");
    weekdayHistogram.addAxesTitles("Occurrences", "Weekday");
    weekdayHistogram.setColorRange(["#9f6700"]);
    monthHistogram = new Histogram(filtersSVG, monthHistogramX, monthHistogramY, monthHistogramWidth, monthHistogramHeight, margin, "month histogram");
    monthHistogram.addAxesTitles("Occurrences", "Month");
    monthHistogram.setColorRange(["#9f6700"]);
    linechart = new LineChart(linechartSVG, linechartX, linechartY, linechartWidth, linechartHeight, margin, "linechart");
    heatmap = new HeatMap(gridSize, map, heatmapLegendSVG);
    choropleth = new Choropleth(choroplethG, geoData, path, choroplethLegendSVG);

    const heatmapSVG = d3.select((<any>d3.select(".heatmap-rect").node()).parentElement.parentElement);

    const mapPlots = {
        'heatmap': heatmapSVG,
        'choropleth': choroplethG
    };

    const mapLegends = {
        'heatmap': heatmapLegendSVG,
        'choropleth': choroplethLegendSVG
    };


    let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Initialize crossfilter objects
    crimes = crossfilter(crimeData);

    crimesByTypeDimension = crimes.dimension(d => d.TYPE);
    crimesByDateDimension = crimes.dimension(d => d.DATE);
    crimesByHourDimension = crimes.dimension(d => d.HOUR);
    crimesByWeekdayDimension = crimes.dimension(d => d.DATE.getDay());
    crimesByMonthDimension = crimes.dimension(d => d.MONTH);
    crimesByGridDimension = heatmap.createGridDimension(crimes);
    crimesByNeighbourhoodDimension = crimes.dimension(d => d.NEIGHBOURHOOD);

    crimesByTypeGroup = crimesByTypeDimension.group();
    crimesByDateGroup = crimesByDateDimension.group();
    crimesByHourGroup = crimesByHourDimension.group();
    crimesByWeekdayGroup = crimesByWeekdayDimension.group();
    crimesByMonthGroup = crimesByMonthDimension.group();
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

    let linechartDispatch = d3.dispatch("selectionChanged");
    linechartDispatch.on("selectionChanged", selectedRange => updateFilterRange(selectedRange, crimesByDateDimension));
    linechart.dispatch = linechartDispatch;

    // Applying initial filters
    map.on("viewreset", reset);
    map.on("moveend", reset);

    function reset() {
        choropleth.reset();
    }

    // Initial plot
    update();

    reset();

    const toggleDiv = d3.select("#toggle-map").style("opacity", 1);
    toggleDiv.selectAll("input").on("click", toggleMap);
    toggleMap();

    function toggleMap() {
        console.log("Switcher");
        const radios: any = document.getElementsByName("radioOptions");
        for (let i = 0; i < radios.length; i++) {
            const svg = mapPlots[radios[i].value];
            const legendSvg = mapLegends[radios[i].value];
            if (radios[i].checked) {
                svg.attr("display", "block");
                legendSvg.attr("display", "block");
            } else {
                svg.attr("display", "none");
                legendSvg.attr("display", "none");
            }
        }
    }

    d3.select("#loader").style("display", "none");
    d3.select("#plot-container").style("opacity", "1");
}

function updateFilter(selection: any, dimension: Dimension<Crime, any>) {
    if (!selection || Object.keys(selection).length == 0) {
        // Clear dimension filters
        dimension.filterAll();
    } else {
        dimension.filterFunction(key => {
            return selection.hasOwnProperty(key);
        });
    }
    update();
}

function updateFilterRange(selectionRange: any[], dimension: Dimension<Crime, any>) {
    if (!selectionRange || selectionRange.length != 2) {
        // Clear dimension filters
        dimension.filterAll();
    } else {
        dimension.filterRange(selectionRange);
    }
    update();
}

function update() {
    typeHistogram.update(crimesByTypeGroup.reduceCount().all());
    hourHistogram.update(crimesByHourGroup.reduceCount().all());
    monthHistogram.update(crimesByMonthGroup.reduceCount().all());
    weekdayHistogram.update(crimesByWeekdayGroup.reduceCount().all());
    linechart.update(crimesByDateGroup.reduceCount().all());
    heatmap.update(crimesByGridGroup.reduceCount().all());
    choropleth.update(crimesByNeighbourhoodGroup.reduceCount().all());
}