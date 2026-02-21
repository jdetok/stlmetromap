import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { buildFeatureLayer, buildLegend } from "../gis/layers.js";
import { buildStopLayers } from "../gis/metro.js";
import { STLCOORDS, STLWKID, BASEMAP, LAYER_CENSUS_COUNTIES, LAYER_CENSUS_TRACTS } from "../global.js";

export const TAG = 'map-window';

type mapCoords = {
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
    spatialReference: { wkid: number }
}

export function newMapCoords(
    xmin: number, ymin: number, xmax: number, ymax: number, wkid: number
): mapCoords {
    return { xmin, ymin, xmax, ymax, spatialReference: { wkid } }
}

export class MapWindow extends HTMLElement {
    public tag: string;
    public coords: mapCoords;
    private div!: HTMLDivElement;
    private view: __esri.MapView;
    public map: __esri.Map;
    constructor() {
        super();
        this.tag = TAG;
        this.coords = newMapCoords(STLCOORDS.xmin, STLCOORDS.ymin, STLCOORDS.xmax, STLCOORDS.ymax, STLWKID);

        const root = this.attachShadow({ mode: "open" });

        this.div = document.createElement("div");
        this.div.style.width = "100%";
        this.div.style.height = "100%";
        this.div.style.overflow = "hidden";
        this.div.style.position = "relative";
        this.div.style.minHeight = "300px"; // prevents it from collapsing
        const style = document.createElement("style");
        style.textContent = STYLE;
        this.map = new Map({
            basemap: BASEMAP
        });
        
        this.view = new MapView({
            container: this.div,
            map: this.map,
            extent: this.coords,
            popupEnabled: true,
            popup: {
                dockEnabled: false,
                dockOptions: {buttonEnabled: false}
            }
        });

        this.view.when(async () => { // ADD LAYERS TO MAP VIEW
            await Promise.all([
                buildStopLayers(this.map),
                buildFeatureLayer(this.map, LAYER_CENSUS_COUNTIES, 0),
                buildFeatureLayer(this.map, LAYER_CENSUS_TRACTS, 1),
            ]);
            buildLegend(this.view);
        }, (e: Error) => console.error("failed to build or display map:", e))
        
        root.append(style, this.div);
    }
};

const STYLE = `
:host {
    position: relative;
    overflow: hidden;
    display: block;
    width: 100%;
    height: 100%;
}

.esri-component * {
    pointer-events: auto;
    text-align: left;
}

.esri-widget--button {
    background-color: var(--popup-bg);
}
.esri-ui-corner {
    position: absolute;
}

.esri-ui-top-left     { top: 15px;    left: 15px;   }
.esri-ui-top-right    { top: 15px;    right: 15px;  }
.esri-ui-bottom-left  { bottom: 15px; left: 15px;   }
.esri-ui-bottom-right { bottom: 15px; right: 15px;  }
.esri-popup__main-container {
    padding: .5rem;
    background-color: var(--popup-bg);
    border: 2px solid black;
    border-radius: 1rem;
    width: 20%;
    margin: 0 auto;
}

.esri-expand__content-container {
    padding: .5rem;
    border: var(--popup-bdr);
    border-radius: var(--popup-bdrrad);
    background-color: var(--popup-bg);
}

.esri-ui-manual-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.esri-attribution {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: auto;
}
`