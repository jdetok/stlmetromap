import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Renderer from "@arcgis/core/renderers/Renderer";
import "@esri/calcite-components/dist/components/calcite-button";
import {
    STLWKID, TRACTS_LAYER_URL, TRACTS_LAYER_TTL, TRACTS_FIELDS, TRACTS_FIELDINFOS,
    COUNTIES_LAYER_URL, COUNTIES_LAYER_TTL, COUNTIES_FIELDS, COUNTIES_FIELDINFOS,
    ML_LAYER_URL, ML_LAYER_TTL, BUS_LAYER_TTL, BUS_LAYER_URL,
    CYCLE_LAYER_URL, CYCLE_LAYER_TTL, CYCLING_FIELDS,
    STOP_FIELDINFOS, STOP_FIELDS, AMTRAK_FIELDS, AMTRAK_FIELDINFOS,
    PLACE_FIELDS, PLACE_FIELDINFOS
} from "./data.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
export type FeatureLayerMeta = {
    title: string;
    source?: Graphic[];
    dataUrl?: string;
    renderer: Renderer;
    popupTemplate?: __esri.PopupTemplateProperties;
    fields?: __esri.FieldProperties[];
    outFields?: string[];
    geometryType?: 'point' | 'polygon' | 'polyline';
    toGraphics?: (data: any) => Graphic[];
}
const POPLDENS_ALPHA = 0.15;
const POPLDENS_CHOROPLETH_LEVELS: cplethEls[] = [
    [0, 2500, [94, 150, 98]],
    [2500, 5000, [17, 200, 152]],
    [5000, 7500, [0, 210, 255]],
    [7500, 10000, [44, 60, 255]],
    [10000, 99999, [50, 1, 63]],
];
const COUNTIES_OUTLINE_COLOR = [0, 0, 0, 0.5];
const COUNTIES_OUTLINE_SIZE = 1.5;
const COUNTIES_INNER_COLOR = [255, 255, 255, 0];

// const BUS_STOP_Y_COLOR = 'mediumseagreen';
const BUS_STOP_Y_COLOR = [0, 255, 255, 0.5];
const BUS_STOP_NO_COLOR = [180, 110, 200, 0.5];
const BUS_STOP_NA_COLOR = [0, 165, 255, 0.5];
const BUS_STOP_SIZE = 4;
const ML_STOP_SIZE = 10;
const RAIL_INNER_COLOR = [0, 0, 0, 0.6];
const CYCLE_LAYER_GRAVEL_COLOR = [180, 80, 170, 0.7];
const CYCLE_LAYER_ASPHALT_COLOR = [208, 148, 75, 0.7];
const CYCLE_LAYER_OTHER_COLOR = [75, 108, 208, 0.7];
const CYCLE_LAYER_UNPAVED_COLOR = [158, 145, 125, 0.7];
const CYCLE_LAYER_SIZE = .8;
const GROCERY_INNER_COLOR = [0, 0, 255, 0.3];
const PARKS_COLOR = [20, 255, 115, 0.35];
const FUN_COLOR = [255, 153, 255, 0.25];
const SOCIAL_COLOR = [184, 217, 255, 0.35];
const SCHOOL_COLOR = [242, 238, 122, 0.3];
const UNI_COLOR = [160, 238, 150, 0.3];
const CHURCH_COLOR = [10, 238, 255, 0.3];
const MED_COLOR = [255, 25, 25, 0.3];

// choropleth levels, pass min val, max val, rgb val
type cplethEls = [number, number, number[]];

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

