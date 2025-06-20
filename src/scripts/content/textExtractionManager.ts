import { Paragraph } from "../models/Paragraph";

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
        const doc = n.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter;

        if (n.nodeType !== doc.defaultView!.Node.TEXT_NODE)
            return NF.FILTER_REJECT;

        if (!(n as Text).data.trim()) return NF.FILTER_REJECT;

        const tag = n.parentElement?.tagName ?? "";

        return ["SCRIPT", "STYLE", "RUBY", "RT", "RB"].includes(tag)
            ? NF.FILTER_REJECT
            : NF.FILTER_ACCEPT;
    }

    private static isLeafBlock(el: Element): boolean {
        return (
            BLOCK_TAGS.has(el.tagName) &&
            !Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName))
        );
    }

    /**
     * Walk `root`, collapse every leaf-block paragraph into **one live `Text` node**,
     * and return the array of those nodes—ready for downstream token wrapping.
     */
    static extract(root: Node): Paragraph[] {
        const out: Paragraph[] = [];
        const queue: Element[] = [root as Element];
        const doc = root.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter;

        while (queue.length) {
            const el = queue.shift()!;
            if (this.isLeafBlock(el)) {
                const walker = doc.createTreeWalker(el, NF.SHOW_TEXT, {
                    acceptNode: this.looseFilter,
                });
                const textNodes: Text[] = [];
                let buf = "";

                for (let n: Node | null; (n = walker.nextNode()); ) {
                    textNodes.push(n as Text);
                    buf += (n as Text).data;
                }

                const cleaned = buf.replace(/\s+/g, " ").trim();
                if (cleaned)
                    out.push({ container: el, textNodes, text: cleaned });
            } else {
                queue.push(...Array.from(el.children));
            }
        }
        return out;
    }
}
