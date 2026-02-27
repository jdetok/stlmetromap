export const TAG = 'site-ttl';

export class SiteTTL extends HTMLElement {
    constructor() {
        super()
        const root = this.attachShadow({ mode: 'open' })
        root.append(this.buildH1(), this.addStyling());
}
    buildH1(): HTMLHeadingElement {
        const h1 = document.createElement('h1');
        const slot = document.createElement('slot');
        h1.append(slot);
        return h1;
    }
    addStyling(): HTMLStyleElement {
        const style = document.createElement('style');
        style.textContent = STYLE;
        return style;
    }
}

const STYLE = `
:host {
    display: block;
    width: 100%;
    margin-top: .5rem;
}
h1 {
    margin: 0 auto;
    text-align: center;
    font-size: 1.8rem;
}
`;

