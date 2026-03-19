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
import "@esri/calcite-components/dist/components/calcite-notice";
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
import { buildCalcitePanel, buildCalciteTableBlock } from "../calcite.js";
import {
    FeatureLayerMeta,
    makeBusStopsLayer,
    makeLinesLayer,
    makePlacesLayer,
    LAYER_ML_STOPS,
    LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS,
    LAYER_CYCLING,
    LAYER_AMTRAK,
    BUS_STOP_SIZE,
} from "../layers.js";

// HELPER TO CREATE CUSTOM HIGHLIGHT SETTINGS
function newHighlightSetting(name: string, color: __esri.ColorProperties): __esri.HighlightOptionsProperties {
    return {
        name: name, color: color,
        fillOpacity: 0.05, shadowColor: "black",
        shadowOpacity: 0.4, shadowDifference: 0.2,
    }
}
// CUSTOM HIGHLIGHT SETTINGS
const HL_PARKS = newHighlightSetting("parks", "mediumseagreen");
const HL_SCHOOLS = newHighlightSetting("schools", "khaki");
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

// TOGGLE BUTTONS FOR HIGHLIGHTING FEATURES
type toggleAction = {
    id: string,
    icon: string,
    text: string,
    where: string,
    highlightName: string,
}
const TOGGLE_ACTIONS: toggleAction[] = [
    {
        id: "parks", icon: "tree", text: "Highlight Parks",
        where: `type = 'park'`, highlightName: HL_PARKS.name!,
    }, {
        id: "medical", icon: "medical", text: "Highlight Hospitals",
        where: `type = 'medical'`, highlightName: HL_MED.name!,
    }, {
        id: "university", icon: "mooc", text: "Highlight Universities",
        where: `type = 'university'`, highlightName: HL_SCHOOLS.name!,
    }, {
        id: "school", icon: "education", text: "Highlight Schools",
        where: `type = 'school'`, highlightName: HL_SCHOOLS.name!,
    }, {
        id: "grocery", icon: "shopping-cart", text: "Highlight Grocery Stores",
        where: `type = 'grocery'`, highlightName: HL_GROCERY.name!,
    }, {
        id: "church", icon: "organization", text: "Highlight Places of Worship",
        where: `type = 'church'`, highlightName: HL_CHURCH.name!,
    }, {
        id: "social_facility", icon: "home", text: "Highlight Community Centers",
        where: `type = 'social_facility'`, highlightName: HL_MED.name!,
    },
];


// COMPONENT CLASS 
export const TAG = "map-window";
export class MapWindow extends HTMLElement {
    private arcgisMap!: HTMLArcgisMapElement;
    
    // HIGHLIGHT SETTING NAMES MAPPED TO HIGHLIGHT HANDLERS
    private highlightHandles: Map<string, __esri.Handle> = new Map();
    
    // UNNAMED FEATURE LAYER METAS
    private layers: FeatureLayerMeta[];

    // NAMED FEATURE LAYER METAS
    private BUS_META: FeatureLayerMeta;
    private LINES_META: FeatureLayerMeta;
    private PLACE_META: FeatureLayerMeta;

    // NAMED FEATURE LAYERS
    private busStopsLayer!: FeatureLayer;
    private placesLayer!: FeatureLayer;

    // ROUTE FILTER ASSETS
    private routesData: any[] = [];
    private routePanel!: HTMLElement;
    private routeInfoPanel!: HTMLCalcitePanelElement;

    // ACTION BAR PANELS
    // private ACTBAR_PANELS: Map<HTMLCalcitePanelElement, string>;
    private legendPanel!: HTMLCalcitePanelElement;
    private layerListPanel!: HTMLCalcitePanelElement;
    private basemapPanel!: HTMLCalcitePanelElement;
    private printPanel!: HTMLCalcitePanelElement;

    // ACTIONS FOR TOGGLE BAR
    private TOGGLE_ACTIONS: toggleAction[];
    
