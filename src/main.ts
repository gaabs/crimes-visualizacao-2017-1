/**
 * Created by Gio on 28/05/2017.
 */
/**
 * Created by Pedro Sereno on 28/05/2017.
 */
import * as d3 from "d3";
import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

const width = 800;
const height = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

const utm = "+proj=utm +zone=10";
const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));


// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/vancouver_crimes.csv")
    .await(plotData);

// Plots GeoJSON data with crime data
function plotData(err, geoData, crimeData) {
    console.log(geoData);
    console.log(crimeData);
    // return;

    const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(200000)
        .center([-123.115328, 49.249808]);

    const path = d3.geoPath()
        .projection(projection);

    const div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //Create SVG element
    const svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const canvas = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0, 5])
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


    var data = [];
    crimeData.forEach((value, index) => {
        if (value.YEAR == 2017) data.push(value);
    });
    console.log(data);

    // Draw crimes circles
    canvas.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
            const latlong: any = proj4(utm, wgs84, [d.X, d.Y]);
            return projection([latlong[0], latlong[1]])[0];
        })
        .attr("cy", (d) => {
            const latlong: any = proj4(utm, wgs84, [d.X, d.Y]);
            return projection([latlong[0], latlong[1]])[1];
        })
        .attr("r", 2)
        .style("fill", "rgb(217,91,67)")
        .style("opacity", 0.85);

    // Pie chart
    var pieData = [];
    var indexes = {};
    var z = 0;
    crimeData.forEach((value) => {
        if (value.YEAR == 2017) {
            if (!indexes[value.TYPE]) {
                indexes[value.TYPE] = z++;
                pieData.push({"TYPE": value.TYPE, "COUNT": 0});
            }

            var index = indexes[value.TYPE];
            pieData[index]["COUNT"]++;
        }
    });

    pieData.sort((a, b) => {
        return a.COUNT - b.COUNT;
    });

    console.log("Pie data: " + pieData);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var legend = d3.select("body").append("svg")
        .attr("class", "legend")
        .attr("width", 400)
        .attr("height", (pieData.length - 1) * 20)
        .selectAll("g")
        .data(pieData.slice(1).reverse())
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d.TYPE));

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function (d) {
            console.log(d);
            return d.TYPE;
        });

    var pie = d3.pie()
        .sort(null)
        .padAngle(0.02)
        .value((d: any) => d.COUNT)
    ;

    var radius = 100;
    const arc: any = d3.arc()
        .padRadius(50);
        // .outerRadius(radius)
        // .innerRadius(radius * 0.6);

    var pies = d3.select("body").selectAll(".pie")
        .data([pieData])
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
        .style("fill", (d: any) => color(d.data.TYPE));

    // const x = arc.outerRadius(radius).innerRadius(radius*0.6);

    // pies.append("text")
    //     .attr("dy", ".35em")
    //     .style("text-anchor", "middle")
    //     .text(function (d) {
    //         return d.MONTH;
    //     });
};