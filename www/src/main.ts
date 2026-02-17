import esriConfig from "@arcgis/core/config"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import "@arcgis/core/assets/esri/themes/light/main.css";

const BUS_STOP_SIZE = 3;
const ML_STOP_SIZE = 8;
const BUS_STOP_COLOR = 'mediumseagreen';
const MLB_STOP_COLOR = 'blue';
const MLR_STOP_COLOR = 'red';
const MLC_STOP_COLOR = 'purple';

const BASEMAP = 'dark-gray';
const MAP_CONTAINER = 'map';
const STLWKID = 4326;
const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};

type Coordinates = { latitude: number, longitude: number, name: string, typ: RouteType };
type RouteType = 'bus' | 'mlr' | 'mlb' | 'mlc';

esriConfig.apiKey = (window as any).ARCGIS_API_KEY;

window.addEventListener("DOMContentLoaded", () => {
    const map = new Map({
        basemap: BASEMAP
    });

    const view = new MapView({
        container: MAP_CONTAINER,
        map,
        extent: {
            xmin: STLCOORDS.xmin,
            ymin: STLCOORDS.ymin,
            xmax: STLCOORDS.xmax,
            ymax: STLCOORDS.ymax,
            spatialReference: { wkid: STLWKID }
        }
    });
    view.when(
        async () => { await placeStopsOnMap(view); },
        (e: Error) => console.error("failed to build or display map:", e)
    );
});

async function placeStopsOnMap(view: MapView) {
    const stops = await getStops();
    stops.forEach((c) => placeMarkerAtCoords(view, c));
}

async function getStops(): Promise<Coordinates[]> {
    const res = await fetch("/stops");
    if (!res.ok) {
        throw new Error(`failed to fetch`)
    }
    const data = await res.json();
    console.trace(`response: ${data.length}`);
    return data;
}

function placeMarkerAtCoords(view: MapView, coords: Coordinates) {
    const color = (
        (coords.typ == 'bus') ? BUS_STOP_COLOR :
        (coords.typ == 'mlc') ? MLC_STOP_COLOR :
        (coords.typ == 'mlb') ? MLB_STOP_COLOR : MLR_STOP_COLOR
    );

    const markerSymbol = new SimpleMarkerSymbol({
        style: 'circle',
        color: color,
        size: (coords.typ == 'bus') ? BUS_STOP_SIZE : ML_STOP_SIZE
    });

    const pointGraphic = new Graphic({
        geometry: new Point({ latitude: coords.latitude, longitude: coords.longitude }),
        symbol: markerSymbol
    });

    view.graphics.add(pointGraphic);
}