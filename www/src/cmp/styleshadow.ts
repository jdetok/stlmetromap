export const STYLE = `
:host {
    display: block;
    width: 100%;
    min-height: 0;
    height: 100%;
    --popup-bg: rgba(115, 128, 137, 0.75);
    --calcite-color-brand: var(--popup-bg);
    --calcite-color-background: var(--popup-bg);
    --calcite-color-foreground-1: var(--popup-bg);
    overflow: clip;
    position: relative;
    --calcite-spacing-sm: 0.25rem;
    --calcite-spacing-md: 0.5rem;
    --calcite-spacing-lg: 0.75rem;
}
#filterbar {
    left: 0.8rem;
    width: min-content;
}
.place_toggles {
    position: absolute;
    bottom: 1.6rem;
    right: 0.8rem;
    /*z-index: 10;*/
}
.esri-features {
    max-height: 20%;
    color: green;
}
calcite-action-bar {
    position: absolute;
    bottom: 4.5rem;
    right: 0.8rem;
    z-index: 15;
}
calcite-panel {
    position: absolute;
    right: 0.8rem;
    bottom: 7.2rem;
    z-index: 10;
    width: fit-content;
    min-width: 18%;
    height: fit-content;
    max-height: 65%;
    max-width: 98%;
}
#filterbar {
    position: absolute;
    bottom: 1.6rem;
    left: 0.8rem;
    z-index: 10;
    width: 220px;
}
calcite-panel.filter {
    left: 0.8rem;
    right: unset;
}

calcite-panel.route-info {
    left: 0.8rem;
    right: unset;
    bottom: 4rem;
}

calcite-panel > * {
    background0color: rgba(125, 140, 151, 0.5);
}
arcgis-map {
    --calcite-block-padding: 0.25rem;
    --calcite-list-item-spacing: 0.25rem; 
    border-radius: 1rem;
    display: block;
    width: 100%;
    height: 100%;
    /*z-index: 1;*/
}
arcgis-zoom {
    position: absolute;
    top: 15px;
    left: 0.8rem;
    z-index: 10;
}

arcgis-legend {
    color: black;
    font-weight: bold;
}
arcgis-search {
    position: absolute;
    top: 15px;
    left: 60px;
    z-index: 10;
}
calcite-notice {
    width: 100%;
    max-width: 100%;
}
calcite-notice > div {
    width: 100%;
    max-width: 100%;
}
calcite-tooltip {
    --calcite-tooltip-z-index: 9999;
    z-index: 9999;
}
.esri-popup {
    max-height: 30% !important;
    z-index: 100;
}
calcite-slider {
    --calcite-slider-track-color: black;
    --calcite-slider-handle-fill-color: rgba(192, 204, 250, 0.5);
    --calcite-slider-accent-color: rgba(3, 11, 41, 0.5);
}
calcite-button {
    --calcite-button-text-color: black;
}
`;
export const MAP_STYLE = `
calcite-button {
    --calcite-button-text-color: black;
}
.esri-popup {
    max-height: 30% !important;
    z-index: 100;
}
.esri-popup__main-container {
    width: fit-content;
    max-width: 50%;
    background: rgba(115, 128, 137, 0.75) !important;
}
@media ( max-width: 900px ) {
    .esri-popup__main-container {
        max-width: 85%;
    }
}           
.esri-widget__table {
    font-size: 0.75rem !important;
}
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > h2 {
    padding-left: 0.3rem;
    font-weight: bold;
    font-size: 1.1rem !important;
    text-align: left !important;
}
.esri-feature-fields__field-header,
    div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(1) {
    padding: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;    
    text-align: right !important;
    font-weight: bold;
}
.esri-feature-fields__field-data,
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) > calcite-button,
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) {
    margin-top: 0 !important;    
    margin-bottom: 0 !important;    
    text-align: left !important;
}
`;