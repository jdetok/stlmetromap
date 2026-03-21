
import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-print";
import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-select";
import "@esri/calcite-components/dist/components/calcite-option";
import "@esri/calcite-components/dist/components/calcite-table";
import "@esri/calcite-components/dist/components/calcite-table-header";
import "@esri/calcite-components/dist/components/calcite-table-row";
import "@esri/calcite-components/dist/components/calcite-slider";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-table-cell";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { STLCOORDS, PROJID, BASEMAP } from "../data.js";
import { STYLE, MAP_STYLE } from "./styleshadow.js";
import { newHighlightSetting, queryLayer, updateRenderedSizes } from "../arcgis.js";
import { buildCalciteAction, buildCalcitePanel, buildCalciteSliderBlock, buildCalciteTableBlock, calciteActionProps } from "../calcite.js";
import {
    FeatureLayerMeta, makeBusStopsLayer, makeMetroLinkLayer, makeLinesLayer, makePlacesLayer, LAYER_ML_STOPS, LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS, LAYER_CYCLING, LAYER_AMTRAK, BUS_STOP_SIZE,
} from "../layers.js";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";

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

const TOGGLE_ACTIONS: calciteActionProps[] = [
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
// TOGGLE BUTTONS FOR CLEARING HIGHLIGHTED PLACES/BUS STOPS
const CLEAR_PLACES = { id: "reset", icon: "reset", text: "Clear Highlighted Places" };
const CLEAR_BUSES = { id: "bus_reset", icon: "bus", text: "Clear Highlighted Bus Stops" };

// ACTION BAR WITH PANELS/UTILITIES
const MAIN_ACTIONS: calciteActionProps[] = [
    { id: "legend", icon: "legend", text: "Legend" },
    { id: "sliders", icon: "sliders", text: "Appearance Sliders" },
    { id: "layers", icon: "layers", text: "Toggle Layers" },
    { id: "basemaps", icon: "basemap", text: "Basemaps" },
    { id: "print", icon: "print", text: "Export" },
];
// REQUEST FULL SCREEN
const FULLSCREEN = { id: "fs", icon: "extent", text: "Fullscreen" };

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
    private METRO_META: FeatureLayerMeta;
    private LINES_META: FeatureLayerMeta;
    private PLACE_META: FeatureLayerMeta;

    // NAMED FEATURE LAYERS
    private busStopsLayer!: FeatureLayer;
    private metroStopsLayer!: FeatureLayer;
    private linesLayer!: FeatureLayer;
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
    private slidersPanel!: HTMLCalcitePanelElement;

    private actionBar!: HTMLCalciteActionBarElement;
    private toggleBar!: HTMLCalciteActionBarElement;

    // ACTIONS FOR TOGGLE BAR
    private TOGGLE_ACTIONS: calciteActionProps[];

    // LINES SLIDER
    private baseLineWidths: number[] = [];
    private lineSizeSliderBlock!: HTMLCalciteBlockElement;
    private lineSizeSlider!: HTMLCalciteSliderElement;
    
    private busStopSizes: number[] = [];
    private metroStopSizes: number[] = [];
    private busStopSliderBlock!: HTMLCalciteBlockElement;
    private metroStopSliderBlock!: HTMLCalciteBlockElement;
    private busStopSizeSlider!: HTMLCalciteSliderElement;
    private metroStopSizeSlider!: HTMLCalciteSliderElement;

    // CONSTRUCTOR
    public constructor() {
        super();
        
        // BUILD DYNAMIC FEATURE LAYER METAS
        this.BUS_META = makeBusStopsLayer(
            (route) => { this.filterByRoutes(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        this.METRO_META = makeMetroLinkLayer(
            (route) => { this.filterByRoutes(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        this.LINES_META = makeLinesLayer(
            (route) => { this.filterByRoutes(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );
        this.PLACE_META = makePlacesLayer(
            (route) => { this.filterByRoutes(route); this.showRouteInfo(route); },
            (routes) => { this.filterByRoutes(routes);  },
        );

        this.TOGGLE_ACTIONS = TOGGLE_ACTIONS;

        // order matters
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            LAYER_CYCLING,
            this.PLACE_META,
            this.LINES_META,
            LAYER_AMTRAK,
            this.BUS_META,
            this.METRO_META,
        ];

        const toggleBar = this.buildToggleBar();
        const actBar = this.buildMainActionBar();
        
        const root = this.attachShadow({ mode: "open" });
        root.append(
            this.addStyling(),
            this.buildMap(),
            this.buildLayerListPanel(),
            this.buildLegendPanel(),
            this.buildPrintPanel(),
            this.buildBasemapPanel(),
            this.buildSlidersPanel(),
            toggleBar.bar,
            actBar.bar,
            this.buildRoutesFilter(),
            this.buildRouteInfoPanel(),
            ...actBar.tooltips,
            ...toggleBar.tooltips,
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
            spatialReference: {wkid: PROJID}
        } as __esri.Extent

        this.arcgisMap.addEventListener("arcgisViewReadyChange", async () => {
            const popupStyle = document.createElement("style");
            popupStyle.textContent = MAP_STYLE;
            this.arcgisMap.shadowRoot?.appendChild(popupStyle);

            // BUILD FEATURE LAYERS
            for (let i = 0; i < this.layers.length; i++) {
                try {
                    const layer = await this.makeFeatureLayer(this.layers[i]);
                    this.arcgisMap.map?.add(layer, i);
                    switch (this.layers[i]) {
                        case this.BUS_META: {
                            this.busStopsLayer = layer;
                            if (this.busStopsLayer.renderer) {
                                const sizeVar = (this.busStopsLayer.renderer as UniqueValueRenderer).visualVariables![0] as __esri.SizeVariable;
                                this.busStopSizes = sizeVar.stops!.map(s => (s as __esri.SizeStop).size as number);
                            }
                            break;
                        }
                        case this.METRO_META: {
                            this.metroStopsLayer = layer;
                            if (this.metroStopsLayer.renderer) {
                                const sizeVar = (this.metroStopsLayer.renderer as UniqueValueRenderer).visualVariables![0] as __esri.SizeVariable;
                                this.metroStopSizes = sizeVar.stops!.map(s => (s as __esri.SizeStop).size as number);
                            }
                            break;
                        }
                        case this.PLACE_META: {
                            this.placesLayer = layer;
                            break;
                        }
                        case this.LINES_META: {
                            this.linesLayer = layer;
                            this.baseLineWidths = (this.linesLayer.renderer as ClassBreaksRenderer).classBreakInfos.map((cb) => {
                                return (cb.symbol as SimpleLineSymbol).width;
                            });
                            break;
                        }
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
                // [this.slidersPanel, "calcite-panel"],
            ]));

            // BUILD ROUTE SELECTOR
            await this.populateRouteSelect();

            // ADD LISTENER ON ZOOM AMOUNT, RE RENDER FEATURES AT SPECIFIC POINTS
            // this.renderOnZoom();

            // open legend when bus stop layer has been created
            this.busStopsLayer.when(() => {
                if (this.arcgisMap.offsetWidth > 800) this.togglePanel('legend', this.actionBar, { legend: this.legendPanel })
            });
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
            spatialReference: { wkid: PROJID },
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
                    spatialReference: { wkid: PROJID },
                }),
                attributes: f.attributes,
            }));
        }
    }
    // BUILD CALCITE ACTION BAR WITH TOGGLE BUTTONS FOR HIGHLIGHTING FEATURES
    private buildToggleBar(): { bar: HTMLCalciteActionBarElement, tooltips: HTMLCalciteTooltipElement[] } {
        const actionBar = document.createElement("calcite-action-bar");
        actionBar.layout = "horizontal";
        actionBar.classList.add("place_toggles");
        let tooltips: HTMLCalciteTooltipElement[] = [];

        for (const a of this.TOGGLE_ACTIONS) {
            // const { action, tooltip } = this.buildToggleBtn(a);
            const { action, tooltip } = buildCalciteAction({
                ...a,
                tooltipProps: { text: a.text },
                onClick: async () => { 
                        this.togglePlacesHighlight(action, a);
                }
            })
            actionBar.appendChild(action);
            if (tooltip) {
                tooltips.push(tooltip);
            }
        }

        const clearPlaces = CLEAR_PLACES;
        const { action: resetPlaces, tooltip: t1 } = buildCalciteAction({
            ...clearPlaces,
            tooltipProps: { text: clearPlaces.text },
            onClick: async () => this.clearHighlighted(actionBar),
        })
        const clearBuses = CLEAR_BUSES;
        const { action: resetBuses, tooltip: t2 } = buildCalciteAction({
            ...clearBuses,
            tooltipProps: { text: clearBuses.text },
            onClick: async () => await this.clearBusStops(),
        })
        actionBar.append(resetPlaces, resetBuses);
        if (t1) tooltips.push(t1);
        if (t2) tooltips.push(t2);

        this.toggleBar = actionBar;
        return { bar: actionBar, tooltips: tooltips };
    }
    private async togglePlacesHighlight(action: HTMLCalciteActionElement, props: calciteActionProps) {
        if (action.active) {
            action.active = false;
            this.highlightHandles.get(props.id)?.remove();
            this.highlightHandles.delete(props.id);
            return;
        }
        action.active = true;
        await this.highlightFeatures(this.placesLayer, props.where ?? '1=1', props.id, props.highlightName ?? 'default');
    }
    // HIGHLIGHT SPECIFIC FEATURES BASED ON whereClause
    private async highlightFeatures(
        layer: FeatureLayer, whereClause: string, id: string, highlight: string
    ): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;

        const result = await layer.queryFeatures({
            where: whereClause,
            returnGeometry: true,
            outSpatialReference: { wkid: PROJID },
        });

        if (result.features.length) {
            const objIds = result.features.map((f: any) => f.attributes.ObjectID);
            this.highlightHandles.set(id, layerView.highlight(objIds, {name: highlight}));
        }
    }
    // REMOVE HIGHLIGHTED PLACES, DESELECT ALL BUTTONS IN TOGGLE PANEL
    private clearHighlighted(actionBar: HTMLCalciteActionBarElement) {
        this.highlightHandles.forEach(h => h.remove());
        this.highlightHandles.clear();
        actionBar.querySelectorAll("calcite-action").forEach((a: any) => a.active = false);
    }
    private async clearBusStops() {
        const layers = [this.busStopsLayer, this.metroStopsLayer, this.linesLayer];
        layers.forEach(async (layer) => {
            const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;
            layerView.featureEffect = null;
        })
    }
    // BUILD CALCITE ACTION BAR, ACTIONS DISPLAY CALCITE PANELS
    private buildMainActionBar(): { bar: HTMLCalciteActionBarElement, tooltips: HTMLCalciteTooltipElement[] } {
        const actionBar = document.createElement("calcite-action-bar");
        actionBar.layout = "horizontal";

        let tooltips: HTMLCalciteTooltipElement[] = [];

        for (const a of MAIN_ACTIONS) {
            const { action, tooltip } = buildCalciteAction({
                ...a,
                tooltipProps: { text: a.text },
                onClick: async () => this.togglePanel(a.id, actionBar, {
                    layers: this.layerListPanel,
                    legend: this.legendPanel,
                    basemaps: this.basemapPanel,
                    print: this.printPanel,
                    sliders: this.slidersPanel,
                })
            });
            actionBar.append(action);
            if (tooltip) {
                tooltips.push(tooltip);
            }
        }
        // build fs action
        const { action: fsAction, tooltip: fsTtip } = buildCalciteAction({
            ...FULLSCREEN,
            tooltipProps: { text: FULLSCREEN.text },
            onClick: async () => {
                if (!document.fullscreenElement) {
                    this.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
        });
        actionBar.append(fsAction);
        if (fsTtip) tooltips.push(fsTtip);

        this.actionBar = actionBar;

        return {bar: actionBar, tooltips};
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
    // BUILD A CALCITE SELECT TO FILTER BY BUS ROUTE
    private buildRoutesFilter(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.id = "filterbar";

        const select = document.createElement("calcite-select") as any;
        select.label = "Route";
        select.id = "route-select";
        select.addEventListener("calciteSelectChange", () => {
            this.filterByRoutes(select.value);
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
        this.basemapPanel = panel;
        return panel;
    }
    private buildSlidersPanel(): HTMLCalcitePanelElement {
        const panel = document.createElement("calcite-panel");
        panel.heading = 'Sliders';
        panel.hidden = true; panel.classList.add('action-panel');
        panel.append(
            this.buildLineWidthSlider(),
            this.buildBusStopSizeSlider(),
            this.buildMetroStopSizeSlider()
        );
        this.slidersPanel = panel;
        return panel;
    }
        private buildLineWidthSlider(): HTMLCalciteBlockElement {
        const { block, slider} = buildCalciteSliderBlock({
            heading: 'Route Line Width',
            onInput: async () => {
                this.linesLayer.renderer = updateRenderedSizes(
                    (this.linesLayer.renderer as ClassBreaksRenderer),
                    this.baseLineWidths,
                    this.lineSizeSlider.value as number,
                ).clone();
            },
            sliderProps: {
                min: 0.25,   
                max: 15,
                step: 0.25,
                value: 1,
                snap: true 
            },
        });
        this.lineSizeSliderBlock = block;
        this.lineSizeSlider = slider;
        return this.lineSizeSliderBlock;
    }
    private buildBusStopSizeSlider(): HTMLCalciteBlockElement {
        const { block, slider} = buildCalciteSliderBlock({
            heading: 'MetroBus Stop Size',
            onInput: async () => {
                this.busStopsLayer.renderer = updateRenderedSizes(
                    (this.busStopsLayer.renderer as UniqueValueRenderer),
                    this.busStopSizes,
                    this.busStopSizeSlider.value as number,
                ).clone();
            },
            sliderProps: {
                min: 0.1,   
                max: 3,
                step: 0.1,
                value: 1,
                snap: true 
            },
        });
        this.busStopSliderBlock = block;
        this.busStopSizeSlider = slider;
        return this.busStopSliderBlock;
    }
    private buildMetroStopSizeSlider(): HTMLCalciteBlockElement {
        const { block, slider} = buildCalciteSliderBlock({
            heading: 'MetroLink Stop Size',
            onInput: async () => {
                this.metroStopsLayer.renderer = updateRenderedSizes(
                    (this.metroStopsLayer.renderer as UniqueValueRenderer),
                    this.metroStopSizes,
                    this.metroStopSizeSlider.value as number,
                ).clone();
            },
            sliderProps: {
                min: 0.1,   
                max: 3,
                step: 0.1,
                value: 1,
                snap: true 
            },
        });
        this.metroStopSliderBlock = block;
        this.metroStopSizeSlider = slider;
        return this.metroStopSliderBlock;
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
    // HIGHLIGHT ALL STOPS FROM SEVERAL BUS ROUTES
    private async filterByRoutes(routeNames: string | string[]): Promise<void> {
        const routes = Array.isArray(routeNames) ? routeNames : [routeNames];
        
        // ORDER MATTERS (lines layer needs to be last)
        const layers = [
            this.busStopsLayer,
            this.metroStopsLayer,
            this.linesLayer
        ];

        // stops layers use route_names field, lines layer uses route_desc field. build separate queries for each
        let whereStop: string;
        let whereLine: string;
        if (routeNames.length > 1) {
            whereStop = (routes as string[]).map(r => `route_names like '%${r}%'`).join(" or ");
            if (routes.some(r => r.includes("MetroLink"))) {
                // lines layer stores metro routes as "MetroLink Red Line" rather than "MLR-MetroLink Red Line"
                whereLine = (routes as string[]).map(r => `route_desc like '%${r.substring(4)}%'`).join(" or ");
                console.log(whereLine)
            } else {
                whereLine = (routes as string[]).map(r => `route_desc like '%${r}%'`).join(" or ");
            }
        } else {
            whereStop = `route_names like '%${routeNames[0]}%'`;
            whereLine = `route_desc like '%${routeNames[0]}%'`;
        }

        // add the feature effect for each layer
        layers.forEach(async (layer: FeatureLayer, i: number) => {
            const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;

            // if (!routeNames) {
            //     layerView.featureEffect = null;
            //     return;
            // }

            layerView.featureEffect = new FeatureEffect({
                filter: new FeatureFilter({ where: i < (layers.length - 1) ? whereStop : whereLine }),
                includedEffect: "bloom(1, 1px, 0.3) drop-shadow(2px 2px 4px black) brightness(2)",
                excludedEffect: "opacity(60%) brightness(1)"
            });
        })
        
        // query just the lines and move the map there
        const res = await queryLayer(this.linesLayer, whereLine);
        if (res.features.length) {
            await this.arcgisMap.view.goTo(res.features, { duration: 600 });
        }
    }
    private buildZoom(): HTMLArcgisZoomElement {
        return document.createElement("arcgis-zoom");
    }
    private buildSearch(): HTMLArcgisSearchElement {
        const search = document.createElement("arcgis-search");
        search.view = this.arcgisMap.view;
        return search;
    }
    private addStyling(): HTMLStyleElement {
        return Object.assign(document.createElement("style"), { textContent: STYLE });
    }
}