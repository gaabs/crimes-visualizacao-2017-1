import * as d3 from "d3";
import {Crime} from "./crime";
import * as L from 'leaflet';

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

export class HeatMap {
    private latLng;
    private data;
    private widthTotal;
    private heightTotal;
    private eachWidth;
    private eachHeight;
    private rectangles;

    constructor(private gridSize: number, private map) {

        this.latLng = [[49.19696140064054, -123.23123931884766], [49.31907993638747, -122.9871368408203]];

        this.widthTotal = Math.abs(this.latLng[0][0] - this.latLng[1][0]);
        this.heightTotal = Math.abs(this.latLng[0][1] - this.latLng[1][1])
        this.eachWidth = this.widthTotal / this.gridSize;
        this.eachHeight = this.heightTotal / this.gridSize;

        this.data = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.data[row] = [];
            for (let column = 0; column < this.gridSize; column++) {
                const bounds = [
                    [this.latLng[0][0] + column * this.eachWidth, this.latLng[0][1] + row * this.eachHeight],
                    [this.latLng[0][0] + (column + 1) * this.eachWidth, this.latLng[0][1] + (row + 1) * this.eachHeight]
                ];
                this.data[row][column] = {
                    bounds: bounds,
                    hits: 0
                };
            }
        }

        this.rectangles = [];

        for (let i = 0; i < this.data.length; i++) {
            this.rectangles[i] = [];
            for (let j = 0; j < this.data[i].length; j++) {
                this.rectangles[i][j] = L.rectangle(this.data[i][j].bounds);
                this.rectangles[i][j].options.weight = 0;
                this.rectangles[i][j].options.color = "transparent";
                this.rectangles[i][j].options.className = "heatmap-rect";
                this.rectangles[i][j].addTo(this.map);
            }
        }
    }

    update(heatmapData: CrossFilter.Grouping<number[], number>[]) {
        let filteredData = heatmapData.filter(d => {
            let i = d.key[0], j = d.key[1];
            return i >= this.latLng[0][0] && i < this.latLng[1][0] && j >= this.latLng[0][1] && j < this.latLng[1][1];
        });

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.data[i][j].hits = 0;
            }
        }

        let maxi = d3.max(filteredData, d => d.value);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        filteredData.forEach((d) => {
            let i = Math.floor((d.key[1] - this.latLng[0][1]) / this.eachHeight);
            let j = Math.floor((d.key[0] - this.latLng[0][0]) / this.eachWidth);
            this.data[i][j].hits += d.value;
        });

        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                this.rectangles[i][j].setStyle({color: colorScale(this.data[i][j].hits)});
                this.rectangles[i][j].setStyle({fillOpacity: this.data[i][j].hits === 0 ? 0 : 0.5});
            }
        }
    }

    createGridDimension(crimes: CrossFilter.CrossFilter<Crime>) {
        let crimesByGridDimension = crimes.dimension(d => {
            return [d.Y, d.X];
        });
        return crimesByGridDimension;
    }
}