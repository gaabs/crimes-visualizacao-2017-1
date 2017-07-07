import * as d3 from "d3";
import * as proj4x from "proj4";
import {BaseType} from "d3-selection";
import {Crime} from "./crime";
import {AbstractPlot} from "./abstractPlot";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class HeatMap extends AbstractPlot {
    private projection;
    private legendAxis;
    private legendScale;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string,
                private gridSize: number,
                private geoData) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);

        // Initialize attributes
        this.projection = d3.geoMercator()
            .translate([this.width / 2, this.height / 2])
            .scale(100000)
            .center([-123.115328, 49.249808]);

        this.colorScale = d3.scaleQuantize<string>().range(colors);

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0, 5])
            .on('zoom', _ => {
                this.canvas.attr("transform", d3.event.transform);
            });

        this.svg.call(zoom);

        // Draw map
        this.plotMap();

        //Append a defs (for definition) element to your SVG
        let defs = this.svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        let linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient2");

        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //Draw the rectangle and fill with gradient
        linearGradient.selectAll("stop")
            .data(this.colorScale.range())
            .enter().append("stop")
            .attr("offset", (d, i) => i / (this.colorScale.range().length - 1))
            .attr("stop-color", d => d);

        this.svg.append("rect")
            .attr("x", this.width / 3)
            .attr("width", this.width / 2)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient2)");

        // Create axis
        this.legendAxis = this.svg.append("g")
            .attr("class", "legendAxis")
            .attr("transform", `translate(${this.width / 3}, 40)`);

        this.legendScale = d3.scaleLinear()
            .range([0, this.width / 2]);
    }

    plotMap() {
        const path = d3.geoPath()
            .projection(this.projection);

        this.canvas.append("g")
            .selectAll("path")
            .data(this.geoData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", '#00441b');
    }

    update(heatmapData: CrossFilter.Grouping<number[], number>[]) {
        // let heatmap = this.calculateHeatmap(this.width, this.height, this.gridSize, crimeData, this.projection);

        let filteredData = heatmapData.filter(d => {
            let i = d.key[0], j = d.key[1];
            return i >= 0 && i < this.height / this.gridSize && j >= 0 && j < this.width / this.gridSize;
        });
        let maxi = d3.max(filteredData, d => d.value);

        // console.log("heatmap: ", heatmapData);
        // console.log("maxi:", maxi);

        this.colorScale.domain([0, maxi]);

        let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
        opacityScale.domain([0, maxi]);

        // Draw grid
        let grid = this.canvas.selectAll("rect")
            .data(filteredData);

        grid.enter()
            .append("rect")
            .attr("width", this.gridSize)
            .attr("height", this.gridSize)
            .merge(grid)
            .transition().duration(500)
            .attr("x", d => d.key[0] * this.gridSize)
            .attr("y", d => d.key[1] * this.gridSize)
            .attr("fill", d => this.colorScale(d['value']))
            .attr("opacity", d => d.value ? opacityScale(d.value) : 0)
            .text(d => d['value']);

        grid.exit().remove();

        // Update legend
        this.legendScale.domain([0, maxi]);
        this.legendAxis
            .transition().duration(500)
            .call(d3.axisTop(this.legendScale.nice())
                .ticks(3, "s")
                .tickSizeOuter(0))
    }

    createGridDimension(crimes: CrossFilter.CrossFilter<Crime>) {
        let crimesByGridDimension = crimes.dimension(d => {
            // let latlong: any = proj4(Projections.utm, Projections.wgs84, [d["X"], d["Y"]]);
            let latlong = [d.X, d.Y];
            let proj = this.projection([latlong[0], latlong[1]]);

            if ((proj[0] < 0 || proj[1] < 0) && proj[0] != -7383.050674157625) {
                console.log(d, latlong, proj);
            }

            return [Math.round(proj[0] / this.gridSize), Math.round(proj[1] / this.gridSize)];
        });

        return crimesByGridDimension;
    }
}