import { describe, it, expect, vi } from 'vitest';
import {
    toPoint, toPolygon, toPolyline,
    makeChoroplethLevels, makeChoroplethRanges,
    newHighlightSetting, updateRenderedSizes,
    tractFieldFromInfos, choropleth,
    queryLayer
} from '../src/arcgis';
import { PROJID } from '../src/data';

const mockPointFeature = (id: number, lon: number, lat: number, extras = {}) => ({
    geometry: { coordinates: [lon, lat] },
    properties: { id, ...extras },
});

const mockPolygonFeature = (id: number, rings: number[][][]) => ({
    geometry: { type: 'Polygon', coordinates: rings },
    properties: { id },
});

const mockLineFeature = (id: number, paths: number[][][]) => ({
    geometry: { type: 'Polygon', coordinates: paths },
    properties: { id, route_names: 'Route 1, Route 2' },
});

describe('toPoint()', () => {
    it('converts features to Graphics with accurate coordinates', () => {
        const longlat: [number, number] = [-90.2, 38.6];
        const data = { features: [mockPointFeature(1, ...longlat)] };
        const graphics = toPoint(data);
        expect(graphics).toHaveLength(1);
        expect(graphics[0].geometry).toMatchObject({ longitude: longlat[0], latitude: longlat[1] });
    });

    it('sets ObejctID from properties.id', () => {
        const data = { features: [mockPointFeature(42, -90, 38)] };
        expect(toPoint(data)[0].attributes.ObjectID).toBe(42);
    });

    it('calculates route_count from comma-separated route_names', () => {
        const data = { features: [mockPointFeature(1, -90, 38, {route_names: 'A, B, C'})] };
        expect(toPoint(data)[0].attributes.route_count).toBe(3);
    });

    it('defaults route_count to 1 when route_names is absent', () => {
        const data = { features: [mockPointFeature(1, -90, 38)] };
        expect(toPoint(data)[0].attributes.route_count).toBe(1);
    });

    it('handles empty features array', () => {
        expect(toPoint({ features: [] })).toHaveLength(0);
    });
});

describe('toPolygon()', () => {
    it('converts Polygon geometry correctly', () => {
        const rings = [[[0, 0], [1, 0], [1, 1], [0, 0]]];
        const data = { features: [mockPolygonFeature(1, rings)] };
        const graphics = toPolygon(data);
        expect(graphics).toHaveLength(1);
        expect(graphics[0].geometry).toBeDefined();
        expect((graphics[0].geometry as any).rings).toEqual(rings);
    });

    it('flattens MultiPolygon coordinates by one level', () => {
        const multiRings = [[[[0, 0], [1, 0], [1, 1], [0, 0]]]];
        const feature = {
            geometry: { type: 'MultiPolygon', coordinates: multiRings },
            properties: { id: 2 },
        };
        const graphics = toPolygon({ features: [feature] });
        expect((graphics[0].geometry as any).rings).toEqual(multiRings.flat(1));
    });
});

describe('toPolyline()', () => {
    it('converts line features to Graphics', () => {
        const paths = [[[0, 0], [1, 1]]];
        const data = { features: [mockLineFeature(1, paths)] };
        const graphics = toPolyline(data);
        expect((graphics[0].geometry as any).paths).toEqual(paths);
    });
});

