/**
 * Created by Gio on 28/05/2017.
 */
/**
 * Created by Pedro Sereno on 28/05/2017.
 */
import * as d3 from "d3";
import * as proj4x from "proj4";
// import * as crossfilter from "crossfilter";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

import {Crime} from "./app/crime"
import * as Map from "./app/map"
import * as PieChart from "./app/pieChart"
import * as Histogram from "./app/histogram"

const width = 800;
const height = 800;
const colors = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'];

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

// console.log(proj4(utm,wgs84,[492890.15, 5457202.22]));

// Load data and plot
d3.queue()
    .defer(d3.json, "assets/data/vancouver_geo.json")
    .defer(d3.csv, "assets/data/vancouver_crimes.csv", d => new Crime(d))
    .await(main);

function main(err, geoData, crimeData) {
    if (err) {
        console.log(err);
        return;
    }

    Map.plotData(geoData, crimeData);
    PieChart.plotData(crimeData);
    Histogram.plotData(crimeData);

    // let crimes = crossfilter(crimeData);
    // console.log(crimes);
}
