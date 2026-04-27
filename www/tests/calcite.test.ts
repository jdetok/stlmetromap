import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
    buildCalciteAction, buildCalciteActionBar, buildCalciteActionBarWithActions, buildCalciteButton, buildCalciteDropdown,
    buildCalcitePanel, buildCalciteSelect, buildCalciteSelectBlock, buildCalciteTable,
    buildCalciteTooltip, calciteActionBarProps, calciteActionBarWithTooltips, calciteActionProps,
    defaultHideBtnId,
    hideActionBar,
} from '../src/calcite';

beforeEach(() => {
    if (!customElements.get('calcite-panel')) {
        customElements.define('calcite-panel', class extends HTMLElement {
            heading: any
            hidden: any
            closable: any
        });
    }
});

// need a way to test if multiple elements are returned
describe('ensure factories return expected element', () => {
    const factories: Record<string, { fn: Function, props?: any }> = {
        'calcite-panel': { fn: buildCalcitePanel, props: { heading: 'test', closable: true } },
        'calcite-tooltip': { fn: buildCalciteTooltip, props: { text: 'test' } },
        'calcite-table': { fn: buildCalciteTable, props: { hasHeader: true, rows: [[]] } },
        'calcite-button': { fn: buildCalciteButton, props: { txt: 'test' } },
        'calcite-select': { fn: buildCalciteSelect, props: { heading: 'test', onSelChange: vi.fn() } },
        'calcite-dropdown': { fn: buildCalciteDropdown, props: { heading: 'test', onSelChange: vi.fn() } },
        'calcite-block': { fn: buildCalciteSelectBlock, props: { heading: 'test', selProps: { heading: 'test', onSelChange: vi.fn() } } },
        'calcite-action-bar': { fn: buildCalciteActionBar, props: {}},
    };
    for (const [tag, f] of Object.entries(factories)) {
        it(`returns a ${tag} element`, async () => {
            let el: any;
            if (f.fn.constructor.name.toLowerCase().includes('async')) {
                el = await (f.fn(f.props));
            } else {
                el = f.fn(f.props);
            }
            expect(el.tagName.toLowerCase()).toBe(tag);
        });
    }
});

describe('buildCalcitePanel() edge cases', () => {
    it('appends a child element to the panel if elementType is passed', () => {
        const panel = buildCalcitePanel({ elementType: 'div' });
        expect(panel.children.length).toBe(1);
    });
    it('appends no children to the panel when elementType is not passed', () => {
        const panel = buildCalcitePanel({});
        expect(panel.children.length).toBe(0);
    });
    it('adds a css class if cssClass is passed', () => {
        const panel = buildCalcitePanel({ cssClass: 'test' });
        expect(panel.classList.length).toBe(1);
    });
    it('classList is empty if cssClass is not passed', () => {
        const panel = buildCalcitePanel({});
        expect(panel.classList.length).toBe(0);
    });
});

describe('buildCalciteAction()', () => {
    const props = {
        id: 'test',
        icon: 'test',
        text: 'test',
    } as calciteActionProps;
    it('returns an action and tooltip element when tooltip props are passed', () => {
        const result = buildCalciteAction({ ...props, tooltipProps: { text: 'test' } });
        expect(result.action.tagName.toLowerCase()).toBe('calcite-action');
        expect(result.tooltip).toBeDefined();
        expect(result.tooltip?.tagName.toLowerCase()).toBe('calcite-tooltip');
    });

    it('returned tooltip is null when tooltip props are not passed', () => {
        const result = buildCalciteAction(props);
        expect(result.tooltip).toBeNull();
    });
});

describe('buildCalciteActionBarWithActions()', () => {
    const actionsWith = 3;
    const actionsWithout = 2;
    const mockPropId = 't';
    const mockProp = { id: mockPropId, icon: 't', text: 't' };
    const mockActionProps: calciteActionProps[] = Array(actionsWith).fill({ ...mockProp, tooltipProps: { text: 't' } });
    mockActionProps.push(...Array(actionsWithout).fill(mockProp));
    const props = {
        id: 'test',
        icon: 'test',
        text: 'test',
    } as calciteActionBarProps;

    describe('test tooltip behavior', () => {
        it('returns appropiate number of tooltips when "actionsProps" prop is passed', () => {
            const result = buildCalciteActionBarWithActions({ ...props, actionsProps: mockActionProps });
            expect(result.tooltips).not.toBeNull();
            expect(result.tooltips?.length).toBe(actionsWith);
        });

        it('tooltips array is null when "actionsProps" is not passed', () => {
            const result = buildCalciteActionBarWithActions(props);
            expect(result.tooltips).toBeNull();
        });
    });
    
    describe('test hide button behavior', () => {
        const getHideBtn = (rtn: calciteActionBarWithTooltips, id: string) => rtn.actionBar.querySelector(id);

        it('appends a hide button with custom properties if actionProps are passed as hideBtn', () => {
            const result = buildCalciteActionBarWithActions({ ...props, hideBtn: mockProp });
            expect(getHideBtn(result, mockPropId)).toBeDefined();
        });

        it('appends a hide button with default properties if true is passed as hideBtn', () => {
            const result = buildCalciteActionBarWithActions({ ...props, hideBtn: true });
            expect(getHideBtn(result, defaultHideBtnId)).toBeDefined();
        });

        it('does not append a hide button if hideBtn is not passed', () => {
            const result = buildCalciteActionBarWithActions(props);
            expect(getHideBtn(result, defaultHideBtnId)).toBeNull();
        });

        it('does not append a hide button if false is passed as hideBtn', () => {
            const result = buildCalciteActionBarWithActions({ ...props, hideBtn: false });
            expect(getHideBtn(result, defaultHideBtnId)).toBeNull();
        });

        describe('hides all actions in actionBar except the hide button', () => {
            let actions: HTMLCalciteActionElement[];
            let hiddenBefore: HTMLCalciteActionElement[];
            let hiddenAfterOne: HTMLCalciteActionElement[];
            let hiddenAfterTwo: HTMLCalciteActionElement[];

            const filterHidden = () => actions.filter((a) => a.hidden);

            beforeAll(async () => {
                const result = buildCalciteActionBarWithActions({ ...props, hideBtn: true, actionsProps: mockActionProps });
                actions = Array.from(result.actionBar.querySelectorAll('calcite-action'));
                hiddenBefore = filterHidden();

                // hide all actions
                await hideActionBar(result.actionBar);
                hiddenAfterOne = filterHidden();

                // re show all actions
                await hideActionBar(result.actionBar);
                hiddenAfterTwo = filterHidden();
            });

            it('no actions hidden before calling hideActionBar', () => {
                expect(hiddenBefore.length).toBe(0);
            });

            // after call, there all actions should be hidden except for the hideBtn itself
            it('all actions except hideBtn are hidden after calling hideActionBar once', () => {
                expect(hiddenAfterOne.length).toBe(actions.length - 1);
            });

            it('no actions hidden after calling hideActionBar twice', () => {
                expect(hiddenAfterTwo.length).toBe(0);
            });
        });
    });
});