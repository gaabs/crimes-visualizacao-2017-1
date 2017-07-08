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
    private tooltip;
    private dateHighlight;

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
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .append("path")
            .style("stroke", "#86170F")
            .style("stroke-width", "1px")
            .style("fill", "red");

        this.xAxisGroup = this.canvas.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.height})`);
        this.yAxisGroup = this.canvas.append("g")
            .attr("class", "yAxis");

        this.xScale = d3.scaleTime()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        // this.lineFunction = d3.line<Grouping<Date, number>>()
        //     .x(d => this.xScale(d.key))
        //     .y(d => this.yScale(d.value))
        //     .curve(d3.curveLinear);

        // Area
        this.lineFunction = d3.area<Grouping<Date, number>>()
            .x(d => this.xScale(d.key))
            .y0(this.height)
            .y1(d => this.yScale(d.value))
        // .curve(d3.curveMonotoneX)


        // Add zoom functionality
        var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [this.width, this.height]])
            .extent([[0, 0], [this.width, this.height]])
            .on("zoom", _ => this.zoomed());

        this.svg.append("rect")
            .attr("class", "zoom")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .attr("fill", "none")
            .attr("cursor", "move")
            .attr("pointer-events", "all")
            .call(zoom)
            .on("mousemove", _ => {
                // Show tooltip
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                // Update tooltip position and info
                // TODO: check magic 7
                let x = d3.event.x - this.margin.left - 7, y = d3.event.y;
                let date = this.xScale.invert(x);
                // let crimeCount = this.yScale(date);
                // this.tooltip.html(crimeCount + "<br/>" + date)
                this.tooltip.html(date)
                    .style("left", x + "px")
                    .style("top", (y - 40) + "px");

                // Show date highlight rectangle
                this.dateHighlight
                    .style("opacity", 0.5)
                    .attr("x", x);
            })
            .on("mouseout", _ => {
                // Hide tooltip
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                // Hide date highlight rectangle
                this.dateHighlight.style("opacity", 0);
            });

        // Create tooltip
        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create date highlight rectangle
        this.dateHighlight = this.canvas.append("rect")
            .attr("class", "dateHighlight")
            .attr("width", 2)
            .attr("height", this.height)
            .attr("fill", "black")
            .style("opacity", 0);
    }

    // Plots line chart with crime data
    update(data: Grouping<Date, number>[]) {
        // console.log("linechart", data);
        this.data = data;

        this.resetScales();
        this.updateAxises(true);
        this.plot(true);
    }

    plot(transition: boolean) {
        this.path
            .transition().duration(transition ? 500 : 0)
            .attr("d", this.lineFunction(this.data));
    }

    resetScales() {
        this.xScale.domain(d3.extent(this.data, d => d.key));
        this.yScale.domain([0, d3.max(this.data, d => d.value)]);

        this.xScaleBase = this.xScale.copy();
        this.yScaleBase = this.yScale.copy();
    }

    updateAxises(transition: boolean) {
        let xAxis = this.xAxisGroup
            .transition().duration(transition ? 500 : 0)
            .call(d3.axisBottom(this.xScale));

        let yAxis = this.yAxisGroup
            .transition().duration(transition ? 500 : 0)
            .call(d3.axisLeft(this.yScale));
    }

    zoomed() {
        var t = d3.event.transform;
        this.xScale.domain(t.rescaleX(this.xScaleBase).domain());
        // console.log("xScale domain:" ,this.xScale.domain());
        // console.log("originalXScale domain:" ,this.xScaleBase.domain());
        // console.log(t);
        this.updateAxises(false);
        this.plot(false);
    }
}

