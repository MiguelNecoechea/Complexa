import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel";
import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";

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
    private skipNextMove = false;

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
            if (this.skipNextMove) {
                this.skipNextMove = false;
                return;
            }

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (this.skipNextMove) {
                this.skipNextMove;
                return;
            }

            this.trackUnderCursor();
        });

        document.addEventListener("pointerout", (e) => {
            if (this.isLocked) return;

            const fromSpan = (e.target as HTMLElement).closest(
                "span[data-pos]",
            );
            const toSpan = (e.relatedTarget as HTMLElement | null)?.closest(
                "span[data-pos]",
            );
            const intoTip = (e.relatedTarget as HTMLElement | null)?.closest(
                "#tooltip",
            );

            if (fromSpan && !toSpan && !intoTip) this.hide();
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

        if (this.skipNextMove) {
            this.skipNextMove = false;
            return;
        }

        const elem = document.elementFromPoint(
            this.mouseX,
            this.mouseY,
        ) as HTMLElement | null;

        if (elem?.closest("#tooltip")) {
            this.reposition();
            return;
        }

        const newSpan = elem?.closest(
            "span[data-pos]",
        ) as HTMLSpanElement | null;

        if (!newSpan) return this.hide();
        if (newSpan !== this.activeSpan || !newSpan.isConnected)
            this.activate(newSpan);
        else this.reposition();
    }

    private handleClick(e: MouseEvent) {
        const clickedInsideTooltip =
            (e.target as HTMLElement).closest("#tooltip") !== null;

        const clickedSpan = (e.target as HTMLElement).closest(
            "span[data-pos]",
        ) as HTMLElement | null;

        if (this.isLocked && !clickedInsideTooltip) {
            this.isLocked = false;
            this.hide();
            if (clickedSpan && clickedSpan === this.activeSpan) {
                this.activate(clickedSpan);
            }
            this.skipNextMove = true;
            return;
        }

        if (!this.isLocked && clickedSpan && clickedSpan === this.activeSpan) {
            this.isLocked = true;
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

        const btn = document.getElementById(
            "jp-exclude-btn",
        ) as HTMLButtonElement;
        btn.onclick = async (e) => {
            e.stopPropagation();
            await FilterTokens.instance.add(vm.surface);
            if (this.activeSpan) {
                this.activeSpan.replaceWith(
                    document.createTextNode(vm.surface),
                );
            }
            this.hide();
        };
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
