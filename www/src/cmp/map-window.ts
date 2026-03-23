// cmp/map-window.ts
// Interactive map custom element definition
// Imports generic helpers from calcite.ts and arcgis.ts for buildng specific elements of the map

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
import Circle from "@arcgis/core/geometry/Circle";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { STLCOORDS, PROJID, BASEMAP } from "../data.js";
import { STYLE, MAP_STYLE } from "./styleshadow.js";
import { newHighlightSetting, queryLayer, updateRenderedSizes } from "../arcgis.js";
import {
    buildCalciteAction, buildCalcitePanel, buildCalciteSliderBlock, buildCalciteTableBlock, calciteActionProps,
    buildCalciteLegendPanel,buildCalciteSelect, buildCalciteCombobox,
    buildCalciteTable,
    buildCalciteActionBar,
    buildCalciteDropdown,
 } from "../calcite.js";
import {
    FeatureLayerMeta, makeBusStopsLayer, makeMetroLinkLayer, makeLinesLayer, makePlacesLayer, LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS, LAYER_CYCLING, LAYER_AMTRAK, BUS_STOP_SIZE,
} from "../layers.js";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import Point from "@arcgis/core/geometry/Point.js";

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

type actbarWithTooltips = { bar: HTMLCalciteActionBarElement, tooltips: HTMLCalciteTooltipElement[] };

