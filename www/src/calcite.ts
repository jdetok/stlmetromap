import LocalBasemapsSource from "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource.js";
// HELPER FOR BUIDING GENERIC CALCITE PANEL WITH THE PASSED ELEMENT AS ITS CHILD
export function buildCalcitePanel(elementType: string, heading: string, baseMaps?: LocalBasemapsSource): HTMLCalcitePanelElement {
    const panel = document.createElement("calcite-panel");
    panel.heading = heading;
    panel.hidden = true;

    const content = document.createElement(elementType) as any;
    if (!content) throw new Error(`couldn't create element of type ${elementType}`);
    if (baseMaps) {
        content.source = baseMaps;
    }
    panel.appendChild(content);
    return panel;
}
export function buildCalciteLegendPanel(heading: string): HTMLCalcitePanelElement {
    const panel = document.createElement("calcite-panel");
    panel.heading = heading;
    panel.hidden = true;
    const content = document.createElement('arcgis-legend');
    panel.append(content);
    return panel;
}

export type calciteSliderBlock = {
    heading: string,
    sliderProps: Partial<HTMLCalciteSliderElement>,
    onInput: (val: number) => Promise<void>,
    cssClass?: string,
    noticeTxt?: string,
};
export function buildCalciteSliderBlock(props: calciteSliderBlock): { block: HTMLCalciteBlockElement, slider: HTMLCalciteSliderElement } { 
    const block = Object.assign(document.createElement('calcite-block'), {
        heading: props.heading,
        open: true,
        className: props.cssClass ?? '',
    });
    const slider = Object.assign(document.createElement('calcite-slider'), { ...props.sliderProps });
    slider.addEventListener('calciteSliderInput', async () => props.onInput(slider.value as number));
    block.append(slider);
    return { block, slider};
};
export function buildCalciteTableBlock(
    label: string, props: any, collapsible: boolean, open: boolean,
    buildTable: (props: unknown) => HTMLCalciteTableElement,
    infoContent?: string
): HTMLCalciteBlockElement {
    const block = Object.assign(document.createElement('calcite-block'), {
        heading: label,
        label: label,
        collapsible: collapsible,
        open: open,
        headingLevel: 2
    });

    if (infoContent) {
        const notice = buildCalciteNotice(label, infoContent);
        block.appendChild(notice.btn);
        block.appendChild(notice.notice);
    }

    block.appendChild(buildTable(props));
    return block;
}

// calcite notice with info button
// closable block for medium amounts of text, naturally expands its container
export function buildCalciteNotice(label: string, content: string): {
    notice: HTMLCalciteNoticeElement, btn: HTMLCalciteActionElement
} {
    const actId = `popover-trigger-${label.replace(/\s+/g, '-')}`;
    const btn = Object.assign(document.createElement('calcite-action'), {
        slot: 'control',
        icon: 'information',
        text: 'Info',
        id: actId,
        scale: 'm',
    });

    const notice = Object.assign(document.createElement('calcite-notice'), {
        open: false,
        kind: 'info',
        scale: 's',
        closable: true,
    });

    // toggle notice on button click
    btn.addEventListener('click', () => {
        notice.open = !notice.open;
    });
    
    notice.appendChild(Object.assign(document.createElement('div'), {
        slot: 'message',
        innerText: content,
    }));

    return {notice: notice, btn: btn};
}

// build a single calcite button
function buildCalciteButton(txt: string, appearance?: string, scale?: string): HTMLCalciteButtonElement {
    const btn = Object.assign(document.createElement("calcite-button"), {
        textContent: txt.trim(),
        appearance: appearance?.trim() ?? "outline",
        scale: scale?.trim() ?? "s",
    });
    btn.setAttribute("appearance", "outline");
    btn.setAttribute("scale", "s");
    return btn;
}
export function makeRoutesButtons(routeNames: string,
    onRouteClick: (route: string) => void,
    onRoutesClick: (route: string | string[]) => void
): HTMLCalciteButtonElement[] {
    let routeBtns: HTMLCalciteButtonElement[] = [];
    if (routeNames) {
        routeNames.split(", ").forEach((route: string) => {
            if (route.includes("No bus stop")) return;
            const btn = buildCalciteButton(route);
            btn.addEventListener("click", () => onRouteClick(route.trim()));
            routeBtns.push(btn);
        });
        if (routeBtns.length > 1) {
            const allBtn = buildCalciteButton("Highlight Each");
            allBtn.addEventListener("click", () => {
                const routes = routeNames.split(", ").map(r => r.trim());
                onRoutesClick(routes);
            });
            routeBtns.push(allBtn)
        }
    }
    return routeBtns;
}

