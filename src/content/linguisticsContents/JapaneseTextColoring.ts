import { Token, MorphFeatures } from "../../models/JapaneseTokens";
import { TextProcessedColor } from "../../models/TextColors";
import DetermineTextColor from "./DetermineTextColor";
import { FilterTokensService } from "../../services/FilterTokensService";
import { POSFilterUtility } from "../POSFilterUtility";

export class JapaneseTextColoring {
    constructor(private tokenFilter: FilterTokensService = FilterTokensService.instance) {}

    public async addPOSAnnotations(enableWordFilters: boolean): Promise<void> {
        const spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>("span[data-pos]");

        // Initialize POSFilterUtility if not already done
        await POSFilterUtility.init();

        // Procesar spans en paralelo para mejor performance
        const colorPromises:Promise<void>[] = Array.from(spans).map(async (span: HTMLSpanElement): Promise<void> => {
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

            // 🚫 Skip coloring for disabled POS types
            if (!POSFilterUtility.shouldProcessToken(token)) {
                span.style.removeProperty("color");
                // Store POS state in span for hover filtering
                span.dataset.posEnabled = "false";
                return;
            }

            // Mark POS as enabled for hover functionality
            span.dataset.posEnabled = "true";

            if (enableWordFilters && this.tokenFilter.shouldExclude(token)) {
                span.style.removeProperty("color");
                return;
            }

            try {
                const { posColor }: TextProcessedColor = await DetermineTextColor.determineColorToken(token);
                span.style.setProperty("color", posColor, "important");
            } catch (error) {
                console.warn("Error determining color for token, using the basic color:", error);
                // Fallback al método sincrónico si hay error
                const { posColor }: TextProcessedColor = DetermineTextColor.determineColorTokenSync(token);
                span.style.setProperty("color", posColor, "important");
            }
        });

        await Promise.all(colorPromises);
    }

    public removePOSAnnotations(): void {
        const spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>("span[data-pos]");
        spans.forEach((span: HTMLSpanElement): void => {
            span.style.removeProperty("color");
        });
    }
}
