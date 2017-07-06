import * as d3 from "d3";
import * as proj4x from "proj4";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";
import Grouping = CrossFilter.Grouping;
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

export class LineChart extends AbstractPlot {
    private path;
    private xAxisGroup;
    private yAxisGroup;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);

        // Initiate attributes
        this.path = this.canvas
            .append("g")
            .append("path")
            .style("stroke", "#86170F")
            .style("stroke-width", "1px")
            .style("fill", "none");

        this.xAxisGroup = this.canvas.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.height})`);
        this.yAxisGroup = this.canvas.append("g")
            .attr("class", "yAxis");
    }

    // Plots line chart with crime data
    update(data: Grouping<Date, number>[]) {
        // console.log("linechart", data);

        let xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.key))
            .range([0, this.width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([this.height, 0]);

        let lineFunction = d3.line<Grouping<Date, number>>()
            .x(d => xScale(d.key))
            .y(d => yScale(d.value))
            .curve(d3.curveLinear);

        this.path
            .transition().duration(500)
            .attr("d", lineFunction(data));

        let xAxis = this.xAxisGroup
            .transition().duration(500)
            .call(d3.axisBottom(xScale));

        let yAxis = this.yAxisGroup
            .transition().duration(500)
            .call(d3.axisLeft(yScale));
    }
}

