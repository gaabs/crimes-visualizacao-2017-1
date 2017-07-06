import * as d3 from "d3";
import * as proj4x from "proj4";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class Choropleth extends AbstractPlot {
    public dispatch;

    private projection;
    private tooltip;

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

        // let margin = {top: 10, right: 20, bottom: 30, left: 40};

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
                // console.log(neighbourhood, feature.properties.value);
            } else {
                feature.properties.value = 0
            }
        });

        console.log("Choropleth: ", neighbourhoodData);
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
                if (this.selected.hasOwnProperty(neighbourhood)) {
                    delete this.selected[neighbourhood];
                } else {
                    this.selected[neighbourhood] = true;
                }
                // console.log(this.selectedNeighbourhoods);
                // console.log(data);
                this.dispatch.call("selectionChanged", {}, this.selected);
            })
            .on("mouseover", d => {
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9)
                this.tooltip.html(d.properties.name + "<br/>" + d.properties.value)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", d => {
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition().duration(500)
            .style("fill", d => {
                let neighbourhood = d.properties.name;
                return this.selected.hasOwnProperty(neighbourhood) ? "gray" : colorScale(d.properties.value);
            });

        choropleth.exit().remove();
    }

}