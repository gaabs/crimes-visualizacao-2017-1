export class Crime {
    TYPE: string;
    NEIGHBOURHOOD: string;
    X: number;
    Y: number;
    YEAR: number;
    MONTH: number;
    DAY: number;
    HOUR: number;
    MINUTE: number;
    DATE: Date;

    constructor(values: any) {
        this.TYPE = values.TYPE;
        this.NEIGHBOURHOOD = values.NEIGHBOURHOOD;
        this.X = values.X;
        this.Y = values.Y;
        this.YEAR = values.YEAR;
        this.MONTH = values.MONTH;
        this.DAY = values.DAY;
        this.HOUR = values.HOUR;
        this.MINUTE = values.MINUTE;

        this.DATE = new Date(values.YEAR, values.MONTH - 1, values.DAY);
    }
}