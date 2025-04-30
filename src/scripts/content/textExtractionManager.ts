export class TextExtractionManager {
    /**
     * Default filter: accept Text nodes containing kanji, reject scripts/styles/ruby
     */
    private static defaultFilter(n: Node): number {
        if (!(n instanceof Text) || !n.data.trim())
            return NodeFilter.FILTER_REJECT;
        const tag = n.parentElement?.tagName;
        if (["SCRIPT", "STYLE", "RUBY", "RT", "RB"].includes(tag!))
            return NodeFilter.FILTER_REJECT;
        return /[\u4E00-\u9FAF]/.test(n.data)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
    }

    /**
     * Collects all Text nodes under `root` that match the given filter
     */
    static extract(
        root: Node,
        filter: (n: Node) => number = this.defaultFilter,
    ): Text[] {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: filter,
        });
        const nodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
            nodes.push(node as Text);
        }
        return nodes;
    }
}
