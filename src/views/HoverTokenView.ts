// views/HoverTokenView.ts
import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel";
import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";
import { JishoService } from "../services/JishoService";
import { JishoEntry } from "../models/Jisho";

const GAP = 8;
const TIMEOUT = 69;

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
    SEARCH_BTN: "jp-search-btn",
};

export default class HoverTokenView {
    private tooltip: HTMLElement = mustId("tooltip");
    private activeSpan: HTMLSpanElement | null = null;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private isLocked: boolean = false;
    private dictionaryMode: boolean = false;
    private hideTimer: number | null = null;

    private vm: HoverTokenViewModel = new HoverTokenViewModel(new JishoService(), FilterTokens);

    constructor() {
        this.attachListeners();
        new ResizeObserver((): void => this.reposition()).observe(this.tooltip);
    }

    private attachListeners(): void {
        document.addEventListener("pointerover", (e: PointerEvent): void => {
            if (this.isLocked) return;
            const span = (e.target as Element | null)?.closest?.("span[data-pos]") as HTMLSpanElement | null;
            if (span && this.hideTimer !== null) { clearTimeout(this.hideTimer); this.hideTimer = null; }
            if (span) this.activate(span);
        });

        document.addEventListener("pointermove", (e: PointerEvent): void => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (this.hideTimer && this.isOverBridge(e.clientX, e.clientY)) {
                clearTimeout(this.hideTimer); this.hideTimer = null; return;
            }
            const tgt = e.target as Element | null;
            if (
                !this.hideTimer && !this.isLocked && !this.dictionaryMode &&
                !tgt?.closest?.("#tooltip") &&
                !tgt?.closest?.("span[data-pos]") &&
                !this.isOverBridge(e.clientX, e.clientY)
            ) {
                this.hideTimer = window.setTimeout((): void => this.tryHide(), TIMEOUT);
            }
        });

        document.addEventListener("pointerout", (e: PointerEvent): void => {
            if (this.isLocked || this.dictionaryMode) return;

            const fromSpan = (e.target as Element | null)?.closest?.("span[data-pos]") as Element | null;
            const intoTip = (e.relatedTarget as Element | null)?.closest?.("#tooltip");

            if (fromSpan && fromSpan === this.activeSpan && !intoTip) {
                this.hideTimer = window.setTimeout(() => this.tryHide(), TIMEOUT);
            }
        });

        document.addEventListener("click", (e: MouseEvent) => this.handleClick(e));
        window.addEventListener("scroll", () => this.trackUnderCursor(), true);
        window.addEventListener("resize", () => this.trackUnderCursor());

        this.tooltip.addEventListener("pointerenter", () => {
            if (this.hideTimer !== null) { clearTimeout(this.hideTimer); this.hideTimer = null; }
            this.isLocked = true;
        });

        this.tooltip.addEventListener("pointerleave", (e: PointerEvent) => {
            const intoSpan = (e.relatedTarget as Element | null)?.closest?.("span[data-pos]") as HTMLSpanElement | null;
            if (intoSpan && intoSpan === this.activeSpan) { this.isLocked = false; return; }
            if (this.dictionaryMode) return;
            this.isLocked = false;
            this.hideTimer = window.setTimeout(() => this.tryHide(), TIMEOUT);
        });

