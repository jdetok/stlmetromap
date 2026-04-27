// arcgis.ts
// Helpers for creating ArcGIS features/graphics 
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-search";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import Graphic from "@arcgis/core/Graphic";
import Circle from "@arcgis/core/geometry/Circle";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import { PROJID } from "./data";
import Renderer from "@arcgis/core/renderers/Renderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";

export function tractFieldFromInfos(globalFieldInfos: __esri.FieldInfo[], field: string): __esri.FieldInfo {
    return globalFieldInfos.find((f) => f.fieldName === field) as __esri.FieldInfo ?? {
        fieldName: field, label: field
    };
}

export type arcgisMapProps = {
    basemap: string | __esri.Basemap | undefined,
    extent: __esri.Extent,
    onViewReady: () => Promise<void>,
};
export function buildArcgisMap(props: arcgisMapProps): HTMLArcgisMapElement {
    const map = Object.assign(document.createElement("arcgis-map"), {
        basemap: props.basemap,
        extent: props.extent,
    });
    map.addEventListener('arcgisViewReadyChange', props.onViewReady, { once: true });
    return map;
};

export type arcgisElementType = 'arcgis-zoom' | 'arcgis-search';

// GENERAL ARCGIS COMPONENT HELPERS
export type arcgisElementProps = {
    elStr: arcgisElementType
    view?: __esri.MapView
};
export type arcgisElementReturn = HTMLArcgisZoomElement | HTMLArcgisSearchElement;
export function buildArcgisElement(props: arcgisElementProps): arcgisElementReturn {
    const el = document.createElement(props.elStr);
    if (props.view) {
        el.view = props.view;
    }
    return el;
}
// HELPER TO CREATE CUSTOM HIGHLIGHT SETTINGS
export function newHighlightSetting(name: string, color: __esri.ColorProperties): __esri.HighlightOptionsProperties {
    return {
        name: name, color: color,
        fillOpacity: 0.05, shadowColor: "black",
        shadowOpacity: 0.4, shadowDifference: 0.2,
    }
}

// choropleth levels, pass min val, max val, rgb val
export type cplethEls = [number, number, readonly number[]];
export type choroProps = {
    levels?: cplethEls[],
    level?: cplethEls,
    opac: number,
    line?: boolean,
}
export type choropleth = {
    lvl1: [number, number, number],
    lvl2: [number, number, number],
    lvl3: [number, number, number],
    lvl4: [number, number, number],
    lvl5: [number, number, number],
};
export function makeChoroplethRanges(numRanges: number, ranges: number[], cpleth: choropleth): cplethEls[] {
    if (ranges.length !== numRanges + 1 ) {
        throw new Error(`length of array (${ranges.length}) should equal numRanges + 1 (${numRanges} + 1: ${numRanges + 1})`);
    }
    const cplethLevels: cplethEls[] = [];

    ranges.forEach((r: number, i) => {
        if (i === numRanges) return;
        cplethLevels.push([r, ranges[i+1] as number, cpleth[`lvl${i + 1}`]])
    })
    return cplethLevels;
}

// create choropleth levels for the array of min/max/color
const newChoroplethLevel = (props: choroProps) => {
    if (!props.level) return;
    return {
        minValue: props.level[0],
        maxValue: props.level[1],
        symbol: props.line ? new SimpleLineSymbol({ color: [...props.level[2], 0.65], width: 0.5 }) :
            new SimpleFillSymbol({ color: [...props.level[2], props.opac] }),
    };
};

export const makeChoroplethLevels = (props: choroProps): __esri.ClassBreakInfoProperties[] => {
    if (!props.levels) throw new Error(`props.levels can't be empty`);
    let lvls: __esri.ClassBreakInfoProperties[] = [];
    for (const l of props.levels) {
        lvls.push(newChoroplethLevel({
            level: l, opac: props.opac, line: props.line ?? false
        }) as __esri.ClassBreakInfoProperties);
    }
    return lvls;
};

export const toPolygon = (data: any): Graphic[] => {
    return data.features.map((f: any) => { 
        return new Graphic({
            geometry: new Polygon({
                rings: (f.geometry.type === "MultiPolygon") ? f.geometry.coordinates.flat(1) : f.geometry.coordinates,
                spatialReference: { wkid: PROJID },
            }),
            attributes: f.properties,
        })
    })
}

// create and return an array of graphics from passed bus/metro stop locations
export const toPoint = (data: any): Graphic[] => {
    return data.features.map((f: any) => {
        return new Graphic({
            geometry: new Point({
                longitude: f.geometry.coordinates[0],
                latitude: f.geometry.coordinates[1],
                spatialReference: { wkid: PROJID },
            }),
            attributes: {
                ...f.properties,
                ObjectID: f.properties.id,
                route_count: f.properties.route_names ? f.properties.route_names.split(", ").length : 1,
            },
        })
    })
};
export const toPolyline = (data: any): Graphic[] => {
    return data.features.map((f: any) => {
        return new Graphic({
            geometry: new Polyline({
                paths: f.geometry.coordinates,
                spatialReference: { wkid: PROJID },
            }),
            attributes: {
                ...f.properties,
                ObjectID: f.properties.id,
                route_count: f.properties.route_names ? f.properties.route_names.split(", ").length : 1,
            },
        })
    })
};

export type renderers = UniqueValueRenderer | ClassBreaksRenderer;
export function updateRenderedSizes(renderer: Renderer, baseSizes: number[], mult: number): UniqueValueRenderer | ClassBreaksRenderer {
    switch (renderer.type) {
        case 'unique-value': {
            const sizeVar = (renderer as UniqueValueRenderer).visualVariables![0] as __esri.SizeVariable;
            sizeVar.stops!.forEach((stop, i) => {
                if (baseSizes[i]) (stop as __esri.SizeStop).size = baseSizes[i] * mult;
            });
            break;
        }
        case 'class-breaks': {
            (renderer as ClassBreaksRenderer).classBreakInfos.forEach((cb, i) => {
                if (baseSizes[i]) (cb.symbol as SimpleLineSymbol).width = baseSizes[i] * mult;
            });
            break;
        }
    };
    return renderer as renderers;
}

export async function queryLayer(layer: FeatureLayer, query: string): Promise<__esri.FeatureSet> {
    return await layer.queryFeatures({
        where: query,
        returnGeometry: true,
        outSpatialReference: {wkid: PROJID},
    });
}

export function applyFeatureEffect(view: __esri.FeatureLayerView, fx: FeatureEffect): void {
    view.featureEffect = fx;
} 

export type circleProps = {
    radius: number,
    fillColor: __esri.ColorProperties | undefined,
    outlineColor: __esri.ColorProperties | undefined,
    outlineWidth: number,
    outlineStyle: string,
}
export async function drawCircle(point: __esri.Point, props: circleProps): Promise<Graphic> {
    return new Graphic({
        geometry: new Circle({
            center: point,
            radius: props.radius,
            radiusUnit: 'meters',
        }),
        symbol: new SimpleFillSymbol({
            color: props.fillColor,
            outline: {
                color: props.outlineColor,
                width: props.outlineWidth,
                style: props.outlineStyle as any,
            }
        })
    })
}