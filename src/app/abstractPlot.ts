import * as d3 from "d3";
import {BaseType} from "d3-selection";

import Grouping = CrossFilter.Grouping;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

export abstract class AbstractPlot {
    public dispatch;

    protected width;
    protected height;
    protected svg;
    protected canvas;
    protected selected = {};

    constructor(protected parent: d3.Selection<BaseType, {}, HTMLElement, any>,
                protected x: number,
                protected y: number,
                protected totalWidth: number,
                protected totalHeight: number,
                protected margin: any,
                protected name: string) {

        // Initiate attributes
        this.width = totalWidth - margin.left - margin.right;
        this.height = totalHeight - margin.top - margin.bottom;

        this.svg = parent.append("svg")
            .attr("class", name)
            .attr("width", totalWidth)
            .attr("height", totalHeight)
            .attr("x", x)
            .attr("y", y);

        this.canvas = this.svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    }

    abstract update(data: Grouping<any, number>[]);
}