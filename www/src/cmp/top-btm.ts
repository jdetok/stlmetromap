export const TAG = 'top-btm';

export class TopBtm extends HTMLElement {
    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        const div = document.createElement('div');
        const slot = document.createElement('slot');
        div.appendChild(slot);
        
        root.append(div, this.addStyling());
        this.style.display = 'block';
    }
    addStyling(): HTMLStyleElement {
        const style = document.createElement('style');
        style.textContent = STYLE;
        return style;
    }
};

const STYLE = `
:host {
    display: none;
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

::slotted(a),
::slotted(p) {
    text-align: center;
}
`;
