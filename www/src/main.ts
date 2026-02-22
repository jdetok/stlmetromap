import "@arcgis/core/assets/esri/themes/light/main.css";
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
    }
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