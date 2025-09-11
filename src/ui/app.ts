/**
 * Main App Script for Complexa
 * This script manages the excluded words display interface
 */

import { LIGHT_POS_COLORS } from '../content/linguisticsContents/DetermineTextColor';
import { ColorCustomizationService } from '../services/ColorCustomizationService';

// Define the POS types we support - all 11 categories
const POS_CATEGORIES = {
    'VERB': 'verb',
    'NOUN': 'noun', 
    'ADJ': 'adj',
    'ADV': 'adv',
    'PRON': 'pron',
    'PROPN': 'propn',
    'PART': 'part',
    'AUX': 'aux',
    'ADP': 'adp',
    'CCONJ': 'cconj',
    'SCONJ': 'sconj'
} as const;

// Function to convert hex color to lighter version
function lightenColor(hex: string, amount: number = 20): string {
    // Remove # if present
    const color = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Add amount to each channel, cap at 255
    const newR = Math.min(255, r + amount);
    const newG = Math.min(255, g + amount);
    const newB = Math.min(255, b + amount);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Function to inject dynamic styles based on current colors from ColorCustomizationService
async function injectPOSStyles(): Promise<void> {
    // Remove existing dynamic styles
    const existingStyle = document.getElementById('dynamic-pos-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'dynamic-pos-styles';
    
    let css = '';
    
    try {
        // Obtener colores actuales del servicio (incluye personalizaciones)
        const currentColors = await ColorCustomizationService.getPOSColors();
        
        // Iterar sobre todas las categorías POS
        for (const [pos, category] of Object.entries(POS_CATEGORIES)) {
            const color = currentColors[pos] || '#000000';
            
            const lightColor = lightenColor(color, 30);
            const r = parseInt(lightColor.substring(1, 3), 16);
            const g = parseInt(lightColor.substring(3, 5), 16);
            const b = parseInt(lightColor.substring(5, 7), 16);
            
            css += `
            /* ${pos} - Current: ${color} -> Light: ${lightColor} */
            .pos-${category} { 
                background: linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.1) 0%, rgba(${r}, ${g}, ${b}, 0.05) 100%);
                border-color: rgba(${r}, ${g}, ${b}, 0.2);
            }
            
            .pos-${category} .pos-header { 
                border-color: ${color}; 
                color: ${color}; 
            }
            
            .pos-${category} .pos-color-indicator { 
                background-color: ${color}; 
            }
            
            .pos-${category} .excluded-table th { 
                background-color: ${color}; 
            }
            `;
        }
        
        style.textContent = css;
        document.head.appendChild(style);
        
        
    } catch (error) {
        console.error('❌ Error loading colors from service, falling back to hardcoded colors:', error);
        
        // Fallback a colores hardcodeados si hay error
        Object.keys(LIGHT_POS_COLORS).forEach(pos => {
            const color = LIGHT_POS_COLORS[pos as keyof typeof LIGHT_POS_COLORS] || '#000000';
            const category = POS_CATEGORIES[pos as keyof typeof POS_CATEGORIES];
            if (!category) return;
            
            const lightColor = lightenColor(color, 30);
            const r = parseInt(lightColor.substring(1, 3), 16);
            const g = parseInt(lightColor.substring(3, 5), 16);
            const b = parseInt(lightColor.substring(5, 7), 16);
            
            css += `
            /* ${pos} - Fallback: ${color} -> Light: ${lightColor} */
            .pos-${category} { 
                background: linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.1) 0%, rgba(${r}, ${g}, ${b}, 0.05) 100%);
                border-color: rgba(${r}, ${g}, ${b}, 0.2);
            }
            
            .pos-${category} .pos-header { 
                border-color: ${color}; 
                color: ${color}; 
            }
            
            .pos-${category} .pos-color-indicator { 
                background-color: ${color}; 
            }
            
            .pos-${category} .excluded-table th { 
                background-color: ${color}; 
            }
            `;
        });
        
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// Color Configuration Modal Class
class ColorConfigModal {
    private modal: HTMLElement;
    private currentPOS: string = '';
    private lightColorPicker: HTMLInputElement;
    private darkColorPicker: HTMLInputElement;
    private lightHexInput: HTMLInputElement;
    private darkHexInput: HTMLInputElement;
    private currentColorPreviewLight: HTMLElement;
    private currentColorPreviewDark: HTMLElement;
    private currentColorHex: HTMLElement;
    private newColorPreviewLight: HTMLElement;
    private newColorPreviewDark: HTMLElement;
    private demoTextLight: HTMLElement;
    private demoBackgroundLight: HTMLElement;
    private demoTextDark: HTMLElement;
    private demoBackgroundDark: HTMLElement;
    private modalTitle: HTMLElement;

    constructor() {
        this.modal = document.getElementById('color-config-modal')!;
        this.lightColorPicker = document.getElementById('light-color-picker') as HTMLInputElement;
        this.darkColorPicker = document.getElementById('dark-color-picker') as HTMLInputElement;
        this.lightHexInput = document.getElementById('light-color-hex-input') as HTMLInputElement;
        this.darkHexInput = document.getElementById('dark-color-hex-input') as HTMLInputElement;
        this.currentColorPreviewLight = document.getElementById('current-color-preview-light')!;
        this.currentColorPreviewDark = document.getElementById('current-color-preview-dark')!;
        this.currentColorHex = document.getElementById('current-color-hex')!;
        this.newColorPreviewLight = document.getElementById('new-color-preview-light')!;
        this.newColorPreviewDark = document.getElementById('new-color-preview-dark')!;
        this.demoTextLight = document.getElementById('demo-text-light')!;
        this.demoBackgroundLight = document.getElementById('demo-background-light')!;
        this.demoTextDark = document.getElementById('demo-text-dark')!;
        this.demoBackgroundDark = document.getElementById('demo-background-dark')!;
        this.modalTitle = document.getElementById('modal-title')!;

        this.bindEvents();
    }

    private bindEvents(): void {
        // Close modal events
        document.getElementById('close-modal')?.addEventListener('click', () => this.close());
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.close());
        
        // Apply color button - NUEVA FUNCIONALIDAD
        document.getElementById('apply-color-btn')?.addEventListener('click', async () => {
            await this.applyColor();
        });
        
        // Light mode color picker events
        this.lightColorPicker.addEventListener('input', (e: Event) => {
            const color = (e.target as HTMLInputElement).value;
            this.lightHexInput.value = color;
            this.updatePreview();
        });
        
        // Light mode hex input events
        this.lightHexInput.addEventListener('input', (e: Event) => {
            const color = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) {
                this.lightColorPicker.value = color;
                this.updatePreview();
            }
        });
        
        // Dark mode color picker events
        this.darkColorPicker.addEventListener('input', (e: Event) => {
            const color = (e.target as HTMLInputElement).value;
            this.darkHexInput.value = color;
            this.updatePreview();
        });
        
        // Dark mode hex input events
        this.darkHexInput.addEventListener('input', (e: Event) => {
            const color = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) {
                this.darkColorPicker.value = color;
                this.updatePreview();
            }
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e: Event) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    private isValidHex(hex: string): boolean {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    private updatePreview(): void {
        // Obtener colores actuales de ambos pickers
        const lightColor = this.lightColorPicker.value;
        const darkColor = this.darkColorPicker.value;
        
        // Actualizar los previews de los nuevos colores
        this.newColorPreviewLight.style.backgroundColor = lightColor;
        this.newColorPreviewLight.style.backgroundImage = 'none';
        this.newColorPreviewDark.style.backgroundColor = darkColor;
        this.newColorPreviewDark.style.backgroundImage = 'none';
        
        // Texto japonés para el preview
        const japaneseText = "こんにちは！私が例です。";
        
        // Actualizar el preview de texto en modo claro
        this.demoTextLight.textContent = japaneseText;
        this.demoTextLight.style.color = lightColor;
        this.demoTextLight.style.border = `2px solid ${lightColor}`;
        this.demoTextLight.style.borderRadius = '8px';
        this.demoTextLight.style.padding = '12px 16px';
        this.demoTextLight.style.backgroundColor = '#ffffff';
        this.demoTextLight.style.fontWeight = '500';
        this.demoTextLight.style.fontSize = '16px';
        this.demoTextLight.style.textAlign = 'center';
        this.demoTextLight.style.boxShadow = 'none';
        
        // Ocultar el segundo recuadro de modo claro
        this.demoBackgroundLight.style.display = 'none';
        
        // Actualizar el preview de texto en modo oscuro
        this.demoTextDark.textContent = japaneseText;
        this.demoTextDark.style.color = darkColor;
        this.demoTextDark.style.border = `2px solid ${darkColor}`;
        this.demoTextDark.style.borderRadius = '8px';
        this.demoTextDark.style.padding = '12px 16px';
        this.demoTextDark.style.backgroundColor = '#000000';
        this.demoTextDark.style.fontWeight = '500';
        this.demoTextDark.style.fontSize = '16px';
        this.demoTextDark.style.textAlign = 'center';
        this.demoTextDark.style.boxShadow = 'none';
        
        // Ocultar el segundo recuadro de modo oscuro
        this.demoBackgroundDark.style.display = 'none';
        
        console.log(`🎨 Preview: Light: ${lightColor}, Dark: ${darkColor}`);
    }

    private styleColorHexText(): void {
        // Hacer el texto del color actual más grande y visible
        this.currentColorHex.style.fontSize = '14px';
        this.currentColorHex.style.fontWeight = 'bold';
        this.currentColorHex.style.fontFamily = 'monospace';
        this.currentColorHex.style.letterSpacing = '0.5px';
    }

    public async open(pos: string): Promise<void> {
        this.currentPOS = pos;
        
        try {
            // Obtener colores actuales del servicio dinámico para ambos modos
            const currentLightColor = await ColorCustomizationService.getColorForPOS(pos, false); // Light mode
            const currentDarkColor = await ColorCustomizationService.getColorForPOS(pos, true);   // Dark mode
            
            // Update modal title
            const posName = pos.charAt(0) + pos.slice(1).toLowerCase();
            this.modalTitle.textContent = `Configure ${posName} Colors`;
            
            // Set current color preview (ambos modos)
            this.currentColorPreviewLight.style.backgroundColor = currentLightColor;
            this.currentColorPreviewLight.style.backgroundImage = 'none';
            this.currentColorPreviewDark.style.backgroundColor = currentDarkColor;
            this.currentColorPreviewDark.style.backgroundImage = 'none';
            this.currentColorHex.innerHTML = `
                <div>Light: ${currentLightColor}</div>
                <div>Dark: ${currentDarkColor}</div>
            `;
            this.styleColorHexText();

            // Set picker values 
            this.lightColorPicker.value = currentLightColor;
            this.lightHexInput.value = currentLightColor;
            this.darkColorPicker.value = currentDarkColor;
            this.darkHexInput.value = currentDarkColor;
            
            // Set new color preview (ambos modos)
            this.newColorPreviewLight.style.backgroundColor = currentLightColor;
            this.newColorPreviewLight.style.backgroundImage = 'none';
            this.newColorPreviewDark.style.backgroundColor = currentDarkColor;
            this.newColorPreviewDark.style.backgroundImage = 'none';
            
            // Update preview
            this.updatePreview();
            
            // Show modal
            this.modal.classList.add('show');
            
        } catch (error) {
            console.error('❌ Error loading current colors, using fallback:', error);
            
            // Fallback a colores hardcodeados
            const fallbackColor = LIGHT_POS_COLORS[pos as keyof typeof LIGHT_POS_COLORS] || '#000000';
            const fallbackDarkColor = this.generateDarkModeColor(fallbackColor);
            
            const posName = pos.charAt(0) + pos.slice(1).toLowerCase();
            this.modalTitle.textContent = `Configure ${posName} Colors`;
            
            this.currentColorPreviewLight.style.backgroundColor = fallbackColor;
            this.currentColorPreviewLight.style.backgroundImage = 'none';
            this.currentColorPreviewDark.style.backgroundColor = fallbackDarkColor;
            this.currentColorPreviewDark.style.backgroundImage = 'none';
            this.currentColorHex.innerHTML = `
                <div>Light: ${fallbackColor}</div>
                <div>Dark: ${fallbackDarkColor}</div>
            `;
            this.styleColorHexText();
            
            this.lightColorPicker.value = fallbackColor;
            this.lightHexInput.value = fallbackColor;
            this.darkColorPicker.value = fallbackDarkColor;
            this.darkHexInput.value = fallbackDarkColor;
            
            this.newColorPreviewLight.style.backgroundColor = fallbackColor;
            this.newColorPreviewLight.style.backgroundImage = 'none';
            this.newColorPreviewDark.style.backgroundColor = fallbackDarkColor;
            this.newColorPreviewDark.style.backgroundImage = 'none';
            
            this.updatePreview();
            this.modal.classList.add('show');
        }
    }

    public close(): void {
        this.modal.classList.remove('show');
    }

    /**
     * Genera una versión más clara del color para mejor contraste en modo oscuro
     */
    private generateDarkModeColor(lightColor: string): string {
        // Convertir hex a RGB
        const rgb = this.hexToRgb(lightColor);
        if (!rgb) return lightColor; // Fallback al color original si no se puede convertir
        
        // Aumentar la luminosidad para modo oscuro (mejor contraste sobre fondo oscuro)
        const factor = 1.5; // Factor de aclarado
        const newR = Math.min(255, Math.round(rgb.r * factor));
        const newG = Math.min(255, Math.round(rgb.g * factor));
        const newB = Math.min(255, Math.round(rgb.b * factor));
        
        // Convertir de vuelta a hex
        return this.rgbToHex(newR, newG, newB);
    }

    /**
     * Convierte color hex a RGB
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convierte RGB a color hex
     */
    private rgbToHex(r: number, g: number, b: number): string {
        return "#" + 
            r.toString(16).padStart(2, '0') + 
            g.toString(16).padStart(2, '0') + 
            b.toString(16).padStart(2, '0');
    }

    /**
     * Añade transparencia a un color hex
     */
    private addAlpha(hex: string, alpha: number): string {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    /**
     * Oscurece un color hex
     */
    private darkenColor(hex: string, amount: number): string {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const newR = Math.max(0, rgb.r - amount);
        const newG = Math.max(0, rgb.g - amount);
        const newB = Math.max(0, rgb.b - amount);
        
        return this.rgbToHex(newR, newG, newB);
    }

    /**
     * Aclara un color hex (método local para la clase)
     */
    private lightenColor(hex: string, amount: number): string {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const newR = Math.min(255, rgb.r + amount);
        const newG = Math.min(255, rgb.g + amount);
        const newB = Math.min(255, rgb.b + amount);
        
        return this.rgbToHex(newR, newG, newB);
    }

    private async applyColor(): Promise<void> {
        try {
            // Obtener los colores seleccionados de ambos pickers
            const selectedLightColor = this.lightColorPicker.value;
            const selectedDarkColor = this.darkColorPicker.value;
            
            if (!selectedLightColor || !selectedDarkColor || !this.currentPOS) {
                console.error('❌ No colors selected or POS not set');
                return;
            }
            
            // Guardar ambos colores usando ColorCustomizationService
            await ColorCustomizationService.setColorForPOS(
                this.currentPOS, 
                selectedLightColor,     // Color para modo claro
                selectedDarkColor       // Color para modo oscuro
            );
            
            console.log(`✅ Colors applied for ${this.currentPOS}: Light: ${selectedLightColor}, Dark: ${selectedDarkColor}`);
            
            // Refrescar los estilos de la app para que se vean los cambios inmediatamente
            await injectPOSStyles();
                        
            // Cerrar el modal
            this.close();
            
        } catch (error) {
            console.error('❌ Error applying colors:', error);
            this.showErrorMessage('Failed to apply colors. Please try again.');
        }
    }
    

    
    private showErrorMessage(message: string): void {
        console.error(`❌ ${message}`);
        // Aquí podrías añadir una notificación de error visual si quieres
    }
}

// Map POS types to their exact categories
function getPOSCategory(pos: string): string {
    const posUpper = pos.toUpperCase();
    return POS_CATEGORIES[posUpper as keyof typeof POS_CATEGORIES] || 'noun'; // default to noun if unknown
}

// Interface for excluded word data (matching FilterTokensService)
interface ExcludedToken {
    surface: string;
    reading?: string;
    pos?: string;
    lemma?: string;
}

class ExcludedWordsManager {
    private excludedWords: ExcludedToken[] = [];

    constructor() {
        this.loadExcludedWords();
    }

    private async loadExcludedWords(): Promise<void> {
        try {
            // Try to get from chrome.storage.sync first
            const result = await chrome.storage.sync.get('excludedTokens');
            const excludedList = result.excludedTokens as ExcludedToken[] || [];
            
            this.excludedWords = excludedList;
            
        } catch (error) {
            try {
                // Fallback to local storage
                const result = await chrome.storage.local.get('excludedTokens');
                const excludedList = result.excludedTokens as ExcludedToken[] || [];
                
                this.excludedWords = excludedList;
                
            } catch (localError) {
                console.warn('Could not load excluded words:', localError);
                this.excludedWords = [];
            }
        }
        
        this.renderExcludedWords();
    }

    private renderExcludedWords(): void {
        // Group words by their specific POS categories
        const categorizedWords: Record<string, ExcludedToken[]> = {};
        
        // Initialize all categories
        Object.values(POS_CATEGORIES).forEach(category => {
            categorizedWords[category] = [];
        });

        // Group words by their POS category
        this.excludedWords.forEach(word => {
            const category = getPOSCategory(word.pos || '');
            if (categorizedWords[category]) {
                categorizedWords[category].push(word);
            }
        });

        // Render each category
        Object.entries(categorizedWords).forEach(([category, words]) => {
            const tbody = document.getElementById(`${category}-tbody`);
            if (!tbody) return;

            // Clear existing content
            tbody.innerHTML = '';

            if (words.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="empty-message">No words yet</td></tr>`;
                return;
            }

            words.forEach(word => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${word.surface}</td>
                    <td>${word.reading || '-'}</td>
                    <td>
                        <button class="remove-word-btn" data-word="${word.surface}">
                            ×
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });

        this.bindRemoveButtons();
    }

    private bindRemoveButtons(): void {
        const removeButtons = document.querySelectorAll('.remove-word-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.target as HTMLButtonElement;
                const word = target.dataset.word;
                if (word) {
                    await this.removeWord(word);
                }
            });
        });
    }

    private async removeWord(word: string): Promise<void> {
        try {
            // Remove from our local array
            this.excludedWords = this.excludedWords.filter(w => w.surface !== word);

            // Update chrome storage
            try {
                await chrome.storage.sync.set({ excludedTokens: this.excludedWords });
            } catch (error) {
                await chrome.storage.local.set({ excludedTokens: this.excludedWords });
            }

            // Re-render the tables
            this.renderExcludedWords();

        } catch (error) {
            console.error('Error removing word:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App page loaded');

    // Initialize color preview modal (solo visual)
    const colorModal = new ColorConfigModal();

    // Inject dynamic POS styles from ColorCustomizationService (ahora con colores dinámicos)
    await injectPOSStyles();

    // Initialize the excluded words manager
    new ExcludedWordsManager();

    // Bind reset colors button event
    const resetColorsBtn = document.getElementById('reset-colors-btn');
    if (resetColorsBtn) {
        resetColorsBtn.addEventListener('click', async () => {
            try {
                // Deshabilitar botón durante la operación
                resetColorsBtn.textContent = '🔄 Resetting...';
                (resetColorsBtn as HTMLButtonElement).disabled = true;
                                
                // Resetear colores usando el servicio
                await ColorCustomizationService.resetColors();
                
                // Refrescar los estilos de la app
                await injectPOSStyles();
                                
                // Rehabilitar botón
                resetColorsBtn.textContent = '🎨 Reset Colors to Default';
                (resetColorsBtn as HTMLButtonElement).disabled = false;
                
            } catch (error) {
                console.error('❌ Error resetting colors:', error);
                
                // Rehabilitar botón en caso de error
                resetColorsBtn.textContent = '🎨 Reset Colors to Default';
                (resetColorsBtn as HTMLButtonElement).disabled = false;
            }
        });
    }

    // Bind config button events (solo para preview visual)
    document.querySelectorAll('.pos-config-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const pos = (button as HTMLElement).dataset.pos;
            if (pos) {
                await colorModal.open(pos);
            }
        });
    });
});

// 🌟 Función global para refrescar estilos cuando cambien los colores
declare global {
    interface Window {
        refreshAppStyles: () => Promise<void>;
    }
}

// Hacer la función disponible globalmente
if (typeof window !== 'undefined') {
    window.refreshAppStyles = async () => {
        await injectPOSStyles();
    };
}
