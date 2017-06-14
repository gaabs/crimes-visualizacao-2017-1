import * as d3 from "d3";
import * as proj4x from "proj4";
import Grouping = CrossFilter.Grouping;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const width = 800;
const height = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];


// Plots line chart with crime data
export function plotData(data: Grouping<Date, number>[]) {
    console.log("linechart", data);

    let margin = {top: 10, right: 20, bottom: 30, left: 40};
    let canvas = d3.select("body").append("svg")
        .attr("class", "histogram")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleTime()
        .domain(d3.extent(data, d => d.key))
        .range([0, width - margin.left - margin.right]);

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) + 100])
        .range([height - margin.top - margin.bottom, 0]);

    let colorScale = d3.scaleOrdinal(d3.schemeCategory20);

    // let rectangles = canvas.selectAll("rect").data(data);
    // let rectangleWidth = width / (data.length);
    //
    // rectangles.exit().remove();
    // rectangles.enter().append("rect").merge(rectangles)
    //     .attr("x", d => x(d.DATE) + rectangleWidth)
    //     .attr("y", d => y(d.COUNT) - margin.top - margin.bottom)
    //     .attr("width", d => rectangleWidth)
    //     .attr("height", d => height - y(d.COUNT))
    //     //.attr("fill", d => colorScale(d.TYPE))
    //     .attr("fill", d => "#86170F")
    //     .attr("text", d => d.TYPE);


    var lineFunction = d3.line<Grouping<Date, number>>()
        .x(d => x(d.key))
        .y(d => y(d.value))
        .curve(d3.curveLinear);


    canvas.append("g")
        .append("path")
        .style("stroke", "#86170F")
        .style("stroke-width", "1px")
        .style("fill", "none")
        .attr("d", lineFunction(data));

    let xAxisGroup = canvas.append("g").attr("transform", `translate(0, ${height - margin.top - margin.bottom})`);
    let yAxisGroup = canvas.append("g");
    let xAxis = xAxisGroup.call(d3.axisBottom(x));
    let yAxis = yAxisGroup.call(d3.axisLeft(y));
}