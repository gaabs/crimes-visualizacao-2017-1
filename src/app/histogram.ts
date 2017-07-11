import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";

import Grouping = CrossFilter.Grouping;

export class Histogram extends AbstractPlot {
    public dispatch;

    private tooltip;
    private xAxisGroup;
    private yAxisGroup;
    private barsGroup;
    private xScale;
    private yScale;
    private labelMapping;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);


        // Create tooltip
        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

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

    setLabelMapping(labelMapping: {}) {
        this.labelMapping = labelMapping;
    }

    update(data: Grouping<any, number>[]) {
        console.log("histogram", data);

        // Filter out unlabeled data
        data = data.filter(d => (typeof d) != 'string' || d.key.length > 0);

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
                // Update rectangle color
                let color = d3.color(this.getColor(data.key)).darker();
                d3.select(parentGroup[index]).select("rect")
                    .attr("fill", color.toString());

                // Update and show tooltip
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                this.tooltip.html(data.value)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", (d, index, parentGroup) => {
                // Update rectangle color
                d3.select(parentGroup[index]).select("rect")
                    .attr("fill", _ => this.getColor(d.key));

                // Hide tooltip
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
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
            .attr("fill", d => this.getColor(d.key));

        // Update rectangles labels
        rectanglesGroups.select("text")
            .transition().duration(500)
            .attr("x", 5)
            .attr("y", d => this.yScale(d.key) + rectangleHeight / 2)
            .attr("dominant-baseline", "central")
            .style("font", "10px sans-serif")
            .text(d => {
                if (this.labelMapping && this.labelMapping.hasOwnProperty(d.key)) {
                    return this.labelMapping[d.key];
                } else {
                    return d.key;
                }
            });


        // Create axis
        this.xAxisGroup
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale.nice())
                .ticks(5, "s")
                .tickSizeOuter(0));
    }

    getColor(key: string) {
        // If none selected, default color for current element
        // If any selected, current element has default color if selected, gray otherwise
        if (Object.keys(this.selected).length == 0 || this.selected.hasOwnProperty(key)) {
            return this.colorScale(key);
        } else {
            return "gray";
        }
    }

    clicked(value: string) {
        if (this.selected.hasOwnProperty(value)) {
            delete this.selected[value];
        } else {
            this.selected[value] = true;
        }
        this.dispatch.call("selectionChanged", {}, this.selected);
    }

    addAxesTitles(xTitle: string, yTitle: string) {
        this.canvas.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", `translate(${-this.margin.left / 4}, ${this.height / 2}) rotate(-90)`)  // text is drawn off the screen top left, move down and out and rotate
            .text(yTitle);

        this.canvas.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", `translate(${this.width / 2}, ${this.height + this.margin.bottom})`)  // centre below axis
            .text(xTitle);
    }
}