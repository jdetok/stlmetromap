import LocalBasemapsSource from "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource.js";
// HELPER FOR BUIDING GENERIC CALCITE PANEL WITH THE PASSED ELEMENT AS ITS CHILD
export function buildCalcitePanel(elementType: string, heading: string, baseMaps?: LocalBasemapsSource): HTMLCalcitePanelElement {
    const panel = document.createElement("calcite-panel");
    panel.heading = heading;
    panel.hidden = true;

    const content = document.createElement(elementType) as any;
    if (baseMaps) {
        content.source = baseMaps;
    }
    panel.appendChild(content);
    return panel;
}

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

function makeRtsBtn(txt: string): HTMLCalciteButtonElement {
    const btn = document.createElement("calcite-button");
    btn.textContent = txt.trim();
    btn.style.setProperty("--calcite-button-text-color", "black");
    btn.setAttribute("appearance", "outline");
    btn.setAttribute("scale", "s");
    return btn;
}
export function makeRoutesButtons(routeNames: string,
    onRouteClick: (route: string) => void,
    onRoutesClick: (route: string[]) => void
): HTMLCalciteButtonElement[] {
    let routeBtns: HTMLCalciteButtonElement[] = [];
    if (routeNames) {
        routeNames.split(", ").forEach((route: string) => {
            if (route.includes("No bus stop")) return;
            const btn = makeRtsBtn(route);
            btn.addEventListener("click", () => onRouteClick(route.trim()));
            routeBtns.push(btn);
        });
        if (routeBtns.length > 1) {
            const allBtn = makeRtsBtn("Highlight Each");
            allBtn.addEventListener("click", () => {
                const routes = routeNames.split(", ").map(r => r.trim());
                onRoutesClick(routes);
            });
            routeBtns.push(allBtn)
        }
    }
    return routeBtns;
}