        mustId("jp-back-btn").addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            this.hideJisho();
        });
    }

    private activate(span: HTMLSpanElement): void {
        this.hideJisho();
        this.activeSpan = span;
        this.vm.setToken(this.spanToToken(span));
        this.bind();
        this.tooltip.style.opacity = "1";
        this.reposition();
    }

    private tryHide(): void {
        if (!this.isLocked && !this.dictionaryMode) this.hide();
    }

    private hide(): void {
        if (this.isLocked) return;
        this.activeSpan = null;
        this.vm.setToken(null);
        this.tooltip.style.opacity = "0";
        this.tooltip.style.transform = "translateY(6px)";
    }

    private trackUnderCursor(): void {
        if (this.isLocked) return;

        const elem = document.elementFromPoint(this.mouseX, this.mouseY) as Element | null;

        if (elem?.closest?.("#tooltip")) { this.reposition(); return; }

        const newSpan = elem?.closest?.("span[data-pos]") as HTMLSpanElement | null;

        if (!newSpan) return this.hide();

        if (newSpan !== this.activeSpan || !newSpan.isConnected) this.activate(newSpan);
        else this.reposition();
    }

    private handleClick(e: MouseEvent): void {
        const target = e.target as Element | null;
        const clickedInsideTooltip = !!target?.closest?.("#tooltip");
        const clickedSpan = target?.closest?.("span[data-pos]") as HTMLSpanElement | null;

        if (this.isLocked && !clickedInsideTooltip) {
            this.isLocked = false;
            this.hide();
            if (clickedSpan && clickedSpan === this.activeSpan) this.activate(clickedSpan);
            this.trackUnderCursor();
            return;
        }

        if (!this.isLocked && clickedSpan && clickedSpan === this.activeSpan) {
            this.isLocked = true;
            this.tooltip.style.opacity = "1";
            this.reposition();
        }
    }

    private reposition(): void {
        if (!this.activeSpan) return;

        const s: DOMRect = this.activeSpan.getBoundingClientRect();
        const t: DOMRect = this.tooltip.getBoundingClientRect();
        const vw: number = document.documentElement.clientWidth;
        const vh: number = document.documentElement.clientHeight;

        let x: number = s.left + s.width / 2 - t.width / 2;
        x = Math.max(4, Math.min(x, vw - t.width - 4));

        const above: number = s.top - t.height - 8;
        const below: number = s.bottom + 8;
        let y: number = above >= 4 ? above : Math.min(vh - t.height - 4, below);

        this.tooltip.style.left = `${Math.round(x)}px`;
        this.tooltip.style.top  = `${Math.round(y)}px`;
        this.tooltip.style.transform = "translateY(0)";
    }

    private isOverBridge(cx: number, cy: number): boolean {
        if (!this.activeSpan) return false;
        const s: DOMRect = this.activeSpan.getBoundingClientRect();
        const t: DOMRect = this.tooltip.getBoundingClientRect();
        const minX: number = Math.min(s.left, t.left) - GAP;
        const maxX: number = Math.max(s.right, t.right) + GAP;
        const minY: number = Math.min(s.top, t.top) - GAP;
        const maxY: number = Math.max(s.bottom, t.bottom) + GAP;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    }

    private bind(): void {
        // simple one-shot binding (no reactive framework needed)
        mustId(BINDINGS.SURFACE).textContent = this.vm.surface;
        mustId(BINDINGS.READING).textContent = this.vm.reading;
        mustId(BINDINGS.LEMMA).textContent   = this.vm.lemma;
        mustId(BINDINGS.POS).textContent     = this.vm.pos;
        mustId(BINDINGS.TAG).textContent     = this.vm.tag;
        mustId(BINDINGS.DEP).textContent     = this.vm.dep;
        mustId(BINDINGS.HEAD).textContent    = this.vm.head;
        mustId(BINDINGS.OFFSET).textContent  = this.vm.offset;
        mustId(BINDINGS.IOB).textContent     = this.vm.iob;
        mustId(BINDINGS.ENTITY).textContent  = this.vm.entity;
        mustId(BINDINGS.MORPH).textContent   = this.vm.morph;

        const excludeBtn: HTMLButtonElement = mustId<HTMLButtonElement>("jp-exclude-btn");
        const searchBtn: HTMLButtonElement = mustId<HTMLButtonElement>(BINDINGS.SEARCH_BTN);


        const allowedLinguisticParts: string[] = ["NOUN", "VERB", "ADJ", "ADV"];
        searchBtn.style.display = allowedLinguisticParts.includes(this.vm.pos) ? "inline-block" : "none";

        excludeBtn.onclick = async (e: MouseEvent): Promise<void> => {
            e.stopPropagation();
            const surface: string = await this.vm.exclude();

            if (surface && this.activeSpan) this.activeSpan.replaceWith(document.createTextNode(surface));

            this.hide();
        };

        searchBtn.onclick = async (e: MouseEvent): Promise<void> => {
            e.stopPropagation();
            try {
                const entry: JishoEntry = await this.vm.lookup();
                this.showJisho(entry);
            } catch (err) {
                console.error(err);
                alert("Lookup failed.");
            }
        };
    }

    private showJisho(entry: JishoEntry): void {
        this.tooltip.classList.add("dictionary-mode");
        mustId("jp-d-head").textContent = entry.slug;
        mustId("jp-d-read").textContent =
            (this.activeSpan?.dataset.reading) || entry.slug;
        const defs: HTMLElement = mustId("jp-d-defs");
        defs.innerHTML = "";
        entry.senses[0].english_definitions.forEach((def: string): void =>
            defs.insertAdjacentHTML("beforeend", `<li>${def}</li>`)
        );
        this.dictionaryMode = true;
        requestAnimationFrame((): void => this.reposition());
    }

    private hideJisho(): void {
        this.tooltip.classList.remove("dictionary-mode");
        mustId("jp-d-head").textContent = "";
        mustId("jp-d-read").textContent = "";
        mustId("jp-d-defs").innerHTML = "";
        this.dictionaryMode = false;
        requestAnimationFrame((): void => this.reposition());
    }

    private spanToToken(span: HTMLSpanElement): Token {
        return {
            surface: span.dataset.surface || "",
            reading: span.dataset.reading || "",
            lemma:   span.dataset.lemma   || "",
            pos:     span.dataset.pos     || "",
            tag:     span.dataset.tag     || "",
            dep:     span.dataset.dep     || "",
            head:    span.dataset.head    || "",
            morph:   span.dataset.morph ? JSON.parse(span.dataset.morph) as MorphFeatures : ({} as MorphFeatures),
            offset:  span.dataset.offset ? parseInt(span.dataset.offset, 10) : 0,
            ent_iob: span.dataset.ent_iob || "",
            ent_type:span.dataset.ent_type|| "",
            is_japanese: span.dataset.is_japanese || "false",
        };
    }
}

function mustId<T extends HTMLElement = HTMLElement>(s: string): T {
    const el = document.getElementById(s) as T | null;
    if (!el) throw new Error(`Required element #${s} not found`);
    return el;
}
