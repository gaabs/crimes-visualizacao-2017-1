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
    private colorScale;
    private legendAxis;
    private legendScale;

    constructor(private gridSize: number, private map, private legendSvg) {

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

        this.colorScale = d3.scaleQuantize<string>().range(colors);

        //Append a defs (for definition) element to your SVG
        let defs = legendSvg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        let linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient-heatmap");

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

        legendSvg.append("rect")
            .attr("x", 0)
            .attr("width", 200)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient-heatmap)")
            .style("z-index", "1002");

        // Create axis
        this.legendAxis = legendSvg.append("g")
            .attr("class", "legendAxis")
            // .attr("transform", `translate(${this.width / 3}, 40)`);
            .attr("transform", `translate(0, 40)`)
            .style("z-index", "1002");

        this.legendScale = d3.scaleLinear()
        // .range([0, this.width / 2]);
            .range([0, 200]);
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

        this.colorScale.domain([0, maxi]);

        filteredData.forEach((d) => {
            let i = Math.floor((d.key[1] - this.latLng[0][1]) / this.eachHeight);
            let j = Math.floor((d.key[0] - this.latLng[0][0]) / this.eachWidth);
            this.data[i][j].hits += d.value;
        });

        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                this.rectangles[i][j].setStyle({color: this.colorScale(this.data[i][j].hits)});
                this.rectangles[i][j].setStyle({fillOpacity: this.data[i][j].hits === 0 ? 0 : 0.5});
            }
        }

        // Update legend
        this.legendScale.domain([0, maxi]);
        this.legendAxis
            .transition().duration(500)
            .call(d3.axisTop(this.legendScale.nice())
                .ticks(3, "s")
                .tickSizeOuter(0));
    }

    createGridDimension(crimes: CrossFilter.CrossFilter<Crime>) {
        let crimesByGridDimension = crimes.dimension(d => {
            return [d.Y, d.X];
        });
        return crimesByGridDimension;
    }
}