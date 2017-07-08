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
import * as L from 'leaflet';

// Measures
const svgHeight = 800;
const svgWidth = 1200;
const mapWidth = 500, mapHeight = 500, mapX = 0, mapY = 0;
const typeHistogramWidth = 300, typeHistogramHeight = 300, typeHistogramX = 400, typeHistogramY = 0;
const hourHistogramWidth = 300, hourHistogramHeight = 300, hourHistogramX = 700, hourHistogramY = 0;
const linechartWidth = 1000, linechartHeight = 300, linechartX = 0, linechartY = 500;
const gridSize = 10;

const margin = {top: 10, right: 20, bottom: 30, left: 40};
const zeroMargin = {top: 0, right: 0, bottom: 0, left: 0};

// Crossfilter
let crimes: CrossFilter.CrossFilter<Crime>;

// Crossfilter Dimensions
let crimesByTypeDimension: Dimension<Crime, string>;
let crimesByDateDimension: Dimension<Crime, Date>;
let crimesByYearDimension: Dimension<Crime, number>;
let crimesByHourDimension: Dimension<Crime, number>;
let crimesByGridDimension: CrossFilter.Dimension<Crime, number[]>;
let crimesByNeighbourhoodDimension: CrossFilter.Dimension<Crime, string>;

// Crossfilter Groups
let crimesByTypeGroup: Group<Crime, string, string>;
let crimesByDateGroup: Group<Crime, Date, Date>;
let crimesByYearGroup: Group<Crime, number, number>;
let crimesByHourGroup: Group<Crime, number, number>;
let crimesByGridGroup: Group<Crime, number[], number[]>;
let crimesByNeighbourhoodGroup: Group<Crime, string, string>;

// AbstractPlot objects
let typeHistogram: Histogram;
let hourHistogram: Histogram;
let linechart: LineChart;
let heatmap: HeatMap;
let choropleth: Choropleth;

const map = L.map('map').setView([49.248239, -123.118418], 11);

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
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/vancouver_crimes_filtered.csv", d => new Crime(d))
    .await(main);

function main(err, geoData, crimeData: Crime[]) {
    if (err) {
        console.log(err);
        return;
    }
    console.log("crimeData", crimeData);

    const mapSVG = d3.select("#map").select("svg").attr("pointer-events", "auto");
    const mapG = mapSVG.select("g");

    // Creating svg elements
    let svg: d3.Selection<BaseType, {}, HTMLElement, any> = d3.select("body").append("svg")
        .attr("height", "100%")
        .attr("width", "100%");

    // Initializing plot objects
    // typeHistogram = new Histogram(svg, typeHistogramX, typeHistogramY, typeHistogramWidth, typeHistogramHeight, margin, "type histogram");
    // hourHistogram = new Histogram(svg, hourHistogramX, hourHistogramY, hourHistogramWidth, hourHistogramHeight, margin, "hour histogram");
    // linechart = new LineChart(svg, linechartX, linechartY, linechartWidth, linechartHeight, margin, "linechart");
    // heatmap = new HeatMap(svg, mapX, mapY, mapWidth, mapHeight, zeroMargin, "heatmap", gridSize, geoData);
    choropleth = new Choropleth(mapG, mapX, mapY, mapWidth, mapHeight, zeroMargin, "choropleth", gridSize, geoData, path);

    // mapSVG.on("click", () => {
    //     console.log("Clicou no SVG");
    // })

    // mapG.on("click", () => {
    //     console.log("Clicou no G");
    // })

    // Initializing crossfilter objects
    crimes = crossfilter(crimeData);

    // crimesOriginal = crossfilter(crimeData);
    //
    // crimesByTypeDimension = crimes.dimension(d => d.TYPE);
    // crimesByDateDimension = crimes.dimension(d => d.DATE);
    // crimesByYearDimension = crimes.dimension(d => d.YEAR);
    // crimesByHourDimension = crimes.dimension(d => d.HOUR);
    crimesByNeighbourhoodDimension = crimes.dimension(d => d.NEIGHBOURHOOD);
    // crimesByGridDimension = heatmap.createGridDimension(crimes);

    // crimesOriginalByDate = crimesOriginal.dimension(d => d.DATE);

    // crimesByTypeGroup = crimesByTypeDimension.group();
    // crimesByDateGroup = crimesByDateDimension.group();
    // crimesByYearGroup = crimesByYearDimension.group();
    // crimesByHourGroup = crimesByHourDimension.group();
    // crimesByGridGroup = crimesByGridDimension.group();
    crimesByNeighbourhoodGroup = crimesByNeighbourhoodDimension.group();


    // Add dispatches
    // let typeHistogramDispatch = d3.dispatch("selectionChanged");
    // typeHistogramDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByTypeDimension));
    // typeHistogram.dispatch = typeHistogramDispatch;
    //
    // let hourHistogramDispatch = d3.dispatch("selectionChanged");
    // hourHistogramDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByHourDimension));
    // hourHistogram.dispatch = hourHistogramDispatch;

    let choroplethDispatch = d3.dispatch("selectionChanged");
    choroplethDispatch.on("selectionChanged", selectedBars => updateFilter(selectedBars, crimesByNeighbourhoodDimension));
    choropleth.dispatch = choroplethDispatch;

    // Applying initial filters
    // crimesByYearDimension.filter(d => d == 2017);
    map.on("moveend", reset);


    function reset() {
        choropleth.reset();
    }

    // Initial plot
    update();

    reset();
    // const toggleDiv = d3.select('body').append('div')
    //     .style('background-color', '#4b5257')
    //     .style('width', 'auto')
    //     .style('display', 'inline-block')
    //     .style('padding', '15px')
    //     .style('color', 'white')
    //     .style('box-sizing', 'border-box')
    //     .style('border-radius', '10px')
    //     .style('position', 'fixed')
    //     .style('top', '10px')
    //     .style('left', '10px');
    //
    // const radioOptions = [
    //     {
    //         text: 'Heatmap',
    //         value: 'heatmap',
    //         checked: true
    //     },
    //     {
    //         text: 'Choropleth',
    //         value: 'choropleth',
    //         checked: false
    //     }];
    //
    // for (let i = 0; i < radioOptions.length; i++) {
    //     const radioDiv = toggleDiv.append('div');
    //     radioDiv.append('input')
    //         .attr('type', 'radio')
    //         .attr('name', 'radioOptions')
    //         .attr('value', radioOptions[i].value)
    //         .attr('id', 'radioOptions' + i)
    //         .property('checked', radioOptions[i].checked)
    //         .on('click', toggleMap);
    //     radioDiv.append('label')
    //         .text(radioOptions[i].text)
    //         .attr('for', 'radioOptions' + i);
    // }

    // toggleMap();
}

function updateFilter(selection: any, dimension: Dimension<Crime, any>) {
    dimension.filterFunction(key => {
        return !selection.hasOwnProperty(key);
    });
    update();
}

function update() {
    // typeHistogram.update(crimesByTypeGroup.reduceCount().all());
    // hourHistogram.update(crimesByHourGroup.reduceCount().all());
    // linechart.update(crimesByDateGroup.reduceCount().all());
    // heatmap.update(crimesByGridGroup.reduceCount().all());
    choropleth.update(crimesByNeighbourhoodGroup.reduceCount().all());
}

// function toggleMap() {
//     const radios: any = document.getElementsByName("radioOptions");
//     for (let i = 0; i < radios.length; i++) {
//         const svg = document.getElementById(radios[i].value);
//         if (radios[i].checked) {
//             svg.style.display = 'block';
//         } else {
//             svg.style.display = 'none';
//         }
//     }
// }