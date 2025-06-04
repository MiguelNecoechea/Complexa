import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel";
import { Token, MorphFeatures } from "../models/JapaneseTokens";

const HOVER_ELEMENTS = {
    TOOLTIP: "tooltip",
};

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
    private tooltip = document.getElementById(HOVER_ELEMENTS.TOOLTIP);

    constructor() {
        if (!this.tooltip) {
            throw new Error(
                "HoverView.html must be injected before HoverTokenView loads",
            );
        }

        this.attachListeners();
    }

    private attachListeners(): void {
        // Hover in
        document.addEventListener("mouseover", (e) => {
            const span = (e.target as HTMLElement).closest(
                "span[data-pos]",
            ) as HTMLSpanElement | null;
            if (!span) return;
            this.show(span);
        });

        // Hover out
        document.addEventListener("mouseout", (e) => {
            const intoTooltip = (
                e.relatedTarget as HTMLElement | null
            )?.closest(`#${HOVER_ELEMENTS.TOOLTIP}`);

            if (!intoTooltip) this.hide();
        });
    }

    private show(span: HTMLSpanElement): void {
        const vm = new HoverTokenViewModel(this.spanToToken(span));
        this.bind(vm);

        requestAnimationFrame(() => {
            if (this.tooltip != null) {
                const { left, top, width } = span.getBoundingClientRect();
                const ttW = this.tooltip.offsetWidth,
                    ttH = this.tooltip.offsetHeight;

                let x = left + width / 2 - ttW / 2 + window.scrollX;
                let y = top - ttH - 8 + window.scrollY;

                x = Math.max(
                    4,
                    Math.min(
                        x,
                        window.scrollX +
                            document.documentElement.clientWidth -
                            ttW -
                            4,
                    ),
                );
                y = Math.max(window.scrollY + 4, y);
                Object.assign(this.tooltip.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                    opacity: "1",
                    transform: "translateY(0)",
                });
            }
        });
    }

    private hide(): void {
        if (this.tooltip != null) {
            Object.assign(this.tooltip.style, {
                opacity: "0",
                transform: "translateY(6px)",
            });
        }
    }

    private spanToToken(span: HTMLSpanElement): Token {
        return {
            surface: span.textContent || "",
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
