import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {Crime} from "./crime";
import {AbstractPlot} from "./abstractPlot";
import * as L from 'leaflet';

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

export class HeatMap extends AbstractPlot {
    private plot;
    private grid;
    private latLng;

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

        this.latLng = [[49.19696140064054, -123.23123931884766], [49.31907993638747, -122.9871368408203]];
    }

    reset() {
        // this.plot.attr("d", this.path);
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
        const widthTotal = Math.abs(this.latLng[0][0] - this.latLng[1][0]);
        const heightTotal = Math.abs(this.latLng[0][1] - this.latLng[1][1])
        const eachWidth = widthTotal / this.gridSize;
        const eachHeight = heightTotal / this.gridSize;

        let filteredData = heatmapData.filter(d => {
            let i = d.key[0], j = d.key[1];
            return i >= this.latLng[0][0] && i < this.latLng[1][0] && j >= this.latLng[0][1] && j < this.latLng[1][1];
        });
        let maxi = d3.max(filteredData, d => d.value);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        let opacityScale = d3.scaleLinear().range([1]);
        opacityScale.domain([0, maxi]);

        const data = [];

        for (let row = 0; row < this.gridSize; row++) {
            data[row] = [];
            for (let column = 0; column < this.gridSize; column++) {
                const bounds = [
                    [this.latLng[0][0] + column * eachWidth, this.latLng[0][1] + row * eachHeight],
                    [this.latLng[0][0] + (column + 1) * eachWidth, this.latLng[0][1] + (row + 1) * eachHeight]
                ];
                data[row][column] = {
                    bounds: bounds,
                    hits: 0
                };
            }
        }
        filteredData.forEach((d) => {
            let found = false;
            for (let i = 0; i < data.length && !found; i++) {
                for (let j = 0; j < data[i].length && !found; j++) {
                    if (
                        d.key[0] >= data[i][j].bounds[0][0]
                        && d.key[0] <= data[i][j].bounds[1][0]
                        && d.key[1] >= data[i][j].bounds[0][1]
                        && d.key[1] <= data[i][j].bounds[1][1]
                    ) {
                        data[i][j].hits += d.value;
                        found = true;
                    }
                }
            }

            // let i = Math.round((d.key[0] - this.latLng[0][0]) / eachWidth);
            // let j = Math.round((d.key[1] - this.latLng[0][1]) / eachHeight);
            // if (i >= this.gridSize) {
            //     i--;
            // }
            // if (j >= this.gridSize) {
            //     j--;
            // }
            // data[i][j].hits += d.value;
        });

        // const test = L.rectangle([[49.248239, -123.118418], [49.268239, -123.098418]]);
        // test.options.color = "black";
        // test.addTo(this.map);

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const rect = L.rectangle(data[i][j].bounds);
                rect.options.color = colorScale(data[i][j].hits);
                rect.options.weight = 0;
                rect.options.fillOpacity = data[i][j].hits === 0 ? 0 : 1;
                rect.options.className = "heatmap-rect";
                rect.addTo(this.map);
            }
        }

        // console.log(data);
    }

    createGridDimension(crimes: CrossFilter.CrossFilter<Crime>) {
        let crimesByGridDimension = crimes.dimension(d => {
            return [d.Y, d.X];
        });

        return crimesByGridDimension;
    }
}