const toPolygon = (data: any): Graphic[] => {
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
const stopsToGraphics = (data: any): Graphic[] => {
    return data.features.map((f: any) => {
        return new Graphic({
            geometry: new Point({
                longitude: f.geometry.coordinates[0],
                latitude: f.geometry.coordinates[1],
                spatialReference: { wkid: STLWKID },
            }),
            attributes: { ...f.properties, ObjectID: f.properties.id, },
        })
    })
};

// LAYERS DEFINED HERE: TO ADD NEW LAYER, CREATE A CONFIG HERE AND ADD IT TO THE ARRAY IN map-window.ts
export const LAYER_BUS_STOPS: FeatureLayerMeta = {
    title: BUS_LAYER_TTL,
    dataUrl: BUS_LAYER_URL,
    geometryType: "point",
    fields: STOP_FIELDS,
    renderer: new UniqueValueRenderer({
        field: "wheelchair_access",
        defaultLabel: "NA",
        defaultSymbol: new SimpleMarkerSymbol({
            style: "circle",
            color: BUS_STOP_NA_COLOR,
            size: BUS_STOP_SIZE,
        }),
        uniqueValueInfos: [
            {
                value: "true",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_Y_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Wheelchair Accessible",
            },
            {
                value: "false",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_NO_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Not Wheelchair Accessible",
            },
        ],
    }),
    popupTemplate: {
        title: `MetroBus ({route_ids}) Stop: {stop_name}`,
        content: [
            {
                type: "fields",
                fieldInfos: STOP_FIELDINFOS
            },
        ],
    },
    toGraphics: stopsToGraphics,
};
export const makeBusStopsLayer = (onRouteClick: (route: string) => void): FeatureLayerMeta => ({
    title: BUS_LAYER_TTL,
    dataUrl: BUS_LAYER_URL,
    geometryType: "point",
    fields: STOP_FIELDS,
    outFields: ["*"],
    renderer: new UniqueValueRenderer({
        field: "wheelchair_access",
        defaultLabel: "NA",
        defaultSymbol: new SimpleMarkerSymbol({
            style: "circle",
            color: BUS_STOP_NA_COLOR,
            size: BUS_STOP_SIZE,
        }),
        uniqueValueInfos: [
            {
                value: "true",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_Y_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Wheelchair Accessible",
            },
            {
                value: "false",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: BUS_STOP_NO_COLOR,
                    size: BUS_STOP_SIZE,
                }),
                label: "Not Wheelchair Accessible",
            },
        ],
    }),
    popupTemplate: {
        title: `MetroBus ({route_ids}) Stop: {stop_name}`,
        outFields: ["*"],
        content: (feature: any) => {
            const attrs = feature.graphic?.attributes;

            const div = document.createElement("div");

            let routeBtns: HTMLCalciteButtonElement[] = [];

            const routeNames: string = attrs?.route_names;
            if (routeNames) {
                routeNames.split(", ").forEach((route: string) => {
                    const btn = document.createElement("calcite-button");
                    btn.textContent = route.trim();
                    btn.style.setProperty("--calcite-button-text-color", "black");
                    btn.setAttribute("appearance", "outline");
                    btn.setAttribute("scale", "s");
                    btn.addEventListener("click", () => onRouteClick(route.trim()));
                    routeBtns.push(btn);
                });
            }

            // fields table
            const tbl = document.createElement("table");

            // add each route as a button
            const row = tbl.insertRow();
            row.insertCell().textContent = "MetroBus Routes Served:";
            row.insertCell().append(...routeBtns);

            STOP_FIELDINFOS.forEach(({ fieldName, label }) => {
                if (fieldName === "route_names") return; // handled separately
                const row = tbl.insertRow();
                row.insertCell().textContent = label;
                row.insertCell().textContent = attrs?.[fieldName] ?? "—";
            });
            div.appendChild(tbl);

            return div;
        }
    },
    toGraphics: stopsToGraphics,
});
export const LAYER_ML_STOPS: FeatureLayerMeta = {
    title: ML_LAYER_TTL,
    dataUrl: ML_LAYER_URL,
    geometryType: "point",
    fields: STOP_FIELDS,
    renderer: new UniqueValueRenderer({
        field: "route_ids",
        uniqueValueInfos: [
            {
                value: "MLR",
                label: "Red Line",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: RAIL_INNER_COLOR,
                    size: ML_STOP_SIZE,
                    outline: new SimpleLineSymbol({
                        color: 'red',
                        width: 1,
                        style: "solid",
                    })
                }),
            },
            {
                value: "MLB",
                label: "Blue Line",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: RAIL_INNER_COLOR,
                    size: ML_STOP_SIZE,
                    outline: new SimpleLineSymbol({
                        color: 'blue',
                        width: 1,
                        style: "solid",
                    })
                }),
            },
            {
                value: "MLB, MLR",
                label: "Blue/Red Lines",
                symbol: new SimpleMarkerSymbol({
                    style: "circle",
                    color: RAIL_INNER_COLOR,
                    size: ML_STOP_SIZE,
                    outline: new SimpleLineSymbol({
                        color: 'purple',
                        width: 1,
                        style: "solid",
                    })
                }),
            },
        ],
    }),
    popupTemplate: {
        title: `Light Rail Stop: {stop_name}`,
        content: [
            {
                type: "fields",
                fieldInfos: STOP_FIELDINFOS
            },
        ],
    },
    toGraphics: stopsToGraphics,
};

