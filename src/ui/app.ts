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
    private colorPicker: HTMLInputElement;
    private hexInput: HTMLInputElement;
    private currentColorPreview: HTMLElement;
    private currentColorHex: HTMLElement;
    private demoTextLight: HTMLElement;
    private demoBackgroundLight: HTMLElement;
    private demoTextDark: HTMLElement;
    private demoBackgroundDark: HTMLElement;
    private modalTitle: HTMLElement;
    private newColorPreview: HTMLElement;

    constructor() {
        this.modal = document.getElementById('color-config-modal')!;
        this.colorPicker = document.getElementById('color-picker') as HTMLInputElement;
        this.hexInput = document.getElementById('color-hex-input') as HTMLInputElement;
        this.currentColorPreview = document.getElementById('current-color-preview')!;
        this.currentColorHex = document.getElementById('current-color-hex')!;
        this.demoTextLight = document.getElementById('demo-text-light')!;
        this.demoBackgroundLight = document.getElementById('demo-background-light')!;
        this.demoTextDark = document.getElementById('demo-text-dark')!;
        this.demoBackgroundDark = document.getElementById('demo-background-dark')!;
        this.modalTitle = document.getElementById('modal-title')!;
        
        // Nuevo elemento para preview del color seleccionado
        this.newColorPreview = document.getElementById('new-color-preview')!;

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
        
        // Color picker events (solo para preview visual)
        this.colorPicker.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.hexInput.value = color;
            this.updatePreview(color);
        });
        
        // Hex input events (solo para preview visual)
        this.hexInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) {
                this.colorPicker.value = color;
                this.updatePreview(color);
            }
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    private isValidHex(hex: string): boolean {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    private updatePreview(color: string): void {
        // Generar color para modo oscuro
        const darkModeColor = this.generateDarkModeColor(color);
        
        // Actualizar el preview del nuevo color (modo claro)
        this.newColorPreview.style.backgroundColor = color;
        this.newColorPreview.style.backgroundImage = 'none'; // Remove transparency pattern
        
        // Texto japonés para el preview
        const japaneseText = "こんにちは！私が例です。";
        
        // Actualizar el preview de texto en modo claro - solo letras del color
        this.demoTextLight.textContent = japaneseText;
        this.demoTextLight.style.color = color;
        this.demoTextLight.style.border = `2px solid ${color}`;
        this.demoTextLight.style.borderRadius = '8px';
        this.demoTextLight.style.padding = '12px 16px';
        this.demoTextLight.style.backgroundColor = '#ffffff'; // Fondo blanco sólido
        this.demoTextLight.style.fontWeight = '500';
        this.demoTextLight.style.fontSize = '16px';
        this.demoTextLight.style.textAlign = 'center';
        this.demoTextLight.style.boxShadow = 'none'; // Sin sombra
        
        // Ocultar el segundo recuadro de modo claro (el que tenía fondo de color)
        this.demoBackgroundLight.style.display = 'none';
        
        // Actualizar el preview de texto en modo oscuro - solo letras del color
        this.demoTextDark.textContent = japaneseText;
        this.demoTextDark.style.color = darkModeColor;
        this.demoTextDark.style.border = `2px solid ${darkModeColor}`;
        this.demoTextDark.style.borderRadius = '8px';
        this.demoTextDark.style.padding = '12px 16px';
        this.demoTextDark.style.backgroundColor = '#000000'; // Fondo negro sólido
        this.demoTextDark.style.fontWeight = '500';
        this.demoTextDark.style.fontSize = '16px';
        this.demoTextDark.style.textAlign = 'center';
        this.demoTextDark.style.boxShadow = 'none'; // Sin sombra
        
        // Ocultar el segundo recuadro de modo oscuro (el que tenía fondo de color)
        this.demoBackgroundDark.style.display = 'none';
        
    }

    public async open(pos: string): Promise<void> {
        this.currentPOS = pos;
        
        try {
            // Obtener color actual del servicio dinámico
            const currentColor = await ColorCustomizationService.getColorForPOS(pos);
            
            // Update modal title
            const posName = pos.charAt(0) + pos.slice(1).toLowerCase();
            this.modalTitle.textContent = `Preview ${posName} Colors`;
            
            // Set current color
            this.currentColorPreview.style.backgroundColor = currentColor;
            this.currentColorPreview.style.backgroundImage = 'none';
            this.currentColorHex.textContent = currentColor;
            this.currentColorHex.style.fontSize = '16px';

            // Set picker values and new color preview
            this.colorPicker.value = currentColor;
            this.hexInput.value = currentColor;
            this.newColorPreview.style.backgroundColor = currentColor;
            this.newColorPreview.style.backgroundImage = 'none';
            
            // Update preview
            this.updatePreview(currentColor);
            
            // Show modal
            this.modal.classList.add('show');
            
            
        } catch (error) {
            console.error('❌ Error loading current color, using fallback:', error);
            
            // Fallback a colores hardcodeados
            const fallbackColor = LIGHT_POS_COLORS[pos as keyof typeof LIGHT_POS_COLORS] || '#000000';
            
            const posName = pos.charAt(0) + pos.slice(1).toLowerCase();
            this.modalTitle.textContent = `Preview ${posName} Colors`;
            
            this.currentColorPreview.style.backgroundColor = fallbackColor;
            this.currentColorPreview.style.backgroundImage = 'none';
            this.currentColorHex.textContent = fallbackColor;
            this.currentColorHex.style.fontSize = '16px';
            this.colorPicker.value = fallbackColor;
            this.hexInput.value = fallbackColor;
            this.newColorPreview.style.backgroundColor = fallbackColor;
            this.newColorPreview.style.backgroundImage = 'none';
            
            this.updatePreview(fallbackColor);
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
            // Obtener el color seleccionado
            const selectedColor = this.colorPicker.value;
            
            if (!selectedColor || !this.currentPOS) {
                console.error('❌ No color selected or POS not set');
                return;
            }
            
            // Generar una versión más clara del color para modo oscuro (mejor contraste)
            const darkModeColor = this.generateDarkModeColor(selectedColor);
                        
            // Guardar el color usando ColorCustomizationService
            await ColorCustomizationService.setColorForPOS(
                this.currentPOS, 
                selectedColor,     // Color original para modo claro
                darkModeColor      // Color ajustado para modo oscuro
            );
            
            
            // Refrescar los estilos de la app para que se vean los cambios inmediatamente
            await injectPOSStyles();
                        
            // Cerrar el modal
            this.close();
            
        } catch (error) {
            console.error('❌ Error applying color:', error);
            this.showErrorMessage('Failed to apply color. Please try again.');
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
