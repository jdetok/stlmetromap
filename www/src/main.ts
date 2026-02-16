import esriConfig from "@arcgis/core/config"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import "@arcgis/core/assets/esri/themes/light/main.css";

esriConfig.apiKey = (window as any).ARCGIS_API_KEY;

type Coordinates = { latitude: number, longitude: number };

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
            stops.forEach((c) => placeMarkerAtCoords(view, c));
        },
        (e: Error) => console.error("MapView failed:", e)
  );
});

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
    const point = new Point({ latitude: coords.latitude, longitude: coords.longitude });

    const markerSymbol = new SimpleMarkerSymbol({
        style: "circle",
        color: "cyan",
        size: 2
    });

    const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
    });

    view.graphics.add(pointGraphic);
}