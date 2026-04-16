import { describe, it, expect, vi, beforeEach } from 'vitest';
import { arcgisElementType, buildArcgisElement, buildArcgisMap } from '../src/arcgis';

// mock custom elements
beforeEach(() => {
    if (!customElements.get('arcgis-map')) {
        customElements.define('arcgis-map', class extends HTMLElement {
            basemap: any
            extent: any
        });
    }
    if (!customElements.get('arcgis-zoom')) {
        customElements.define('arcgis-zoom', class extends HTMLElement {
            view: any
        });
    }
    if (!customElements.get('arcgis-search')) {
        customElements.define('arcgis-search', class extends HTMLElement {
            view: any
        });
    }
});

describe('buildArcgisMap()', () => {
    const basemap = 'topo';
    const nullExtent = {} as __esri.Extent;

    it('returns an arcgis-map element', () => {
        const el = buildArcgisMap({ basemap, extent: nullExtent, onViewReady: vi.fn() });
        expect(el.tagName.toLowerCase()).toBe('arcgis-map');
    });

    it('assigns basemap and extent from props', () => {
        const extent = { xmin: 0, ymin: 0, xmax: 1, ymax: 1 } as __esri.Extent;
        const el = buildArcgisMap({ basemap, extent, onViewReady: vi.fn() })
        expect(el.basemap).toBe(basemap);
        expect(el.extent).toBe(extent);
    });

    it('attaches onViewReady as a one-time arcgisViewReadyChange listener', () => {
        const onViewReady = vi.fn();
        const el = buildArcgisMap({ basemap, extent: nullExtent, onViewReady });

        // dispatch event twice, onViewReady should only be called once
        for (let i = 0; i < 2; i++) {
            el.dispatchEvent(new Event('arcgisViewReadyChange'));
            expect(onViewReady).toHaveBeenCalledTimes(1);   
        }
    });
});

describe('buildArcgisElement()', () => {
    const validTags = ['arcgis-zoom', 'arcgis-search'] as arcgisElementType[];
    const mockView = { zoom: 10 } as __esri.MapView;

    it('creates appropriate arcgis element based on elStr', () => {
        for (const tag of validTags) {
            const el = buildArcgisElement({ elStr: tag });
            expect(el.tagName.toLowerCase()).toBe(tag);
        }
    });

    it('assigns view when provided', () => {
        for (const tag of validTags) {
            const el = buildArcgisElement({ elStr: tag, view: mockView });
            expect(el.view).toBe(mockView);
        }
    });

    it('does not assign view when omitted', () => {
        for (const tag of validTags) {
            const el = buildArcgisElement({ elStr: tag });
            expect(el.view).toBeUndefined();
        }
    });
});