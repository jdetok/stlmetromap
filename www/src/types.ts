import Graphic from "@arcgis/core/Graphic";
import Renderer from "@arcgis/core/renderers/Renderer";

export type FeatureLayerMeta = {
    title: string;
    source?: Graphic[];
    dataUrl?: string;
    renderer: Renderer;
    popupTemplate?: __esri.PopupTemplateProperties;
    fields?: __esri.FieldProperties[];
    geometryType?: 'point' | 'polygon' | 'polyline';
    toGraphics?: (data: any) => Graphic[];
}

export type StopMarkers = {stops: StopMarker[]}
export type StopMarker = {
    id: string | number,
    name: string,
    typ: RouteType,
    routes: Route[],
    yx: Coordinates,
    tractGeoid?: string,
}
export type RouteType = 'bus' | 'mlr' | 'mlb' | 'mlc';

type Route = {
    id: string | number,
    name: string,
    nameLong: string,
}

type Coordinates = { latitude: number, longitude: number, name: string, typ: RouteType };

// choropleth levels, pass min val, max val, rgb val
export type cplethEls = [number, number, number[]];