describe('makeChoroplethLevels()', () => {
    const levels: [number, number, readonly number[]][] = [
        [0, 100, [255, 0, 0]],
        [101, 200, [0, 255, 0]],
    ];

    it('returns one entry per level', () => {
        const result = makeChoroplethLevels({ levels, opac: 0.5 });
        expect(result).toHaveLength(2);
    });

    it('sets minValue and maxValue correctly', () => {
        const result = makeChoroplethLevels({ levels, opac: 0.5 });
        expect(result[0].minValue).toBe(0);
        expect(result[0].maxValue).toBe(100);
        expect(result[1].minValue).toBe(101);
    });

    it('throws when levels is undefined', () => {
        expect(() => makeChoroplethLevels({ opac: 1.5 })).toThrow();
    });

    it('uses SimpleLineSymbol when line=true', () => {
        const result = makeChoroplethLevels({ levels, opac: 0.5, line: true });
        expect((result[0].symbol as any).type).toBe('simple-line');
    });

    it('uses SimpleFillSymbol when line=false (default)', () => {
        const result = makeChoroplethLevels({ levels, opac: 0.5 });
        expect((result[0].symbol as any).type).toBe('simple-fill');
    });
});

describe('newHighlightSetting()', () => {
    it('returns correct shape', () => {
        const setting = newHighlightSetting('test', 'red');
        expect(setting.name).toBe('test');
        expect(setting.color).toBe('red');
        expect(setting.fillOpacity).toBe(0.05);
    });
});

describe('updateRenderedSizes()', () => {
    it('updates unique-value renderer stop sizes', () => {
        const stops = [{ size: 10 }, { size: 20 }];
        const renderer = {
            type: 'unique-value',
            visualVariables: [{ stops }],
        } as any;
        updateRenderedSizes(renderer, [10, 20], 2);
        expect(stops[0].size).toBe(20);
        expect(stops[1].size).toBe(40);
    });

    it('updates class-breaks renderer symbol widths', () => {
        const classBreakInfos = [
            { symbol: { width: 1 } },
            { symbol: { width: 2 } },
        ];
        const renderer = { type: 'class-breaks', classBreakInfos } as any;
        updateRenderedSizes(renderer, [1, 2], 3);
        expect(classBreakInfos[0].symbol.width).toBe(3);
        expect(classBreakInfos[1].symbol.width).toBe(6);
    });
});

describe('tractFieldFromInfos()', () => {
    it('returns a single __esri.FieldInfo from an array of them by fieldName', () => {
        const name = 'test';
        const finfos = [{ fieldName: name, label: name }] as __esri.FieldInfo[];
        const result = tractFieldFromInfos(finfos, name);
        expect(result.fieldName).toBe(name);
    });
});

describe('makeChoroplethRanges()', () => {
    const cpleth: choropleth = {
        lvl1: [94, 150, 98],
        lvl2: [17, 200, 152],
        lvl3: [0, 210, 255],
        lvl4: [44, 60, 255],
        lvl5: [50, 1, 63],
    } as const;

    it('throws if length of ranges is not numRanges+1', () => {
        expect(() => makeChoroplethRanges(5, [0, 1, 2, 3], cpleth)).toThrow();
    });

    it('builds choropleth ranges properly', () => {
        const ranges = [0, 2500, 5000, 7500, 10000, 100000];
        const result = makeChoroplethRanges(5, ranges, cpleth);
        result.forEach((r, i) => {
            expect(r[0]).toBe(ranges[i]);
            expect(r[1]).toBe(ranges[i+1]);
        });
    });
});

describe('queryLayer', () => {
    const mockQuery = '1=1';
    const mockErr = 'failed';
    it('calls queryFeatures with correct params', async () => {
        const mockFeatureSet = { features: [] };
        const mockLayer = { queryFeatures: vi.fn().mockResolvedValue(mockFeatureSet) } as any;
        const result = await queryLayer(mockLayer, mockQuery);
        expect(mockLayer.queryFeatures).toHaveBeenCalledWith({
            where: mockQuery,
            returnGeometry: true,
            outSpatialReference: { wkid: PROJID },
        });
        expect(result).toBe(mockFeatureSet);
    });

    it('propagates errors from queryFeatures', async () => {
        const mockLayer = { queryFeatures: vi.fn().mockRejectedValue(new Error(mockErr)) } as any;
        await expect(queryLayer(mockLayer, mockQuery)).rejects.toThrow(mockErr);
    })
});