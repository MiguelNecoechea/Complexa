// src/wrappers/TokenWrapper.ts
import { Paragraph } from "../../models/Paragraph";
import { Token } from "../../models/JapaneseTokens";
import { FilterTokens } from "../../appFunctions/WordFilters/FilterTokens";
import HoverTokenView from "../../views/HoverTokenView";

/**
 * Low-level helper that:
 *   1. Adds <span class="lingua-token">…</span> around every selected token.
 *   2. Returns the created DOM elements (row-by-row, one row per paragraph).
 *   3. Mounts the shared hover tooltip once.                        */
export class TokenWrapper {
    private tooltipReady = false;

    constructor(private readonly tokenFilter = FilterTokens.instance) {}

    /** Wrap every token and return the resulting DOM matrix. */
    async wrap(
        paragraphs: Paragraph[],
        tokenizedArrays: Token[][],
    ): Promise<HTMLElement[][]> {
        const tokenizedDOM: HTMLElement[][] = [];

        for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
            const para = paragraphs[pIdx];
            const tokens = tokenizedArrays[pIdx] ?? [];
            const row: HTMLElement[] = [];

            let tIdx = 0;
            let charCount = 0;

            para.textNodes.forEach((node) => {
                const start = charCount;
                const end = start + node.data.length;
                const frag = node.ownerDocument!.createDocumentFragment();

                let localPos = 0;

                while (tIdx < tokens.length && tokens[tIdx].offset < end) {
                    const tok = tokens[tIdx];
                    if (
                        tok.offset >= start &&
                        tok.offset + tok.surface.length <= end
                    ) {
                        const rel = tok.offset - start;

                        if (rel > localPos) {
                            frag.append(
                                node.ownerDocument!.createTextNode(
                                    node.data.slice(localPos, rel),
                                ),
                            );
                        }

                        if (this.tokenFilter.shouldExclude(tok)) {
                            frag.append(
                                node.ownerDocument!.createTextNode(tok.surface),
                            );
                        } else {
                            // build the span
                            const span = this.buildSpan(tok);
                            frag.append(span);
                            row.push(span);
                        }

                        localPos = rel + tok.surface.length;
                        tIdx++;
                    } else {
                        break;
                    }
                }

                if (localPos < node.data.length) {
                    frag.append(
                        node.ownerDocument!.createTextNode(
                            node.data.slice(localPos),
                        ),
                    );
                }

                node.parentNode!.replaceChild(frag, node);
                charCount = end;
            });

            tokenizedDOM.push(row);
        }

        await this.mountHoverToolTip();
        return tokenizedDOM;
    }

    /** Build the <span> element with every data-* attr used elsewhere. */
    private buildSpan(tok: Token): HTMLSpanElement {
        const span = document.createElement("span");
        span.textContent = tok.surface;
        span.classList.add("lingua-token", "mw-no-invert", "notheme");

        //linguistic metadata
        span.dataset.surface = tok.surface;
        span.dataset.pos = tok.pos;
        span.dataset.lemma = tok.lemma;
        span.dataset.tag = tok.tag;
        span.dataset.dep = tok.dep;
        span.dataset.head = String(tok.head);
        span.dataset.offset = String(tok.offset);
        span.dataset.ent_obj = tok.ent_iob;
        span.dataset.ent_type = tok.ent_type;
        if (tok.reading) span.dataset.reading = tok.reading;

        return span;
    }

    private async mountHoverToolTip(): Promise<void> {
        if (this.tooltipReady) return;

        const hoverHTML = await fetch(
            chrome.runtime.getURL("static/views/hoverView.html"),
        ).then((r) => r.text());

        document.body.insertAdjacentHTML("beforeend", hoverHTML);
        new HoverTokenView();
        this.tooltipReady = true;
    }
}
