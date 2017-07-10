import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {Crime} from "./crime";
import {AbstractPlot} from "./abstractPlot";
import * as L from 'leaflet';

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

export class HeatMap extends AbstractPlot {
    private plot;
    private grid;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string,
                private gridSize: number,
                private geoData,
                private path,
                private map) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);

        this.plotMap();
    }

    reset() {
        this.plot.attr("d", this.path);

        // this.grid.attr("transform", (d) => {
        //     return "translate(" + d.key[0] + "," + d.key[1] + ")";
        // });
        //
        // const bounds = this.path.bounds(this.geoData);
        //
        // const topLeft = bounds[0],
        //     bottomRight = bounds[1];
        //
        // this.svg.attr("width", bottomRight[0] - topLeft[0])
        //     .attr("height", bottomRight[1] - topLeft[1])
        //     .style("left", topLeft[0] + "px")
        //     .style("top", topLeft[1] + "px");
        //
        // // this.svg.attr("transform", "translate(" + -topLeft[0] + ","
        // //     + -topLeft[1] + ")");
        //
        // // initialize the path data
        // // d3_features.attr("d", path)
        // //     .style("fill-opacity", 0.7)
        // //     .attr('fill', 'blue');
    }

    plotMap() {
        this.plot = this.svg.selectAll("path")
            .data(this.geoData.features)
            .enter()
            .append("path")
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", '#00441b');
    }

    update(heatmapData: CrossFilter.Grouping<number[], number>[]) {
        // const bounds = this.path.bounds(this.geoData);
        //
        // const topLeft = bounds[0],
        //     bottomRight = bounds[1];
        //
        // this.width = bottomRight[0] - topLeft[0];
        // this.height = bottomRight[1] - topLeft[1];
        //
        // console.log(heatmapData);

        // let mappedData = heatmapData.map(d => {
        //     const point = this.map.latLngToLayerPoint(new L.LatLng(d.key[1], d.key[0]));
        //     d.key = [point.x, point.y];
        //     return d;
        // });

        let filteredData = heatmapData.filter(d => {
            let i = d.key[0], j = d.key[1];
            return i >= 0 && i < this.height / this.gridSize && j >= 0 && j < this.width / this.gridSize;
        });
        let maxi = d3.max(filteredData, d => d.value);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
        opacityScale.domain([0, maxi]);

        // Draw grid
        this.grid = this.svg.selectAll("rect")
            .data(filteredData);

        this.grid.enter()
            .append("rect")
            .attr("width", this.gridSize)
            .attr("height", this.gridSize)
            .merge(this.grid)
            .transition().duration(500)
            .attr("x", d => d.key[0] * this.gridSize)
            .attr("y", d => d.key[1] * this.gridSize)
            .attr("fill", d => colorScale(d['value']))
            .attr("opacity", d => d.value ? opacityScale(d.value) : 0)
            .text(d => d['value']);

        this.grid.exit().remove();
    }

    createGridDimension(crimes: CrossFilter.CrossFilter<Crime>) {
        let crimesByGridDimension = crimes.dimension(d => {
            const point = this.map.latLngToLayerPoint(new L.LatLng(d.Y, d.X));
            // d.key = [Math.round(point.x / this.gridSize), Math.round(point.y / this.gridSize)];

            return [Math.round(point.x / this.gridSize), Math.round(point.y / this.gridSize)];
            // return [d.X, d.Y];
        });

        return crimesByGridDimension;
    }
}