import * as d3 from "d3";
import * as proj4x from "proj4";
import Grouping = CrossFilter.Grouping;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

export class Histogram {
    private margin;
    private canvas;
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
            .attr("class", "histogram")
            .attr("width", width)
            .attr("height", height)
            .attr("x", x)
            .attr("y", y)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.xAxisGroup = this.canvas.append("g")
            .attr("transform", `translate(0, ${this.height - this.margin.top - this.margin.bottom})`);
        this.yAxisGroup = this.canvas.append("g");
    }

    plotData(data: Grouping<string, number>[]) {
        console.log("histogram", data);

        let xScale = d3.scaleBand()
            .domain(data.map(d => d.key))
            .range([0, this.width - this.margin.left - this.margin.right]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) + 100])
            .range([this.height - this.margin.top - this.margin.bottom, 0]);
        console.log("histogram max:", d3.max(data, d => d.value));
        console.log("histogram scaledMax:", yScale(d3.max(data, d => d.value)));

        let colorScale = d3.scaleOrdinal(d3.schemeCategory20);

        let rectangles = this.canvas.selectAll("rect").data(data);
        let rectangleWidth = this.width / (2 * data.length);

        rectangles.exit().remove();
        rectangles.enter().append("rect").merge(rectangles)
            .attr("x", d => xScale(d.key) + rectangleWidth / 2)
            .attr("y", d => yScale(d.value))
            .attr("width", d => rectangleWidth)
            .attr("height", d => this.height - yScale(d.value) - this.margin.top - this.margin.bottom)
            .attr("fill", d => colorScale(d.key))
            .attr("text", d => d.key);


        let xAxis = this.xAxisGroup.call(d3.axisBottom(xScale));
        let yAxis = this.yAxisGroup.call(d3.axisLeft(yScale));
    }
}