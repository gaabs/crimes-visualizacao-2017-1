import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const width = 800;
const height = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

// Plots Pie chart with crime data
export function plotData(data) {
    console.log("Pie data: ", data);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var legend = d3.select("body").append("svg")
        .attr("class", "legend")
        .attr("width", 400)
        .attr("height", (data.length) * 20)
        .selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d["key"]));

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function (d) {
            return d["key"];
        });

    var pie = d3.pie()
        .sort(null)
        .padAngle(0.02)
        .value((d: any) => d["value"])
    ;

    var radius = 100;
    const arc: any = d3.arc()
        .padRadius(50);
    // .outerRadius(radius)
    // .innerRadius(radius * 0.6);

    var pies = d3.select("body").selectAll(".pie")
        .data([data])
        .enter().append("svg")
        .attr("class", "pie")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    pies.selectAll(".arc")
        .data(d => pie(d))
        .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc.outerRadius(radius).innerRadius(radius * 0.6))
        .style("fill", (d: any) => color(d.data["key"]));


    // const x = arc.outerRadius(radius).innerRadius(radius*0.6);

    // pies.append("text")
    //     .attr("dy", ".35em")
    //     .style("text-anchor", "middle")
    //     .text(function (d) {
    //         return d.MONTH;
    //     });
};