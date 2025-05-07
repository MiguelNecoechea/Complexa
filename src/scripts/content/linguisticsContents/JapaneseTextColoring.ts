import { Token } from "../../models/JapaneseTokens";

export class JapaneseTextColoring {
    private posColorMap: Record<string, string> = {
        NOUN: "#1f77b4",
        VERB: "#d62728",
        ADJ: "#2ca02c",
        ADV: "#ff7f0e",
    };

    public addPOSAnnotations(): void {
        // select all spans that you previously decorated with data-pos
        const spans =
            document.querySelectorAll<HTMLSpanElement>("span[data-pos]");
        spans.forEach((span) => {
            const pos = span.dataset.pos!;
            const color = this.posColorMap[pos] || "#000000";
            span.style.color = color;
        });
    }
}
