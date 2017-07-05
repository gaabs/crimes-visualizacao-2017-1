import * as d3 from "d3";
import * as proj4x from "proj4";
import {BaseType} from "d3-selection";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class Choropleth {
    public dispatch;

    private projection;
    private svg;
    private canvas;
    private tooltip;
    private selectedNeighbourhoods = {};

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

        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0, 5])
            .on('zoom', _ => {
                this.canvas.attr("transform", d3.event.transform);
            });

        this.svg.call(zoom);
    }

    update(neighbourhoodData: CrossFilter.Grouping<string, number>[]) {
        // let heatmap = this.calculateHeatmap(this.width, this.height, this.gridSize, crimeData, this.projection);

        let maxi = 0;

        // Join data
        let neighbourhoodDataHash = {};
        neighbourhoodData.forEach(grouping => neighbourhoodDataHash[grouping.key] = grouping.value);

        this.geoData.features.forEach(feature => {
            let neighbourhood = feature.properties.name;
            if (neighbourhoodDataHash.hasOwnProperty(neighbourhood)) {
                feature.properties.value = neighbourhoodDataHash[neighbourhood];
                maxi = Math.max(maxi, neighbourhoodDataHash[neighbourhood]);
                console.log(neighbourhood, feature.properties.value);
            } else {
                feature.properties.value = 0
            }
        });

        // console.log("Choropleth: ", neighbourhoodData);
        // console.log("maxi:", maxi);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        // let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
        // opacityScale.domain([0, maxi]);

        // Draw grid
        const path = d3.geoPath()
            .projection(this.projection);

        let choropleth = this.canvas.selectAll("path")
            .data(this.geoData.features);

        choropleth.enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .merge(choropleth)
            .on("click", (d) => {
                let neighbourhood = d.properties.name;
                if (this.selectedNeighbourhoods.hasOwnProperty(neighbourhood)) {
                    delete this.selectedNeighbourhoods[neighbourhood];
                } else {
                    this.selectedNeighbourhoods[neighbourhood] = true;
                }
                // console.log(this.selectedNeighbourhoods);
                // console.log(data);
                this.dispatch.call("selectionChanged", {}, this.selectedNeighbourhoods);
            })
            // .on("mouseover", d => {
            //     this.tooltip.transition()
            //         .duration(200)
            //         .style("opacity", .9)
            //     this.tooltip.html(d.properties.name + "<br/>" + d.properties.value)
            //         .style("left", (d3.event.pageX) + "px")
            //         .style("top", (d3.event.pageY - 28) + "px");
            // })
            .transition().duration(500)
            .style("fill", d => {
                let neighbourhood = d.properties.name;
                return this.selectedNeighbourhoods.hasOwnProperty(neighbourhood) ? "gray" : colorScale(d.properties.value);
            });

        choropleth.exit().remove();
    }

}