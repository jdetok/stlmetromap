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
import "@arcgis/core/assets/esri/themes/light/main.css";

const STL_COUNTIES_MO = [
    "'St. Louis County'",
    "'St. Louis city'",
    "'St. Charles County'",
    "'Jefferson County'",
    "'Franklin County'",
    // "'Crawford County'", // only sullivan - todo
    "'Warren County'",
].join(", ");

const STL_COUNTIES_IL = [
    "'St. Clair County'",
    "'Madison County'",
    "'Monroe County'",
    "'Jersey County'",
    "'Calhoun County'",
    "'Macoupin County'",
    "'Clinton County'",
    "'Bond County'"
].join(", ");

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

const BUS = 'MetroBus';
const ML = 'MetroLink (Light Rail)';

const RouteTypes: Record<RouteType, string> = {
    bus: BUS,
    mlr: ML,
    mlb: ML,
    mlc: ML
};

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
    view.when( async () => { // map entrypoint
        await buildCountyLayer(map);
        await buildStopLayers(map);
        await buildLegend(map, view);
    }, (e: Error) => console.error("failed to build or display map:", e))
});

// wait for layers to exist then add expandable legend to map
// as long as the layers have a title and renderer function they will add to the legend automatically
async function buildLegend(map: Map, view: MapView) {
    await Promise.all(map.layers.toArray().map((l) => view.whenLayerView(l as any)));
    view.ui.add(new Expand({
        view,
        content: new Legend({
            view: view,
        }),
        expanded: true,
    }), "top-right");
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
            title: "{name}",
            content: [
                {
                    type: "fields", fieldInfos: [
                        { fieldName: "type", label: "Service Type:" },
                        { fieldName: "routes", label: "Routes Served:" },
                    ]
                }
            ]
        },
    });
}

async function getStops(): Promise<StopMarkers> {
    const res = await fetch("/stops");
    if (!res.ok) {
        throw new Error(`failed to fetch`)
    }
    return await res.json();
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
        url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0",
        definitionExpression: `
            (STATE_NAME = 'Missouri' AND NAME IN (${STL_COUNTIES_MO}))
            OR
            (STATE_NAME = 'Illinois' AND NAME IN (${STL_COUNTIES_IL}))
        `,
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
                        { fieldName: "STATE_NAME", label: "State: " },
                        { fieldName: "POPULATION", label: "Population: " },
                    ]
                }
            ]
        }
    });
}