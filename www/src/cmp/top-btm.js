export const TAG = 'top-btm';
export const CHANGE_SIZE_AT = 900;
function newHdrEl(lbl, short, href, items) {
    return {
        item: {
            lbl,
            short: short ? short : lbl,
            href
        },
        items,
    };
}
export class TopBtm extends HTMLElement {
    constructor() {
        super();
        this.tag = TAG;
        this.hdrItems = [
            newHdrEl("Developed by Justin DeKock", "About me"),
            newHdrEl("About me"),
            newHdrEl("About the project", "About", "/about"),
            newHdrEl("Sources/references", "Sources"),
            newHdrEl("Source code", "Source code", "https://github.com/jdetok/stlmetromap"),
        ];
        const root = this.attachShadow({ mode: 'open' });
        root.append(this.buildDiv(), this.addStyling());
    }
    buildDiv() {
        const div = document.createElement('div');
        for (const i of this.hdrItems) {
            const elType = i.item.href ? 'a' : 'p';
            let el = document.createElement(elType);
            el.textContent = (window.innerWidth < CHANGE_SIZE_AT) ? i.item.short : i.item.lbl;
            if (i.item.href) {
                el = el;
                el.href = i.item.href;
            }
            div.appendChild(el);
        }
        return div;
    }
    addStyling() {
        const style = document.createElement('style');
        style.textContent = STYLE;
        return style;
    }
}
;
const STYLE = `
:host {
    display: block;
    width: 100%;
    margin: 0 auto;
    margin-top: .5rem;
}
div {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    width: 100%;
    align-items: center;
    margin: 0 auto;
}

a, p {
    text-align: center;
}
`;
