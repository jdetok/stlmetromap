import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import { FeatureLayerMeta, StopMarkers, StopMarker, RouteType, cplethEls } from './types.js'
export const BASEMAP = 'dark-gray';
export const STLWKID = 4326;
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};
const BUS = 'Bus';
const ML = 'Light Rail';
const BUS_STOP_SIZE = 4;
const ML_STOP_SIZE = 10;
const CYCLE_PATH_COLOR = [208, 148, 75, 0.7];
const CYCLE_PATH_SIZE = .8;
const COUNTIES_OUTLINE_COLOR = [250, 250, 250, 0.5];
const COUNTIES_OUTLINE_SIZE = 1.5;
const COUNTIES_INNER_COLOR = [255, 255, 255, 0];
const BUS_STOP_COLOR = 'mediumseagreen';
const MLB_STOP_COLOR = 'blue';
const MLR_STOP_COLOR = 'red';
const MLC_STOP_COLOR = 'purple';
const POPLDENS_ALPHA = 0.15;
// tuples of min, max, 3 digit rgb. builder func addss the POPLDENS_APLHA value for rgba to each
const POPLDENS_CHOROPLETH_LEVELS: cplethEls[] = [
    [0, 2500, [94, 150, 98]], [2500, 5000, [17, 200, 152]], [5000, 7500, [0, 210, 255]], [7500, 10000, [44, 60, 255]], [10000, 99999, [50, 1, 63]],
];

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
const newChoroplethLevel = (c: cplethEls) => {
        return { minValue: c[0], maxValue: c[1], symbol: new SimpleFillSymbol({ color: [...c[2], POPLDENS_ALPHA] })};
}
const makeChoroplethLevels = (levels: cplethEls[]): __esri.ClassBreakInfoProperties[] => {
    let lvls: __esri.ClassBreakInfoProperties[] = [];
    for (const l of levels) {
        lvls.push(newChoroplethLevel(l))
    }
    return lvls;
}
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
            color: COUNTIES_INNER_COLOR,
            outline: new SimpleLineSymbol({
                color: COUNTIES_OUTLINE_COLOR,
                width: COUNTIES_OUTLINE_SIZE,
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
        classBreakInfos: makeChoroplethLevels(POPLDENS_CHOROPLETH_LEVELS),
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

export const cyclingToGraphics = (data: any) => {
    return data.features.map((f: any, i: number) => new Graphic({
        geometry: new Polyline({
            paths: [f.geometry.coordinates], // wrap once
            spatialReference: { wkid: STLWKID },
        }),
        attributes: {
            ObjectID: i + 1,
            name: f.properties.name ?? "",
            highway: f.properties.highway ?? "",
            surface: f.properties.surface ?? "",
        },
    }));
};

export const LAYER_CYCLING: FeatureLayerMeta = {
    title: "Cycling Paths",
    dataUrl: "/bikes",
    geometryType: "polyline",
    fields: [
        { name: "ObjectID", alias: "ObjectID", type: "oid" },
        { name: "name", alias: "Name", type: "string" },
        { name: "highway", alias: "Highway", type: "string" },
        { name: "surface", alias: "Surface", type: "string" },
    ],
    renderer: new SimpleRenderer({
        symbol: new SimpleLineSymbol({
            width: CYCLE_PATH_SIZE,
            style: "solid",
            color: CYCLE_PATH_COLOR,
        }),
    }),
    popupTemplate: {
        title: "{name}",
        content: [{
            type: "fields",
            fieldInfos: [
                { fieldName: "highway", label: "Type" },
                { fieldName: "surface", label: "Surface" },
            ],
        }],
    },
    toGraphics: cyclingToGraphics,
};