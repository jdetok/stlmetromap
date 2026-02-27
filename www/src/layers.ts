import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import { FeatureLayerMeta, StopMarkers, StopMarker, cplethEls } from "./types.js";
import {
    STLWKID, routeTypes, TRACTS_LAYER_URL, TRACTS_LAYER_TTL, TRACTS_FIELDS, TRACTS_FIELDINFOS,
    COUNTIES_LAYER_URL, COUNTIES_LAYER_TTL, COUNTIES_FIELDS, COUNTIES_FIELDINFOS,
    ML_LAYER_URL, ML_LAYER_TTL, STOP_FIELDS, BUS_LAYER_TTL, BUS_LAYER_URL,
    CYCLE_LAYER_URL, CYCLE_LAYER_TTL, CYCLING_FIELDS
} from "./data.js";

const POPLDENS_ALPHA = 0.15;
const POPLDENS_CHOROPLETH_LEVELS: cplethEls[] = [
    [0, 2500, [94, 150, 98]],
    [2500, 5000, [17, 200, 152]],
    [5000, 7500, [0, 210, 255]],
    [7500, 10000, [44, 60, 255]],
    [10000, 99999, [50, 1, 63]],
];
const COUNTIES_OUTLINE_COLOR = [250, 250, 250, 0.5];
const COUNTIES_OUTLINE_SIZE = 1.5;
const COUNTIES_INNER_COLOR = [255, 255, 255, 0];

const BUS_STOP_A_COLOR = 'mediumseagreen';
const BUS_STOP_NA_COLOR = [180, 110, 200, 0.7];
const BUS_STOP_SIZE = 4;

const ML_STOP_SIZE = 10;
const MLB_STOP_COLOR = 'blue';
const MLR_STOP_COLOR = 'red';
const MLC_STOP_COLOR = 'purple';

const CYCLE_LAYER_GRAVEL_COLOR = [180, 80, 170, 0.7];
const CYCLE_LAYER_ASPHALT_COLOR = [208, 148, 75, 0.7];
const CYCLE_LAYER_OTHER_COLOR = [75, 108, 208, 0.7];
const CYCLE_LAYER_UNPAVED_COLOR = [158, 145, 125, 0.7];
const CYCLE_LAYER_SIZE = .8;

// create choropleth levels for the array of min/max/color
const newChoroplethLevel = (c: cplethEls) => {
    return {
        minValue: c[0],
        maxValue: c[1],
        symbol: new SimpleFillSymbol({ color: [...c[2], POPLDENS_ALPHA] }),
    };
};
const makeChoroplethLevels = (levels: cplethEls[]): __esri.ClassBreakInfoProperties[] => {
    let lvls: __esri.ClassBreakInfoProperties[] = [];
    for (const l of levels) {
        lvls.push(newChoroplethLevel(l));
    }
    return lvls;
};

// create and return an array of graphics from passed bus/metro stop locations
const stopsToGraphics = (data: StopMarkers): Graphic[] => {
    return data.stops.map(
        (s: StopMarker, i: number) =>
            new Graphic({
                geometry: new Point({
                    latitude: s.yx.latitude,
                    longitude: s.yx.longitude,
                    spatialReference: { wkid: STLWKID },
                }),
                attributes: {
                    ObjectID: i + 1,
                    id: s.id,
                    name: s.name,
                    type: routeTypes[s.typ],
                    typ: s.typ,
                    routes: s.routes.map((r) => `${r.name}-${r.nameLong}`).join(", "),
                    tractGeoid: s.tractGeoid,
                    whlChr: s.whlChr,
                },
            }),
    );
};

// LAYERS DEFINED HERE: TO ADD NEW LAYER, CREATE A CONFIG HERE AND ADD IT TO THE ARRAY IN map-window.ts
export const LAYER_BUS_STOPS: FeatureLayerMeta = {
    title: BUS_LAYER_TTL,
    dataUrl: BUS_LAYER_URL,
    geometryType: "point",
    fields: STOP_FIELDS,
    renderer: new UniqueValueRenderer({
        field: "whlChr",
        uniqueValueInfos: [
            {
                value: "POSSIBLE",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_A_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Wheelchair Accessible",
            },
            {
                value: "NOT_POSSIBLE",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_NA_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Not Wheelchair Accessible",
            },
        ],
    }),
    popupTemplate: {
        title: "{type} Stop: {name}",
        content: [
            {
                type: "fields",
                fieldInfos: [
                    { fieldName: "routes", label: "Routes Served:" },
                    { fieldName: "tractGeoid", label: "Tract GeoID:" },
                ],
            },
        ],
    },
    toGraphics: stopsToGraphics,
};

