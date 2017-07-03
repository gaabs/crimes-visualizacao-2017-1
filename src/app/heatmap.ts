import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
// const colors = ["#ffffd9", "#081d58"];
// const colors = ["#ffffd9", "#41b6c4", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class HeatMap {
    private projection;
    private svg;
    private canvas;

    constructor(private parent,
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

    update(crimeData) {
        let heatmap = this.calculateHeatmap(this.width, this.height, this.gridSize, crimeData, this.projection);
        let maxi = d3.max(heatmap, d => d['value']);

        console.log("heatmap: ", heatmap);
        console.log("maxi:", maxi);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
        opacityScale.domain([0, maxi]);

        // Draw grid
        let grid = this.canvas.selectAll("rect")
            .data(heatmap);

        grid.enter()
            .append("rect")
            .attr("x", d => d['i'] * this.gridSize)
            .attr("y", d => d['j'] * this.gridSize)
            .attr("width", this.gridSize)
            .attr("height", this.gridSize)
            .merge(grid)
            .attr("fill", d => colorScale(d['value']))
            .attr("opacity", d => opacityScale(d['value']))
            .text(d => d['value']);

        grid.exit().remove();
    }

    /**
     *  Returns heatmap data array, where each element contains:
     *  i: row number
     *  j: column number
     *  value: heatmap count value
     *
     * @param width
     * @param height
     * @param gridSize
     * @param crimeData
     * @param projection
     * @returns {Array}
     */
    calculateHeatmap(width, height, gridSize, crimeData, projection) {
        let heatmap = [];
        for (let i = 0; i < height / gridSize; i++) {
            heatmap[i] = [];
            for (let j = 0; j < width / gridSize; j++) {
                heatmap[i][j] = 0;
            }
        }

        crimeData.forEach(d => {
            let latlong: any = proj4(Projections.utm, Projections.wgs84, [d["X"], d["Y"]]);
            let proj = projection([latlong[0], latlong[1]]);
            let i = Math.round(proj[0] / gridSize), j = Math.round(proj[1] / gridSize);
            if (i >= 0 && i < height / gridSize && j >= 0 && j < width / gridSize) {
                heatmap[i][j]++;
            } else {
                // console.log(i,j);
            }
        });

        let heatmapData = [];
        heatmap.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value) {
                    heatmapData.push({'i': i, 'j': j, 'value': value});
                }
            });
        });

        return heatmapData;
    }
}