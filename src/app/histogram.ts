import * as d3 from "d3";
import {BaseType} from "d3-selection";

import Grouping = CrossFilter.Grouping;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

export class Histogram {
    public dispatch;

    private margin;
    private canvas;
    private xAxisGroup;
    private yAxisGroup;
    private barsGroup;
    private selectedBars = {};

    constructor(private parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                private x: number,
                private y: number,
                private width: number,
                private height: number) {

        // Initiate attributes
        this.margin = {top: 10, right: 20, bottom: 30, left: 50};
        this.canvas = parent.append("svg")
            .attr("class", "histogram")
            .attr("width", width)
            .attr("height", height)
            .attr("x", x)
            .attr("y", y)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


        // Creating groups
        this.barsGroup = this.canvas.append("g")
            .attr("class", "bars");

        this.xAxisGroup = this.canvas.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.height - this.margin.top - this.margin.bottom})`);

        this.yAxisGroup = this.canvas.append("g")
            .attr("class", "yAxis");

    }

    plotData(data: Grouping<any, number>[]) {
        // console.log("histogram", data);

        // Filter out unlabeled data
        data = data.filter(d => d.key.length > 0);

        // X scale represents the values
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) + 100])
            .range([0, this.width - this.margin.left - this.margin.right]);

        // Y scale represents the labels
        let yScale = d3.scaleBand()
            .domain(data.map(d => d.key))
            .range([this.height - this.margin.top - this.margin.bottom, 0]);


        let colorScale = d3.scaleOrdinal(d3.schemeCategory20).domain(data.map(d => d.key));

        let rectangles = this.barsGroup.selectAll("rect").data(data);
        let rectangleHeight = this.height / (2 * data.length);

        rectangles.exit().remove();
        rectangles.enter().append("rect").merge(rectangles)
            .on("click", (data: Grouping<string, number>) => {
                if (this.selectedBars.hasOwnProperty(data.key)) {
                    delete this.selectedBars[data.key];
                } else {
                    this.selectedBars[data.key] = true;
                }
                this.dispatch.call("selectionChanged", {}, this.selectedBars);
            })
            .transition().duration(500)
            .attr("x", 0)
            .attr("y", d => yScale(d.key) + rectangleHeight / 3)
            .attr("width", d => xScale(d.value))
            .attr("height", d => rectangleHeight)
            .attr("text", d => d.key)
            .attr("fill", d => this.selectedBars.hasOwnProperty(d["key"]) ? "gray" : colorScale(d.key))


        // Create axises then rotate labels
        let xAxis = this.xAxisGroup
            .transition().duration(500)
            .call(d3.axisBottom(xScale));

        let yAxis = this.yAxisGroup
            .transition().duration(500)
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", `translate(20, 0)`);
    }
}