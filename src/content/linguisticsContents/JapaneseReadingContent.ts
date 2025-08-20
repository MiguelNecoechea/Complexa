// Handles DOM traversal, messaging, and style injection
import * as wanakana from "wanakana";
import { ReadingTypes } from "../../models/PopupSettings";


const KANJI_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Annotate a single token's surface with its reading.
 * Mirrors the Python _add_reading logic.
 */
function addReading(surface: string, reading: string, mode: ReadingTypes): string {

    const readingHira: string = wanakana.toHiragana(reading);
    const out: string[] = [];
    const kanjiBuf: string[] = [];
    let sIdx: number = 0;
    let rIdx: number = 0;

    const flush = (upTo: number): void => {
        if (kanjiBuf.length === 0) return;

        const core: string = kanjiBuf.join("");
        let final: string = readingHira.slice(rIdx, upTo);

        if (mode === "katakana") final = wanakana.toKatakana(final);
        else if (mode === "romaji") final = wanakana.toRomaji(final);

        out.push(`<ruby>${escapeHtml(core)}<rt>${escapeHtml(final)}</rt></ruby>`);
        kanjiBuf.length = 0;
        rIdx = upTo;
    };

    while (sIdx < surface.length) {
        const ch: string = surface[sIdx];
        if (KANJI_RE.test(ch)) {
            kanjiBuf.push(ch);
        } else {
            const kana: string = wanakana.toHiragana(ch);
            const start: number = kanjiBuf.length ? rIdx + 1 : rIdx;
            let nextPos: number = readingHira.indexOf(kana, start);
            if (nextPos === -1) nextPos = readingHira.length;

            flush(nextPos);
            out.push(escapeHtml(ch));
            rIdx = nextPos + 1;
        }
        sIdx++;
    }

    flush(readingHira.length);
    return out.join("");
}

export class KanjiReadingsProcessor {
    private readingsAdded: boolean = false;
    private readingMode: ReadingTypes;

    constructor(readingMode: ReadingTypes) {
        this.readingMode = readingMode;
        this.initialize();
    }

    private initialize(): void {
        this.addRubyStyles();
    }

    public addReadings(): void {
        if (this.readingsAdded) return;

        const spans: NodeListOf<HTMLSpanElement> =
            document.querySelectorAll<HTMLSpanElement>("span[data-reading]");

        spans.forEach((span: HTMLSpanElement): void => {
            const surface: string = span.textContent || "";
            const reading : string= span.dataset.reading || "";

            span.innerHTML = addReading(surface, reading, this.readingMode);
        });

        this.readingsAdded = true;
    }

    changeReadingType(mode: ReadingTypes): void {
        this.readingMode = mode;

        if (!this.readingsAdded) return;

        document.querySelectorAll("ruby rt").forEach((rt: Element): void => {
            const base: string = rt.textContent || "";
            let converted: string;

            switch (mode) {
                case "katakana":
                    converted = wanakana.toKatakana(base);
                    break;
                case "romaji":
                    converted = wanakana.toRomaji(base);
                    break;
                default:
                    converted = wanakana.toHiragana(base);
            }
            rt.textContent = converted;
        });

    }

    private addRubyStyles(): void {
        const style: HTMLStyleElement = document.createElement("style");
        style.textContent = `ruby { line-height: 1.65; } ruby rt { font-size: .55em; white-space: nowrap; }`;
        document.head.appendChild(style);
    }
}
