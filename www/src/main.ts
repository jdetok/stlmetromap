// import "@arcgis/core/assets/esri/themes/light/main.css";
import "@esri/calcite-components/dist/components/calcite-table-header";
import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@esri/calcite-components/dist/components/calcite-table-cell";
import "@esri/calcite-components/dist/components/calcite-table-row";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@esri/calcite-components/dist/components/calcite-slider";
import "@esri/calcite-components/dist/components/calcite-select";
import "@esri/calcite-components/dist/components/calcite-option";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-table";
import "@esri/calcite-components/dist/components/calcite-label";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-print";
import * as mw from "./cmp/map-window.js";
import * as tb from "./cmp/top-btm.js";

const COMPONENTS = [
    {
        tag: mw.TAG,
        cls: mw.MapWindow,
    },
    {
        tag: tb.TAG,
        cls: tb.TopBtm,
    },
];

function declareCustomElements() {
    for (const c of COMPONENTS) {
        console.log(`defining element with tag ${c.tag}`);
        customElements.define(c.tag, c.cls);
    }
}

// ENTRY POINT
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM LOADED");
    declareCustomElements();
});