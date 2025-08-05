import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel";
import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";
import { ReadingMode } from "../content/linguisticsContents/JapaneseReadingContent";

import * as wanakana from "wanakana";
import {JishoEntry} from "../models/Jisho";

interface JishoLookupRequest {
    action: "JISHO_LOOKUP";
    word: string;
}

type JishoLookupResponse = | { ok: true;  data: { data: JishoEntry[] } } | { ok: false; err: unknown };

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
    private tooltip: HTMLElement = document.getElementById("tooltip")!;
    private activeSpan: HTMLSpanElement | null = null;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private isLocked: boolean = false;
    private skipNextMove: boolean = false;
    private dictionaryMode: boolean = false;
    private hideTimer: number | null = null;


    constructor() {
        this.attachListeners();
    }

    private attachListeners(): void {
        document.addEventListener("pointerover", (e: PointerEvent): void => {
            if (this.isLocked) return;

            const span = (e.target as HTMLElement).closest("span[data-pos]") as HTMLSpanElement | null;

            if (span && this.hideTimer !== null) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }

            if (span) this.activate(span);
        });

        document.addEventListener("pointermove", (e: PointerEvent): void => {
            if (this.hideTimer && this.isOverBridge(e.clientX, e.clientY)) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
                return;
            }
            if (
                !this.hideTimer && !this.isLocked && !this.dictionaryMode &&
                !(e.target as HTMLElement).closest("#tooltip") &&
                !(e.target as HTMLElement).closest("span[data-pos]") &&
                !this.isOverBridge(e.clientX, e.clientY)
            ) {
                this.hideTimer = window.setTimeout(() => this.tryHide(), TIMEOUT);
            }
        });

        document.addEventListener("pointerout", (e: PointerEvent): void => {

            if (this.isLocked || this.dictionaryMode) return;

            const fromSpan: Element | null = (e.target as HTMLElement).closest("span[data-pos]");
            const intoTip: Element | null | undefined  = (e.relatedTarget as HTMLElement | null)?.closest("#tooltip");

            if (fromSpan && fromSpan === this.activeSpan && !intoTip) {
                this.hideTimer = window.setTimeout(() => this.tryHide(), TIMEOUT);
            }
        });

        document.addEventListener("click", (e: MouseEvent): void => this.handleClick(e));
        window.addEventListener("scroll", (): void => this.trackUnderCursor(), true);
        window.addEventListener("resize", (): void => this.trackUnderCursor());

        this.tooltip.addEventListener("pointerenter", (): void => {
            if (this.hideTimer !== null) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            this.isLocked = true;
        });

        this.tooltip.addEventListener("pointerleave", (e: PointerEvent): void => {
            const intoSpan = (e.relatedTarget as HTMLElement | null)?.closest(
                "span[data-pos]") as HTMLSpanElement | null;

            if (intoSpan && intoSpan === this.activeSpan) {
                this.isLocked = false;
                return;
            }

            if (this.dictionaryMode) return;

            this.isLocked = false;
            this.hideTimer = window.setTimeout(() => this.tryHide(), TIMEOUT);
        });


        id("jp-back-btn").addEventListener("click", (e: MouseEvent): void => {
            e.stopPropagation();
            this.hideJisho();
        });
    }

    private activate(span: HTMLSpanElement): void {
        this.hideJisho();
        this.activeSpan = span;
        this.bind(new HoverTokenViewModel(this.spanToToken(span)));
        this.tooltip.style.opacity = "1";
        this.reposition();
    }

    private isOverBridge(cx: number, cy: number): boolean {
        if (!this.activeSpan) return false;

        const s: DOMRect = this.activeSpan.getBoundingClientRect();
        const t: DOMRect = this.tooltip.getBoundingClientRect();

        const minX: number = Math.min(s.left,  t.left ) - GAP;
        const maxX: number = Math.max(s.right, t.right) + GAP;
        const minY: number = Math.min(s.top,   t.top  ) - GAP;
        const maxY: number = Math.max(s.bottom,t.bottom)+ GAP;

        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    }

    private tryHide(): void {
        if (!this.isLocked && !this.dictionaryMode) this.hide();
    }

    private hide(): void {
        if (this.isLocked) return;

        this.activeSpan = null;
        this.tooltip.style.opacity = "0";
        this.tooltip.style.transform = "translateY(6px)";
    }

    private trackUnderCursor(): void {
        if (this.isLocked) return;

        if (this.skipNextMove) {
            this.skipNextMove = false;
            return;
        }

        const elem = document.elementFromPoint(this.mouseX, this.mouseY) as HTMLElement | null;

        if (elem?.closest("#tooltip")) {
            this.reposition();
            return;
        }

        const newSpan = elem?.closest("span[data-pos]") as HTMLSpanElement | null;

        if (!newSpan) return this.hide();
        if (newSpan !== this.activeSpan || !newSpan.isConnected) this.activate(newSpan);
        else this.reposition();
    }

    private handleClick(e: MouseEvent): void {
        const clickedInsideTooltip: boolean = (e.target as HTMLElement).closest("#tooltip") !== null;

        const clickedSpan = (e.target as HTMLElement).closest("span[data-pos]") as HTMLElement | null;

        if (this.isLocked && !clickedInsideTooltip) {
            this.isLocked = false;
            this.hide();
            if (clickedSpan && clickedSpan === this.activeSpan) this.activate(clickedSpan);

            this.skipNextMove = true;
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

        const { left, top, width, height } = this.activeSpan.getBoundingClientRect();

        if (height === 0) return this.hide();

        const w: number = this.tooltip.offsetWidth;
        const h: number = this.tooltip.offsetHeight;

        let x: number = left + width / 2 - w / 2;
        let y: number = top - h - 8;

        const vw: number = document.documentElement.clientWidth;

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
            morph: span.dataset.morph ? (JSON.parse(span.dataset.morph) as MorphFeatures) : ({} as MorphFeatures),
            offset: span.dataset.offset ? parseInt(span.dataset.offset, 10) : 0,
            ent_iob: span.dataset.ent_iob || "",
            ent_type: span.dataset.ent_type || "",
            is_japanese: span.dataset.is_japanese || "false",
        };
    }

    private bind(vm: HoverTokenViewModel): void {
        id(BINDINGS.SURFACE).textContent = vm.surface;
        id(BINDINGS.READING).textContent = convertReading(vm.reading);
        id(BINDINGS.LEMMA).textContent = vm.lemma;
        id(BINDINGS.POS).textContent = vm.pos;
        id(BINDINGS.TAG).textContent = vm.tag;
        id(BINDINGS.DEP).textContent = vm.dep;
        id(BINDINGS.HEAD).textContent = vm.head;
        id(BINDINGS.OFFSET).textContent = vm.offset;
        id(BINDINGS.IOB).textContent = vm.iob;
        id(BINDINGS.ENTITY).textContent = vm.entity;
        id(BINDINGS.MORPH).textContent = vm.morph;

        const btn = document.getElementById("jp-exclude-btn") as HTMLButtonElement;
        const allowed: string[] = ["NOUN", "VERB", "ADJ"];
        const searchBtn: HTMLButtonElement = id<HTMLButtonElement>(BINDINGS.SEARCH_BTN);

        btn.onclick = async (e: MouseEvent): Promise<void> => {
            e.stopPropagation();
            await FilterTokens.instance.add(vm.surface);
            if (this.activeSpan) this.activeSpan.replaceWith(document.createTextNode(vm.surface));
            this.hide();
        };


        allowed.includes(vm.pos) ? (searchBtn.style.display = "inline-block") : (searchBtn.style.display = "none");

        searchBtn.onclick = async (e: MouseEvent): Promise<void> => {
            e.stopPropagation();
            try {
                const entry: JishoEntry = await this.lookupJisho(vm.lemma || vm.surface);
                this.showJisho(entry);
            } catch (err) {
                console.error(err);
                alert("Lookup failed.");
            }
        };

    }

    private showJisho(entry: JishoEntry): void {
        this.tooltip.classList.add("dictionary-mode");

        id("jp-d-head").textContent = entry.slug;

        id("jp-d-read").textContent = convertReading(
            this.activeSpan?.dataset.reading ?? entry.slug);

        const defs: HTMLElement = id("jp-d-defs");

        defs.innerHTML = "";

        entry.senses[0].english_definitions.forEach((def: string): void =>
            defs.insertAdjacentHTML("beforeend", `<li>${def}</li>`));

        this.dictionaryMode = true;
    }

    private hideJisho(): void {
        this.tooltip.classList.remove("dictionary-mode");
        id("jp-d-head").textContent = "";
        id("jp-d-read").textContent = "";
        id("jp-d-defs").innerHTML = "";
        this.dictionaryMode = false;
    }

    private lookupJisho(word: string): Promise<JishoEntry> {
        return new Promise((resolve, reject): void => {
            const req: JishoLookupRequest = { action: "JISHO_LOOKUP", word };

            chrome.runtime.sendMessage<JishoLookupRequest, JishoLookupResponse>(
                req,
                (resp: JishoLookupResponse): void => {
                    if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                    if (resp?.ok) {
                        // @ts-ignore
                        const first: any = resp.data[0];
                        return first ? resolve(first)
                            : reject(new Error("No definition"));
                    }
                    reject(resp?.err ?? new Error("Unknown error"));
                },
            );
        });
    }
}

// Helping functions
function getReadingMode(): ReadingMode {
    return ((window as any).readingMode as ReadingMode) || "hiragana";
}

function convertReading(reading: string): string {
    const mode: ReadingMode = getReadingMode();
    switch (mode) {
        case "katakana":
            return wanakana.toKatakana(reading);
        case "romaji":
            return wanakana.toRomaji(reading);
        default:
            return wanakana.toHiragana(reading);
    }
}

function id<T extends HTMLElement>(s: string): T {
    return document.getElementById(s) as T;
}
