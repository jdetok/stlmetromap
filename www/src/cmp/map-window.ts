// cmp/map-window.ts
// Interactive map custom element definition
// Imports generic helpers from calcite.ts and arcgis.ts for buildng specific elements of the map
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils"
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer.js";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Graphic from "@arcgis/core/Graphic";
import Color from "@arcgis/core/Color.js";
import { STYLE, MAP_STYLE } from "./styleshadow.js";
import {
    arcgisMapProps, buildArcgisElement, buildArcgisMap, drawCircle,
    makeChoroplethLevels, queryLayer, updateRenderedSizes, cplethEls
} from "../arcgis.js";
import {
    buildCalciteAction, buildCalcitePanel, buildCalciteSliderBlock, buildCalciteTableBlock, calciteActionProps,
    buildCalciteLegendPanel, buildCalciteTable, buildCalciteActionBar, buildCalciteDropdown,
    buildCalciteSelectBlock,
    calciteOptionProps,
 } from "../calcite.js";
import {
    FeatureLayerMeta, makeBusStopsLayer, makeMetroLinkLayer, makeLinesLayer, makePlacesLayer, LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS, LAYER_CYCLING, LAYER_AMTRAK, TRACT_CLASSBREAKS,
    tractsField,
} from "../layers.js";
import {
    STLCOORDS, PROJID, BASEMAP, TOGGLE_ACTIONS, HIGHLIGHTS,
    CLEAR_BUSES, CLEAR_PLACES, FULLSCREEN, MAIN_ACTIONS
} from "../data.js";

type mapLayer = { fn?: Function, meta: FeatureLayerMeta, layer: FeatureLayer, i: number}
type actbarWithTooltips = { bar: HTMLCalciteActionBarElement, tooltips: HTMLCalciteTooltipElement[] };
type routeLinesData = {
    type: string,
    coordinates: any,
    properties: Record<string, (string | number | boolean)>,
};

// COMPONENT CLASS 
export const TAG = "map-window";
export class MapWindow extends HTMLElement {
    private maxW: number = 980;
    private maxH: number = 980;
    // private arcgisMap!: HTMLArcgisMapElement;
    private mapProps: arcgisMapProps = {
        basemap: BASEMAP,
        extent: STLCOORDS,
        onViewReady: this.onMapViewReady.bind(this),
    }
    private arcgisMap = buildArcgisMap(this.mapProps);

    // ARRAY OF BUILT FEATURE LAYER METAS (makeFeatureLayer builds these as FeatureLayers)
    private builtLayers: FeatureLayer[] = [];

    private mapLayers: Map<string, mapLayer> = new Map([
        ['counties', { meta: LAYER_CENSUS_COUNTIES, layer: new FeatureLayer, i: 0 }],
        ['tracts', { meta: LAYER_CENSUS_TRACTS, layer: new FeatureLayer, i: 1 }],
        ['amtrak', { meta: LAYER_AMTRAK, layer: new FeatureLayer, i: 2 }],
        ['cycling', { meta: LAYER_CYCLING, layer: new FeatureLayer, i: 3 }],
        ['places', { fn: makePlacesLayer, meta: {} as FeatureLayerMeta, layer: new FeatureLayer, i: 4 }],
        ['lines', { fn: makeLinesLayer, meta: {} as FeatureLayerMeta, layer: new FeatureLayer, i: 5 }],
        ['metro', { fn: makeMetroLinkLayer, meta: {} as FeatureLayerMeta, layer: new FeatureLayer, i: 6 }],
        ['bus', { fn: makeBusStopsLayer, meta: {} as FeatureLayerMeta, layer: new FeatureLayer, i: 7 }],
    ]);
    
    // NAMED FEATURE LAYERS
    private get busStopsLayer(): FeatureLayer { return this.mapLayers.get('bus')!.layer }; 
    private get metroStopsLayer(): FeatureLayer { return this.mapLayers.get('metro')!.layer }; 
    private get linesLayer(): FeatureLayer { return this.mapLayers.get('lines')!.layer }; 
    private get placesLayer(): FeatureLayer { return this.mapLayers.get('places')!.layer }; 
    private get tractsLayer(): FeatureLayer { return this.mapLayers.get('tracts')!.layer };
    
