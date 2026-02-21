import "@arcgis/core/assets/esri/themes/light/main.css";
import { declareCustomElements } from "./cmp/cmp.js"

// ENTRY POINT
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM LOADED");
    declareCustomElements();
});