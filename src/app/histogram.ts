import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";

import Grouping = CrossFilter.Grouping;

export class Histogram extends AbstractPlot {
    public dispatch;

    private xAxisGroup;
    private yAxisGroup;
    private barsGroup;
    private xScale;
    private yScale;

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

        // Create scales
        // X scale represents the values
        this.xScale = d3.scaleLinear()
            .range([0, this.width]);

        // Y scale represents the labels
        this.yScale = d3.scaleBand()
            .range([this.height, 0]);

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory20);

    }

    setColorRange(colorRange: string[]) {
        this.colorScale.range(colorRange);
    }

    update(data: Grouping<any, number>[]) {
        console.log("histogram", data);

        // Filter out unlabeled data
        data = data.filter(d => d.key.length > 0);

        // X scale represents the values
        this.xScale.domain([0, d3.max(data, d => d.value) + 100]);

        // Y scale represents the labels
        this.yScale.domain(data.map(d => d.key));

        this.colorScale.domain(data.map(d => d.key));

        let rectanglesGroups = this.barsGroup.selectAll(".rect").data(data);
        let rectangleHeight = this.height / (data.length);

        // Update rectangles elements
        rectanglesGroups.exit().remove();
        rectanglesGroups = rectanglesGroups.enter()
            .append("g")
            .attr("class", "rect");
        rectanglesGroups.append("rect");
        rectanglesGroups.append("text");
        rectanglesGroups = this.barsGroup.selectAll(".rect").data(data);

        // Add listeners
        rectanglesGroups
            .on("mouseover", (data, index, parentGroup) => {
                d3.select(parentGroup[index]).select("rect")
                    .attr("fill", "#e64a19");
            })
            .on("mouseout", (d, index, parentGroup) => {
                d3.select(parentGroup[index]).select("rect")
                    .attr("fill", _ => this.selected.hasOwnProperty(d.key) ? "gray" : this.colorScale(d.key));
            })
            .on("click", (data: Grouping<string, number>) => {
                this.clicked(data.key)
            });


        // Update rectangles values
        rectanglesGroups.select("rect")
            .transition().duration(500)
            .attr("x", 0)
            .attr("y", d => this.yScale(d.key))
            .attr("width", d => this.xScale(d.value))
            .attr("height", d => rectangleHeight)
            .attr("fill", d => this.selected.hasOwnProperty(d.key) ? "gray" : this.colorScale(d.key));

        // Update rectangles labels
        rectanglesGroups.select("text")
            .transition().duration(500)
            .attr("x", 5)
            .attr("y", d => this.yScale(d.key) + rectangleHeight / 2)
            .attr("dominant-baseline", "central")
            .style("font", "10px sans-serif")
            .text(d => d.key);


        // Create axis
        this.xAxisGroup
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale));
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