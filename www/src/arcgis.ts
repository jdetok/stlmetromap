import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import Graphic from "@arcgis/core/Graphic";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import { STLWKID } from "./data";

// HELPER TO CREATE CUSTOM HIGHLIGHT SETTINGS
export function newHighlightSetting(name: string, color: __esri.ColorProperties): __esri.HighlightOptionsProperties {
    return {
        name: name, color: color,
        fillOpacity: 0.05, shadowColor: "black",
        shadowOpacity: 0.4, shadowDifference: 0.2,
    }
}

// choropleth levels, pass min val, max val, rgb val
export type cplethEls = [number, number, number[]];

// create choropleth levels for the array of min/max/color
const newChoroplethLevel = (c: cplethEls, line?: boolean) => {
    return {
        minValue: c[0],
        maxValue: c[1],
        symbol: line ? new SimpleLineSymbol({ color: [...c[2], 0.65], width: 0.5 }) :
            new SimpleFillSymbol({ color: [...c[2], 0.05] }),
    };
};
export const makeChoroplethLevels = (levels: cplethEls[], line?: boolean): __esri.ClassBreakInfoProperties[] => {
    let lvls: __esri.ClassBreakInfoProperties[] = [];
    for (const l of levels) {
        lvls.push(newChoroplethLevel(l, line));
    }
    return lvls;
};

export const toPolygon = (data: any): Graphic[] => {
    return data.features.map((f: any) => { 
        return new Graphic({
            geometry: new Polygon({
                rings: (f.geometry.type === "MultiPolygon") ? f.geometry.coordinates.flat(1) : f.geometry.coordinates,
                spatialReference: { wkid: STLWKID },
            }),
            attributes: f.properties,
        })
    })
}

// create and return an array of graphics from passed bus/metro stop locations
export const toPoint = (data: any): Graphic[] => {
    return data.features.map((f: any) => {
        return new Graphic({
            geometry: new Point({
                longitude: f.geometry.coordinates[0],
                latitude: f.geometry.coordinates[1],
                spatialReference: { wkid: STLWKID },
            }),
            attributes: {
                ...f.properties,
                ObjectID: f.properties.id,
                route_count: f.properties.route_names ? f.properties.route_names.split(", ").length : 1,
            },
        })
    })
};
export const toPolyline = (data: any): Graphic[] => {
    return data.features.map((f: any) => {
        return new Graphic({
            geometry: new Polyline({
                paths: f.geometry.coordinates,
                spatialReference: { wkid: STLWKID },
            }),
            attributes: {
                ...f.properties,
                ObjectID: f.properties.id,
                route_count: f.properties.route_names ? f.properties.route_names.split(", ").length : 1,
            },
        })
    })
};