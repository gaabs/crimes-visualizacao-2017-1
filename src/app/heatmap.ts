import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ["#ffffd9", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
// const colors = ["#ffffd9", "#081d58"];
// const colors = ["#ffffd9", "#41b6c4", "#081d58"];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));

export function plotData(parent, x, y, width, height, geoData, crimeData) {
    console.log("heatmap crimeData", crimeData);
    console.log("heatmap geoData", geoData);

    const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(100000)
        .center([-123.115328, 49.249808]);

    const path = d3.geoPath()
        .projection(projection);

    //Create SVG element
    let svg = parent.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("x", x)
        .attr("y", y);

    const canvas = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0, 5])
        // .translateExtent([[-2*1000, -1000], [2*1000, 2*1000]])
        .on('zoom', _ => {
            canvas.attr("transform", d3.event.transform);
        });

    svg.call(zoom);


    // Draw map
    canvas.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", '#00441b');


    let heatmap = [];
    let gridSize = 10;
    for (let i = 0; i < height / gridSize; i++) {
        heatmap[i] = [];
        for (let j = 0; j < width / gridSize; j++) {
            heatmap[i][j] = 0;
        }
    }

    let maxi = 0;


    crimeData.forEach(d => {
        let latlong: any = proj4(Projections.utm, Projections.wgs84, [d["X"], d["Y"]]);
        let proj = projection([latlong[0], latlong[1]]);
        let i = Math.round(proj[0] / gridSize), j = Math.round(proj[1] / gridSize);
        // console.log(i, j);
        if (i >= 0 && i < height / gridSize && j >= 0 && j < width / gridSize) {
            heatmap[i][j]++;
            // console.log("entrou", i, j, heatmap[i][j]);
            maxi = Math.max(maxi, heatmap[i][j]);
        } else {
            // console.log(i,j);
        }
    });

    let crimeValues = [];
    heatmap.forEach(row => {
        row.forEach(value => {
            if (value > 0) {
                crimeValues.push(value);
            }
        });
    });

    console.log("heatmap: ", heatmap);
    console.log("maxi:", maxi);

    let colorScale = d3.scaleQuantize<string>().range(colors);
    // let colorScale = d3.scaleLinear<number>().range([0, 10]);
    colorScale.domain([0, maxi]);
    // colorScale.interpolate(d3.interpolateRgb);

    let opacityScale = d3.scaleLinear().range([0.5, 0.85]);
    opacityScale.domain([0, maxi]);

    // let opacityScale = d3.scaleLinear().range([0.1, 0,5, 0.85]);
    // opacityScale.domain([0, 11, maxi]);

    // Draw grid

    for (let i = 0; i < height / gridSize; i++) {
        for (let j = 0; j < width / gridSize; j++) {
            if (heatmap[i][j] > 0) {
                canvas.append("rect")
                    .attr("x", i * gridSize)
                    .attr("y", j * gridSize)
                    .attr("width", gridSize)
                    .attr("height", gridSize)
                    .attr("fill", colorScale(heatmap[i][j]))
                    .attr("opacity", opacityScale(heatmap[i][j]))
                    .text(heatmap[i][j])
                ;

                // console.log(i, j, heatmap[i][j], colorScale(heatmap[i][j]), opacityScale(heatmap[i][j]));
            }
        }
    }

    let mean = d3.mean(crimeValues);
    console.log("mean", mean, typeof mean);

    let median = d3.median(crimeValues);
    console.log("median", median, typeof median);
}