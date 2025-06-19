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
    // Reject text nodes inside SCRIPT/STYLE/RUBY/RT/RB or that are pure whitespace
    private static looseFilter(n: Node): number {
        const doc = n.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter; // <— get NodeFilter from jsdom’s window

        if (n.nodeType !== doc.defaultView!.Node.TEXT_NODE)
            return NF.FILTER_REJECT;
        if (!(n as Text).data.trim()) return NF.FILTER_REJECT;

        const tag = (n.parentElement as HTMLElement | null)?.tagName;
        return ["SCRIPT", "STYLE", "RUBY", "RT", "RB"].includes(tag ?? "")
            ? NF.FILTER_REJECT
            : NF.FILTER_ACCEPT;
    }

    private static strictFilter(n: Node): number {
        const doc = n.ownerDocument!;
        const NF = doc.defaultView!.NodeFilter;

        const base = TextExtractionManager.looseFilter(n);
        if (base !== NF.FILTER_ACCEPT) return base;

        return /[\u4E00-\u9FAF]/.test((n as Text).data)
            ? NF.FILTER_ACCEPT
            : NF.FILTER_REJECT;
    }

    private static isLeafBlock(element: Element): boolean {
        return (
            BLOCK_TAGS.has(element.tagName) &&
            !Array.from(element.children).some((c) => BLOCK_TAGS.has(c.tagName))
        );
    }

    static extract(root: Node): Text[] {
        const NF = root.ownerDocument!.defaultView!.NodeFilter;
        const seen = new Set<Text>();
        const out: Text[] = [];
        const q: Element[] = [root as Element];

        while (q.length) {
            const el = q.shift()!;

            if (this.isLeafBlock(el)) {
                // Phase-A: does this paragraph have at least one kanji node?
                const hasKanji = el
                    .ownerDocument!.createTreeWalker(el, NF.SHOW_TEXT, {
                        acceptNode: this.strictFilter,
                    })
                    .nextNode();

                if (!hasKanji) continue;

                // Phase-B: collect *kanji* nodes only (strictFilter again)
                const walker = el.ownerDocument!.createTreeWalker(
                    el,
                    NF.SHOW_TEXT,
                    { acceptNode: this.strictFilter },
                );

                for (let n: Node | null; (n = walker.nextNode()); ) {
                    const t = n as Text;
                    console.log(t);
                    if (seen.has(t)) continue;
                    seen.add(t);
                    out.push(t);
                }
            } else {
                q.push(...Array.from(el.children));
            }
        }
        return out;
    }
}
