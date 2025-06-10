import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel";
import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { finalization } from "node:process";

const BINDINGS = {
    SURFACE: "jp-surface",
    LEMMA: "jp-lemma",
    READING: "jp-reading",
    POS: "jp-pos",
    TAG: "jp-tag",
    DEP: "jp-dep",
    HEAD: "jp-head",
    OFFSET: "jp-offset",
    IOB: "jp-iob",
    ENTITY: "jp-entity",
    MORPH: "jp-morph",
};

export default class HoverTokenView {
    private tooltip = ensureTooltip();
    private activeSpan: HTMLSpanElement | null = null;
    private mouseX = 0;
    private mouseY = 0;
    private isLocked = false;

    constructor() {
        this.attachListeners();
    }

    private attachListeners(): void {
        document.addEventListener("pointerover", (e) => {
            if (this.isLocked) return;

            const span = (e.target as HTMLElement).closest(
                "span[data-pos]",
            ) as HTMLSpanElement | null;
            if (span) this.activate(span);
        });

        document.addEventListener("pointermove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.trackUnderCursor();
        });

        document.addEventListener("pointerout", (e) => {
            if (!(e.relatedTarget as Element | null) && !this.isLocked)
                this.hide();
        });

        document.addEventListener("click", (e) => this.handleClick(e));

        window.addEventListener("scroll", () => this.trackUnderCursor(), true);
        window.addEventListener("resize", () => this.trackUnderCursor());
    }

    private activate(span: HTMLSpanElement) {
        this.activeSpan = span;
        this.bind(new HoverTokenViewModel(this.spanToToken(span)));
        this.tooltip.style.opacity = "1";
        this.reposition();
    }

    private hide() {
        if (this.isLocked) return;

        this.activeSpan = null;
        this.tooltip.style.opacity = "0";
        this.tooltip.style.transform = "translateY(6px)";
    }

    private trackUnderCursor() {
        if (this.isLocked) return;

        const elem = document.elementFromPoint(
            this.mouseX,
            this.mouseY,
        ) as HTMLElement | null;
        const newSpan = elem?.closest(
            "span[data-pos]",
        ) as HTMLSpanElement | null;

        if (!newSpan) return this.hide();
        if (newSpan !== this.activeSpan || !newSpan.isConnected)
            this.activate(newSpan);
        else this.reposition();
    }

    private handleClick(e: MouseEvent) {
        const clickedSpan = (e.target as HTMLElement).closest(
            "span[data-pos]",
        ) as HTMLSpanElement | null;

        if (this.isLocked) {
            this.hide();
            this.isLocked = false;
            return;
        }

        if (clickedSpan && clickedSpan === this.activeSpan) {
            this.isLocked = !this.isLocked;
            this.tooltip.style.opacity = "1";
            this.reposition();
        }
    }

    private reposition() {
        if (!this.activeSpan) return;

        const { left, top, width, height } =
            this.activeSpan.getBoundingClientRect();
        if (height === 0) return this.hide();

        const w = this.tooltip.offsetWidth;
        const h = this.tooltip.offsetHeight;

        let x = left + width / 2 - w / 2;
        let y = top - h - 8;

        const vw = document.documentElement.clientWidth;
        x = Math.max(4, Math.min(x, vw - w - 4));
        y = y < 4 ? top + height + 8 : y;

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
        this.tooltip.style.transform = "translateY(0)";
    }

    private spanToToken(span: HTMLSpanElement): Token {
        return {
            surface: span.dataset.surface || "",
            reading: span.dataset.reading || "",
            lemma: span.dataset.lemma || "",
            pos: span.dataset.pos || "",
            tag: span.dataset.tag || "",
            dep: span.dataset.dep || "",
            head: span.dataset.head || "",
            morph: span.dataset.morph
                ? (JSON.parse(span.dataset.morph) as MorphFeatures)
                : ({} as MorphFeatures),
            offset: span.dataset.offset ? parseInt(span.dataset.offset, 10) : 0,
            ent_iob: span.dataset.ent_iob || "",
            ent_type: span.dataset.ent_type || "",
        };
    }

    private bind(vm: HoverTokenViewModel): void {
        id(BINDINGS.SURFACE).textContent = vm.surface;
        id(BINDINGS.READING).textContent = vm.reading;
        id(BINDINGS.LEMMA).textContent = vm.lemma;
        id(BINDINGS.POS).textContent = vm.pos;
        id(BINDINGS.TAG).textContent = vm.tag;
        id(BINDINGS.DEP).textContent = vm.dep;
        id(BINDINGS.HEAD).textContent = vm.head;
        id(BINDINGS.OFFSET).textContent = vm.offset;
        id(BINDINGS.IOB).textContent = vm.iob;
        id(BINDINGS.ENTITY).textContent = vm.entity;
        id(BINDINGS.MORPH).textContent = vm.morph;
    }
}

// Helper for the binding.
function id<T extends HTMLElement>(s: string): T {
    return document.getElementById(s) as T;
}

// Helper for injecting
function ensureTooltip(): HTMLElement {
    let node = document.getElementById("tooltip");
    if (!node) {
        node = document.createElement("div");
        node.id = "tooltip";
        node.className = "jp-tooltip";
        node.innerHTML = /* html */ `<table><tbody>…your <tr>s…</tbody></table>`;
        document.body.appendChild(node);
    }
    return node;
}
