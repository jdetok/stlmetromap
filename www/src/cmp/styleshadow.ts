export const STYLE = `
:host {
    display: block;
    width: 100%;
    min-height: 0;
    height: 100%;
    --popup-bg: rgba(115, 128, 137, 0.75);
    --btn-hvr: rgba(68, 78, 87, 0.9);
    --btn-prs: rgba(80, 89, 96, 0.89);
    --calcite-color-brand: var(--popup-bg);
    --calcite-color-background: var(--popup-bg);
    --calcite-color-foreground-1: var(--popup-bg);
    overflow: clip;
    position: relative;
    --calcite-spacing-sm: 0.25rem;
    --calcite-spacing-md: 0.5rem;
    --calcite-spacing-lg: 0.75rem;
    --route-combo-width: 215px;
    --route-combo-left: 0.8rem;
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
    height: fit-content;
    max-height: 50%;
    width: 300px;
    max-width: 98%;
}
calcite-panel.route-info {
    left: calc(var(--route-combo-width) + var(--route-combo-left) + 0.5rem);
    right: unset;
    bottom: 1.6rem;
}
calcite-dropdown {
    --calcite-dropdown-background-color: var(--popup-bg);
    position: absolute;
    bottom: 1.6rem;
    z-index: 10;
    --calcite-dropdown-width: var(--route-combo-width);
    left: var(--route-combo-left);
}
@media (max-width: 900px) {
    calcite-dropdown {
        top: 0.4rem;
        bottom: unset;
        right: 1.6rem;
        left: unset;
    }
    calcite-panel {
        position: absolute;
        right: 4rem;
        bottom: 4rem;
        z-index: 10;
        height: fit-content;
        max-height: 40%;
        width: 250px;
        max-width: 98%;
    }
    
    calcite-panel.route-info {
        unset: 3rem;
        bottom: 4.5rem;
        left: 0.2rem;
        right: unset;
    }
    arcgis-zoom {
        top: 0.4rem;
    }
    arcgis-search {
        display: none;
    }

    calcite-action-bar {
        position: absolute;
        bottom: 1.4rem;
        right: 0.4rem;
        z-index: 15;
    }
    .place_toggles {
        position: absolute;
        bottom: 4rem;
        right: 0.4rem;
        /*z-index: 10;*/
    }
}
calcite-dropdown-item {
    --calcite-dropdown-item-background-color-hover: var(--btn-hvr);
    --calcite-dropdown-item-background-color-press: var(--btn-prs);
    --calcite-dropdown-item-icon-color-press: white;
    --calcite-dropdown-item-text-color-press: white;
    --calcite-dropdown-item-text-color: black;
    max-width: var(--route-combo-width);
}
calcite-button {
    --calcite-button-background-color: var(--popup-bg);
    --calcite-button-border-color: black;
}
calcite-button:hover {
    --calcite-button-background-color: var(--btn-hvr);
    --calcite-button-border-color: white;
}



calcite-select {
    position: absolute;
    bottom: 1.6rem;
    left: 0.8rem;
    z-index: 10;
    width: 220px;
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
    top: 1.6rem;
    left: 0.8rem;
    z-index: 10;
}

arcgis-legend {
    color: black;
    font-weight: bold;
    position: relative;
    z-index: 5;
}
arcgis-search {
    position: absolute;
    top: 1.6rem;
    left: 2.8rem;
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
calcite-slider {
    --calcite-slider-track-color: rgba(11, 90, 11, 0.75);
    --calcite-slider-track-fill-color: black;
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
    max-height: 40% !important;
    z-index: 100 !important;
    max-width: 70% !important;
}
.esri-popup__main-container {
    z-index: 100 !important;
    position: relative;
    width: fit-content;
    
    background: rgba(115, 128, 137, 0.75) !important;
}
@media ( max-width: 900px ) and (max-height: 900px ) {
    .esri-popup, .esri-popup__main-container {
        max-width: 85%;
        max-height: 25%;
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
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) > calcite-button,
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) {
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) > calcite-button,
div > div.esri-view-root > div.esri-ui.calcite-mode-light > div.esri-ui-inner-container.esri-ui-manual-container > div.esri-component.esri-popup.esri-popup--is-docked.esri-popup--is-docked-top-right > div > div > calcite-flow > calcite-flow-item > div > div > div > div > div > div > div > table > tbody > tr > td:nth-child(2) {
    margin-top: 0 !important;    
    margin-bottom: 0 !important;    
    text-align: left !important;
}
    .esri-component.esri-popup {
    z-index: 200 !important;
}
.esri-component.esri-legend {
    z-index: 50 !important;
}
`;