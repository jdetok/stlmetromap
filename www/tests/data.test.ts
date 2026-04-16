import { describe, it, expect } from "vitest";
import { fieldInfos, PLACE_FIELDS, TRACTS_FIELDS, STOP_FIELDS } from '../src/data';

describe('fieldInfos()', () => {
    it('maps fields to FieldInfo shape', () => {
        const result = fieldInfos(PLACE_FIELDS, []);
        expect(result[0]).toMatchObject({ fieldName: expect.any(String), label: expect.any(String) });
    });

    it('excludes specified fields names', () => {
        const exclude = ['ObjectID', 'type'];
        const result = fieldInfos(PLACE_FIELDS, exclude);
        const names = result.map((f) => f.fieldName);
        exclude.forEach((f) => expect(names).not.toContain(f));
    });

    it('returns empty array when all fields are excluded', () => {
        const allNames = PLACE_FIELDS.map((f) => f.name!);
        expect(fieldInfos(PLACE_FIELDS, allNames)).toHaveLength(0);
    });

    it('preserves alias as label', () => {
        const result = fieldInfos([{ name: 'foo', alias: 'Foo Label', type: 'string' }], []);
        expect(result[0].label).toBe('Foo Label');
    });

    it('handles large field sets (STOP_FIELDS)', () => {
        const result = fieldInfos(STOP_FIELDS, ['ObjectID']);
        expect(result.length).toBe(STOP_FIELDS.length - 1);
    });
});

describe('constants', () => {
    it('TOGGLE_ACTIONS all have required shape', async () => {
        const { TOGGLE_ACTIONS } = await import('../src/data');
        const expectedFields = ['id', 'icon', 'where', 'highlightName'];
        for (const action of TOGGLE_ACTIONS) {
            expectedFields.forEach((f) => expect(action).toHaveProperty(f));
        }
    })
    
});