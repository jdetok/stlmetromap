import esriConfig from "@arcgis/core/config"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import "@arcgis/core/assets/esri/themes/light/main.css";

const BUS_STOP_SIZE = 3;
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
    view.when(
        async () => {
            await buildStopLayers(map);
         },
        (e: Error) => console.error("failed to build or display map:", e)
    );
});

async function buildStopLayers(map: Map) {
    let busStops: StopMarker[] = [];
    let mlStops: StopMarker[] = [];
    let stopLayersToAdd: StopMarker[][] = [busStops, mlStops];

    const stopMarkers = await getStops();

    stopMarkers.stops.forEach((stop) => {
        stop.typ === 'bus' ? busStops.push(stop) : mlStops.push(stop);
    });

    for (const sl of stopLayersToAdd) {
        map.add(makeStopLayer(sl));
    }
}

function makeStopLayer(stops: StopMarker[]): GraphicsLayer {
    let layer = new GraphicsLayer();
    let graphics: Graphic[] = [];
    stops.forEach((stop) => {
        graphics.push(makeStopGraphic(stop));
    });
    layer.addMany(graphics);
    return layer;
}

function makeStopGraphic(stop: StopMarker): Graphic {
    const color = (
        (stop.typ == 'bus') ? BUS_STOP_COLOR :
        (stop.typ == 'mlc') ? MLC_STOP_COLOR :
        (stop.typ == 'mlb') ? MLB_STOP_COLOR : MLR_STOP_COLOR
    );
    return new Graphic({
        geometry: new Point({ latitude: stop.yx.latitude, longitude: stop.yx.longitude }),
        symbol: createMarkerSymbol(color, (stop.typ == 'bus') ? BUS_STOP_SIZE : ML_STOP_SIZE),
        attributes: {
            "name": stop.name,
            "type": RouteTypes[stop.typ],
            "routes": stop.routes.map(r => `${r.name} | ${r.nameLong}`).join(', '),
        },
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
    const data = await res.json();
    console.trace(`response: ${data.length}`);
    return data;
}

function createMarkerSymbol(color: string, size: number) {
    return new SimpleMarkerSymbol({
        style: 'circle',
        color: color,
        size: size
    }); 
}