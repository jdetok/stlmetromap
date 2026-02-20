import { STLCOORDS, STLWKID, BASEMAP, MAP_CONTAINER } from "../global.js";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";

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
    private mapDiv!: HTMLDivElement;
    private view?: __esri.MapView;
    constructor() {
        super();
        this.tag = TAG;
        this.coords = newMapCoords(STLCOORDS.xmin, STLCOORDS.ymin, STLCOORDS.xmax, STLCOORDS.ymax, STLWKID);

        const root = this.attachShadow({ mode: "open" });

        // container INSIDE the component
        this.mapDiv = document.createElement("div");
        this.mapDiv.style.width = "60%";
        this.mapDiv.style.height = "60%";
        this.mapDiv.style.minHeight = "300px"; // prevents it from collapsing

        // optional: component-level styles
        const style = document.createElement("style");
        style.textContent = `
        :host {
            display: block;
            width: 60%;
            height: 60%;
        }
        `;

        root.append(style, this.mapDiv);
    }

    connectedCallback() {
        // build once
        if (!this.view) this.buildMap();
    }

    disconnectedCallback() {
        // important: ArcGIS cleanup
        this.view?.destroy();
        this.view = undefined;
    }
    buildMap() {
        const div = document.createElement('div');
        const map = new Map({
            basemap: BASEMAP
        });
        const view = new MapView({
            container: div,
            map: map,
            extent: this.coords,
            popupEnabled: true,
            popup: {
                dockEnabled: false,
                dockOptions: {buttonEnabled: false}
            }
        });
        view.when(async () => { // ADD LAYERS TO MAP VIEW
            console.trace('adding layers');
        }, (e: Error) => console.error("failed to build or display map:", e))
    }
};