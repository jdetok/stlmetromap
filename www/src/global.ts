import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import Renderer from "@arcgis/core/renderers/Renderer";

export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};
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
export type FeatureLayerMeta = {
    title: string,
    dataUrl?: string,
    renderer: Renderer,
    popupTemplate?: __esri.PopupTemplateProperties,
    fields?: __esri.FieldProperties[],
    source?: any,
    geometryType?: any
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