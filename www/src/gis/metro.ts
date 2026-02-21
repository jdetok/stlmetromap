import Map from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Field from "@arcgis/core/layers/support/Field";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import { BUS, ML, BUS_STOP_COLOR, BUS_STOP_SIZE, MLC_STOP_COLOR, ML_STOP_SIZE, MLB_STOP_COLOR, MLR_STOP_COLOR, STLWKID } from "../global.js"

const RouteTypes: Record<RouteType, string> = {
    bus: BUS,
    mlr: ML,
    mlb: ML,
    mlc: ML
};

type Route = {
    id: string | number,
    name: string,
    nameLong: string,
}
type Coordinates = { latitude: number, longitude: number, name: string, typ: RouteType };
type RouteType = 'bus' | 'mlr' | 'mlb' | 'mlc';

type StopMarkers = {stops: StopMarker[]}
type StopMarker = {
    id: string | number,
    name: string,
    typ: RouteType,
    routes: Route[],
    yx: Coordinates,
}

// get metro stops from backend
async function getStops(): Promise<StopMarkers> {
    const res = await fetch("/stops");
    if (!res.ok) {
        throw new Error(`failed to fetch`)
    }
    return await res.json();
}

// create and add feature layers to map for each stop category
export async function buildStopLayers(map: Map): Promise<void> {
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
    const source = stops.map((s) => new Graphic({
        geometry: new Point({ latitude: s.yx.latitude, longitude: s.yx.longitude }),
        attributes: {
            name: s.name,
            type: RouteTypes[s.typ],
            routes: s.routes.map(r => `${r.name}-${r.nameLong}`).join(", "),
        }
    }))
    return new FeatureLayer({
        title,
        source,
        spatialReference: { wkid: STLWKID },
        objectIdField: "ObjectID",
        geometryType: "point",
        fields: [
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