export const LAYER_ML_STOPS: FeatureLayerMeta = {
    title: ML_LAYER_TTL,
    dataUrl: ML_LAYER_URL,
    geometryType: "point",
    fields: STOP_FIELDS,
    renderer: new UniqueValueRenderer({
        field: "typ",
        uniqueValueInfos: [
            {
                value: "mlr",
                label: "Red Line",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: MLR_STOP_COLOR,
                    size: ML_STOP_SIZE,
                }),
            },
            {
                value: "mlb",
                label: "Blue Line",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: MLB_STOP_COLOR,
                    size: ML_STOP_SIZE,
                }),
            },
            {
                value: "mlc",
                label: "Blue/Red Lines",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: MLC_STOP_COLOR,
                    size: ML_STOP_SIZE,
                }),
            },
        ],
    }),
    popupTemplate: {
        title: "{type} Stop: {name}",
        content: [
            {
                type: "fields",
                fieldInfos: [
                    { fieldName: "routes", label: "Routes Served:" },
                    { fieldName: "tractGeoid", label: "Tract GeoID:" },
                ],
            },
        ],
    },
    toGraphics: stopsToGraphics,
};

export const LAYER_CENSUS_COUNTIES: FeatureLayerMeta = {
    title: COUNTIES_LAYER_TTL,
    dataUrl: COUNTIES_LAYER_URL,
    geometryType: "polygon",
    fields: COUNTIES_FIELDS as __esri.FieldProperties[],
    renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
            color: COUNTIES_INNER_COLOR,
            outline: new SimpleLineSymbol({
                color: COUNTIES_OUTLINE_COLOR,
                width: COUNTIES_OUTLINE_SIZE,
                style: "solid",
            }),
        }),
    }),
    popupTemplate: {
        title: "{NAME}",
        content: [
            {
                type: "fields",
                fieldInfos: COUNTIES_FIELDINFOS,
            },
        ],
    },
};

export const LAYER_CENSUS_TRACTS: FeatureLayerMeta = {
    title: TRACTS_LAYER_TTL,
    dataUrl: TRACTS_LAYER_URL,
    geometryType: "polygon",
    fields: TRACTS_FIELDS as __esri.FieldProperties[],
    renderer: new ClassBreaksRenderer({
        field: "POPLSQMI",
        classBreakInfos: makeChoroplethLevels(POPLDENS_CHOROPLETH_LEVELS),
    }),
    popupTemplate: {
        title: "Census Tract {TRACT}",
        content: [
            {
                type: "fields",
                fieldInfos: TRACTS_FIELDINFOS,
            },
        ],
    },
};


export const LAYER_CYCLING: FeatureLayerMeta = {
    title: CYCLE_LAYER_TTL,
    dataUrl: CYCLE_LAYER_URL,
    geometryType: "polyline",
    fields: CYCLING_FIELDS as __esri.FieldProperties[],
    renderer: new UniqueValueRenderer({
        field: "surface",
        defaultSymbol: new SimpleLineSymbol({ color: CYCLE_LAYER_OTHER_COLOR, width: CYCLE_LAYER_SIZE }),
        defaultLabel: "Path Type Unknown",
        uniqueValueGroups: [{
            classes: [{
                label: "Paved Path",
                values: ["paved", "concrete", "asphalt"] as __esri.UniqueValueProperties[],
                symbol: new SimpleLineSymbol({
                    color: CYCLE_LAYER_ASPHALT_COLOR,
                    width: CYCLE_LAYER_SIZE,
                }),
            }],
        }, {
            classes: [{
                label: "Unpaved Path",
                values: ["unpaved", "dirt"] as __esri.UniqueValueProperties[],
                symbol: new SimpleLineSymbol({
                    color: CYCLE_LAYER_UNPAVED_COLOR,
                    width: CYCLE_LAYER_SIZE,
                }),
            }],
        }, {
            classes: [{
                label: "Gravel Path",
                values: ["gravel", "fine_gravel", "crushed_limestone"] as __esri.UniqueValueProperties[],
                symbol: new SimpleLineSymbol({
                    color: CYCLE_LAYER_GRAVEL_COLOR,
                    width: CYCLE_LAYER_SIZE,
                }),
            }],
        }],        
    }),
    popupTemplate: {
        title: "{name}",
        content: [
            {
                type: "fields",
                fieldInfos: [{ fieldName: "surface", label: "Surface: " }],
            },
        ],
    },
    // toGraphics: cyclingToGraphics,
    toGraphics: (data: any): Graphic[] => {
        return data.features.map((f: any, i: number): Graphic =>
            new Graphic({
                geometry: new Polyline({
                    paths: [f.geometry.coordinates], // wrap once
                    spatialReference: { wkid: STLWKID },
                }),
                attributes: {
                    ObjectID: i + 1,
                    name: f.properties.name,
                    surface: f.properties.surface ?? "",
                },
            }),
        );
    }
};
