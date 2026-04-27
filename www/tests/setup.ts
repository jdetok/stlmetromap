// www/tests/setup.ts
import { vi } from 'vitest';
vi.stubGlobal('CSSStyleSheet', class { });
vi.mock('@esri/calcite-components/dist/calcite/calcite.css', () => ({}));

vi.mock('@arcgis/core/Graphic', () => ({
    default: vi.fn().mockImplementation(function(this: any, props: any) {
        Object.assign(this, props);
    }),
}));
vi.mock('@arcgis/core/renderers/visualVariables/SizeVariable', () => ({
    default: vi.fn().mockImplementation(function(this: any, props: any) {
        Object.assign(this, props);
    }),
}));
vi.mock('@arcgis/core/layers/FeatureLayer', () => ({
    default: vi.fn().mockImplementation(function(this: any) {
        this.queryFeatures = vi.fn().mockResolvedValue({ features: [] });
        this.renderer = null;
    }),
}));
vi.mock('@arcgis/core/layers/support/FeatureEffect', () => ({
    default: vi.fn().mockImplementation(function(this: any, props: any) {
        Object.assign(this, props);
    }),
}));
vi.mock('@arcgis/core/layers/support/FeatureFilter', () => ({
    default: vi.fn().mockImplementation(function(this: any, props: any) {
        Object.assign(this, props);
    }),
}));
vi.mock('@arcgis/core/Color', () => ({
    default: vi.fn().mockImplementation(function(this: any, vals: any) {
        const [r, g, b, a] = Array.isArray(vals) ? vals : [0, 0, 0, 1];
        Object.assign(this, { r, g, b, a });
    }),
}));

const ctorWithType = (type: string) => vi.fn().mockImplementation(function (this: any, props: any) {
    Object.assign(this, props, { type });
});

vi.mock('@arcgis/core/geometry/Point', () => ({
    default: ctorWithType('point'),
}));

vi.mock('@arcgis/core/geometry/Polyline', () => ({
    default: ctorWithType('polyline'),
}));

vi.mock('@arcgis/core/geometry/Polygon', () => ({
    default: ctorWithType('polygon'),
}));

vi.mock('@arcgis/core/geometry/Circle', () => ({
    default: ctorWithType('circle'),
}))

vi.mock('@arcgis/core/symbols/SimpleLineSymbol', () => ({
    default: ctorWithType('simple-line'),
}));
vi.mock('@arcgis/core/symbols/SimpleFillSymbol', () => ({
    default: ctorWithType('simple-fill'),
}));
vi.mock('@arcgis/core/symbols/SimpleMarkerSymbol', () => ({
    default: ctorWithType('simple-marker'),
}));
vi.mock('@arcgis/core/renderers/UniqueValueRenderer', () => ({
    default: ctorWithType('unique-value'),
}));
vi.mock('@arcgis/core/renderers/ClassBreaksRenderer', () => ({
    default: ctorWithType('class-breaks'),
}));
vi.mock('@arcgis/core/renderers/SimpleRenderer', () => ({
    default: ctorWithType('simple'),
}));
vi.mock('@arcgis/core/core/reactiveUtils', () => ({
    watch: vi.fn(),
    when: vi.fn(),
}));
vi.mock('@arcgis/map-components/dist/components/arcgis-map', () => ({}));
vi.mock('@arcgis/map-components/dist/components/arcgis-zoom', () => ({}));
vi.mock('@arcgis/map-components/dist/components/arcgis-search', () => ({}));
vi.mock('@esri/calcite-components/dist/components/calcite-button', () => ({}));