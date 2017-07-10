import * as d3 from "d3";
import {BaseType} from "d3-selection";
import {AbstractPlot} from "./abstractPlot";

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

export class Choropleth extends AbstractPlot {
    public dispatch;
    private tooltip;
    private tooltipTitle;
    private tooltipText;
    private plot;

    constructor(parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                x: number,
                y: number,
                totalWidth: number,
                totalHeight: number,
                margin: {},
                name: string,
                private geoData,
                private path) {

        super(parent, x, y, totalWidth, totalHeight, margin, name);

        // Initialize attributes

        this.tooltip = d3.select("#tooltip-map");
        this.tooltipTitle = this.tooltip.select("#tooltip-title");
        this.tooltipText = this.tooltip.select("#tooltip-text");
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

        console.log("Choropleth: ", neighbourhoodData);

        let colorScale = d3.scaleQuantize<string>().range(colors);
        colorScale.domain([0, maxi]);

        this.plot = this.svg.selectAll("path")
            .data(this.geoData.features);

        this.plot.exit().remove();
        this.plot = this.plot.enter().append("path")
            .style("stroke", "black")
            .style("stroke-width", "1")
            .style("opacity", 0.7)
            .merge(this.plot)
            .style("fill", d => {
                let neighbourhood = d.properties.name;
                return this.selected.hasOwnProperty(neighbourhood) ? "gray" : colorScale(d.properties.value);
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

    }

}