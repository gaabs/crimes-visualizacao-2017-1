import * as d3 from "d3";
import * as proj4x from "proj4";
import {BaseType} from "d3-selection";
import {Crime} from "./crime";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class HeatMap{
    private projection;
    private svg;
    private canvas;

    constructor(private parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                private x: number,
                private y: number,
                private width: number,
                private height: number,
                private gridSize: number,
                private geoData) {

        // Initialize attributes
        this.projection = d3.geoMercator()
            .translate([width / 2, height / 2])
            .scale(100000)
            .center([-123.115328, 49.249808]);

        this.svg = parent.append("svg")
            .attr("class", "heatmap")
            .attr("width", width)
            .attr("height", height)
            .attr("x", x)
            .attr("y", y);

        this.canvas = this.svg.append("g");

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0, 5])
            .on('zoom', _ => {
                this.canvas.attr("transform", d3.event.transform);
            });

        this.svg.call(zoom);

        // Draw map
        this.plotMap();

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

        // let maxi = heatmapData[0].value;
        let maxi = d3.max(heatmapData, d => {
            let i = d.key[0], j = d.key[1];
            if (i >= 0 && i < this.height / this.gridSize && j >= 0 && j < this.width / this.gridSize) {
                return d.value;
            } else {
                return 0;
            }
        });

        // console.log("heatmap: ", heatmapData);
        // console.log("maxi:", maxi);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
        opacityScale.domain([0, maxi]);

        // Draw grid
        let grid = this.canvas.selectAll("rect")
            .data(heatmapData);

        grid.enter()
            .append("rect")
            .attr("width", this.gridSize)
            .attr("height", this.gridSize)
            .merge(grid)
            .transition().duration(500)
            .attr("x", d => d.key[0] * this.gridSize)
            .attr("y", d => d.key[1] * this.gridSize)
            .attr("fill", d => colorScale(d['value']))
            .attr("opacity", d => d.value ? opacityScale(d.value) : 0)
            .text(d => d['value']);

        grid.exit().remove();
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