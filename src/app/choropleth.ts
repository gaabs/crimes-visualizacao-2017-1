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

        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("width", "80px")
            .style("height", "38px");

        this.colorScale = d3.scaleQuantize<string>().range(colors);

        //Append a defs (for definition) element to your SVG
        let defs = this.svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        let linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

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
            .style("fill", "url(#linear-gradient)");

        // Create axis
        this.legendAxis = this.svg.append("g")
            .attr("class", "legendAxis")
            .attr("transform", `translate(${this.width / 3}, 40)`);

        this.legendScale = d3.scaleLinear()
            .range([0, this.width / 2]);

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


        this.colorScale.domain([0, maxi]);

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
                    .style("opacity", .9);
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
                let neighbourhood = {"name": d.properties.name, "value": d.properties.value};
                return this.getColor(neighbourhood);
            });


        choropleth.exit().remove();

        // Update legend
        this.legendScale.domain([0, maxi]);
        this.legendAxis
            .transition().duration(500)
            .call(d3.axisTop(this.legendScale.nice())
                .ticks(3, "s")
                .tickSizeOuter(0))
    }

    getColor(neighbourhood: any) {
        // If none selected, default color for current element
        // If any selected, current element has default color if selected, gray otherwise

        if (Object.keys(this.selected).length == 0 || this.selected.hasOwnProperty(neighbourhood.name)) {
            return this.colorScale(neighbourhood.value);
        } else {
            return "gray";
        }
    }

}