// ACTION CONFIGS FOR THE TOGGLE BAR. EACH RENDERS INTO A BUTTON WITH A BUTTON TO HIGHLIGHT FEATURES
// RETURNED FROM THE WHERE STRING
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
const CLEAR_BUSES = { id: "bus_reset", icon: "bus", text: "Clear Highlighted Transit Stops" };

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

    // NAMED FEATURE LAYER METAS
    private BUS_META: FeatureLayerMeta = {} as FeatureLayerMeta;
    private METRO_META: FeatureLayerMeta = {} as FeatureLayerMeta;
    private LINES_META: FeatureLayerMeta = {} as FeatureLayerMeta;
    private PLACE_META: FeatureLayerMeta = {} as FeatureLayerMeta;
    
    // init helper builds the named types with the imported func from layers.ts
    private namedLayerMetas: Array<[string, Function]> = [
        ['BUS_META', makeBusStopsLayer],
        ['METRO_META', makeMetroLinkLayer],
        ['LINES_META', makeLinesLayer],
        ['PLACE_META', makePlacesLayer],
    ];

    // ARRAY OF BUILT FEATURE LAYER METAS (makeFeatureLayer builds these as FeatureLayers)
    private layers: FeatureLayerMeta[] = [];
    private builtLayers: FeatureLayer[] = [];

    // NAMED FEATURE LAYERS
    private busStopsLayer: FeatureLayer = new FeatureLayer;
    private metroStopsLayer: FeatureLayer = new FeatureLayer;
    private linesLayer: FeatureLayer = new FeatureLayer;
    private placesLayer: FeatureLayer = new FeatureLayer;
    private cyclingLayer: FeatureLayer = new FeatureLayer;
    private countiesLayer: FeatureLayer = new FeatureLayer;
    private tractsLayer: FeatureLayer = new FeatureLayer;
    private amtrakLayer: FeatureLayer = new FeatureLayer;

    // ROUTE FILTER SELECTOR
    private routesData: any[] = [];
    private routeSelect!: HTMLCalciteSelectElement;
    private routeCombobox!: HTMLCalciteDropdownElement;
    private routeInfoPanel!: HTMLCalcitePanelElement;

    // ACTION BAR PANELS
    private legendPanel!: HTMLCalcitePanelElement;
    private layerListPanel!: HTMLCalcitePanelElement;
    private basemapPanel!: HTMLCalcitePanelElement;
    private printPanel!: HTMLCalcitePanelElement;
    private slidersPanel!: HTMLCalcitePanelElement;

    // ACTION BARS
    private actionBar!: HTMLCalciteActionBarElement;
    private toggleBar!: HTMLCalciteActionBarElement;

    // ACTIONS FOR TOGGLE BAR
    private TOGGLE_ACTIONS: calciteActionProps[] = TOGGLE_ACTIONS;

    // ARRAYS OF FEATURE SIZES FOR SLIDERS
    private busStopSizes: number[] = [];
    private metroStopSizes: number[] = [];
    private lineSizes: number[] = [];

    // BLOCKS TO CONTAIN SLIDERS
    private busStopSliderBlock!: HTMLCalciteBlockElement;
    private metroStopSliderBlock!: HTMLCalciteBlockElement;
    private lineSizeSliderBlock!: HTMLCalciteBlockElement;

    // SLIDER ELEMENTS
    private busStopSizeSlider!: HTMLCalciteSliderElement;
    private metroStopSizeSlider!: HTMLCalciteSliderElement;
    private lineSizeSlider!: HTMLCalciteSliderElement;

    private radiusGraphic: Graphic | null = null;
    private circleMeters: number | null = null;

    // append all tooltips to this array, append to shadow root at once
    private tooltips: HTMLCalciteTooltipElement[] = []; 

    // CONSTRUCTOR
    public constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });

        // build feature layer metas imported as functions
        this.initLayerMetas();

        // layers render in order (first element is bottom, last is top)
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            LAYER_CYCLING,
            LAYER_AMTRAK,
            this.PLACE_META,
            this.LINES_META,
            this.BUS_META,
            this.METRO_META,
        ];
        
        // build all action bars (in this)
        this.initActionBars([
            ['toggleBar', this.buildToggleBar.bind(this)],
            ['actionBar', this.buildMainActionBar.bind(this)]
        ]);
        // this.resizeRender();
        window.addEventListener('resize', () => {
            const isWide = this.offsetWidth >= 900;
            const newLayout = isWide ? 'horizontal' : 'vertical';
            
            if (this.toggleBar?.layout !== newLayout) {
                this.toggleBar.layout = newLayout;
            }
            if (this.actionBar?.layout !== newLayout) {
                this.actionBar.layout = newLayout;
            }
        });
        
        // build and append all elements to shadow dom
        root.append(
            this.addStyling(),
            this.buildMap(),
            this.buildLayerListPanel(),
            this.buildLegendPanel(),
            this.buildPrintPanel(),
            this.buildBasemapPanel(),
            this.buildSlidersPanel(),
            this.buildRouteInfoPanel(),
            this.toggleBar,
            this.actionBar,
            ...this.tooltips,
        );
    }
    // build sections requiring async
    async connectedCallback(): Promise<void> {
        this.routeCombobox = await this.buildRoutesFilter();
        this.shadowRoot?.append(this.routeCombobox);
    }
    disconnectedCallback(): void {
        this.arcgisMap?.remove();
    }
    // build layer metas imported as funcs from layers.ts
    private initLayerMetas(): void {
        for (const [meta, fn] of this.namedLayerMetas) {
            this[meta] = fn(
                (route: string | string[]) => { this.filterByRoutes(route); this.showRouteInfo(route as string); },
                (routes: string | string[]) => { this.filterByRoutes(routes); this.routeInfoPanel.closed = true; }
                
            );
        }
    }
    // set the action bar keys (have to be defined in this) with their associated function
    private initActionBars(meta: Array<[string, () => actbarWithTooltips]>): void {
        for (const [bar, fn] of meta) {
            const actBar = fn();
            this[bar] = actBar.bar;
            this.tooltips.push(...actBar.tooltips);
        }
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
            this.arcgisMap.shadowRoot?.append(popupStyle);

            // BUILD FEATURE LAYERS
            this.builtLayers = await this.buildFeatureLayers();
            console.log(`%clayer metas: ${this.layers.length} | built layers: ${this.builtLayers.length}`,
                'color: seagreen; font-weight: 600;'
            );

            // BUILD UTILITY WIDGETS
            this.arcgisMap.append(this.buildZoom(), this.buildSearch());
            
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

            // ADD LISTENER ON ZOOM AMOUNT, RE RENDER FEATURES AT SPECIFIC POINTS
            // this.renderOnZoom();
            view.on("click", async (event) => {
                console.log("clicked view");
                const point = event.mapPoint;

                if (this.radiusGraphic) {
                    view.graphics.remove(this.radiusGraphic);
                }
                this.circleMeters = 805;

                const circle = new Circle({
                    center: point,
                    radius: this.circleMeters,
                    radiusUnit: 'meters',
                });
                this.radiusGraphic = new Graphic({
                    geometry: circle,
                    symbol: new SimpleFillSymbol({
                        color: [255, 255, 255, 0.05],
                        outline: {
                            color: [255, 255, 255, 0.5],
                            width: 1.5,
                            style: 'dash',
                        }
                    })
                })
                view.graphics.add(this.radiusGraphic);

                // await this.highlightStopsWithinMeters(view, point, this.circleMeters); 
            });
            // open legend when bus stop layer has been created
            this.busStopsLayer.when(async () => {
                
                if (this.arcgisMap.offsetWidth > 800) this.togglePanel('legend', this.actionBar, { legend: this.legendPanel });
            });
            
        }, { once: true });

        return this.arcgisMap;
    }
    private async highlightStopsWithinMeters(view: __esri.MapView, point: Point, meters: number, ): Promise<void> {
        const layerView = await view.whenLayerView(this.busStopsLayer);
        const query = Object.assign(this.busStopsLayer.createQuery(), {
            geometry: point,
            distance: meters,
            units: "meters",
        });
        const { features } = await layerView.queryFeatures(query);
        console.log(features);
        this.busStopsLayer.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({objectIds: features.map(f => f.attributes.ObjectID)}),
            includedEffect: "brightness(3)",
            excludedEffect: "brightness(1) opacity(50%)"
        })
    }
    private async buildFeatureLayers(): Promise<FeatureLayer[]> {
        let featureLayers: FeatureLayer[] = [];
        for (let i = 0; i < this.layers.length; i++) {
            try {
                const layer = await this.makeFeatureLayer(this.layers[i]);
                featureLayers.push(layer);
                this.arcgisMap.map?.add(layer, i);

                // assign named layers
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
                    case this.LINES_META: {
                        this.linesLayer = layer;
                        this.lineSizes = (this.linesLayer.renderer as ClassBreaksRenderer).classBreakInfos.map((cb) => {
                            return (cb.symbol as SimpleLineSymbol).width;
                        });
                        break;
                    }
                    case this.PLACE_META: {
                        this.placesLayer = layer;
                        break;
                    }
                    case LAYER_CYCLING: {
                        this.cyclingLayer = layer;
                        break;
                    }    
                    case LAYER_AMTRAK: {
                        this.amtrakLayer = layer;
                        break;
                    }
                    case LAYER_CENSUS_COUNTIES: {
                        this.countiesLayer = layer;
                        break;
                    }
                    case LAYER_CENSUS_TRACTS: {
                        this.tractsLayer = layer;
                        break;
                    }
                }
            } catch (e) {
                throw new Error(`failed to build layer ${i + 1}/${this.layers.length}: ${e}`);
            }
        }
        return featureLayers;
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
            legendEnabled: meta.legendEnabled ?? true,
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
    private buildToggleBar(): actbarWithTooltips {
        const actionBar = buildCalciteActionBar({ layout: window.innerWidth < 900 ? 'vertical' : 'horizontal', cssClass: 'place_toggles' });
        
        let tooltips: HTMLCalciteTooltipElement[] = [];

        for (const a of this.TOGGLE_ACTIONS) {
            const { action, tooltip } = buildCalciteAction({
                ...a,
                tooltipProps: { text: a.text },
                onClick: async () => { 
                        this.togglePlacesHighlight(action, a);
                }
            })
            actionBar.append(action);
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
            onClick: async () => await this.clearStopsFX(),
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
    private async clearStopsFX() {
        const layers = [this.busStopsLayer, this.metroStopsLayer, this.linesLayer];
        layers.forEach(async (layer) => {
            const layerView = await this.arcgisMap.view.whenLayerView(layer) as __esri.FeatureLayerView;
            layerView.featureEffect = null;
        })
    }
    // BUILD CALCITE ACTION BAR, ACTIONS DISPLAY CALCITE PANELS
    private buildMainActionBar(): actbarWithTooltips {
        const actionBar = buildCalciteActionBar({ layout: 'horizontal' });
    
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
    
    private buildLayerListPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel({ elementType: "arcgis-layer-list", heading: "Layers"});
        this.layerListPanel = panel;
        return panel;
    }
    private buildPrintPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel({ elementType: "arcgis-print", heading: "Export" });
        this.printPanel = panel;
        return panel;
    }
    private buildLegendPanel(): HTMLCalcitePanelElement {
        const panel = buildCalciteLegendPanel('Legend');
        this.legendPanel = panel;
        return panel;
    }
    private buildBasemapPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel({ elementType: "arcgis-basemap-gallery", heading: "Basemaps"})
        this.basemapPanel = panel;
        return panel;
    }
    private buildSlidersPanel(): HTMLCalcitePanelElement {
        const panel = buildCalcitePanel({ heading: 'Sliders', cssClass: 'action-panel' });
        panel.append(
            this.buildLineSizeSlider(),
            this.buildBusStopSizeSlider(),
            this.buildMetroStopSizeSlider()
        );
        this.slidersPanel = panel;
        return panel;
    }
    private buildLineSizeSlider(): HTMLCalciteBlockElement {
        const { block, slider} = buildCalciteSliderBlock({
            heading: 'Route Line Width',
            onInput: async () => {
                this.linesLayer.renderer = updateRenderedSizes(
                    (this.linesLayer.renderer as ClassBreaksRenderer),
                    this.lineSizes,
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
    // BUILD A CALCITE SELECT TO FILTER BY BUS ROUTE
    private async buildRoutesFilter(): Promise<HTMLCalciteDropdownElement> {
        const sel = await buildCalciteDropdown({
            heading: "Select MetroBus Routes",
            placeholder: "",
            selectMode: 'multiple',
            icon: "bus",
            onSelChange: (vals: string[]) => {
                this.filterByRoutes(vals);
                this.showRouteInfo(vals[0]);
                if (!vals || vals.length > 1) {
                    this.routeInfoPanel.hidden = true;
                    // this.clearStopsFX();
                }
            },
            optsProps: {
                allOpt: { label: 'All MetroBus Routes', value: 'all' },
                dataUrl: '/layers/routes',
                mapFeatures: (features) => {
                    this.routesData = features;
                    return features.map((f: any) => f.properties.route_desc.replace("'", '')).sort();
                }
            }
        }, true);
        this.routeCombobox = sel;
        return sel;
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

            layerView.featureEffect = new FeatureEffect({
                filter: new FeatureFilter({ where: i < (layers.length - 1) ? whereStop : whereLine }),
                includedEffect: "bloom(1, 1px, 0.3) drop-shadow(2px 2px 4px black) brightness(2)",
                // excludedEffect: "opacity(60%) brightness(1)"
            });
        })
        
        // query just the lines and move the map there
        const res = await queryLayer(this.linesLayer, whereLine);
        if (res.features.length) {
            await this.arcgisMap.view.goTo(res.features, { duration: 600 });
        }
    }
    private buildRouteInfoPanel(): HTMLCalcitePanelElement {
        this.routeInfoPanel = buildCalcitePanel({ heading: 'Route Info', cssClass: 'route-info' }); 
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

        // stop frequency table
        const freqTbl = buildCalciteTableBlock(
            "Frequency (minutes)", props, false, true,
            () => buildCalciteTable({
                hasHeader: true, rows: [
                    ['Weekday', 'Saturday', 'Sunday'],
                    [props.freq_wk, props.freq_sa, props.freq_su],
                ]
            }), `Frequencies were derived by
            taking the mode of the
            difference in start times 
            between two consecutive trips. 
            Frequencies may differ during 
            early/late hours.` 
        );
        this.routeInfoPanel.append(freqTbl);

        // 'access to' table
        const accessTbl = buildCalciteTableBlock(
            "Stops w/ access to", props, true, false, 
            () => {
                const rows: string[][] = [];
                for (const [key, val] of Object.entries(props)) {
                if (!key.includes("_access_")) continue;
                    if ((!key.toLowerCase().includes("amenity")) && String(val) === "false") continue;
                    
                    // last string after last _
                    const keyVal = key.split("_").at(-1);
                    rows.push([`${String(keyVal).charAt(0).toUpperCase()}${String(keyVal).slice(1)}`, String(val) ?? 'NA']);
                }
                return buildCalciteTable({ hasHeader: false, rows });
            }, `A stop 'has access'
            to amenities within
            805 meters (~1/2 mile).`,
        );
        this.routeInfoPanel.append(accessTbl);
        this.routeInfoPanel.hidden = false;
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