    // CONSTRUCTOR 
    public constructor() {
        super();
        
        // BUILD DYNAMIC FEATURE LAYER METAS
        this.BUS_META = makeBusStopsLayer(
            (route) => { this.filterByRoute(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        this.LINES_META = makeLinesLayer(
            (route) => { this.filterByRoute(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        this.PLACE_META = makePlacesLayer(
            (route) => { this.filterByRoute(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );

        this.TOGGLE_ACTIONS = TOGGLE_ACTIONS;

        // order matters
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            LAYER_CYCLING,
            this.PLACE_META,
            LAYER_AMTRAK,
            this.LINES_META,
            this.BUS_META,
            LAYER_ML_STOPS,
        ];

        const root = this.attachShadow({ mode: "open" });
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
            

            // BUILD FEATURE LAYERS
            for (let i = 0; i < this.layers.length; i++) {
                try {
                    const layer = await this.makeFeatureLayer(this.layers[i]);
                    this.arcgisMap.map?.add(layer, i);
                    if (this.layers[i] === this.BUS_META) {
                        this.busStopsLayer = layer;
                    }
                    if (this.layers[i] === this.PLACE_META) {
                        this.placesLayer = layer;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            // BUILD UTILITY WIDGETS
            this.arcgisMap.appendChild(this.buildZoom());
            this.arcgisMap.appendChild(this.buildSearch());
            
            // SET OBJECT HIGHLIGHT COLORS
            const view = this.arcgisMap.view as __esri.MapView;
            if (view.popup) {
                view.popup.dockOptions = { breakpoint: false };
                view.popup.dockEnabled = true;
            }
            
            view.highlights = HIGHLIGHTS;

            await this.setPanelViews(view, new Map([
                [this.layerListPanel, "arcgis-layer-list"],
                [this.legendPanel, "arcgis-legend"],
                [this.basemapPanel, "arcgis-basemap-gallery"],
                [this.printPanel, "arcgis-print"],
            ]));

            // BUILD ROUTE SELECTOR
            await this.populateRouteSelect();

            // ADD LISTENER ON ZOOM AMOUNT, RE RENDER FEATURES AT SPECIFIC POINTS
            this.renderOnZoom();

        }, { once: true });

        return this.arcgisMap;
    }

    private async setPanelViews(view: __esri.MapView, panelEls: Map<HTMLCalcitePanelElement, string>) {
        for (const [k, v] of panelEls) {
            await customElements.whenDefined(v);
            (k.querySelector(v) as any).view = view;
        }
    }
    // WATCH VIEW ZOOM, RERENDER FEATURES ACCORDINGLY
    private renderOnZoom() {
        this.arcgisMap.view.watch("zoom", (zoom) => {
            // console.log("zoom: ", zoom);
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
    // BUILD A FEATURE LAYER FROM FeatureLayerMeta
    private async makeFeatureLayer(meta: FeatureLayerMeta): Promise<FeatureLayer> {
        try {
            if (meta.dataUrl) {
                const res = await fetch(meta.dataUrl);
                const data = await res.json();
                meta.source = this.buildGraphics(meta, data);
            } else {
                throw new Error(`no data source for ${meta.title} layer`);
            }
        } catch (e) {
            throw new Error(`failed to create feature layer: ${e}`);
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
    private buildGraphics(meta: FeatureLayerMeta, data: any): Graphic[] {
        if (meta.toGraphics) {
            return meta.toGraphics(data);
        } else {
            if (!data?.features?.length) {
                throw new Error(`layer "${meta.title}" expected data.features[]`);
            }
            return data.features.map((f: any) => new Graphic({
                geometry: new Polygon({
                    rings: f.geometry.rings,
                    spatialReference: { wkid: STLWKID },
                }),
                attributes: f.attributes,
            }));
        }
    }
    // BUILD CALCITE ACTION BAR WITH TOGGLE BUTTONS FOR HIGHLIGHTING FEATURES
    private buildToggleBar(): HTMLCalciteActionBarElement {
        const actionBar = document.createElement("calcite-action-bar") as any;
        actionBar.layout = "vertical";
        actionBar.classList.add("place_toggles");

        for (const a of this.TOGGLE_ACTIONS) {
            actionBar.appendChild(this.buildToggleBtn(a));
        }

        // BUILD AND APPEND RESET BUTTONS (BUS AND PLACES HIGHIGHTS)
        actionBar.appendChild(this.resetPlacesHighlight(actionBar));
        actionBar.appendChild(this.resetBusRoutesBtn());

        return actionBar;
    }
    private buildToggleBtn(a: toggleAction): HTMLCalciteActionElement {
        const action = document.createElement("calcite-action");
        action.dataset.actionId = a.id;
        action.icon = a.icon;
        action.text = a.text;
        action.addEventListener("click", async () => {
            if (action.active) {
                action.active = false;
                this.highlightHandles.get(a.id)?.remove();
                this.highlightHandles.delete(a.id);
                return;
            }
            action.active = true;
            await this.highlightFeatures(this.placesLayer, a.where, a.id, a.highlightName);
        });
        return action;
    }
    // HIGHLIGHT SPECIFIC FEATURES BASED ON whereClause
    private async highlightFeatures(
        layer: FeatureLayer, whereClause: string, id: string, highlight: string
    ): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;
        const result = await layer.queryFeatures({
            where: whereClause,
            returnGeometry: true,
            outSpatialReference: { wkid: STLWKID },
        });

        if (result.features.length) {
            const objIds = result.features.map((f: any) => f.attributes.ObjectID);
            this.highlightHandles.set(id, layerView.highlight(objIds, {name: highlight}));
        }
    }
    // REMOVE HIGHLIGHTED PLACES, DESELECT ALL BUTTONS IN TOGGLE PANEL
    private resetPlacesHighlight(actionBar: HTMLCalciteActionBarElement): HTMLCalciteActionElement {
        const btn = document.createElement("calcite-action");
        btn.icon = 'reset';
        btn.text = "Reset Highlighted Places"
        btn.addEventListener("click", async () => {
            this.highlightHandles.forEach(h => h.remove());
            this.highlightHandles.clear();
            actionBar.querySelectorAll("calcite-action").forEach((a: any) => a.active = false)
        })
        return btn;
    }
    // REMOVE ANY FEATURE EFFECTS FROM THE BUS STOP LAYER
    private resetBusRoutesBtn(): HTMLCalciteActionElement {
        const btn = document.createElement("calcite-action");
        btn.icon = 'bus';
        btn.text = "Reset Highlighted Bus Stops"
        btn.addEventListener("click", async () => {
            const busLayerView = await this.arcgisMap.view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;
            busLayerView.featureEffect = null;
        })
        return btn;
    }
    // BUILD CALCITE ACTION BAR, ACTIONS DISPLAY CALCITE PANELS
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
            actionBar.appendChild(this.buildActionBtn(a as toggleAction, actionBar));
        }
        actionBar.appendChild(this.buildFsBtn())
        return actionBar;
    }
    private buildActionBtn(a: toggleAction, actionBar: HTMLCalciteActionBarElement): HTMLCalciteActionElement {
        const action = document.createElement("calcite-action");
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
        return action;
    }
    // SHOW/HIDE CALCITE PANELS FROM THE ACTION BAR
    private togglePanel(id: string, actionBar: any, panels: Record<string, HTMLElement>): void {
        actionBar.querySelectorAll("calcite-action").forEach((a: any) => {
            a.active = a.dataset.actionId === id ? !a.active : false;
        });
        Object.entries(panels).forEach(([key, panel]: [string, any]) => {
            panel.hidden = key !== id || !actionBar.querySelector(`[data-action-id="${id}"]`).active;
        });
    }
    // BUILD FULL SCREEN ACTION BUTTON
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
    // BUILD A CALCITE SELECT TO FILTER BY BUS ROUTE
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
        const panel = buildCalcitePanel("arcgis-basemap-gallery", "Basemaps")
        // const panel = buildCalcitePanel("arcgis-basemap-gallery", "Basemaps", new LocalBasemapsSource({
        //     basemaps: [
        //         Basemap.fromId("dark-gray")!, Basemap.fromId("hybrid")!, Basemap.fromId("streets-night-vector")!,
        //         Basemap.fromId("imagery")!, Basemap.fromId("osm")!,
        //     ]
        // }));
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
        this.routeInfoPanel = document.createElement("calcite-panel");
        this.routeInfoPanel.classList.add("route-info");
        this.routeInfoPanel.heading = "Route Info";
        this.routeInfoPanel.hidden = true;
        this.routeInfoPanel.closable = true;
        this.routeInfoPanel.addEventListener("calcitePanelClose", () => {
            this.routeInfoPanel.hidden = true;
        });
        return this.routeInfoPanel;
    }
    private showRouteInfo(route: string): void {
        if (!route) {
            this.routeInfoPanel.hidden = true;
            return;
        }

        const feature = this.routesData.find((f: any) => f.properties.route_desc === route);
        if (!feature) return;

        const props = feature.properties;
        this.routeInfoPanel.querySelectorAll("calcite-block")?.forEach((t) => t.remove());
        this.routeInfoPanel.heading = `${route}: ${props.stops_total} stops`;
        this.routeInfoPanel.closed = false;
        this.routeInfoPanel.closable = true;

        // const freqTbl = this.buildFreqTable(props);
        const freqTbl = buildCalciteTableBlock(
            "Frequency (minutes)", props, false, true, this.buildFreqTable,
            `Frequencies were derived by
            taking the mode of the
            difference in start times 
            between two consecutive trips. 
            Frequencies may differ during 
            early/late hours.` 
        );
        this.routeInfoPanel.appendChild(freqTbl);

        const accessTbl = buildCalciteTableBlock(
            "Stops w/ access to", props, true, false, this.buildPropsTable,
            `A stop 'has access'
            to amenities within
            805 meters (~1/2 mile).`,
        );
        this.routeInfoPanel.appendChild(accessTbl);
        this.routeInfoPanel.hidden = false;
    }
    private buildFreqTable(props: any): HTMLCalciteTableElement {
        const tbl = document.createElement("calcite-table");

        const hdg = Object.assign(document.createElement("calcite-table-row"), { slot: "table-header" });
        const h1 = Object.assign(document.createElement("calcite-table-header"), { heading: "Weekday" });
        const h2 = Object.assign(document.createElement("calcite-table-header"), { heading: "Saturday" });
        const h3 = Object.assign(document.createElement("calcite-table-header"), { heading: "Sunday" });
        hdg.append(h1, h2, h3);
        tbl.appendChild(hdg);
        
        const row = document.createElement("calcite-table-row");
        for (const f of [props.freq_wk, props.freq_sa, props.freq_su]) {
            row.appendChild(Object.assign(document.createElement("calcite-table-cell"), { innerText: f ?? 'NA' }));
        }
        tbl.appendChild(row);
        return tbl;
    }
    private buildPropsTable(props: any): HTMLCalciteTableElement {
        const tbl = document.createElement("calcite-table");
        
        // add the key as the first table cell and the val as the second
        for (const [key, val] of Object.entries(props as any)) {
            // exclusions
            if (!key.includes("_access_")) continue;
            if ((!key.toLowerCase().includes("amenity")) && String(val) === "false") continue;
            
            const row = document.createElement("calcite-table-row");
            const keyCell = document.createElement("calcite-table-cell");
            const valCell = document.createElement("calcite-table-cell");
            
            // last string after last _
            const keyVal = key.split("_").at(-1);

            keyCell.innerText = `${String(keyVal).charAt(0).toUpperCase()}${String(keyVal).slice(1)}`;
            valCell.innerText = String(val) ?? 'NA';

            row.append(keyCell, valCell);
            tbl.appendChild(row);
        }
        return tbl;
    }
    // BUILD SELECT LIST OF ALL BUS ROUTES
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
    // HIGHLIGHT ALL STOPS IN A BUS ROUTE
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
    // HIGHLIGHT ALL STOPS FROM SEVERAL BUS ROUTES
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
    private addStyling(): HTMLStyleElement {
        return Object.assign(document.createElement("style"), { textContent: STYLE });
    }
}

const STYLE = `
:host {
    display: block;
    width: 100%;
    min-height: 0;
    height: 100%;
    --popup-bg: rgba(115, 128, 137, 0.75);
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
    background0color: rgba(125, 140, 151, 0.5);
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
calcite-notice {
    width: 100%;
    max-width: 100%;
}
calcite-notice > div {
    width: 100%;
    max-width: 100%;
}
`;