import { MEDIAQ_MAXW, MEDIAQ_MAXH } from "../data";
export const STYLE = `
:host {
    display: block;
    overflow: clip;
    position: relative;
    width: 100%;
    min-height: 0;
    height: 100%;
    --popup-bg: rgba(115, 128, 137, 0.75);
    --btn-hvr: rgba(68, 78, 87, 0.9);
    --btn-prs: rgba(80, 89, 96, 0.89);
    --calcite-color-brand: var(--popup-bg);
    --calcite-color-background: var(--popup-bg);
    --calcite-color-foreground-1: var(--popup-bg);
    --calcite-spacing-sm: 0.25rem;
    --calcite-spacing-md: 0.5rem;
    --calcite-spacing-lg: 0.75rem;
    --route-combo-width: 215px;
    --action-width: 55px;
    --action-height: 45px;
    --from-top: 0.4rem;
    --from-side: 0.4rem;
    --from-bottom: 1.6rem;
}
#filterbar {
    left: var(--from-side);
    width: min-content;
}
/*
    calcite-action-bar components are contained in the .actbars grid
    for large screens (> maxw import) both action bars are rendered horizontal,
    with the main action bar on top and the places toggle bar on bottom.
    for smaller screen, the toggle bar is rendered vertically and placed on top
    with the main bar on bottom, still horizontal
*/
.actbars {
    display: grid;
    gap: 0.2rem;
    grid-template-areas: "a" "." "b";
    position: absolute;
    bottom: var(--from-bottom);
    right: var(--from-side);
    left: unset;
}
.actbars > * {
    right: var(--from-side);
    left: unset;
    margin-left: auto;
}
calcite-action-bar {
    z-index: 20;
    width: fit-content;
}
calcite-action-bar.main {
    grid-area: a;
}
calcite-action-bar.toggle {
    grid-area: b;
}
.esri-features {
    max-height: 20%;
    color: green;
}
calcite-panel {
    position: absolute;
    right: var(--from-side);
    bottom: 7.2rem;
    z-index: 10;
    height: fit-content;
    max-height: 50%;
    width: 300px;
    max-width: 98%;
}
calcite-panel.route-info {
    left: calc(var(--route-combo-width) + var(--from-side) + 0.5rem);
    right: unset;
    bottom: 1.6rem;
}
calcite-dropdown {
    --calcite-dropdown-background-color: var(--popup-bg);
    position: absolute;
    bottom: 1.6rem;
    z-index: 10;
    --calcite-dropdown-width: var(--route-combo-width);
    left: var(--from-side);
}
@media (max-width: ${MEDIAQ_MAXW}px) {
    calcite-dropdown {
        top: var(--from-top);
        bottom: unset;
        right: var(--from-side);
        left: unset;
    }
    calcite-panel {
        position: absolute;
        right: calc(var(--action-width) + var(--from-side));
        bottom: calc(var(--action-height) + var(--from-bottom));
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
        top: var(--from-top);
    }
    arcgis-search {
        display: none;
    }
    /* flip areas for smaller screen (toggle goes on top) */
    .actbars {
        grid-template-areas: "b" "." "a";
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
    --calcite-button-text-color: black;
}
calcite-button:hover {
    --calcite-button-background-color: var(--btn-hvr);
    --calcite-button-border-color: white;
}
arcgis-map {
    --calcite-block-padding: 0.25rem;
    --calcite-list-item-spacing: 0.25rem; 
    border-radius: 1rem;
    display: block;
    width: 100%;
    height: 100%;
}
arcgis-zoom {
    position: absolute;
    top: var(--from-top);
    left: var(--from-side);
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
    top: var(--from-top);
    left: 2.8rem;
    z-index: 10;
}
calcite-notice {
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
`;
// have to inject styling into the arcgis-map shadow dom for popups etc
export const MAP_STYLE = `
/* hover to reveal outline inside popup*/
calcite-button {
    --calcite-button-text-color: black;
}
.esri-popup {
    max-height: 40% !important;
}
@media (max-width: ${MEDIAQ_MAXW}px) and (max-height: ${MEDIAQ_MAXH}px ) {
    .esri-popup {
        width: fit-content;
        max-width: 100%;
        max-height: 20%;
    }
}
`;