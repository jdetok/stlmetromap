import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@arcgis/map-components/dist/components/arcgis-print";
import "@esri/calcite-components/dist/components/calcite-select";
import "@esri/calcite-components/dist/components/calcite-option";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { STLCOORDS, STLWKID, BASEMAP } from "../data.js";
import {
    FeatureLayerMeta,
    LAYER_BUS_STOPS,
    LAYER_ML_STOPS,
    LAYER_CENSUS_COUNTIES,
    LAYER_CENSUS_TRACTS,
    LAYER_CYCLING,
    LAYER_AMTRAK,
    LAYER_PLACES
} from "../layers.js";

export const TAG = "map-window";

export class MapWindow extends HTMLElement {
    private arcgisMap!: HTMLArcgisMapElement;
    private layers: FeatureLayerMeta[];
    private busStopsLayer!: FeatureLayer;
    private layerListPanel!: HTMLElement;
    private routePanel!: HTMLElement;
    private legendPanel!: HTMLElement;
    private basemapPanel!: HTMLElement;
    private printPanel!: HTMLElement;
    public constructor() {
        super();

        const root = this.attachShadow({ mode: "open" });
        
        // order matters
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            LAYER_PLACES,
            LAYER_CYCLING,
            LAYER_AMTRAK,
            LAYER_BUS_STOPS,
            LAYER_ML_STOPS,
        ];
        root.append(
            this.addStyling(),
            this.buildMap(),
            this.buildLayerListPanel(),
            this.buildLegendPanel(),
            this.buildPrintPanel(),
            this.buildBasemapPanel(),
            this.buildRoutePanel(),
            this.buildActionBar(),
            this.buildFilterBar(),
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
                    if (this.layers[i] === LAYER_BUS_STOPS) {
                        this.busStopsLayer = layer;
                    }
                    this.arcgisMap.map?.add(layer, i);
                } catch (e) {
                    console.error(e);
                }
            }
            await this.populateRouteSelect();

        }, { once: true });
        return this.arcgisMap;
    }
    private buildActionBar(): HTMLElement {
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
            action.addEventListener("click", () => this.togglePanel(a.id, actionBar, {
                layers: this.layerListPanel,
                legend: this.legendPanel,
                basemaps: this.basemapPanel,
                print: this.printPanel,
            }));
            actionBar.appendChild(action);
        }
        return actionBar;
    }
    private buildFilterBar(): HTMLElement {
        const actionBar = document.createElement("calcite-action-bar") as any;
        actionBar.id = "filterbar";
        actionBar.layout = "horizontal";

        const actions = [
            { id: "routes", icon: "filter", text: "Filter Bus Routes" },
        ];
        // const panels: Record<string, HTMLElement> = ;
        for (const a of actions) {
            const action = document.createElement("calcite-action") as any;
            action.dataset.actionId = a.id;
            action.icon = a.icon;
            action.text = a.text;
            action.addEventListener("click", () => this.togglePanel(a.id, actionBar, {
                routes: this.routePanel,
            }));
            actionBar.appendChild(action);
        }
        return actionBar;
    }

    private togglePanel(id: string, actionBar: any, panels: Record<string, HTMLElement>): void {
        // toggle active action
        actionBar.querySelectorAll("calcite-action").forEach((a: any) => {
            a.active = a.dataset.actionId === id ? !a.active : false;
        });

        // show/hide panels
        Object.entries(panels).forEach(([key, panel]: [string, any]) => {
            panel.hidden = key !== id || !actionBar.querySelector(`[data-action-id="${id}"]`).active;
        });
    }
    private buildLayerListPanel(): HTMLElement {
        const panel = document.createElement("calcite-panel") as any;
        panel.heading = "Layers";
        panel.hidden = true;

        const layerList = document.createElement("arcgis-layer-list") as HTMLArcgisLayerListElement;
        panel.appendChild(layerList);

        this.layerListPanel = panel;
        return panel;
    }
    private buildPrintPanel(): HTMLElement {
        const panel = document.createElement("calcite-panel") as any;
        panel.heading = "Export";
        panel.hidden = true;

        const print = document.createElement("arcgis-print") as any;
        panel.appendChild(print);

        this.printPanel = panel;
        return panel;
    }
    private buildLegendPanel(): HTMLElement {
        const panel = document.createElement("calcite-panel") as any;
        panel.heading = "Legend";
        panel.hidden = true;

        const legend = document.createElement("arcgis-legend") as HTMLArcgisLegendElement;
        legend.legendStyle = "classic";
        panel.appendChild(legend);

        this.legendPanel = panel;
        return panel;
    }
    private buildBasemapPanel(): HTMLElement {
        const panel = document.createElement("calcite-panel") as any;
        panel.heading = "Basemaps";
        panel.hidden = true;

        const gallery = document.createElement("arcgis-basemap-gallery") as any;
        panel.appendChild(gallery);

        this.basemapPanel = panel;
        return panel;
    }
    private buildZoom(): HTMLElement {
        return document.createElement("arcgis-zoom");
    }
    private buildSearch(): HTMLElement {
        const search = document.createElement("arcgis-search");
        search.view = this.arcgisMap.view;
        return search;
    }
    private buildRoutePanel(): HTMLElement {
        const panel = document.createElement("calcite-panel");
        panel.classList.add("filter");
        panel.heading = "Filter by Route";
        panel.hidden = true;

        const select = document.createElement("calcite-select") as any;
        select.label = "Route";
        select.id = "route-select";

        select.addEventListener("calciteSelectChange", () => {
            this.filterByRoute(select.value);
        });

        panel.appendChild(select);
        this.routePanel = panel;
        return panel;
    }

    private async populateRouteSelect(): Promise<void> {
        const result = await this.busStopsLayer.queryFeatures({
            where: "1=1",
            outFields: ["route_names"],
            returnGeometry: false,
            orderByFields: ["route_names"],
        });

        const routeNames: string[] = [...new Set(
            result.features
                .flatMap(f => (f.attributes.route_names as string).split(","))
                .map(r => r.trim())
        )].sort();

        const select = this.routePanel.querySelector("calcite-select") as any;

        const allOption = document.createElement("calcite-option") as any;
        allOption.value = "";
        allOption.label = "All routes";
        select.appendChild(allOption);

        for (const name of routeNames) {
            const option = document.createElement("calcite-option") as any;
            option.value = name;
            option.label = name;
            select.appendChild(option);
        }
    }
    private async filterByRoute(routeName: string): Promise<void> {
        const layerView = await this.arcgisMap.view.whenLayerView(this.busStopsLayer) as __esri.FeatureLayerView;

        if (!routeName) {
            // clear filter
            layerView.featureEffect = null;
            return;
        }

        layerView.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({
                where: `route_names like '%${routeName}%'`
            }),
            includedEffect: "bloom(2, 1px, 0.3) drop-shadow(2px 2px 4px black) brightness(2)",
            excludedEffect: "opacity(60%) brightness(1)"
        });
    }
    private addStyling(): HTMLStyleElement {
        return Object.assign(document.createElement("style"), { textContent: STYLE });
    }
    private async makeFeatureLayer(meta: FeatureLayerMeta): Promise<FeatureLayer> {
        try {
            if (meta.dataUrl) {
                const res = await fetch(meta.dataUrl);
                const data = await res.json();
                console.log(data);

                // build graphics layer if specified
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
        });
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


calcite-action-bar {
    position: absolute;
    bottom: 1.8rem;
    right: 5px;
    z-index: 10;
}
calcite-panel {
    position: absolute;
    right: 5px;
    bottom: 70px;
    z-index: 10;
    width: fit-content;
    height: fit-content;
    max-height: 55%;
    max-width: 98%;
}
calcite-panel.filter {
    left: 5px;
    right: unset;  /* override the global right */
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