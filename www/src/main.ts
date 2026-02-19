import esriConfig from "@arcgis/core/config"
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Field from "@arcgis/core/layers/support/Field";
import Legend from "@arcgis/core/widgets/Legend";
import Expand from "@arcgis/core/widgets/Expand";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import "@arcgis/core/assets/esri/themes/light/main.css";

const MO_COUNTIES: Record<string, string> = {
    "St. Louis County": "189",
    "St. Louis city": "510",
    "St. Charles County": "183",
    "Jefferson County": "099",
    "Franklin County": "071",
    "Warren County": "219",
}
const IL_COUNTIES: Record<string, string> = {
    "St. Clair County": "163",
    "Madison County": "119",
    "Monroe County": "133",
    "Jersey County": "083",
    "Calhoun County": "013",
    "Macoupin County": "117",
    "Clinton County": "027",
    "Bond County": "005",
}
const MO_COUNTY_NAMES = Object.keys(MO_COUNTIES).join("','");
const IL_COUNTY_NAMES = Object.keys(IL_COUNTIES).join("','");
const MO_COUNTY_FIPS = Object.values(MO_COUNTIES).join("','");
const IL_COUNTY_FIPS = Object.values(IL_COUNTIES).join("','");

const ARCGIS_CENSUS_TRACTS_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0";
const ARCGIS_CENSUS_TRACTS_EXP = `(STATE_FIPS = '29' AND COUNTY_FIPS IN ('${MO_COUNTY_FIPS}')) OR (STATE_FIPS = '17' AND COUNTY_FIPS IN ('${IL_COUNTY_FIPS}'))`;
const ARCGIS_CENSUS_COUNTIES_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0";
const ARCGIS_CENSUS_COUNTIES_EXP = `(STATE_ABBR = 'MO' AND NAME IN ('${MO_COUNTY_NAMES}')) OR (STATE_ABBR = 'IL' AND NAME IN ('${IL_COUNTY_NAMES}'))`;
    
const POPLMAP_ALPHA = 0.1;
const BUS_STOP_SIZE = 3.5;
const ML_STOP_SIZE = 8;
const BUS_STOP_COLOR = 'mediumseagreen';
const MLB_STOP_COLOR = 'blue';
const MLR_STOP_COLOR = 'red';
const MLC_STOP_COLOR = 'magenta';
const BASEMAP = 'dark-gray';
const MAP_CONTAINER = 'map';
const STLWKID = 4326;
const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};
const BUS = 'Bus';
const ML = 'Light Rail';
const RouteTypes: Record<RouteType, string> = {
    bus: BUS,
    mlr: ML,
    mlb: ML,
    mlc: ML
};

type StopMarkers = {stops: StopMarker[]}
type StopMarker = {
    id: string | number,
    name: string,
    typ: RouteType,
    routes: Route[],
    yx: Coordinates,
}
type Route = {
    id: string | number,
    name: string,
    nameLong: string,
}
type Coordinates = { latitude: number, longitude: number, name: string, typ: RouteType };
type RouteType = 'bus' | 'mlr' | 'mlb' | 'mlc';

// ENTRY POINT
window.addEventListener("DOMContentLoaded", () => {
    esriConfig.apiKey = (window as any).ARCGIS_API_KEY;
    const map = new Map({
        basemap: BASEMAP
    });
    const view = new MapView({
        container: MAP_CONTAINER,
        map: map,
        extent: {
            xmin: STLCOORDS.xmin,
            ymin: STLCOORDS.ymin,
            xmax: STLCOORDS.xmax,
            ymax: STLCOORDS.ymax,
            spatialReference: { wkid: STLWKID }
        },
        popupEnabled: true,
        popup: {
            dockEnabled: false,
            dockOptions: {buttonEnabled: false}
        }
    });
    view.when(async () => { // map entrypoint
        await Promise.all([
            buildCountyLayer(map),
            buildPopulationLayer(map),
            buildStopLayers(map),
        ]);
        buildLegend(view);
    }, (e: Error) => console.error("failed to build or display map:", e))
});

// get metro stops from backend
async function getStops(): Promise<StopMarkers> {
    const res = await fetch("/stops");
    if (!res.ok) {
        throw new Error(`failed to fetch`)
    }
    return await res.json();
}

// wait for layers to exist then add expandable legend to map
// as long as the layers have a title and renderer function they will add to the legend automatically
function buildLegend(view: MapView) {
    const expand = new Expand({
        view,
        content: new Legend({
            view: view,
        }),
        expanded: true,
    });
    view.ui.add(expand, "top-right");
    // await Promise.all(map.layers.toArray().map((l) => view.whenLayerView(l as any)));
}

