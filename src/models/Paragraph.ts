export interface NodeSpan {
    node: Text;
    start: number;
    end: number;
}

export interface Paragraph {
    container: Element;
    textNodes: Text[];
    text: string;
    spans: NodeSpan[];
}
