import * as mw from "./map-window.js";
import * as hb from "./hdr-bar.js";

const COMPONENTS = [
    {
        tag: mw.TAG,
        cls: mw.MapWindow,
    },
    {
        tag: hb.TAG,
        cls: hb.HeadBar,
    }
]

export function declareCustomElements() {
    for (const c of COMPONENTS) {
        console.trace(`defining element with tag ${c.tag}`);
        customElements.define(c.tag, c.cls);
    }
}