    private tractsChoroplethMap: Map<__esri.FieldInfo, cplethEls[]> = TRACT_CLASSBREAKS;
    
    // HIGHLIGHT SETTING NAMES MAPPED TO HIGHLIGHT HANDLERS
    private highlightHandles: Map<string, __esri.Handle> = new Map();
    
    // CALCITE PANELS
    private routeInfoPanel: HTMLCalcitePanelElement = buildCalcitePanel({ heading: 'Route Info', cssClass: 'route-info' }); 
    private legendPanel: HTMLCalcitePanelElement = buildCalciteLegendPanel('Legend');
    private layerListPanel: HTMLCalcitePanelElement = buildCalcitePanel({ elementType: "arcgis-layer-list", heading: "Layers"});
    private basemapPanel: HTMLCalcitePanelElement = buildCalcitePanel({ elementType: "arcgis-basemap-gallery", heading: "Basemaps"});
    private printPanel: HTMLCalcitePanelElement = buildCalcitePanel({ elementType: "arcgis-print", heading: "Export" });
    private slidersPanel: HTMLCalcitePanelElement = buildCalcitePanel({ heading: 'Edit Map Appearance', cssClass: 'action-panel' });

    // skip as val if the panel does get the map view assigned to it
    private actionBarPanels = new Map([
        [this.layerListPanel, "arcgis-layer-list"],
        [this.legendPanel, "arcgis-legend"],
        [this.basemapPanel, "arcgis-basemap-gallery"],
        [this.printPanel, "arcgis-print"],
        [this.slidersPanel, "skip"]
    ]);

    // ACTION BARS
    private actionBar!: HTMLCalciteActionBarElement;
    private toggleBar!: HTMLCalciteActionBarElement;
    private actBarMetas: [string, () => actbarWithTooltips][] = [
        ['toggleBar', this.buildToggleBar.bind(this)],
        ['actionBar', this.buildMainActionBar.bind(this)]
    ];

    // ACTIONS FOR TOGGLE BAR
    private TOGGLE_ACTIONS: calciteActionProps[] = TOGGLE_ACTIONS;

    // ROUTE DROPDOWN
    private routesData: routeLinesData[] = [];
    private routeDropdown!: HTMLCalciteDropdownElement;

    // ARRAYS OF FEATURE SIZES FOR SLIDERS
    private busStopSizes: number[] = [];
    private metroStopSizes: number[] = [];
    private lineSizes: number[] = [];

    // BLOCKS TO CONTAIN SLIDERS
    private busStopSliderBlock!: HTMLCalciteBlockElement;
    private metroStopSliderBlock!: HTMLCalciteBlockElement;
    private lineSizeSliderBlock!: HTMLCalciteBlockElement;
    private tractChoroSelBlock!: HTMLCalciteBlockElement;

    // SLIDER ELEMENTS
    private busStopSizeSlider!: HTMLCalciteSliderElement;
    private metroStopSizeSlider!: HTMLCalciteSliderElement;
    private lineSizeSlider!: HTMLCalciteSliderElement;
    private tractOpacitySlider!: HTMLCalciteSliderElement;
    
    private radiusGraphic: Graphic | null = null;
    private circleMeters: number = 805; // approx 1/2 mile
    private tractOriginalColors: Color[] = [];
    private currentTractOpacity: number = 0.05;

    // append all tooltips to this array, append to shadow root at once
    private tooltips: HTMLCalciteTooltipElement[] = []; 

