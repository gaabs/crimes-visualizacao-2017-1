//Data filter methods
import * as proj4x from "proj4";
const proj4 = (proj4x as any).default;

class Projections {
    static readonly utm = "+proj=utm +zone=10";
    static readonly wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
}

function convertArrayOfObjectsToCSV(data) {
    var result, keys, columnDelimiter, lineDelimiter;
    columnDelimiter = ',';
    lineDelimiter = '\n';

    // Getting columns and filtering out HUNDRED_BLOCK
    keys = Object.keys(data[0]).filter(d => d != "HUNDRED_BLOCK");

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
        // Converting coordinates
        let latlong: any = proj4(Projections.utm, Projections.wgs84, [item["X"], item["Y"]]);

        // Appending column data
        keys.forEach(function (key, column) {
            // Filtering out HUNDRED_BLOCK
            if (key == "HUNDRED_BLOCK") {
                return;
            }

            if (column > 0) result += columnDelimiter;

            if (key == "X") {
                result += latlong[0];
            } else if (key == "Y") {
                result += latlong[1];
            } else {
                result += item[key];
            }
        });
        result += lineDelimiter;
    });

    return result;
}

// Usage:
// downloadFile(crimeData, 'vancouver_crimes_filtered.csv');
export function downloadFile(data, outputFilename) {
    var csvData = convertArrayOfObjectsToCSV(data);
    var blob = new Blob([csvData], {
        type: "application/csv;charset=utf-8;"
    });

    if (window.navigator.msSaveBlob) {
        // FOR IE BROWSER
        navigator.msSaveBlob(blob, outputFilename);
    } else {
        // FOR OTHER BROWSERS
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        // link.style = "visibility:hidden";
        link.download = outputFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
