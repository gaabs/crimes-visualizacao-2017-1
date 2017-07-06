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
    private xScale;
    private yScale;
    private lineFunction;
    private xScaleBase;
    private yScaleBase;
    private data: Grouping<Date, number>[];

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

        this.xScale = d3.scaleTime()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        this.lineFunction = d3.line<Grouping<Date, number>>()
            .x(d => this.xScale(d.key))
            .y(d => this.yScale(d.value))
            .curve(d3.curveLinear);

        // Add zoom functionality
        var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [this.width, this.height]])
            .extent([[0, 0], [this.width, this.height]])
            .on("zoom", d => {
                // console.log(d3.event.transform);
                this.zoomed();
                // this.canvas.attr("transform", d3.event.transform);

            });

        this.svg.append("rect")
            .attr("class", "zoom")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .attr("fill", "none")
            .attr("cursor", "move")
            .attr("pointer-events", "all")
            .call(zoom);
    }

    // Plots line chart with crime data
    update(data: Grouping<Date, number>[]) {
        // console.log("linechart", data);
        this.data = data;

        this.resetScales();
        this.updateAxises();
        this.plot();
    }

    plot() {
        //TODO: check when to do transition
        this.path
            // .transition().duration(500)
            .attr("d", this.lineFunction(this.data));
    }

    resetScales() {
        this.xScale.domain(d3.extent(this.data, d => d.key));
        this.yScale.domain([0, d3.max(this.data, d => d.value)]);

        this.xScaleBase = this.xScale.copy();
        this.yScaleBase = this.yScale.copy();
    }

    updateAxises() {
        let xAxis = this.xAxisGroup
            // .transition().duration(500)
            .call(d3.axisBottom(this.xScale));

        let yAxis = this.yAxisGroup
            // .transition().duration(500)
            .call(d3.axisLeft(this.yScale));
    }

    zoomed() {
        var t = d3.event.transform;
        this.xScale.domain(t.rescaleX(this.xScaleBase).domain());
        // console.log("xScale domain:" ,this.xScale.domain());
        // console.log("originalXScale domain:" ,this.xScaleBase.domain());
        this.updateAxises();
        console.log(t);
        this.plot();
    }
}

