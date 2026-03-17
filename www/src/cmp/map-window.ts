import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-print";
import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-select";
import "@esri/calcite-components/dist/components/calcite-option";
import "@esri/calcite-components/dist/components/calcite-table";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-table-header";
import "@esri/calcite-components/dist/components/calcite-table-row";
import "@esri/calcite-components/dist/components/calcite-table-cell";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { STLCOORDS, STLWKID, BASEMAP } from "../data.js";
import {
    makeBusStopsLayer,
    makePlacesLayer,
    FeatureLayerMeta,
    LAYER_ML_STOPS,
    LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS,
    LAYER_CYCLING,
    LAYER_AMTRAK,
    BUS_STOP_SIZE,
} from "../layers.js";

function newHighlightSetting(name: string, color: __esri.ColorProperties): __esri.HighlightOptionsProperties {
    return {
        name: name, color: color,
        fillOpacity: 0.25, shadowColor: "black",
        shadowOpacity: 0.4, shadowDifference: 0.2,
    }
}

const HL_PARKS = newHighlightSetting("parks", "mediumseagreen");
const HL_SCHOOLS = newHighlightSetting("schools", "khaki");
const HL_UNI = newHighlightSetting("uni", "yellow");
const HL_CHURCH = newHighlightSetting("church", "violet");
const HL_MED = newHighlightSetting("med", "mediumvioletred");
const HL_GROCERY = newHighlightSetting("grocery", "white");
const HIGHLIGHTS: __esri.CollectionProperties<__esri.HighlightOptionsProperties> = [
    newHighlightSetting("default", "cyan"),
    HL_PARKS,
    HL_SCHOOLS,
    HL_CHURCH, 
    HL_MED,
    HL_GROCERY,
];

