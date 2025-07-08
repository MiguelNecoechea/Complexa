import { Paragraph, NodeSpan } from "../models/Paragraph";

const BLOCK_TAGS = new Set<string>([
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "DIV",
    "DL",
    "DT",
    "DD",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HR",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TD",
    "TH",
    "UL",
] as const);

export class TextExtractionManager {
    private static looseFilter(n: Node): number {
        const doc: Document = n.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter;

        if (n.nodeType !== doc.defaultView!.Node.TEXT_NODE) return NF.FILTER_REJECT;

        const data: string = (n as Text).data.trim();

        if (!data) return NF.FILTER_REJECT;

        const tag: string = n.parentElement?.tagName ?? "";

        if (["SCRIPT", "STYLE", "RUBY", "RT", "RB"].includes(tag)) return NF.FILTER_REJECT;

        const JAPANESE_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/;
        const DIGIT_RE = /\d/;

        if (!JAPANESE_RE.test(data) && !DIGIT_RE.test(data)) return NF.FILTER_REJECT;

        return NF.FILTER_ACCEPT;
    }

    private static isLeafBlock(el: Element): boolean {
        return (BLOCK_TAGS.has(el.tagName) &&
            !Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName))
        );
    }

    /**
     * Walk `root`, collapse every leaf-block paragraph into one live `Text` node,
     * and return the array of those nodes—ready for downstream token wrapping.
     */
    static extract(root: Node): Paragraph[] {
        const out: Paragraph[] = [];
        const queue: Element[] = [root as Element];
        const doc: Document = root.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter;

        while (queue.length) {
            const el = queue.shift()!;
            if (this.isLeafBlock(el)) {
                const walker = doc.createTreeWalker(el, NF.SHOW_TEXT, {acceptNode: this.looseFilter});

                const textNodes: Text[] = [];
                const spans: NodeSpan[] = [];
                let buf: string = "";
                let cursor: number = 0;

                for (let n: Node | null; (n = walker.nextNode()); ) {
                    const txt = n as Text;
                    textNodes.push(txt);
                    const len = txt.data.length;
                    spans.push({ node: txt, start: cursor, end: cursor + len });
                    buf += txt.data;
                    cursor += len;
                }

                const text = buf;
                if (text.trim()) out.push({ container: el, textNodes, spans, text });
            } else {
                queue.push(...Array.from(el.children));
            }
        }
        return out;
    }
}