    // CONSTRUCTOR
    public constructor() {
        super();

        const logTimeStr = `${TAG} constructor built after`;
        console.time(logTimeStr);
        
        const root = this.attachShadow({ mode: "open" });

        // build feature layer metas imported as functions
        this.initLayerMetas();
        
        // build all action bars (in this)
        this.initActionBars(this.actBarMetas);
        this.buildRouteInfoPanel();
    
        // build and append all elements to shadow dom
        root.append(
            this.addStyling(STYLE),
            this.arcgisMap,
            this.routeInfoPanel,
            this.toggleBar,
            this.actionBar,
            ...this.actionBarPanels.keys(),
            ...this.tooltips,
        );

        // reconfigure on window resizes
        window.addEventListener('resize', this.onResize.bind(this));

        // log time to complete constructor
        console.timeEnd(logTimeStr);
    }
    // build sections requiring async
    async connectedCallback(): Promise<void> {
        await this.buildSlidersPanel();
        this.routeDropdown = await this.buildRoutesDropdown();
        this.shadowRoot?.append(this.routeDropdown);
    }
    disconnectedCallback(): void {
        this.arcgisMap?.remove();
    }
    // build layer metas imported as funcs from layers.ts
    private initLayerMetas(): void {
        for (const [key, entry] of this.mapLayers) {
            if (entry.fn) {
                console.log(`building ${key}`);
                entry.meta = entry.fn(
                    (route: string | string[]) => { this.filterByRoutes(route); this.showRouteInfo(route as string); },
                    (routes: string | string[]) => { this.filterByRoutes(routes); this.routeInfoPanel.closed = true; }
                )
            }
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
    private onResize(): void {
        const isWide = this.offsetWidth >= 900;
        const newLayout = isWide ? 'horizontal' : 'vertical';
        
        if (this.toggleBar?.layout !== newLayout) {
            this.toggleBar.layout = newLayout;
        }
        if (this.actionBar?.layout !== newLayout) {
            this.actionBar.layout = newLayout;
        }
    }
    private async onMapViewReady(): Promise<void> {
        const logTimeStr = `time to build arcgis-map`;
        console.time(logTimeStr);
        this.arcgisMap.shadowRoot?.append(this.addStyling(MAP_STYLE));

        // BUILD FEATURE LAYERS
        this.builtLayers = await this.buildMapFeatureLayers();
        console.log(`%cbuilt layers: ${this.builtLayers.length}`, 'color: seagreen; font-weight: 600;');

        // SET OBJECT HIGHLIGHT COLORS
        const view = this.arcgisMap.view as __esri.MapView;
        view.highlights = HIGHLIGHTS;
        
        // BUILD UTILITY WIDGETS
        this.arcgisMap.append(
            buildArcgisElement({ elStr: 'arcgis-zoom' }),
            buildArcgisElement({ elStr: 'arcgis-search', view: view })
        );
        
        await this.setPanelViews(view, new Map([...this.actionBarPanels].filter(([, v]) => v !== 'skip')));
    
        this.setDockablePopupsBySize(view, this.maxW, this.maxH);
        await this.openLegendOnLayerLoaded(view, this.busStopsLayer, this.maxW, this.maxH);
        
        // draw circle on screen on click
        view.on('click', async (event: __esri.ViewClickEvent) => {
            this.drawCircleOnStopClick(view, event);
        });

        console.timeEnd(logTimeStr);
    }
    private async drawCircleOnStopClick(view: __esri.MapView, event: __esri.ViewClickEvent): Promise<void> {
        const hit = await view.hitTest(event, { include: [this.busStopsLayer, this.metroStopsLayer] });
        if (!hit.results.length) return;

        if (this.radiusGraphic) {
            view.graphics.remove(this.radiusGraphic);
        }

        const point = (hit.results[0] as __esri.GraphicHit).graphic.geometry as __esri.Point;
        this.radiusGraphic = await drawCircle(point, {
                radius: this.circleMeters,
                fillColor: [255, 255, 255, 0.05],
                outlineColor: [255, 255, 255, 0.5],
                outlineWidth: 1.5,
                outlineStyle: 'dash',
            }
        );
        view.graphics.add(this.radiusGraphic);
        this.highlightStopsWithinMeters(view);
    }
    private setDockablePopupsBySize(view: __esri.MapView, maxW: number, maxH: number): void {
        if (view.popup) {
            view.popup.dockOptions = { breakpoint: false };
            view.popup.dockEnabled = true;
            reactiveUtils.watch(
                () => view.size,
                ([w, h]) => {
                    if (!w || !h) throw new Error(`width or height is undefined: w: ${w}, h: ${h}`);
                    if (view.popup) view.popup.dockEnabled = w >= maxW && h >= maxH;
                }
            );
        }
    }
    private async openLegendOnLayerLoaded(view: __esri.MapView, layer: FeatureLayer, maxW: number, maxH: number): Promise<void> {
        await reactiveUtils.whenOnce(
        () => layer.loadStatus === 'loaded').then(() => {
            if (!view.size) return;
            const [w, h] = view.size;
            if (!w || !h) throw new Error(`width or height is undefined: w: ${w}, h: ${h}`);
            if (w >= maxW || h >= maxH ) {
                console.log(`%copening legend (W:${w}Xh:${h})`, 'color: seagreen;');
                this.togglePanel('legend', this.actionBar, { legend: this.legendPanel });
            }
        })
    }
    // build all layers concurrently, sort on 'i' field to add to map in order
    private async buildMapFeatureLayers(): Promise<FeatureLayer[]> {
        const builtLayers: Map<number, FeatureLayer> = new Map();
        await Promise.all([...this.mapLayers.entries()].map(async ([key, entry]) => {
            try {
                const layer = await this.makeFeatureLayer(entry.meta);
                builtLayers.set(entry.i, layer);
                entry.layer = layer;
                this.extractBuiltSizes(key, layer);
                return layer;
            } catch (e) {
                throw new Error(`failed to build layer ${entry.i + 1}: ${e}`);
            }
        }));
        // add layers to map after all have loaded
        const sortedLayers = [...builtLayers.entries()].sort(([i1,], [i2,]) => i1 - i2).map(([, layer]) => layer);
        sortedLayers.forEach((layer, i) => this.arcgisMap.map?.add(layer, i));
        return sortedLayers;
    }
    // capture graphics sizes at build time for sliders
    private extractBuiltSizes(key: string, layer: FeatureLayer): void {
        switch (key) {
            case 'bus': {
                const sizeVar = (layer.renderer as UniqueValueRenderer).visualVariables![0] as __esri.SizeVariable;
                this.busStopSizes = sizeVar.stops!.map(s => (s as __esri.SizeStop).size as number);
                break;
            }
            case 'metro': {
                const sizeVar = (layer.renderer as UniqueValueRenderer).visualVariables![0] as __esri.SizeVariable;
                this.metroStopSizes = sizeVar.stops!.map(s => (s as __esri.SizeStop).size as number);
                break;
            }
            case 'lines': {
                this.lineSizes = (layer.renderer as ClassBreaksRenderer)
                    .classBreakInfos.map((cb) => (cb.symbol as SimpleLineSymbol).width);
                break;
            }
            case 'tracts': {
                this.tractOriginalColors = (layer.renderer as ClassBreaksRenderer).classBreakInfos
                    .map(cb => (cb.symbol as SimpleFillSymbol).color.clone());
                break;
            }
        }
    }
    // assign map view to each panel that requires it
    private async setPanelViews(view: __esri.MapView, panelEls: Map<HTMLCalcitePanelElement, string>) {
        for (const [k, v] of panelEls) {
            await customElements.whenDefined(v);
            (k.querySelector(v) as any).view = view;
        }
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
    private async highlightStopsWithinMeters(view: __esri.MapView): Promise<void> {
        if (!this.radiusGraphic) return;
        const layerView = await view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;
        
        layerView.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({
                geometry: this.radiusGraphic.geometry,
                spatialRelationship: 'intersects',
            }),
            includedEffect: "brightness(2)",
            excludedEffect: "brightness(1)",
        });
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
            a.active = a.dataset['actionId'] === id ? !a.active : false;
        });
        Object.entries(panels).forEach(([key, panel]: [string, any]) => {
            panel.hidden = key !== id || !actionBar.querySelector(`[data-action-id="${id}"]`).active;
        });
    }
    // this.sliderPanel is pre build with buildCalcitePanel
    // this builds and appends Calcite elements to the sliderPanel
    private async buildSlidersPanel(): Promise<void> {
        this.tractChoroSelBlock = await this.buildTractChoroFieldSelector();
        this.slidersPanel.append(
            this.tractChoroSelBlock,
            this.buildTractOpacitySlider(),
            this.buildLineSizeSlider(),
            this.buildBusStopSizeSlider(),
            this.buildMetroStopSizeSlider(),
        );
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
    // slider for adjusting the opacity (rgb[a]) of the SimpleFillSymbols representing census tracts
    private buildTractOpacitySlider(): HTMLCalciteBlockElement {
        const { block, slider } = buildCalciteSliderBlock({
            heading: 'Census Tract Fill Opacity',
            onInput: async () => {
                const renderer = this.tractsLayer.renderer as ClassBreaksRenderer;
                this.currentTractOpacity = this.tractOpacitySlider.value as number;
                renderer.classBreakInfos.forEach((cb, i) => {
                    if (this.tractOriginalColors[i]) {
                        const { r, g, b } = this.tractOriginalColors[i];
                        cb.symbol.color = new Color([r, g, b, this.currentTractOpacity]);
                    }
                })
                this.tractsLayer.renderer = renderer.clone();
            },
            sliderProps: {
                min: 0,
                max: 0.5,
                step: 0.01,
                value: 0.05,
                snap: true,
            }
        });
        this.tractOpacitySlider = slider;
        return block;
    }
    private async buildTractChoroFieldSelector(): Promise<HTMLCalciteBlockElement> {
        const head = 'Select Census Tract Chroropleth Field';
        return await buildCalciteSelectBlock({
            heading: head,
            selProps: {
                heading: head,
                optsProps: {
                    opts: [...this.tractsChoroplethMap.keys()].map(({ label, fieldName }) => ({
                        label,
                        value: fieldName,
                    })) as calciteOptionProps[],
                },
                onSelChange: (val: string) => {
                    const renderer = (this.tractsLayer.renderer as ClassBreaksRenderer);
                    renderer.field = val;
                    renderer.classBreakInfos = makeChoroplethLevels({
                        levels: this.tractsChoroplethMap.get(tractsField(val)),
                        opac: this.currentTractOpacity
                    }!);
                    this.tractsLayer.renderer = renderer.clone();
                }
            }
        });
    }
    // BUILD A CALCITE SELECT TO FILTER BY BUS ROUTE
    private async buildRoutesDropdown(): Promise<HTMLCalciteDropdownElement> {
        return await buildCalciteDropdown({
            heading: "Select MetroBus Routes",
            placeholder: "",
            selectMode: 'multiple',
            icon: "bus",
            onSelChange: (vals: string[]) => {
                this.filterByRoutes(vals);
                this.showRouteInfo(vals[0] ?? '');
                if (!vals || vals.length > 1) {
                    this.routeInfoPanel.hidden = true;
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
    private buildRouteInfoPanel(): void {
        this.routeInfoPanel.addEventListener("calcitePanelClose", () => {
            this.routeInfoPanel.hidden = true;
        });
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
        this.routeInfoPanel.heading = `${route}: ${props['stops_total']} stops`;
        this.routeInfoPanel.closed = false;
        this.routeInfoPanel.closable = true;

        // stop frequency table
        const freqTbl = buildCalciteTableBlock(
            "Frequency (minutes)", props, false, true,
            () => buildCalciteTable({
                hasHeader: true, rows: [
                    ['Weekday', 'Saturday', 'Sunday'],
                    [props['freq_wk'], props['freq_sa'], props['freq_su']],
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
    private addStyling(style: string): HTMLStyleElement {
        return Object.assign(document.createElement("style"), { textContent: style });
    }
}