function buildCalcitePanel(elementType: string, heading: string): HTMLCalcitePanelElement {
    const panel = document.createElement("calcite-panel");
    panel.heading = heading;
    panel.hidden = true;

    const content = document.createElement(elementType) as any;
    panel.appendChild(content);
    return panel;
}
export const TAG = "map-window";
export class MapWindow extends HTMLElement {
    private arcgisMap!: HTMLArcgisMapElement;
    private highlightHandles: Map<string, __esri.Handle> = new Map();
    private layers: FeatureLayerMeta[];
    private BUS_META: FeatureLayerMeta;
    private PLACE_META: FeatureLayerMeta;
    private busStopsLayer!: FeatureLayer;
    private placesLayer!: FeatureLayer;
    private routePanel!: HTMLElement;
    private layerListPanel!: HTMLCalcitePanelElement;
    private routeInfoPanel!: HTMLCalcitePanelElement;
    private legendPanel!: HTMLCalcitePanelElement;
    private basemapPanel!: HTMLCalcitePanelElement;
    private printPanel!: HTMLCalcitePanelElement;
    private routesData: any[] = [];
    public constructor() {
        super();

        const root = this.attachShadow({ mode: "open" });
        
        this.BUS_META = makeBusStopsLayer(
            (route) => { this.filterByRoute(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );

        this.PLACE_META = makePlacesLayer(
            (route) => { this.filterByRoute(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        // order matters
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            LAYER_CYCLING,
            this.PLACE_META,
            LAYER_AMTRAK,
            this.BUS_META,
            LAYER_ML_STOPS,
        ];

        root.append(
            this.addStyling(),
            this.buildMap(),
            this.buildLayerListPanel(),
            this.buildLegendPanel(),
            this.buildPrintPanel(),
            this.buildBasemapPanel(),
            this.buildActionBar(),
            this.buildToggleBar(),
            this.buildRoutesFilter(),
            this.buildRouteInfoPanel(),
        );

    }
    disconnectedCallback(): void {
        this.arcgisMap?.remove();
    }
    private buildMap(): HTMLArcgisMapElement {
        this.arcgisMap = document.createElement("arcgis-map") as HTMLArcgisMapElement;
        this.arcgisMap.basemap = BASEMAP;
        this.arcgisMap.extent = {
            xmin: STLCOORDS.xmin,
            ymin: STLCOORDS.ymin,
            xmax: STLCOORDS.xmax,
            ymax: STLCOORDS.ymax,
            spatialReference: {wkid: STLWKID}
        } as __esri.Extent

        this.arcgisMap.addEventListener("arcgisViewReadyChange", async () => {
            const view = this.arcgisMap.view as __esri.MapView;
            this.arcgisMap.appendChild(this.buildZoom());
            this.arcgisMap.appendChild(this.buildSearch());
            (this.layerListPanel.querySelector("arcgis-layer-list") as any).view = view;
            (this.legendPanel.querySelector("arcgis-legend") as any).view = view;
            (this.basemapPanel.querySelector("arcgis-basemap-gallery") as any).view = view;
            (this.printPanel.querySelector("arcgis-print") as any).view = view;
            for (let i = 0; i < this.layers.length; i++) {
                try {
                    const layer = await this.makeFeatureLayer(this.layers[i]);
                    if (this.layers[i] === this.BUS_META) {
                        this.busStopsLayer = layer;
                    }
                    if (this.layers[i] === this.PLACE_META) {
                        this.placesLayer = layer;
                    }
                    this.arcgisMap.map?.add(layer, i);
                } catch (e) {
                    console.error(e);
                }
            }
            await this.populateRouteSelect();
            // re-render stop size based on zoom amount
            this.renderOnZoom();

            // SET OBJECT HIGH LIGHT COLOR
            view.highlights = HIGHLIGHTS;
        }, { once: true });

        return this.arcgisMap;
    }
    private renderOnZoom() {
        this.arcgisMap.view.watch("zoom", (zoom) => {
            console.log("zoom: ", zoom);
            const scale = zoom <= 9 ? 0.5 : zoom <= 11 ? 0.75 : zoom <= 12 ? 1 : zoom < 15 ? 1.25 : zoom < 17 ? 1.5 : 2;
            (this.busStopsLayer.renderer as any).visualVariables[0].stops = [
                { value: 1, size: BUS_STOP_SIZE * scale },
                { value: 2, size: BUS_STOP_SIZE * 1.5 * scale },
                { value: 3, size: BUS_STOP_SIZE * 2.5 * scale },
                { value: 4, size: BUS_STOP_SIZE * 3.5 * scale },
                { value: 5, size: BUS_STOP_SIZE * 4 * scale },
            ];
        });
    }
    private async makeFeatureLayer(meta: FeatureLayerMeta): Promise<FeatureLayer> {
        try {
            if (meta.dataUrl) {
                const res = await fetch(meta.dataUrl);
                const data = await res.json();

                if (meta.toGraphics) {
                    meta.source = meta.toGraphics(data);
                } else {
                    if (!data?.features?.length) {
                        throw new Error(`layer "${meta.title}" expected data.features[]`);
                    }
                    meta.source = data.features.map((f: any) => new Graphic({
                        geometry: new Polygon({
                            rings: f.geometry.rings,
                            spatialReference: { wkid: STLWKID },
                        }),
                        attributes: f.attributes,
                    }));
                }
            }
        } catch (e) {
            throw new Error(`no data source for ${meta.title} layer: ${e}`);
        }
        return new FeatureLayer({
            title: meta.title,
            source: meta.source,
            objectIdField: "ObjectID",
            geometryType: meta.geometryType,
            spatialReference: { wkid: STLWKID },
            renderer: meta.renderer,
            popupTemplate: meta.popupTemplate,
            fields: meta.fields,
            outFields: ["*"],
        });
    }
    private addStyling(): HTMLStyleElement {
        return Object.assign(document.createElement("style"), { textContent: STYLE });
    }
    private togglePanel(id: string, actionBar: any, panels: Record<string, HTMLElement>): void {
        actionBar.querySelectorAll("calcite-action").forEach((a: any) => {
            a.active = a.dataset.actionId === id ? !a.active : false;
        });
        Object.entries(panels).forEach(([key, panel]: [string, any]) => {
            panel.hidden = key !== id || !actionBar.querySelector(`[data-action-id="${id}"]`).active;
        });
    }
    private buildActionBar(): HTMLCalciteActionBarElement {
        const actionBar = document.createElement("calcite-action-bar") as any;
        actionBar.layout = "horizontal";

        const actions = [
            { id: "legend", icon: "legend", text: "Legend" },
            { id: "layers", icon: "layers", text: "Layers" },
            { id: "basemaps", icon: "basemap", text: "Basemaps" },
            { id: "print", icon: "print", text: "Export" },
        ];
        for (const a of actions) {
            const action = document.createElement("calcite-action") as any;
            action.dataset.actionId = a.id;
            action.icon = a.icon;
            action.text = a.text;

            action.addEventListener("click", () => {
                this.togglePanel(a.id, actionBar, {
                    layers: this.layerListPanel,
                    legend: this.legendPanel,
                    basemaps: this.basemapPanel,
                    print: this.printPanel,
                });
            });
            actionBar.appendChild(action);
        }
        actionBar.appendChild(this.buildFsBtn())
        return actionBar;
    }
    private buildToggleBar(): HTMLCalciteActionBarElement {
        const actionBar = document.createElement("calcite-action-bar") as any;
        actionBar.layout = "vertical";
        actionBar.classList.add("place_toggles");

        const actions = [
            {
                id: "parks", icon: "tree", text: "Highlight Parks",
                layer: () => this.placesLayer, where: `type = 'park'`,
                highlight: HL_PARKS,
            },
            {
                id: "medical", icon: "medical", text: "Highlight Hospitals",
                layer: () => this.placesLayer, where: `type = 'medical'`,
                highlight: HL_MED,
            },
            {
                id: "university", icon: "mooc", text: "Highlight Universities",
                layer: () => this.placesLayer, where: `type = 'university'`,
                highlight: HL_SCHOOLS,
            },
            {
                id: "school", icon: "education", text: "Highlight Schools",
                layer: () => this.placesLayer, where: `type = 'school'`,
                highlight: HL_SCHOOLS,
            },
            {
                id: "grocery", icon: "shopping-cart", text: "Highlight Grocery Stores",
                layer: () => this.placesLayer, where: `type = 'grocery'`,
                highlight: HL_GROCERY,
            },
            {
                id: "church", icon: "organization", text: "Highlight Places of Worship",
                layer: () => this.placesLayer, where: `type = 'church'`,
                highlight: HL_CHURCH,
            },
            {
                id: "social_facility", icon: "home", text: "Highlight Community Centers",
                layer: () => this.placesLayer, where: `type = 'social_facility'`,
                highlight: HL_MED,
            },
        ];
        for (const a of actions) {
            const action = document.createElement("calcite-action") as any;
            action.dataset.actionId = a.id;
            action.icon = a.icon;
            action.text = a.text;
            action.addEventListener("click", async () => {
                await this.highlightFeatures(action, a.layer(), a.where, a.id, a.highlight.name ?? 'default');
            });
            actionBar.appendChild(action);
        }

        const resetPlacesBtn = document.createElement("calcite-action");
        resetPlacesBtn.icon = 'reset';
        resetPlacesBtn.text = "Reset Highlighted Places"
        resetPlacesBtn.addEventListener("click", async () => {
            this.highlightHandles.forEach(h => h.remove());
            this.highlightHandles.clear();
            actionBar.querySelectorAll("calcite-action").forEach((a: any) => a.active = false)
        })
        actionBar.appendChild(resetPlacesBtn);

        const resetBusesBtn = document.createElement("calcite-action");
        resetBusesBtn.icon = 'bus';
        resetBusesBtn.text = "Reset Highlighted Bus Stops"
        resetBusesBtn.addEventListener("click", async () => {
            const busLayerView = await this.arcgisMap.view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;
            busLayerView.featureEffect = null;
        })
        actionBar.appendChild(resetBusesBtn);

        return actionBar;
    }
    private async highlightFeatures(btn: any, layer: FeatureLayer, whereClause: string, id: string, highlight: string): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;

        if (btn.active) {
            btn.active = false;
            this.highlightHandles.get(id)?.remove();
            this.highlightHandles.delete(id);
            return;
        }

        btn.active = true;
        const result = await layer.queryFeatures({
            where: whereClause,
            returnGeometry: true,
            outSpatialReference: { wkid: STLWKID },
        });

        if (result.features.length) {
            const objIds = result.features.map((f: any) => f.attributes.ObjectID);
            this.highlightHandles.set(id, layerView.highlight(objIds, {name: highlight}));
            // await this.arcgisMap.view.goTo(result.features, { duration: 600 });
        }
    }
    private buildFsBtn(): HTMLCalciteActionElement {
        const fsAction = document.createElement("calcite-action") as any;
        fsAction.icon = "extent";
        fsAction.text = "Fullscreen";
        fsAction.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                this.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
        return fsAction;
    }
    private buildRoutesFilter(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.id = "filterbar";

        const select = document.createElement("calcite-select") as any;
        select.label = "Route";
        select.id = "route-select";
        select.addEventListener("calciteSelectChange", () => {
            this.filterByRoute(select.value);
            this.showRouteInfo(select.value);
            if (!select.value) {
                this.routeInfoPanel.hidden = true;
            }
        });

        wrapper.appendChild(select);
        this.routePanel = wrapper;
        return wrapper;
    }
    
    private buildLayerListPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel("arcgis-layer-list", "Layers");
        this.layerListPanel = panel;
        return panel;
    }
    private buildPrintPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel("arcgis-print", "Export");
        this.printPanel = panel;
        return panel;
    }
    private buildLegendPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel("arcgis-legend", "Legend");
        this.legendPanel = panel;
        return panel;
    }
    private buildBasemapPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel("arcgis-basemap-gallery", "Basemaps");
        this.basemapPanel = panel;
        return panel;
    }
    private buildZoom(): HTMLArcgisZoomElement {
        return document.createElement("arcgis-zoom");
    }
    private buildSearch(): HTMLArcgisSearchElement {
        const search = document.createElement("arcgis-search");
        search.view = this.arcgisMap.view;
        return search;
    }
    private buildRouteInfoPanel(): HTMLCalcitePanelElement {
        const panel = document.createElement("calcite-panel");
        panel.classList.add("route-info");
        panel.heading = "Route Info";
        panel.hidden = true;
        panel.closed = false;
        panel.closable = true;
        panel.addEventListener("calcitePanelClose", () => {
            this.routeInfoPanel.hidden = true;
        });
        this.routeInfoPanel = panel;
        return panel;
    }
    private showRouteInfo(route: string): void {
        if (!route) {
            this.routeInfoPanel.hidden = true;
            return;
        }

        const feature = this.routesData.find((f: any) => f.properties.route_desc === route);
        if (!feature) return;

        const props = feature.properties;
        this.routeInfoPanel.querySelector("calcite-table")?.remove();
        this.routeInfoPanel.heading = `${route}: ${props.stops_total} stops`;
        this.routeInfoPanel.closed = false;
        this.routeInfoPanel.closable = true;

        const tbl = this.buildPropsTable(`Route ${props.route}`, props);
        this.routeInfoPanel.appendChild(tbl);
        this.routeInfoPanel.hidden = false;
    }
    private buildPropsTable(routeHeading: string, props: any): HTMLCalciteTableElement {
        const tbl = document.createElement("calcite-table");
        tbl.setAttribute("caption", routeHeading);

        const hdg = Object.assign(document.createElement("calcite-table-row"), { slot: "table-header" });
        const h1 = Object.assign(document.createElement("calcite-table-header"), { heading: "Amenity Type" });
        const h2 = Object.assign(document.createElement("calcite-table-header"), { heading: "Stops w/ Access" });
        hdg.append(h1, h2);
        tbl.appendChild(hdg);
        // add the key as the first table cell and the val as the second
        for (const [key, val] of Object.entries(props)) {
            if (!key.includes("_access_")) continue;
            if ((!key.toLowerCase().includes("amenity")) && String(val) === "false") continue;
            console.log(String(val));
            const row = document.createElement("calcite-table-row");
            const keyVal = key.split("_").at(-1);
            const amenity = Object.assign(document.createElement("calcite-table-cell"), {
                innerText: `${String(keyVal).charAt(0).toUpperCase()}${String(keyVal).slice(1)}`
            });
            const access = Object.assign(document.createElement("calcite-table-cell"), { innerText: val });
            row.append(amenity, access);
            tbl.appendChild(row);
        }
        return tbl;
    }

    private async populateRouteSelect(): Promise<void> {
        const res = await fetch("layers/routes");
        const data = await res.json();

        this.routesData = data.features;
        const routes = data.features.map((f: any) => f.properties.route_desc).sort();

        const select = this.routePanel.querySelector("calcite-select") as any;

        const allOption = document.createElement("calcite-option") as any;
        allOption.value = "all" ;
        allOption.label = "All MetroBus Routes";
        select.appendChild(allOption);

        for (const r of routes) {
            const option = document.createElement("calcite-option") as any;
            option.value = r;
            option.label = r;
            select.appendChild(option);
        }
    }
    private async filterByRoute(routeName: string): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;

        if (!routeName) {
            layerView.featureEffect = null;
            return;
        }

        const whereClause = `route_names like '%${routeName}%'`;

        layerView.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({ where: whereClause }),
            includedEffect: "bloom(2, 1px, 0.3) drop-shadow(2px 2px 4px black) brightness(2)",
            excludedEffect: "opacity(60%) brightness(1)"
        });
        const result = await this.busStopsLayer.queryFeatures({
            where: whereClause,
            returnGeometry: true,
            outSpatialReference: { wkid: STLWKID },
        });
        if (result.features.length) {
            await this.arcgisMap.view.goTo(result.features, { duration: 600 });
        }
    }
    private async filterByRoutes(routeNames: string[]): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;

        if (!routeNames) {
            layerView.featureEffect = null;
            return;
        }

        const whereClause = routeNames.map(r => `route_names like '%${r}%'`).join(" or ");

        layerView.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({ where: whereClause }),
            includedEffect: "bloom(2, 1px, 0.3) drop-shadow(2px 2px 4px black) brightness(2)",
            excludedEffect: "opacity(60%) brightness(1)"
        });
        const result = await this.busStopsLayer.queryFeatures({
            where: whereClause,
            returnGeometry: true,
            outSpatialReference: { wkid: STLWKID },
        });
        if (result.features.length) {
            await this.arcgisMap.view.goTo(result.features, { duration: 600 });
        }
    }
}

