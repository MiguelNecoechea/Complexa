// Handles DOM traversal, messaging, and style injection
import * as wanakana from "wanakana";

import { Token } from "../../models/JapaneseTokens";

// Regex to detect any CJK Unified Ideographs (Kanji)
const KANJI_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

export type ReadingMode = "romaji" | "hiragana" | "katakana";

/* ─────────────────────────  HELPER FUNCTIONS  ───────────────────────── */

/**
 * Escape HTML special characters to prevent injection.
 */
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
function addReading(
    surface: string,
    reading: string,
    mode: ReadingMode,
): string {
    const rawReading = typeof reading === "string" ? reading : "";

    const readingHira = wanakana.toHiragana(rawReading);
    const out: string[] = [];
    const kanjiBuf: string[] = [];
    let sIdx = 0;
    let rIdx = 0;

    const flush = (upTo: number) => {
        if (kanjiBuf.length === 0) return;

        const core = kanjiBuf.join("");
        let final = readingHira.slice(rIdx, upTo);

        if (mode === "katakana") final = wanakana.toKatakana(final);
        else if (mode === "romaji") final = wanakana.toRomaji(final);

        out.push(
            `<ruby><rb>${escapeHtml(core)}</rb><rt>${escapeHtml(final)}</rt></ruby>`,
        );
        kanjiBuf.length = 0;
        rIdx = upTo;
    };

    while (sIdx < surface.length) {
        const ch = surface[sIdx];
        if (KANJI_RE.test(ch)) {
            kanjiBuf.push(ch);
        } else {
            const kana = wanakana.toHiragana(ch);
            const start = kanjiBuf.length ? rIdx + 1 : rIdx;
            let nextPos = readingHira.indexOf(kana, start);
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
    private readingMode: ReadingMode;

    constructor(readingMode: ReadingMode) {
        this.readingMode = readingMode;
        this.initialize();
    }

    /* ─────────────────────────  BOOTSTRAP  ───────────────────────── */
    private async initialize(): Promise<void> {
        this.addRubyStyles();
    }

    /* ─────────────────────  RUBY ANNOTATION FLOW  ─────────────────── */
    public addReadings(): void {
        if (this.readingsAdded) return;

        const spans =
            document.querySelectorAll<HTMLSpanElement>("span[data-reading]");

        spans.forEach((span) => {
            const surface = span.textContent || "";
            const reading = span.dataset.reading || "";

            const rubyHtml = addReading(surface, reading, this.readingMode);
            span.innerHTML = rubyHtml;
        });

        this.readingsAdded = true;
    }

    /**
     * Replace a text node with a fragment of annotated HTML.
     */
    private annotateNode(node: Text, html: string): void {
        const frag = document.createRange().createContextualFragment(html);
        node.replaceWith(frag);
    }

    /* ─────────────────── RE-ANNOTATE ─────────────────── */

    changeReadingType(mode: ReadingMode): void {
        this.readingMode = mode;
        if (!this.readingsAdded) {
            return;
        }

        document.querySelectorAll("ruby rt").forEach((rt) => {
            const base = rt.textContent || "";
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

    /* ─────────────────────────  STYLES  ───────────────────────── */
    private addRubyStyles(): void {
        const style = document.createElement("style");
        style.textContent = `ruby { line-height: 1.65; } ruby rt { font-size: .55em; white-space: nowrap; }`;
        document.head.appendChild(style);
    }
}
