import * as d3 from "d3";
import * as proj4x from "proj4";
import Grouping = CrossFilter.Grouping;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

export class LineChart {
    private margin;
    private canvas;
    private path;
    private xAxisGroup;
    private yAxisGroup;

    constructor(private parent,
                private x: number,
                private y: number,
                private width: number,
                private height: number) {

        // Initiate attributes
        this.margin = {top: 10, right: 20, bottom: 30, left: 40};

        this.canvas = parent.append("svg")
            .attr("class", "linechart")
            .attr("width", width)
            .attr("height", height)
            .attr("x", x)
            .attr("y", y)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.path = this.canvas.append("g").append("path");

        this.xAxisGroup = this.canvas.append("g")
            .attr("transform", `translate(0, ${this.height - this.margin.top - this.margin.bottom})`);
        this.yAxisGroup = this.canvas.append("g");
    }

    // Plots line chart with crime data
    plotData(data: Grouping<Date, number>[]) {
        console.log("linechart", data);

        let xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.key))
            .range([0, this.width - this.margin.left - this.margin.right]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) + 100])
            .range([this.height - this.margin.top - this.margin.bottom, 0]);

        let lineFunction = d3.line<Grouping<Date, number>>()
            .x(d => xScale(d.key))
            .y(d => yScale(d.value))
            .curve(d3.curveLinear);

        this.path
            .style("stroke", "#86170F")
            .style("stroke-width", "1px")
            .style("fill", "none")
            .attr("d", lineFunction(data));

        let xAxis = this.xAxisGroup.call(d3.axisBottom(xScale));
        let yAxis = this.yAxisGroup.call(d3.axisLeft(yScale));
    }
}