const STYLE = `
:host {
    display: block;
    width: 100%;
    min-height: 0;
    height: 100%;
    --popup-bg: rgba(125, 140, 151, 0.42);
    --calcite-color-brand: var(--popup-bg);
    --calcite-color-background: var(--popup-bg);
    --calcite-color-foreground-1: var(--popup-bg);
    overflow: hidden;
    position: relative;
    --calcite-spacing-sm: 0.25rem;
    --calcite-spacing-md: 0.5rem;
    --calcite-spacing-lg: 0.75rem;
}

#filterbar {
    left: 5px;
    width: min-content;
}
.place_toggles {
    position: absolute;
    bottom: 4.5rem;
    right: 5px;
    z-index: 10;
}
calcite-action-bar {
    position: absolute;
    bottom: 1.8rem;
    right: 5px;
    z-index: 10;
}
calcite-panel {
    position: absolute;
    right: 55px;
    bottom: 70px;
    z-index: 10;
    width: fit-content;
    height: fit-content;
    max-height: 55%;
    max-width: 98%;
}
#filterbar {
    position: absolute;
    bottom: 1.8rem;
    left: 5px;
    z-index: 10;
    width: 220px;
}
calcite-panel.filter {
    left: 5px;
    right: unset;
}

calcite-panel.route-info {
    left: 5px;
    right: unset;
}

calcite-panel > * {
    background0color: rgba(125, 140, 151, 0.1);
}
arcgis-map {
    --calcite-block-padding: 0.25rem;
    --calcite-list-item-spacing: 0.25rem; 
    border-radius: 1rem;
    display: block;
    width: 100%;
    height: 100%;
    z-index: 1;
}
arcgis-zoom {
    position: absolute;
    top: 15px;
    left: 15px;
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
`;