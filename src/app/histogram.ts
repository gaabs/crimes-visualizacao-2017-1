import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const width = 800;
const height = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];


// Plots histogram with crime data
export function plotData(data) {
    console.log("histogram", data);

    let margin = {top: 10, right: 20, bottom: 30, left: 40};
    let canvas = d3.select("body").append("svg")
        .attr("class", "histogram")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleBand()
        .domain(data.map(d => d["key"]))
        .range([0, width - margin.left - margin.right]);


    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["value"] as number) + 100])
        .range([height - margin.top - margin.bottom, 0]);

    let colorScale = d3.scaleOrdinal(d3.schemeCategory20);

    let rectangles = canvas.selectAll("rect").data(data);
    let rectangleWidth = width / (2 * data.length);

    rectangles.exit().remove();
    rectangles.enter().append("rect").merge(rectangles)
        .attr("x", d => x(d["key"]) + rectangleWidth / 2)
        .attr("y", d => y(d["value"]) - margin.top - margin.bottom)
        .attr("width", d => rectangleWidth)
        .attr("height", d => height - y(d["value"]))
        .attr("fill", d => colorScale(d["key"]))
        .attr("text", d => d["key"]);


    let xAxisGroup = canvas.append("g").attr("transform", `translate(0, ${height - margin.top - margin.bottom})`);
    let yAxisGroup = canvas.append("g");
    let xAxis = xAxisGroup.call(d3.axisBottom(x));
    let yAxis = yAxisGroup.call(d3.axisLeft(y));
}