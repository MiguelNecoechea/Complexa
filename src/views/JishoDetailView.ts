import { JishoEntry } from "../models/Jisho";

export default class JishoDetailView {
    private panel: HTMLElement = ensureJishoPanel();
    private backBtn: HTMLButtonElement = this.panel.querySelector<HTMLButtonElement>("#jp-back-btn")!;
    private head: HTMLElement   = this.panel.querySelector<HTMLElement>("#jp-d-head")!;
    private read: HTMLElement   = this.panel.querySelector<HTMLElement>("#jp-d-read")!;
    private defs: HTMLElement   = this.panel.querySelector<HTMLElement>("#jp-d-defs")!;

    constructor(private onBack: () => void) {
        this.backBtn.onclick = (e: MouseEvent): void => { e.stopPropagation(); this.hide(); this.onBack(); };
    }

    show(entry: JishoEntry): void {
        this.head.textContent = entry.slug;
        this.read.textContent = entry.reading;

        this.defs.innerHTML = "";

        entry.senses[0].english.forEach(def =>
            this.defs.insertAdjacentHTML("beforeend", `<li>${def}</li>`));

        this.panel.classList.add("show");
    }

    hide(): void {
        this.panel.classList.remove("show");
    }
}

function ensureJishoPanel(): HTMLElement {
    let node: HTMLElement | null = document.getElementById("jisho-panel");
    if (node) return node;

    node = document.createElement("section");
    node.id = "jisho-panel";
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");
    node.innerHTML = `
    <button id="jp-back-btn" class="jp-btn back">← Back</button>
    <h2 id="jp-d-head"></h2>
    <p  id="jp-d-read" class="reading"></p>
    <ul id="jp-d-defs" class="defs"></ul>`;
    document.body.appendChild(node);

    const css: HTMLStyleElement = document.createElement("style");
    css.textContent = `
    #jisho-panel {position:fixed;inset:0;z-index:2147483648;
      background:var(--tooltip-bg);backdrop-filter:blur(10px) saturate(150%);
      color:var(--tooltip-text);padding:24px 32px;display:flex;
      flex-direction:column;gap:12px;opacity:0;pointer-events:none;
      transform:translateY(16px);transition:all .2s ease;}
    #jisho-panel.show{opacity:1;pointer-events:auto;transform:none;}
    #jisho-panel .reading{font-size:1.2rem;font-style:italic;}
    #jisho-panel .defs{list-style:disc;padding-left:1.2rem;}
    #jp-back-btn.back{align-self:flex-start;background:#6c757d;color:#fff;}
  `;
    document.head.appendChild(css);
    return node;
}