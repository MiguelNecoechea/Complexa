import { Token } from "../../models/JapaneseTokens";
import { TextProcessedColor } from "../../models/TextColors";

type ColorMap = Record<string, string>;

function defaultColour(dark: boolean): string {
    return dark ? "#e0e0e0" : "#202124";
}

// Light mode TextColors
const LIGHT_POS_COLORS: ColorMap = {
    NOUN: "#1f77b4", // blue
    VERB: "#d62728", // red
    ADJ: "#2ca02c", // green
    ADV: "#ff7f0e", // orange
    PRON: "#9467bd", // purple
    PROPN: "#63A2B0", // aqua
    PART: "#8c564b", // brown
    AUX: "#e377c2", // pink
    ADP: "#7f7f7f", // grey
    CCONJ: "#bcbd22", // olive
    SCONJ: "#17becf", // teal
};

const LIGHT_INFLECTION_COLORS: ColorMap = {
    基本形: "#d62728", // dictionary form
    過去形: "#9467bd", // past tense
    未然形: "#8c564b", // negative stem
    連用形: "#ff7f0e", // continuative form
    意志形: "#e377c2", // volitional form
};

// Dark mode text colors
const DARK_POS_COLORS: ColorMap = {
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

const DARK_INFLECTION_COLORS: ColorMap = {
    基本形: "#f2706a",
    過去形: "#b48cd5",
    未然形: "#a67a6f",
    連用形: "#ff9a4e",
    意志形: "#f68fcf",
};

export class DetermineTextColor {
    private static matchDark = window.matchMedia?.("(prefers-color-scheme: dark)");

    private static isDark(): boolean {
        return this.matchDark?.matches ?? false;
    }

    public determineColorToken(token: Token): TextProcessedColor {
        const dark = DetermineTextColor.isDark();
        const posPalette = dark ? DARK_POS_COLORS : LIGHT_POS_COLORS;
        const infPalette = dark ? DARK_INFLECTION_COLORS : LIGHT_INFLECTION_COLORS;

        const posKey = token.pos?.toUpperCase() ?? "";
        const tagKey = token.tag ?? "";

        const posColor = posPalette[posKey] ?? defaultColour(dark);
        const tagColor = token.dep === "ROOT" ? (infPalette[tagKey] ?? posColor) : posColor;

        return { posColor, tagColor };
    }
}

export default new DetermineTextColor();