const AMTRAK_LAYER_TTL = "Amtrak";
const AMTRAK_LAYER_URL = "/layers/amtrak";
const AMTRAK_COLOR = [245, 245, 245, 0.6];
const AMTRAK_SIZE = 18;
export const LAYER_AMTRAK: FeatureLayerMeta = {
    title: AMTRAK_LAYER_TTL,
    dataUrl: AMTRAK_LAYER_URL,
    geometryType: "point",
    fields: AMTRAK_FIELDS,
    renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
            style: "circle",
            color: RAIL_INNER_COLOR,
            size: AMTRAK_SIZE,
            outline: new SimpleLineSymbol({
                color: AMTRAK_COLOR,
                width: 1,
                style: "solid",
            }),
        }),
    }),
    popupTemplate: {
        title: `Amtrak Stop: {name}`,
        content: [
            {
                type: "fields",
                fieldInfos: AMTRAK_FIELDINFOS
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
        title: "{county_name}",
        content: [
            {
                type: "fields",
                fieldInfos: COUNTIES_FIELDINFOS,
            },
        ],
    },
    toGraphics: toPolygon,
};

export const LAYER_CENSUS_TRACTS: FeatureLayerMeta = {
    title: TRACTS_LAYER_TTL,
    dataUrl: TRACTS_LAYER_URL,
    geometryType: "polygon",
    fields: TRACTS_FIELDS as __esri.FieldProperties[],
    renderer: new ClassBreaksRenderer({
        field: "popl_dens",
        classBreakInfos: makeChoroplethLevels(POPLDENS_CHOROPLETH_LEVELS),
    }),
    popupTemplate: {
        title: "{tract_name}",
        content: [
            {
                type: "fields",
                fieldInfos: TRACTS_FIELDINFOS,
            },
        ],
    },
    toGraphics: toPolygon,
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

export const LAYER_PLACES: FeatureLayerMeta = {
    title: 'Places',
    dataUrl: '/layers/places',
    geometryType: "polygon",
    fields: PLACE_FIELDS,
    renderer: new UniqueValueRenderer({
    field: "type",
    uniqueValueInfos: [
        {
            value: "park",
            label: "Parks",
            symbol: new SimpleFillSymbol({
                color: PARKS_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 1 }),
            }),
        },
        {
            value: "grocery",
            label: "Grocery",
            symbol: new SimpleFillSymbol({
                color: GROCERY_INNER_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "social_facility",
            label: "Social Facility",
            symbol: new SimpleFillSymbol({
                color: SOCIAL_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "university",
            label: "College/University",
            symbol: new SimpleFillSymbol({
                color: UNI_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "church",
            label: "Place of Worship",
            symbol: new SimpleFillSymbol({
                color: CHURCH_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "medical",
            label: "Medical Facility",
            symbol: new SimpleFillSymbol({
                color: MED_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "entertainment",
            label: "Enterntainment/Fun",
            symbol: new SimpleFillSymbol({
                color: FUN_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 0.5 }),
            }),
        },
        {
            value: "school",
            label: "School",
            symbol: new SimpleFillSymbol({
                color: SCHOOL_COLOR,
                style: "diagonal-cross",
                outline: new SimpleLineSymbol({ color: 'black', width: 1 }),
            }),
        },
        ],
    defaultLabel: "Other", 
    defaultSymbol: new SimpleFillSymbol({
        color: [128, 128, 128, 0.3],
        outline: new SimpleLineSymbol({ color: 'grey', width: 0.5 }),
    }),
}),
    popupTemplate: {
        title: `{name} ({type})`,
        content: [
            {
                type: "fields",
                fieldInfos: PLACE_FIELDINFOS
            },
        ],
    },
    toGraphics: toPolygon,
};