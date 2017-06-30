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
import * as Histogram from "./app/histogram";
import * as LineChart from "./app/lineChart";
import * as HeatMap from "./app/heatmap";
import Grouping = CrossFilter.Grouping;
import Dimension = CrossFilter.Dimension;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const svgHeight = 800;
const svgWidth = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];
const mapWidth = 500, mapHeight = 500, mapX = 0, mapY = 0;
const histogramWidth = 500, histogramHeight = 300, histogramX = 500, histogramY = 0;
const linechartWidth = 1000, linechartHeight = 300, linechartX = 0, linechartY = 500;

// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));

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
    let svg = d3.select("body").append("svg")
        .attr("height", svgHeight)
        .attr("width", svgWidth);

    // let body = d3.select("body");

    console.log("crimeData", crimeData);
    // Creating crossfilter Dimensions
    let crimes = crossfilter(crimeData);
    let crimesByType: Dimension<Crime, string> = crimes.dimension(d => d.TYPE);
    let crimesByYear: Dimension<Crime, number> = crimes.dimension(d => d.YEAR);
    let crimesByDate: Dimension<Crime, Date> = crimes.dimension(d => d.DATE);


    crimesByYear.filter(d => d == 2017);
    // Map.plotData(svg, mapX, mapY, mapWidth, mapHeight, geoData, crimesByYear.top(Infinity));
    // PieChart.plotData(crimesByType.group().reduceCount().top(Infinity));

    Histogram.plotData(svg, histogramX, histogramY, histogramWidth, histogramHeight, crimesByType.group().reduceCount().top(Infinity));

    let crimesOriginal = crossfilter(crimeData);
    let crimesOriginalByDate: Dimension<Crime, Date> = crimesOriginal.dimension(d => d.DATE);
    LineChart.plotData(svg, linechartX, linechartY, linechartWidth, linechartHeight, crimesOriginalByDate.group().reduceCount().all());


    HeatMap.plotData(svg, mapX, mapY, mapWidth, mapHeight, geoData, crimesByYear.top(Infinity));
}