// tooltips
type tooltipPlacements = "left" | "right" | "auto" | "top" | "auto-start" | "auto-end" | "top-start" |
    "top-end" | "bottom" | "bottom-start" | "bottom-end" | "right-start" | "right-end" | "left-start" |
    "left-end" | "leading-start" | "leading" | "leading-end" | "trailing-end" | "trailing" | "trailing-start";
export type calciteTooltipProps = {
    text: string,
    refElId?: string,
    placement?: tooltipPlacements,
};
export function buildCalciteTooltip(props: calciteTooltipProps): HTMLCalciteTooltipElement {
    const tooltip = document.createElement("calcite-tooltip");
    tooltip.referenceElement = props.refElId ?? "";
    tooltip.textContent = props.text;
    tooltip.placement = props.placement ?? "bottom";
    tooltip.overlayPositioning = "fixed";
    return tooltip;
};
export type calciteActionProps = {
    id: string,
    icon: string,
    text: string,
    where?: string,
    highlightName?: string,
    onClick?: () => Promise<void>,
    tooltipProps?: calciteTooltipProps,
}
// return action with or without a tooltip. tooltip must be appended to the root as well
export type calciteActionReturn = {
    action: HTMLCalciteActionElement,
    tooltip: HTMLCalciteTooltipElement | null,
}
export function buildCalciteAction(props: calciteActionProps): calciteActionReturn { 
    const btnId = `toggle-action-${props.id}`;
    const action = Object.assign(document.createElement('calcite-action'), {
        id: btnId,
        icon: props.icon,
        text: props.text,
    })
    action.dataset.actionId = props.id;
    if (props.onClick) {
        action.addEventListener("click", props.onClick);
    }
    const tooltip = props.tooltipProps ? buildCalciteTooltip(props.tooltipProps) : null;
    if (props.tooltipProps && tooltip) {
        tooltip.referenceElement = btnId;
    }
    return { action, tooltip }
};

// calcite select helpers
export type calciteOptionProps = {
    value: string,
    label: string,
}
export type calciteSelectProps = {
    heading: string,
    onSelChange: (val: string) => void,
    cssClass?: string,
    optsProps?: {
        allOpt?: calciteOptionProps,
        dataUrl?: string,
        mapFeatures: (features: any[]) => any[],
    },
}
export async function buildCalciteSelect(props: calciteSelectProps): Promise<HTMLCalciteSelectElement> {
    const sel = Object.assign(document.createElement('calcite-select'), {
        heading: props.heading,
        label: props.heading,
    });
    if (props.cssClass) sel.classList.add(props.cssClass);
    sel.addEventListener('calciteSelectChange', () => props.onSelChange(sel.value));

    if (props.optsProps) {
        let builtOpts: HTMLCalciteOptionElement[] = [];
        
        // all option
        if (props.optsProps.allOpt) {
            builtOpts.push(Object.assign(document.createElement('calcite-option'), {
                label: props.optsProps.allOpt.label,
                value: props.optsProps.allOpt.value,
            }));
        }
        if (props.optsProps.dataUrl) {
            try {
                const data = await fetch(props.optsProps.dataUrl).then(r => r.json());
                const opts = props.optsProps.mapFeatures(data.features);
                for (const opt of opts) {
                    builtOpts.push(Object.assign(document.createElement('calcite-option'), {
                        label: opt,
                        value: opt,
                    }));
                }
            } catch (e) {
                throw new Error(`failed to fetch data from ${props.optsProps.dataUrl}: ${e}`);
            }
        }
        if (builtOpts.length === 0) {
            throw new Error('no options');
        }
        sel.append(...builtOpts);
    }
    return sel;
}