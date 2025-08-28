import { Token, MorphFeatures } from "../../models/JapaneseTokens";
import { TextProcessedColor } from "../../models/TextColors";
import DetermineTextColor from "./DetermineTextColor";

export class JapaneseTextColoring {
    constructor() {}

    public addPOSAnnotations(): void {
        const spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>("span[data-pos]");

        spans.forEach((span: HTMLSpanElement): void => {
            const token: Token = {
                surface: span.textContent || "",
                reading: span.dataset.reading || "",
                lemma: span.dataset.lemma || "",
                pos: span.dataset.pos!,
                tag: span.dataset.tag || "",
                dep: span.dataset.dep || "",
                head: span.dataset.head || "",
                morph: span.dataset.morph ? (JSON.parse(span.dataset.morph) as MorphFeatures) : ({} as MorphFeatures),
                offset: span.dataset.offset ? parseInt(span.dataset.offset, 10) : 0,
                ent_iob: span.dataset.ent_iob || "",
                ent_type: span.dataset.ent_type || "",
                is_japanese: span.dataset.is_japanese || "false",
            };

            const { posColor, tagColor }: TextProcessedColor = DetermineTextColor.determineColorToken(token);

            span.style.color = posColor;

        });
    }

    public removePOSAnnotations(): void {
        const spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>("span[data-pos]");
        spans.forEach((span: HTMLSpanElement): void => {
            span.style.color = "";
        });
    }
}
