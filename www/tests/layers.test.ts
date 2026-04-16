import { describe, it, expect } from 'vitest';
import { tractsField, TRACT_CLASSBREAKS } from '../src/layers';

const fieldsExpected = ['popl_dens', 'med_inc', 'med_rent', 'pov_dens', 'med_age'];

it('sanity check', () => {
    expect(1).toBe(1);
});

// TODO: figure out how to make the commented tests below work. they are failing due to trying to import a css file

// describe('TRACT_CLASSBREAKS', () => {
//     it('has entries for all expected fields', () => {
//         const fieldNames = [...TRACT_CLASSBREAKS.keys()].map((f) => f.fieldName);
//         fieldsExpected.forEach((f) => expect(fieldNames).toContain(f));
//     });

//     it('each entry has 5 choropleth levels', () => {
//         for (const [, levels] of TRACT_CLASSBREAKS) {
//             expect(levels).toHaveLength(5);
//         }
//     });

//     it('levels are contiguous', () => {
//         for (const [, levels] of TRACT_CLASSBREAKS) {
//             for (let i = 0; i < levels.length - 1; i++) {
//                 expect(levels[i][1]).toBeLessThan(levels[i + 1][0]);
//             }
//         }
//     });
// });

// describe('tractsField()', () => {
//     it('returns matching FieldInfo for known field', () => {
//         fieldsExpected.forEach((f) => {
//             const result = tractsField(f);
//             expect(result.fieldName).toBe(f)
//         });
//     });

//     it('returns fallback for unknown field', () => {
//         const result = tractsField('unknown');
//         expect(result.fieldName).toBe('unknown');
//         expect(result.label).toBe('unknown');
//     });
// });
