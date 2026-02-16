import esriConfig from "@arcgis/core/config"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import "@arcgis/core/assets/esri/themes/light/main.css";

esriConfig.apiKey = (window as any).ARCGIS_API_KEY;

type Coordinates = { latitude: number, longitude: number, name: string, typ: RouteType };
type RouteType = 'bus' | 'mlr' | 'mlb' | 'mlc';

window.addEventListener("DOMContentLoaded", () => {
    const map = new Map({
        basemap: "dark-gray"
    });

    const view = new MapView({
        container: "map",
        map,
        extent: {
            xmin: -90.32,
            ymin: 38.53,
            xmax: -90.15,
            ymax: 38.75,
            spatialReference: { wkid: 4326 }
        }
    });
      view.when(
        async () => {
            console.log("MapView ready");
            const stops = await getStops();
            stops.forEach((c) => placeMarkerAtCoords(view, c))   
        },
        (e: Error) => console.error("MapView failed:", e)
  );
});

async function getStops(): Promise<Coordinates[]> {
    // const url = (typ == 'bus') ? '/stops' : `/${typ}stops`;
    const res = await fetch("/stops");
    if (!res.ok) {
        throw new Error(`failed to fetch`)
    }
    const data = await res.json();
    console.trace(`response: ${data.length}`);
    return data;
}

function placeMarkerAtCoords(view: MapView, coords: Coordinates) {
    const point = new Point({ latitude: coords.latitude, longitude: coords.longitude });
    const color = (coords.typ == 'bus') ? 'green' : (coords.typ == 'mlc') ? 'purple' : (coords.typ == 'mlb') ? 'blue' : 'red';
    const size = (coords.typ == 'bus') ? 3 : 8;

    const markerSymbol = new SimpleMarkerSymbol({
        style: "circle",
        color: color,
        size: size
    });

    const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
    });

    view.graphics.add(pointGraphic);
}