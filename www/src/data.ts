import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import { FeatureLayerMeta, StopMarkers, StopMarker, RouteType } from './types.js'

export const STLWKID = 4326;
export const BASEMAP = 'dark-gray';
export const BUS = 'Bus';
export const ML = 'Light Rail';
export const POPLMAP_ALPHA = 0.15;
export const BUS_STOP_SIZE = 3.5;
export const ML_STOP_SIZE = 10;
export const BUS_STOP_COLOR = 'mediumseagreen';
export const MLB_STOP_COLOR = 'blue';
export const MLR_STOP_COLOR = 'red';
export const MLC_STOP_COLOR = 'purple';
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};
const STOP_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "id", alias: "ID", type: "string" },
    { name: "name", alias: "Name", type: "string" },
    { name: "typ", alias: "Service Type", type: "string" },
    { name: "type", alias: "Stop Type", type: "string" },
    { name: "routes", alias: "Routes Served", type: "string" },
];

const routeTypes: Record<RouteType, string> = {
    bus: BUS,
    mlr: ML,
    mlb: ML,
    mlc: ML
};

const stopsToGraphics = (data: StopMarkers) => {
    return data.stops.map((s: StopMarker, i: number) => new Graphic({
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
            routes: s.routes.map(r => `${r.name}-${r.nameLong}`).join(", "),
        }
    }));
};

export const LAYER_BUS_STOPS: FeatureLayerMeta = {
    title: "MetroBus Stops",
    dataUrl: "/stops/bus",
    geometryType: "point",
    fields: STOP_FIELDS,
    renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({ style: 'circle', color: BUS_STOP_COLOR, size: BUS_STOP_SIZE }),
    }),
    popupTemplate: {
        title: "{type} Stop: {name}",
        content: [
            {
                type: "fields",
                fieldInfos: [ { fieldName: "routes", label: "Routes Served:" } ],
            }
        ]
    },
    toGraphics: stopsToGraphics,
}

export const LAYER_ML_STOPS: FeatureLayerMeta = {
    title: "MetroLink Stops",
    dataUrl: "/stops/ml",
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
                label: "Blue/Red",
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
                fieldInfos: [ { fieldName: "routes", label: "Routes Served:" } ],
            }
        ]
    },
    toGraphics: stopsToGraphics,
}

export const LAYER_CENSUS_COUNTIES: FeatureLayerMeta = {
    title: "St. Louis MSA Counties",
    dataUrl: "/counties",
    geometryType: "polygon",
    fields: [
        { name: "NAME", alias: "Name", type: "string" },
    ],
    renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
            color: [255, 255, 255, 0.05],
            outline: new SimpleLineSymbol({
                color: [250, 250, 250, 0.5],
                width: 1.5,
                style: "solid"
            })
        })
    }),
    popupTemplate: {
        title: "{NAME}",
        content: [{
            type: "fields",
            fieldInfos: [
                { fieldName: "STATE", label: "State: " },
                { fieldName: "NAME", label: "County: " },
            ]
        }],
    },
};

export const LAYER_CENSUS_TRACTS: FeatureLayerMeta = {
    title: "Census Tract Population Density",
    dataUrl: "/tracts",
    geometryType: "polygon",
    fields: [
        { name: "GEOID", alias: "GEOID", type: "string" },
        { name: "TRACT", alias: "Tract", type: "string" },
        { name: "POPL", alias: "Population", type: "double" },
        { name: "POPLSQMI", alias: "Population/Mi^2", type: "double" },
    ],
    renderer: new ClassBreaksRenderer({
        field: "POPLSQMI",
        classBreakInfos: [
            { minValue: 0, maxValue: 2500, symbol: new SimpleFillSymbol({ color: [94, 150, 98, POPLMAP_ALPHA] }) },
            { minValue: 2500, maxValue: 5000, symbol: new SimpleFillSymbol({ color: [17, 200, 152, POPLMAP_ALPHA] }) },
            { minValue: 5000, maxValue: 7500, symbol: new SimpleFillSymbol({ color: [0, 210, 255, POPLMAP_ALPHA] }) },
            { minValue: 7500, maxValue: 10000, symbol: new SimpleFillSymbol({ color: [44, 60, 255, POPLMAP_ALPHA] }) },
            { minValue: 10000, maxValue: 99999, symbol: new SimpleFillSymbol({ color: [50, 1, 63, POPLMAP_ALPHA] }) },
        ],
    }),
    popupTemplate: {
        title: "Census Tract {TRACT}",
        content: [{
            type: "fields",
            fieldInfos: [
                { fieldName: "POPL", label: "Population: " },
                { fieldName: "POPLSQMI", label: "Population/Mi^2: " },
            ]
        }]
    },
};
