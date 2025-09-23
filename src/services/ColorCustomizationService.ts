import { Token } from "../models/JapaneseTokens";
import { TextProcessedColor } from "../models/TextColors";

type ColorMap = Record<string, string>;

interface CustomColorSettings {
    lightColors: Partial<ColorMap>;
    darkColors: Partial<ColorMap>;
}

export class ColorCustomizationService {
    private static readonly STORAGE_KEY = "customColors";
    
    // Colores por defecto - modo claro
    private static readonly DEFAULT_LIGHT_COLORS: ColorMap = {
        NOUN: "#1f77b4",
        VERB: "#d65627",
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

    // Colores por defecto - modo oscuro
    private static readonly DEFAULT_DARK_COLORS: ColorMap = {
        NOUN: "#69a3f3",
        VERB: "#f2706a",
        ADJ: "#6dc66d",
        ADV: "#ff9a4e",
        PRON: "#b48cd5",
        PROPN: "#2e7686",
        PART: "#a67a6f",
        AUX: "#f68fcf",
        ADP: "#b3b3b3",
        CCONJ: "#d9db4c",
        SCONJ: "#5fdfea",
    };

    // Colores de inflexión por defecto - modo claro
    private static readonly DEFAULT_LIGHT_INFLECTION_COLORS: ColorMap = {
        基本形: "#d62728",
        過去形: "#9467bd",
        未然形: "#8c564b",
        連用形: "#ff7f0e",
        意志形: "#e377c2",
    };

    // Colores de inflexión por defecto - modo oscuro
    private static readonly DEFAULT_DARK_INFLECTION_COLORS: ColorMap = {
        基本形: "#f2706a",
        過去形: "#b48cd5",
        未然形: "#a67a6f",
        連用形: "#ff9a4e",
        意志形: "#f68fcf",
    };

    /**
     * Detecta si el sistema está en modo oscuro
     */
    private static isDark(): boolean {
        const matchDark: MediaQueryList = window.matchMedia?.("(prefers-color-scheme: dark)");
        return matchDark?.matches ?? false;
    }

    /**
     * Color por defecto cuando no se encuentra una categoría
     */
    private static defaultColour(dark: boolean): string {
        return dark ? "#e0e0e0" : "#202124";
    }

    /**
     * Obtiene la configuración de colores personalizados del storage
     */
    private static async getCustomSettings(): Promise<CustomColorSettings> {
        try {
            const result = await chrome.storage.sync.get(this.STORAGE_KEY);
            return result[this.STORAGE_KEY] || { lightColors: {}, darkColors: {} };
        } catch (error) {
            console.warn("Error getting custom colors from storage:", error);
            return { lightColors: {}, darkColors: {} };
        }
    }

    /**
     * Obtiene los colores POS (mezclando defaults + personalizados)
     */
    public static async getPOSColors(isDark?: boolean): Promise<ColorMap> {
        const dark: boolean = isDark ?? this.isDark();
        const customSettings: CustomColorSettings = await this.getCustomSettings();
        
        const defaultColors: ColorMap = dark ? this.DEFAULT_DARK_COLORS : this.DEFAULT_LIGHT_COLORS;
        const customColors: Partial<ColorMap> = dark ? customSettings.darkColors : customSettings.lightColors;
        
        // Filtrar valores undefined y mantener solo strings válidos
        const filteredCustomColors: ColorMap = {};
        Object.entries(customColors).forEach(([key, value]: [string, string | undefined]): void => {
            if (value) {
                filteredCustomColors[key] = value;
            }
        });
        
        return { ...defaultColors, ...filteredCustomColors };
    }

    /**
     * Obtiene los colores de inflexión (mezclando defaults + personalizados)
     */
    public static async getInflectionColors(isDark?: boolean): Promise<ColorMap> {
        const dark = isDark ?? this.isDark();
        // Podria extenderse para incluir colores personalizados
        return dark ? this.DEFAULT_DARK_INFLECTION_COLORS : this.DEFAULT_LIGHT_INFLECTION_COLORS;
    }

    /**
     * Determina el color de un token
     */
    public static async determineColorToken(token: Token): Promise<TextProcessedColor> {
        const dark: boolean = this.isDark();
        const posPalette: ColorMap = await this.getPOSColors(dark);
        const infPalette: ColorMap = await this.getInflectionColors(dark);

        const posKey: string = token.pos?.toUpperCase() ?? "";
        const tagKey: string = token.tag ?? "";

        const posColor: string = posPalette[posKey] ?? this.defaultColour(dark);
        const tagColor: string = token.dep === "ROOT" ? (infPalette[tagKey] ?? posColor) : posColor;

        return { posColor, tagColor };
    }

    /**
     * Establece un color personalizado para una categoría POS específica
     */
    public static async setColorForPOS(
        pos: string, 
        lightColor: string, 
        darkColor?: string
    ): Promise<void> {
        try {
            const settings: CustomColorSettings = await this.getCustomSettings();
            
            settings.lightColors[pos.toUpperCase()] = lightColor;
            if (darkColor) {
                settings.darkColors[pos.toUpperCase()] = darkColor;
            }
            
            await chrome.storage.sync.set({ [this.STORAGE_KEY]: settings });
            
            // Notificar a todas las pestañas activas sobre el cambio de colores
            await this.notifyColorChangeToAllTabs();
            
            // Refrescar estilos de la app si está disponible
            await this.refreshAppStylesIfAvailable();
            
        } catch (error) {
            console.error("Error setting custom color:", error);
        }
    }

    /**
     * Método auxiliar para refrescar estilos de la app si está disponible
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
     * Obtiene un color específico para una categoría POS
     */
    public static async getColorForPOS(pos: string, isDark?: boolean): Promise<string> {
        const colors: ColorMap = await this.getPOSColors(isDark);
        return colors[pos.toUpperCase()] ?? this.defaultColour(isDark ?? this.isDark());
    }

    /**
     * Obtiene los colores por defecto para un POS específico
     */
    public static getDefaultColorsForPOS(pos: string): { light: string; dark: string } {
        const posUpper: string = pos.toUpperCase();
        return {
            light: this.DEFAULT_LIGHT_COLORS[posUpper] ?? this.defaultColour(false),
            dark: this.DEFAULT_DARK_COLORS[posUpper] ?? this.defaultColour(true)
        };
    }

    /**
     * Resetea los colores de un POS específico a los valores por defecto
     */
    public static async resetPOSColor(pos: string): Promise<void> {
        try {
            const customSettings: CustomColorSettings = await this.getCustomSettings();
            const posUpper: string = pos.toUpperCase();
            
            // Remover el POS específico de ambos modos
            if (customSettings.lightColors[posUpper]) {
                delete customSettings.lightColors[posUpper];
            }
            if (customSettings.darkColors[posUpper]) {
                delete customSettings.darkColors[posUpper];
            }
            
            // Guardar la configuración actualizada
            await chrome.storage.sync.set({ [this.STORAGE_KEY]: customSettings });
            
            // Notificar cambio
            await this.notifyColorChangeToAllTabs();
            await this.refreshAppStylesIfAvailable();
            
        } catch (error) {
            console.error(`Error resetting color for POS ${pos}:`, error);
        }
    }

    /**
     * Notifica a todas las pestañas activas sobre cambios en los colores
     */
    private static async notifyColorChangeToAllTabs(): Promise<void> {
        try {
            // Enviar mensaje al background worker para que notifique a todas las pestañas
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
    public static async setColorAndRefresh(pos: string, lightColor: string, darkColor?: string): Promise<void> {
        await this.setColorForPOS(pos, lightColor, darkColor);
    }

    /**
     * Función de prueba para verificar que las notificaciones funcionan
     */
    public static async testNotifications(): Promise<void> {
        await this.notifyColorChangeToAllTabs();
    }
}
