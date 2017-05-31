import * as proj4x from "proj4";
// import {arc} from "d3-shape";
const proj4 = (proj4x as any).default;

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

export class Crime {
    TYPE: string;
    HUNDRED_BLOCK: string;
    NEIGHBOURHOOD: string;
    X: number;
    Y: number;
    LATITUDE: number;
    LONGITUDE: number;
    YEAR: number;
    MONTH: number;
    DAY: number;
    HOUR: number;
    MINUTE: number;

    constructor(values: any) {
        this.TYPE = values.TYPE;
        this.HUNDRED_BLOCK = values.HUNDRED_BLOCK;
        this.NEIGHBOURHOOD = values.NEIGHBOURHOOD;
        this.X = values.X;
        this.Y = values.Y;
        this.YEAR = values.YEAR;
        this.MONTH = values.MONTH;
        this.DAY = values.DAY;
        this.HOUR = values.HOUR;
        this.MINUTE = values.MINUTE;

        // let latlong: any = proj4(Projections.utm, Projections.wgs84, [this.X, this.Y]);
        // this.LATITUDE = latlong[0];
        // this.LONGITUDE = latlong[1];
    }
}