import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@arcgis/map-components/dist/components/arcgis-print";
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
    LAYER_GROCERY,
    LAYER_PARKS, 
    LAYER_FUN,
    LAYER_SCHOOL,
    LAYER_AMTRAK,
    LAYER_SOCIAL
} from "../layers.js";

export const TAG = "map-window";

export class MapWindow extends HTMLElement {
    private arcgisMap!: HTMLArcgisMapElement;
    private layers: FeatureLayerMeta[];
    private layerListPanel!: HTMLElement;
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
            LAYER_GROCERY,
            LAYER_SOCIAL,
            LAYER_SCHOOL,
            LAYER_PARKS,
            LAYER_FUN,
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
            this.buildActionBar(),
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
            for (let i = 0; i < this.layers.length; i++) {
                try {
                    const view = this.arcgisMap.view as __esri.MapView;
                    (this.layerListPanel.querySelector("arcgis-layer-list") as any).view = view;
                    (this.legendPanel.querySelector("arcgis-legend") as any).view = view;
                    (this.basemapPanel.querySelector("arcgis-basemap-gallery") as any).view = view;
                    (this.printPanel.querySelector("arcgis-print") as any).view = view;

                    const layer = await this.makeFeatureLayer(this.layers[i]);
                    this.arcgisMap.map?.add(layer, i);
                } catch (e) {
                    console.error(e);
                }
            }
        }, { once: true });

        return this.arcgisMap;
    }
    private buildActionBar(): HTMLElement {
        const actionBar = document.createElement("calcite-action-bar") as any;
        actionBar.layout = "vertical";

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
            action.addEventListener("click", () => this.togglePanel(a.id, actionBar));
            actionBar.appendChild(action);
        }

        return actionBar;
    }

    private togglePanel(id: string, actionBar: any): void {
        const panels: Record<string, HTMLElement> = {
            layers: this.layerListPanel,
            legend: this.legendPanel,
            basemaps: this.basemapPanel,
            print: this.printPanel,
        };

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
    --popup-bg: rgba(125, 140, 151, 0.82);
    --calcite-color-brand: var(--popup-bg);
    --calcite-color-background: var(--popup-bg);
    --calcite-color-foreground-1: var(--popup-bg);
    overflow: hidden;
    position: relative;
    --calcite-spacing-sm: 0.25rem;   /* tightest — affects internal item padding */
    --calcite-spacing-md: 0.5rem;    /* medium spacing */
    --calcite-spacing-lg: 0.75rem;   /* larger gaps between sections */
}

calcite-action-bar {
    position: absolute;
    bottom: 1.8rem;
    right: .2rem;
    z-index: 10;
}
calcite-panel {
    position: absolute;
    bottom: 1.8rem;
    right: .2rem;
    z-index: 10;
    width: fit-content;
    height: fit-content;
    max-height: 48%;
    max-width: 98%;
}
arcgis-map {
    --calcite-block-padding: 0.25rem;
    --calcite-list-item-spacing: 0.25rem; 
    border-radius: 1rem;
    display: block;
    width: 100%;
    height: 100%;
}
`;