import * as d3 from "d3";
import {BaseType} from "d3-selection";

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

export class Choropleth {
    public dispatch;
    private tooltip;
    private tooltipTitle;
    private tooltipText;
    private plot;
    private selected = {};
    private colorScale;
    private legendAxis;
    private legendScale;

    constructor(private canvas,
                private geoData,
                private path,
                private legendSvg) {

        this.tooltip = d3.select("#tooltip-map");
        this.tooltipTitle = this.tooltip.select("#tooltip-title");
        this.tooltipText = this.tooltip.select("#tooltip-text");
        this.colorScale = d3.scaleQuantize<string>().range(colors);

        //Append a defs (for definition) element to your SVG
        let defs = legendSvg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        let linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient-choropleth");

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
            .style("fill", "url(#linear-gradient-choropleth)")
            .style("z-index", "1002");

        // Create axis
        this.legendAxis = legendSvg.append("g")
            .attr("class", "legendAxis")
            // .attr("transform", `translate(${this.width / 3}, 40)`);
            .attr("transform", `translate(10, 40)`)
            .style("z-index", "1002");

        this.legendScale = d3.scaleLinear()
            // .range([0, this.width / 2]);
            .range([0, 180]);
    }

    reset() {
        this.plot.attr("d", this.path);
    }

    update(neighbourhoodData: CrossFilter.Grouping<string, number>[]) {
        let maxi = 0;

        // Join data
        let neighbourhoodDataHash = {};
        neighbourhoodData.forEach(grouping => neighbourhoodDataHash[grouping.key] = grouping.value);

        this.geoData.features.forEach(feature => {
            let neighbourhood = feature.properties.name;
            if (neighbourhoodDataHash.hasOwnProperty(neighbourhood)) {
                feature.properties.value = neighbourhoodDataHash[neighbourhood];
                maxi = Math.max(maxi, neighbourhoodDataHash[neighbourhood]);
            } else {
                feature.properties.value = 0
            }
        });

        this.colorScale.domain([0, maxi]);

        this.plot = this.canvas.selectAll("path")
            .data(this.geoData.features);

        this.plot.exit().remove();
        this.plot = this.plot.enter().append("path")
            .style("stroke", "black")
            .style("stroke-width", "1")
            .style("opacity", 0.7)
            .merge(this.plot)
            .style("fill", d => {
                let neighbourhood = {"name": d.properties.name, "value": d.properties.value};
                return this.getColor(neighbourhood);
            });

        this.plot
            .on("click", (d) => {
                let neighbourhood = d.properties.name;
                if (this.selected.hasOwnProperty(neighbourhood)) {
                    delete this.selected[neighbourhood];
                } else {
                    this.selected[neighbourhood] = true;
                }
                this.dispatch.call("selectionChanged", {}, this.selected);
            })
            .on("mouseover", d => {
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                this.tooltipTitle.text(d.properties.name);
                this.tooltipText.text(d.properties.value);
            })
            .on("mouseout", d => {
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Update legend
        this.legendScale.domain([0, maxi]);
        this.legendAxis
            .transition().duration(500)
            .call(d3.axisTop(this.legendScale.nice())
                .ticks(3, "s")
                .tickSizeOuter(0));
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