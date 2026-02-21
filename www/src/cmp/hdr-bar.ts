export const TAG = 'hdr-bar';
export const CHANGE_SIZE_AT = 900;

type listItem = {
    lbl: string;
    short: string;
    href?: string;
}

type hdrEl = {
    item: listItem;
    items?: listItem[]; 
};

function newHdrEl(lbl: string, short?: string, href?: string, items?: listItem[]): hdrEl {
    return {
        item: {
            lbl,
            short: short ? short : lbl,
            href
        },
        items, 
    };
}

export class HeadBar extends HTMLElement {
    public tag: string;
    public hdrItems: hdrEl[];
    constructor() {
        super();
        this.tag = TAG;

        this.hdrItems = [
            newHdrEl("About the developer", "About me"),
            newHdrEl("About the project", "About"),
            newHdrEl("Sources/references", "Sources"),
            newHdrEl("Source code", "Source code", "https://github.com/jdetok/stlmetromap"),
        ];

        const root = this.attachShadow({ mode: 'open' });
        root.append(this.buildDiv(), this.addStyling());
    }
    buildDiv(): HTMLDivElement {
        const div = document.createElement('div');
        for (const i of this.hdrItems) {
            const elType = i.item.href ? 'a' : 'p';
            let el = document.createElement(elType) as HTMLParagraphElement | HTMLAnchorElement;
            el.textContent = (window.innerWidth < CHANGE_SIZE_AT) ? i.item.short : i.item.lbl;
            if (i.item.href) {
                el = (el as HTMLAnchorElement);
                el.href = i.item.href
            }
            div.appendChild(el);
        }
        return div;
    }
    addStyling(): HTMLStyleElement {
        const style = document.createElement('style');
        style.textContent = STYLE;
        return style;
    }
};

const STYLE = `
:host {
    display: block;
    width: 100%;
}
div {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    width: 100%;
    align-items: center;
}

a, p {
    text-align: center;
}
`;