// create and add feature layers to map for each stop category
async function buildStopLayers(map: Map): Promise<void> {
    const stopMarkers = await getStops();
    
    const bus: StopMarker[] = [];
    const mlc: StopMarker[] = [];
    const mlb: StopMarker[] = [];
    const mlr: StopMarker[] = [];

    stopMarkers.stops.forEach((s) => {
        switch (s.typ) {
            case 'bus': bus.push(s); break;
            case 'mlc': mlc.push(s); break;
            case 'mlb': mlb.push(s); break;
            case 'mlr': mlr.push(s); break;
        }

    });
    return (async function () {
        map.add(await makeStopLayer(bus, 'MetroBus Stops', BUS_STOP_COLOR, BUS_STOP_SIZE));
        map.add(await makeStopLayer(mlc, 'MetroLink Blue/Red Line Stops', MLC_STOP_COLOR, ML_STOP_SIZE));
        map.add(await makeStopLayer(mlb, 'MetroLink Blue Line Stops', MLB_STOP_COLOR, ML_STOP_SIZE));
        map.add(await makeStopLayer(mlr, 'MetroLink Red Line Stops', MLR_STOP_COLOR, ML_STOP_SIZE));
    })();
}

// make feature layers for a specific stop category 
async function makeStopLayer(stops: StopMarker[],
    title: string,
    color: string,
    size: number
): Promise<FeatureLayer> {
    const source = stops.map((stop, i) => new Graphic({
        geometry: new Point({ latitude: stop.yx.latitude, longitude: stop.yx.longitude }),
        attributes: {
            ObjectID: i + 1, // required
            name: stop.name,
            type: RouteTypes[stop.typ],
            routes: stop.routes.map(r => `${r.name}-${r.nameLong}`).join(", "),
        }
    }))

    return new FeatureLayer({
        title,
        source,
        spatialReference: { wkid: STLWKID },
        objectIdField: "ObjectID",
        geometryType: "point",
        fields: [
            new Field({ name: "ObjectID", alias: "ObjectID", type: "oid" }),
            new Field({ name: "name", alias: "Name", type: "string" }),
            new Field({ name: "type", alias: "Service Type", type: "string" }),
            new Field({ name: "routes", alias: "Routes Served", type: "string" }),
        ],
        renderer: new SimpleRenderer({
            symbol: createMarkerSymbol(color, size),
        }),
        popupTemplate: {
            title: "{type} Stop: {name}",
            content: [
                {
                    type: "fields", fieldInfos: [
                        { fieldName: "routes", label: "Routes Served:" },
                    ]
                }
            ]
        },
    });
}

function createMarkerSymbol(color: string, size: number) {
    return new SimpleMarkerSymbol({
        style: 'circle',
        color: color,
        size: size
    }); 
}

async function buildCountyLayer(map: Map) {
    map.add(makeCountyLayer(), 0);
}

function makeCountyLayer(): FeatureLayer {
    return new FeatureLayer({
        title: "St. Louis MSA Counties",
        url: ARCGIS_CENSUS_COUNTIES_URL,
        definitionExpression: ARCGIS_CENSUS_COUNTIES_EXP,
        renderer: new SimpleRenderer({
            symbol: new SimpleFillSymbol({
                color: [255, 255, 255, 0.05], // nearly transparent fill
                outline: new SimpleLineSymbol({
                    color: [200, 200, 200, 0.8],
                    width: 1.5,
                    style: "solid"
                })
            })
        }),
        popupTemplate: {
            title: "{NAME}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        { fieldName: "STATE_ABBR", label: "State: " },
                        { fieldName: "POPULATION", label: "Population: " },
                    ]
                }
            ]
        }
    });
}

async function buildPopulationLayer(map: Map): Promise<void> {
    return map.add(makePopulationLayer(), 1);
}

async function makePopulationLayer(): Promise<FeatureLayer> {
    return new FeatureLayer({
        title: "Census Tract Population Density",
        url: ARCGIS_CENSUS_TRACTS_URL,
        definitionExpression: ARCGIS_CENSUS_TRACTS_EXP,
        renderer: new ClassBreaksRenderer({
            field: "POPULATION",
            classBreakInfos: [
                { minValue: 0,     maxValue: 1000,  symbol: new SimpleFillSymbol({ color: [253, 231, 37,  POPLMAP_ALPHA] }) },
                { minValue: 1000, maxValue: 3000, symbol: new SimpleFillSymbol({ color: [94, 201, 98, POPLMAP_ALPHA] }) },
                { minValue: 3000,  maxValue: 6000,  symbol: new SimpleFillSymbol({ color: [20,  110, 105, POPLMAP_ALPHA] }) },
                { minValue: 6000,  maxValue: 8000,  symbol: new SimpleFillSymbol({ color: [33,  85,  110, POPLMAP_ALPHA] }) },
                { minValue: 8000,  maxValue: 10000, symbol: new SimpleFillSymbol({ color: [44,  60,  105, POPLMAP_ALPHA] }) },
                { minValue: 10000, maxValue: 99999, symbol: new SimpleFillSymbol({ color: [50,  1,   63,  POPLMAP_ALPHA] }) },
            ],
        }),
        popupTemplate: {
            title: "Tract {TRACT_FIPS}",
            content: [{
                type: "fields", fieldInfos: [
                    { fieldName: "POPULATION", label: "Population: " },
                    { fieldName: "POP_SQMI", label: "Population/Mi^2: " },
                    { fieldName: "STATE_ABBR", label: "State: " },
                    { fieldName: "STATE_FIPS", label: "State FIPS: " },
                    { fieldName: "COUNTY_FIPS", label: "County FIPS: " },
                ]
            }]
        }
    });
}