import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));

export function plotData(parent, x, y, width, height, geoData, crimeData) {
    console.log("map geoData", geoData);
    console.log("map crimeData", crimeData);

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
            console.log(d3.event.transform);
            console.log("zoomed");
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


    // Draw crimes circles
    canvas.selectAll("circle")
        .data(crimeData)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
            const latlong: any = proj4(Projections.utm, Projections.wgs84, [d["X"], d["Y"]]);
            return projection([latlong[0], latlong[1]])[0];
        })
        .attr("cy", (d) => {
            const latlong: any = proj4(Projections.utm, Projections.wgs84, [d["X"], d["Y"]]);
            return projection([latlong[0], latlong[1]])[1];
        })
        .attr("r", 2)
        .style("fill", "rgb(217,91,67)")
        .style("opacity", 0.85);
}