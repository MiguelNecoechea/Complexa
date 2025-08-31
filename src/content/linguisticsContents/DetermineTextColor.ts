/*
 * DetermineTextColor.ts
 * This file is responsible for handling all the colors that the users sees when adding color to the text.
 * this file is essential given that mostly we have colors definitions and a small function to create the CSS
 * elements that the webpage text is going to have.
 */

import { Token } from "../../models/JapaneseTokens";
import { TextProcessedColor } from "../../models/TextColors";
import { ColorCustomizationService } from "../../services/ColorCustomizationService";

type ColorMap = Record<string, string>;

function defaultColour(dark: boolean): string {
    return dark ? "#e0e0e0" : "#202124";
}

// Light mode TextColors
export const LIGHT_POS_COLORS: ColorMap = {
    NOUN: "#1f77b4",
    VERB: "#d62728",
    ADJ: "#2ca02c",
    ADV: "#ff7f0e",
    PRON: "#9467bd",
    PROPN: "#63A2B0",
    PART: "#8c564b",
    AUX: "#e377c2",
    ADP: "#7f7f7f",
    CCONJ: "#bcbd22",
    SCONJ: "#17becf",
};

export const LIGHT_INFLECTION_COLORS: ColorMap = {
    基本形: "#d62728", 
    過去形: "#9467bd",
    未然形: "#8c564b",
    連用形: "#ff7f0e",
    意志形: "#e377c2",
};

// Dark mode text colors
export const DARK_POS_COLORS: ColorMap = {
    NOUN: "#69a3f3",
    VERB: "#f2706a",
    ADJ: "#6dc66d",
    ADV: "#ff9a4e",
    PRON: "#b48cd5",
    PART: "#a67a6f",
    AUX: "#f68fcf",
    ADP: "#b3b3b3",
    CCONJ: "#d9db4c",
    SCONJ: "#5fdfea",
};

export const DARK_INFLECTION_COLORS: ColorMap = {
    基本形: "#f2706a",
    過去形: "#b48cd5",
    未然形: "#a67a6f",
    連用形: "#ff9a4e",
    意志形: "#f68fcf",
};

export class DetermineTextColor {
    private static matchDark: MediaQueryList = window.matchMedia?.("(prefers-color-scheme: dark)");

    private static isDark(): boolean {
        return this.matchDark?.matches ?? false;
    }

    public async determineColorToken(token: Token): Promise<TextProcessedColor> {
        // Usar el nuevo servicio de colores
        return await ColorCustomizationService.determineColorToken(token);
    }

    // Método sincrónico de fallback para compatibilidad (usando colores hardcodeados)
    public determineColorTokenSync(token: Token): TextProcessedColor {
        const dark: boolean = DetermineTextColor.isDark();
        const posPalette: ColorMap = dark ? DARK_POS_COLORS : LIGHT_POS_COLORS;
        const infPalette: ColorMap = dark ? DARK_INFLECTION_COLORS : LIGHT_INFLECTION_COLORS;

        const posKey: string = token.pos?.toUpperCase() ?? "";
        const tagKey: string = token.tag ?? "";

        const posColor: string = posPalette[posKey] ?? defaultColour(dark);
        const tagColor: string = token.dep === "ROOT" ? (infPalette[tagKey] ?? posColor) : posColor;

        return { posColor, tagColor };
    }
}

export default new DetermineTextColor();
