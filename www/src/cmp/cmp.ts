import * as mw from "./map-window.js";
import * as tb from "./top-btm.js";

const COMPONENTS = [
    {
        tag: mw.TAG,
        cls: mw.MapWindow,
    },
    {
        tag: tb.TAG,
        cls: tb.TopBtm,
    }
]

export function declareCustomElements() {
    for (const c of COMPONENTS) {
        console.trace(`defining element with tag ${c.tag}`);
        customElements.define(c.tag, c.cls);
    }
}