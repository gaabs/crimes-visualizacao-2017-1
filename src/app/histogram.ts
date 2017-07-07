import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";

import Grouping = CrossFilter.Grouping;

export class Histogram extends AbstractPlot {
    public dispatch;

    private xAxisGroup;
    private yAxisGroup;
    private barsGroup;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);


        // Creating groups
        this.barsGroup = this.canvas.append("g")
            .attr("class", "bars");

        this.xAxisGroup = this.canvas.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.height})`);

        this.yAxisGroup = this.canvas.append("g")
            .attr("class", "yAxis");

    }

    update(data: Grouping<any, number>[]) {
        console.log("histogram", data);

        // Filter out unlabeled data
        data = data.filter(d => d.key.length > 0);

        // X scale represents the values
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) + 100])
            .range([0, this.width]);

        // Y scale represents the labels
        let yScale = d3.scaleBand()
            .domain(data.map(d => d.key))
            .range([this.height, 0]);


        let colorScale = d3.scaleOrdinal(d3.schemeCategory20).domain(data.map(d => d.key));

        let rectangles = this.barsGroup.selectAll("rect").data(data);
        let rectangleHeight = this.height / (data.length);

        rectangles.exit().remove();
        rectangles.enter().append("rect").merge(rectangles)
            .on("click", (data: Grouping<string, number>) => this.clicked(data.key))
            .transition().duration(500)
            .attr("x", 0)
            .attr("y", d => yScale(d.key))
            .attr("width", d => xScale(d.value))
            .attr("height", d => rectangleHeight)
            .attr("fill", d => this.selected.hasOwnProperty(d.key) ? "gray" : colorScale(d.key))
            .text(d => d.key);


        // Create axises then rotate labels
        this.xAxisGroup
            .transition().duration(500)
            .call(d3.axisBottom(xScale));

        this.yAxisGroup
            .transition().duration(500)
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", `translate(20, 0)`);

        this.yAxisGroup.selectAll(".tick")
            .on("click", d => this.clicked(d));
    }

    clicked(value: string) {
        if (this.selected.hasOwnProperty(value)) {
            delete this.selected[value];
        } else {
            this.selected[value] = true;
        }
        this.dispatch.call("selectionChanged", {}, this.selected);
    }
}