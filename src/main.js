const width = 800;
const height = 800;
const colors = ['#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b'];

const utm = "+proj=utm +zone=10";
const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));


const projection = d3.geoMercator()
        .translate([width/2, height/2])
        .scale([200000])
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

// Load in GeoJSON data
d3.json("vancouver.json", function(json) {
    console.log(json);

    const data = [ {
        name: "Mischief",
        year: 2003,
        month: 7,
        day: 17,
        hour: 18,
        minute:	0,
        hundred_block: "3XX E 2ND AVE",
        neighbourhood: "Mount Pleasant",
        x: 492890.15,
        y:	5457202.22
    },
    {
        name: "Mischief",
        year: 2003,
        month: 7,
        day: 17,
        hour: 18,
        minute:	0,
        hundred_block: "3XX E 2ND AVE",
        neighbourhood: "Mount Pleasant",
        x: 488044.86,
        y:	5456825.29

    },
    {
        name: "Mischief",
        year: 2003,
        month: 7,
        day: 17,
        hour: 18,
        minute:	0,
        hundred_block: "3XX E 2ND AVE",
        neighbourhood: "Mount Pleasant",
        x: 488044.86,
        y:	5456825.29
    } 
    ];

    canvas.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", '#00441b');

    canvas.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
            const latlong = proj4(utm,wgs84,[d.x, d.y]);
            return projection([latlong[0], latlong[1]])[0];
        })
        .attr("cy", (d) => {
            console.log("OI");
            const latlong = proj4(utm,wgs84,[d.x, d.y]);
            return projection([latlong[0], latlong[1]])[1];
        })
        .attr("r", 10)
        .style("fill", "rgb(217,91,67)")	
		.style("opacity", 0.85);
});

// d3.json("us-states.json", function(json) {
//     console.log(json);

//     canvas.selectAll("path")
//         .data(json.features)
//         .enter()
//         .append("path")
//         .attr("d", path)
//         .style("stroke", "#fff")
//         .style("stroke-width", "1")
//         .style("fill", '#e5f5f9');
// });
