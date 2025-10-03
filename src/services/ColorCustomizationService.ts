import { Token } from "../models/JapaneseTokens";
import { TextProcessedColor } from "../models/TextColors";
import { LIGHT_POS_COLORS, DARK_POS_COLORS } from "../content/utils/DetermineTextColor";

type ColorMap = Record<string, string>;

interface CustomColorSettings {
    lightColors: Partial<ColorMap>;
    darkColors: Partial<ColorMap>;
}

export class ColorCustomizationService {
    private static readonly STORAGE_KEY: string = "customColors";

    /**
     * Detects if the system is in dark mode
     */
    private static isDark(): boolean {
        const matchDark: MediaQueryList = window.matchMedia?.("(prefers-color-scheme: dark)");
        return matchDark?.matches ?? false;
    }

    /**
     * Default color if a category is not found
     */
    private static defaultColour(dark: boolean): string {
        return dark ? "#e0e0e0" : "#202124";
    }

    /**
     * Get the information about the color from settings
     */
    private static async getCustomSettings(): Promise<CustomColorSettings> {
        try {
            const result: {[key: string]: any} = await chrome.storage.sync.get(this.STORAGE_KEY);
            return result[this.STORAGE_KEY] || { lightColors: {}, darkColors: {} };
        } catch (error) {
            console.warn("Error getting custom colors from storage:", error);
            return { lightColors: {}, darkColors: {} };
        }
    }

    /**
     * Gets all the POS colors.
     */
    public static async getPOSColors(isDark?: boolean): Promise<ColorMap> {
        const dark: boolean = isDark ?? this.isDark();
        const customSettings: CustomColorSettings = await this.getCustomSettings();
        
        const defaultColors: ColorMap = dark ? DARK_POS_COLORS : LIGHT_POS_COLORS;
        const customColors: Partial<ColorMap> = dark ? customSettings.darkColors : customSettings.lightColors;
        
        const filteredCustomColors: ColorMap = {};
        Object.entries(customColors).forEach(([key, value]: [string, string | undefined]): void => {
            if (value) filteredCustomColors[key] = value;

        });
        
        return { ...defaultColors, ...filteredCustomColors };
    }

    /**
     * Determines the color of a token.
     */
    public static async determineColorToken(token: Token): Promise<TextProcessedColor> {
        const dark: boolean = this.isDark();
        const posPalette: ColorMap = await this.getPOSColors(dark);

        const posKey: string = token.pos?.toUpperCase() ?? "";

        const posColor: string = posPalette[posKey] ?? this.defaultColour(dark);

        return { posColor };
    }

    /**
     * Sets a customized color for a property
     */
    public static async setColorForPOS(pos: string, lightColor: string, darkColor?: string): Promise<void> {
        try {
            const settings: CustomColorSettings = await this.getCustomSettings();
            
            settings.lightColors[pos.toUpperCase()] = lightColor;
            if (darkColor) {
                settings.darkColors[pos.toUpperCase()] = darkColor;
            }
            
            await chrome.storage.sync.set({ [this.STORAGE_KEY]: settings });
            
            await this.notifyColorChangeToAllTabs();
            
            await this.refreshAppStylesIfAvailable();
            
        } catch (error) {
            console.error("Error setting custom color:", error);
        }
    }

    /**
     * Auxiliary function in order to refresh tabs
     */
    private static async refreshAppStylesIfAvailable(): Promise<void> {
        if (typeof window !== 'undefined' && 'refreshAppStyles' in window) {
            try {
                await (window as any).refreshAppStyles();
            } catch (error) {
                console.warn("Warning: Could not refresh app styles:", error);
            }
        }
    }

    /**
     * Gets a specific color for a category.
     */
    public static async getColorForPOS(pos: string, isDark?: boolean): Promise<string> {
        const colors: ColorMap = await this.getPOSColors(isDark);
        return colors[pos.toUpperCase()] ?? this.defaultColour(isDark ?? this.isDark());
    }

    /**
     * Obtains all the POS color for a specified element.
     */
    public static getDefaultColorsForPOS(pos: string): { light: string; dark: string } {
        const posUpper: string = pos.toUpperCase();
        return {
            light: LIGHT_POS_COLORS[posUpper] ?? this.defaultColour(false),
            dark: DARK_POS_COLORS[posUpper] ?? this.defaultColour(true)
        };
    }

    /**
     * Notifies all tabs about changes in the color schema
     */
    private static async notifyColorChangeToAllTabs(): Promise<void> {
        try {
            const response = await chrome.runtime.sendMessage({
                action: "NOTIFY_COLOR_CHANGE"
            });

            if (!response?.ok) {
                console.warn("⚠️ Failed to send color change notification to background worker");
            }

        } catch (error) {
            console.error("Error requesting color change notification:", error);
        }
    }

}
