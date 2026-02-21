import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Legend from "@arcgis/core/widgets/Legend";
import Expand from "@arcgis/core/widgets/Expand";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { FeatureLayerMeta, STLWKID } from "../global.js";

// wait for layers to exist then add expandable legend to map
// as long as the layers have a title and renderer function they will add to the legend automatically
export function buildLegend(view: MapView) {
    view.ui.add(new Expand({
        view,
        content: new Legend({
            view: view,
        }),
        expanded: true,
        mode: 'floating',
    }), "bottom-right");
}

export async function buildFeatureLayer(map: Map, meta: FeatureLayerMeta, idx?: number): Promise<void> {
    try {
        map.add(await makeFeatureLayer(meta), idx);
    } catch (e) { throw new Error(`failed to build layer: ${e}`) }
}

async function makeFeatureLayer(meta: FeatureLayerMeta): Promise<FeatureLayer> {
    try {
        if (meta.dataUrl) {
            const res = await fetch(meta.dataUrl);
            const data = await res.json();
            console.log("layer data:", data);
            meta.source = data.features.map((f: any) => new Graphic({
                geometry: new Polygon({
                    rings: f.geometry.rings,
                    spatialReference: { wkid: STLWKID }
                }),
                attributes: f.attributes,
            }));
        }
    } catch(e) { throw new Error("no data source for layer: " + meta.title); }
    // fallback for url-based layers if you ever need one
    return new FeatureLayer({
        title: meta.title,
        source: meta.source,
        objectIdField: "ObjectID",  // add this
        geometryType: "polygon",
        spatialReference: { wkid: STLWKID },  // add this too
        renderer: meta.renderer,
        popupTemplate: meta.popupTemplate,
        fields: meta.fields,
        // visible: true,
    });
}