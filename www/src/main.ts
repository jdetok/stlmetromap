import esriConfig from "@arcgis/core/config"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import Field from "@arcgis/core/layers/support/Field";
import Legend from "@arcgis/core/widgets/Legend";
import Expand from "@arcgis/core/widgets/Expand";
import "@arcgis/core/assets/esri/themes/light/main.css";

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
    view.when().then(
        async () => {
            try {
                await buildStopLayers(map);
                await Promise.all(map.layers.toArray().map((l) => view.whenLayerView(l as any)));

                console.log("layers", map.layers.length, map.layers.toArray().map(l => l.title));

                const legend = new Legend({
                    view: view,
                });
                
                await legend.when();

                const expand = new Expand({
                    view,
                    content: legend,
                    expanded: true,
                });

                view.ui.add(expand, "top-right");
                expand.expand();

                // Wait for Calcite to hydrate the popover
                setTimeout(() => {
                    document.querySelector('calcite-popover')?.setAttribute('placement', 'top-trailing');
                }, 100);

            } catch (e) {
                console.error("error in view.when callback: ", e);
            }
        },
        (e: Error) => console.error("failed to build or display map:", e)
    );
});

async function buildStopLayers(map: Map) {
    const bus: StopMarker[] = [];
    const mlc: StopMarker[] = [];
    const mlb: StopMarker[] = [];
    const mlr: StopMarker[] = [];

    const stopMarkers = await getStops();

    stopMarkers.stops.forEach((s) => {
        switch (s.typ) {
            case 'bus': bus.push(s); break;
            case 'mlc': mlc.push(s); break;
            case 'mlb': mlb.push(s); break;
            case 'mlr': mlr.push(s); break;
        }
    });

    map.add(makeStopLayer(bus, 'MetroBus Stops', BUS_STOP_COLOR, BUS_STOP_SIZE));
    map.add(makeStopLayer(mlc, 'MetroLink Blue/Red Line Stops', MLC_STOP_COLOR, ML_STOP_SIZE));
    map.add(makeStopLayer(mlb, 'MetroLink Blue Line Stops', MLB_STOP_COLOR, ML_STOP_SIZE));
    map.add(makeStopLayer(mlr, 'MetroLink Red Line Stops', MLR_STOP_COLOR, ML_STOP_SIZE));
}

function makeStopLayer(stops: StopMarker[],
    title: string,
    color: string,
    size: number
): FeatureLayer {
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