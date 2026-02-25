import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import LayerList from "@arcgis/core/widgets/LayerList";
import Expand from "@arcgis/core/widgets/Expand";
import Legend from "@arcgis/core/widgets/Legend";
import { FeatureLayerMeta } from "../types.js";
import {
    STLCOORDS, STLWKID, BASEMAP, LAYER_BUS_STOPS, LAYER_ML_STOPS, LAYER_CENSUS_COUNTIES, LAYER_CENSUS_TRACTS,
    LAYER_CYCLING,
    // LAYER_RAILS
} from "../data.js";

export const TAG = 'map-window';

type mapCoords = {
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
    spatialReference: { wkid: number }
}

export function newMapCoords(
    xmin: number, ymin: number, xmax: number, ymax: number, wkid: number
): mapCoords {
    return { xmin, ymin, xmax, ymax, spatialReference: { wkid } }
}

export class MapWindow extends HTMLElement {
    private div!: HTMLDivElement;
    private view: __esri.MapView;
    private map: __esri.Map;
    private coords: mapCoords;
    private layers: FeatureLayerMeta[];
    public constructor() {
        super();

        const root = this.attachShadow({ mode: "open" });
        this.div = Object.assign(document.createElement("div"), { style: "min-height: 100%;" });

        this.coords = newMapCoords(STLCOORDS.xmin, STLCOORDS.ymin, STLCOORDS.xmax, STLCOORDS.ymax, STLWKID);

        this.map = new Map({
            basemap: BASEMAP
        });
        
        this.view = new MapView({
            container: this.div,
            map: this.map,
            extent: this.coords,
            popupEnabled: true,
            popup: {
                dockEnabled: false,
                dockOptions: { buttonEnabled: false }
            }
        });

        // order matters
        this.layers = [
            LAYER_CENSUS_COUNTIES,
            LAYER_CENSUS_TRACTS,
            // LAYER_RAILS,
            LAYER_CYCLING,
            LAYER_BUS_STOPS,
            LAYER_ML_STOPS,
        ];

        this.view.when(async () => { // ADD LAYERS TO MAP VIEW
            for (let i = 0; i < this.layers.length; i++) {
                this.map.add(await this.makeFeatureLayer(this.layers[i]), i);
            }

            // add UI buttons/popups
            this.view.ui.add(this.addLayerList(), 'bottom-left');
            this.view.ui.add(this.addLegend(), 'bottom-right')
        }, (e: Error) => console.error("failed to build or display map:", e))

        root.append(this.addStyling(), this.div);
    }
    private addStyling(): HTMLStyleElement {
        return Object.assign(document.createElement('style'), { textContent: STYLE });
    }
    private addLayerList(): Expand {
        return new Expand({
            view: this.view,
            content: new LayerList({ view: this.view }),
            expanded: true,
        });
    }
    private addLegend(): Expand {
        return new Expand({
            view: this.view,
            content: new Legend({
                view: this.view,
            }),
            expanded: true,
            mode: 'floating',
        });
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
                            spatialReference: { wkid: STLWKID }
                        }),
                        attributes: f.attributes,
                    }));
                }
            }
        } catch (e) { throw new Error(`no data source for ${meta.title} layer: ${e}`); }
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
    };
}
const STYLE = `
:host {
    --popup-bdr: 2px solid black;
    --popup-bdrrad: .5rem;
    --popup-bg: rgba(125, 140, 151, 0.61);
    /*--popup-bg: rgba(192, 201, 209, 0.85);*/
    position: relative;
    overflow: hidden;
    display: block;
    width: 100%;
    height: 100%;
    --calcite-color-brand: var(--popup-bg);
    --calcite-popover-background-color: var(--popup-bg);
    --calcite-popover-corner-radius: 1rem;
    --calcite-popover-padding: 1rem;
}

.esri-component * {
    pointer-events: auto;
    text-align: left;
}

.esri-widget--button {
    background-color: var(--popup-bg);
}

/* endless scroll and no expands without these */
.esri-ui-corner {
    position: absolute;
}
.esri-ui-top-left     { top: 15px;    left: 15px;   }
.esri-ui-top-right    { top: 15px;    right: 15px;  }
.esri-ui-bottom-left  { bottom: 15px; left: 15px;   }
.esri-ui-bottom-right { bottom: 15px; right: 15px;  }

.esri-popup {
    background-color: var(--popup-bg);
    margin: 0 auto;
    width: fit-content;
    max-width: 400px;
    padding: .5rem;
    border-radius: var(--popup-bdrrad);
}

/* force legend padding */
.esri-expand__content-container {
    padding: .5rem;
}

.esri-ui-manual-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.esri-attribution {
    display: none;
    position: absolute;
    bottom: auto;
    left: 0;
    right: 0;
    margin-top: 2px;
    height: 16px;
    pointer-events: auto;
}
`