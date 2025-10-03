import { LIGHT_POS_COLORS } from '../../content/utils/DetermineTextColor';
import { ColorCustomizationService } from '../../services/ColorCustomizationService';
import { POSStateService, getPOSStateService } from '../../services/POSStateService';

// Function to get user-friendly POS names (imported from app.ts)
function getPOSDisplayName(posCode: string): string {
    const posNames: { [key: string]: string } = {
        'VERB': 'Verbs',
        'NOUN': 'Nouns',
        'ADJ': 'Adjectives',
        'ADV': 'Adverbs',
        'PRON': 'Pronouns',
        'PROPN': 'Proper Nouns',
        'PART': 'Particles',
        'AUX': 'Auxiliary Verbs',
        'ADP': 'Adpositions',
        'CCONJ': 'Coordinating Conjunctions',
        'SCONJ': 'Subordinating Conjunctions'
    };
    
    return posNames[posCode.toUpperCase()] || posCode.charAt(0) + posCode.slice(1).toLowerCase();
}

/**
 * Color Configuration Modal Class
 * Handles the POS color configuration modal, including color pickers,
 * preview functionality, and integration with the POSStateService.
 */
export class ColorConfigModel {
    private readonly modal: HTMLElement;
    private currentPOS: string = '';
    private posStateService: POSStateService;
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
        this.posStateService = getPOSStateService();
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
        
        // Apply color button
        document.getElementById('apply-color-btn')?.addEventListener('click', async () => {
            await this.applyColor();
        });
        
        // Reset POS color button
        document.getElementById('reset-pos-color-btn')?.addEventListener('click', async () => {
            await this.resetPOSColor();
        });
        
        // Light mode color picker events
        this.lightColorPicker.addEventListener('input', (e: Event): void => {
            this.lightHexInput.value = (e.target as HTMLInputElement).value;
            this.updatePreview();
        });
        
        // Light mode hex input events
        this.lightHexInput.addEventListener('input', (e: Event): void => {
            const color: string = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) {
                this.lightColorPicker.value = color;
                this.updatePreview();
            }
        });
        
        // Dark mode color picker events
        this.darkColorPicker.addEventListener('input', (e: Event): void => {
            this.darkHexInput.value = (e.target as HTMLInputElement).value;
            this.updatePreview();
        });
        
        // Dark mode hex input events
        this.darkHexInput.addEventListener('input', (e: Event): void => {
            const color: string = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) {
                this.darkColorPicker.value = color;
                this.updatePreview();
            }
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e: Event): void => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.close();
            }
        });

        // Switch toggle event listener
        const switchElement = document.getElementById('pos-toggle-switch') as HTMLInputElement;
        switchElement?.addEventListener('change', () => {
            this.updateSwitchLabel();
        });
    }

    private isValidHex(hex: string): boolean {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    private updateSwitchLabel(): void {
        const switchElement = document.getElementById('pos-toggle-switch') as HTMLInputElement;
        const switchLabel: Element | null = document.querySelector('.modal-switch-label');
        const modalContent: Element | null = document.querySelector('.modal-content');
        
        if (switchElement && switchLabel && modalContent && this.currentPOS) {
            const posDisplayName: string = getPOSDisplayName(this.currentPOS);
            const action: "Disable" | "Enable" = switchElement.checked ? 'Disable' : 'Enable';
            switchLabel.textContent = `${action} ${posDisplayName}`;
            
            // Toggle modal disabled state
            if (switchElement.checked) {
                modalContent.classList.remove('disabled');
            } else {
                modalContent.classList.add('disabled');
            }
        }
    }

    /**
     * Normaliza un color hex a formato de 6 caracteres (sin alpha)
     * Convierte #rrggbbaa a #rrggbb
     */
    private normalizeHexColor(hex: string): string {
        if (!hex) return '#000000';
        
        // Remove # if present
        let cleanHex = hex.replace('#', '');
        
        // If it's 8 characters (with alpha), take only the first 6
        if (cleanHex.length === 8) {
            cleanHex = cleanHex.substring(0, 6);
        }
        
        // Ensure it's exactly 6 characters
        if (cleanHex.length === 6) {
            return `#${cleanHex}`;
        }
        
        // If it's 3 characters, expand it
        if (cleanHex.length === 3) {
            return `#${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}`;
        }
        
        // Fallback to black if invalid
        return '#000000';
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
            const currentLightColor: string = await ColorCustomizationService.getColorForPOS(pos, false); // Light mode
            const currentDarkColor: string = await ColorCustomizationService.getColorForPOS(pos, true);   // Dark mode
            
            // Normalizar colores a formato de 6 caracteres
            const normalizedLightColor: string = this.normalizeHexColor(currentLightColor);
            const normalizedDarkColor: string = this.normalizeHexColor(currentDarkColor);
            
            // Update modal title
            const posDisplayName: string = getPOSDisplayName(pos);
            this.modalTitle.textContent = `Configure ${posDisplayName} Colors`;
            
            // Load and set switch state from storage
            const switchElement = document.getElementById('pos-toggle-switch') as HTMLInputElement;
            if (switchElement) {
                switchElement.checked = this.posStateService.getPOSState(pos);
            }
            this.updateSwitchLabel();
            
            // Set current color preview (ambos modos) - usar colores originales para display
            this.currentColorPreviewLight.style.backgroundColor = normalizedLightColor;
            this.currentColorPreviewLight.style.backgroundImage = 'none';
            this.currentColorPreviewDark.style.backgroundColor = normalizedDarkColor;
            this.currentColorPreviewDark.style.backgroundImage = 'none';
            this.currentColorHex.innerHTML = `
                <div>Light: ${normalizedLightColor}</div>
                <div>Dark: ${normalizedDarkColor}</div>
            `;
            this.styleColorHexText();

            // Set picker values - usar colores normalizados
            this.lightColorPicker.value = normalizedLightColor;
            this.lightHexInput.value = normalizedLightColor;
            this.darkColorPicker.value = normalizedDarkColor;
            this.darkHexInput.value = normalizedDarkColor;
            
            // Set new color preview (ambos modos)
            this.newColorPreviewLight.style.backgroundColor = normalizedLightColor;
            this.newColorPreviewLight.style.backgroundImage = 'none';
            this.newColorPreviewDark.style.backgroundColor = normalizedDarkColor;
            this.newColorPreviewDark.style.backgroundImage = 'none';
            
            // Update preview
            this.updatePreview();
            
            // Show modal y bloquear scroll del body
            this.modal.classList.add('show');
            this.blockBodyScroll();
            
        } catch (error) {
            console.error('❌ Error loading current colors, using fallback:', error);
            
            // Fallback a colores hardcodeados
            const fallbackColor: string = LIGHT_POS_COLORS[pos as keyof typeof LIGHT_POS_COLORS] || '#000000';
            const fallbackDarkColor: string = this.generateDarkModeColor(fallbackColor);
            
            // Normalizar colores de fallback
            const normalizedFallbackLight: string = this.normalizeHexColor(fallbackColor);
            const normalizedFallbackDark: string = this.normalizeHexColor(fallbackDarkColor);
            
            const posName: string = pos.charAt(0) + pos.slice(1).toLowerCase();
            this.modalTitle.textContent = `Configure ${posName} Colors`;
            
            this.currentColorPreviewLight.style.backgroundColor = normalizedFallbackLight;
            this.currentColorPreviewLight.style.backgroundImage = 'none';
            this.currentColorPreviewDark.style.backgroundColor = normalizedFallbackDark;
            this.currentColorPreviewDark.style.backgroundImage = 'none';
            this.currentColorHex.innerHTML = `
                <div>Light: ${normalizedFallbackLight}</div>
                <div>Dark: ${normalizedFallbackDark}</div>
            `;
            this.styleColorHexText();
            
            this.lightColorPicker.value = normalizedFallbackLight;
            this.lightHexInput.value = normalizedFallbackLight;
            this.darkColorPicker.value = normalizedFallbackDark;
            this.darkHexInput.value = normalizedFallbackDark;
            
            this.newColorPreviewLight.style.backgroundColor = normalizedFallbackLight;
            this.newColorPreviewLight.style.backgroundImage = 'none';
            this.newColorPreviewDark.style.backgroundColor = normalizedFallbackDark;
            this.newColorPreviewDark.style.backgroundImage = 'none';
            
            this.updatePreview();
            this.modal.classList.add('show');
            this.blockBodyScroll();
        }
    }

    public close(): void {
        this.modal.classList.remove('show');
        this.unblockBodyScroll();
    }

    /**
     * Bloquea el scroll del body cuando el modal está abierto
     */
    private blockBodyScroll(): void {
        // Guardar posición actual de scroll
        const scrollY: number = window.scrollY;
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollY}px`;
        
        // También bloquear scroll en html para mayor compatibilidad
        document.documentElement.style.overflow = 'hidden';
    }

    /**
     * Unlocks body from scroll.
     */
    private unblockBodyScroll(): void {
        const scrollY: string = document.body.style.top;
        
        // Restore styles
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        document.documentElement.style.overflow = '';
        
        // Restore scroll position
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }

    /**
     * Genera una versión más clara del color para mejor contraste en modo oscuro
     */
    private generateDarkModeColor(lightColor: string): string {
        // Convertir hex a RGB
        const rgb = this.hexToRgb(lightColor);
        if (!rgb) return lightColor;
        
        // Increases color brightness so text is more readable in dark mode.
        const factor = 1.5;
        const newR: number = Math.min(255, Math.round(rgb.r * factor));
        const newG: number = Math.min(255, Math.round(rgb.g * factor));
        const newB: number = Math.min(255, Math.round(rgb.b * factor));
        
        // Convert back to hex
        return this.rgbToHex(newR, newG, newB);
    }

    /**
     * Converts a hex color into RGB
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result: RegExpExecArray | null = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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

    private async applyColor(): Promise<void> {
        try {
            const switchElement = document.getElementById('pos-toggle-switch') as HTMLInputElement;
            
            if (!this.currentPOS) {
                console.error('❌ POS not set');
                return;
            }
            
            if (switchElement && switchElement.checked) {
                // Switch is ON - Apply the selected colors
                const selectedLightColor: string = this.lightColorPicker.value;
                const selectedDarkColor: string = this.darkColorPicker.value;
                
                if (!selectedLightColor || !selectedDarkColor) {
                    console.error('❌ No colors selected');
                    return;
                }
                
                await ColorCustomizationService.setColorForPOS(
                    this.currentPOS, 
                    selectedLightColor,
                    selectedDarkColor
                );
            }
            
            // Save the switch state regardless of position
            if (switchElement) {
                await this.posStateService.setPOSState(this.currentPOS, switchElement.checked);
                
                try {
                    await chrome.runtime.sendMessage({
                        action: 'POS_STATES_UPDATED',
                        type: 'POS_STATES_UPDATED'
                    });
                } catch (error) {
                    console.warn('⚠️ Could not notify content scripts about POS state change:', error);
                }
            }
            
            if (window.refreshAppStyles) {
                await window.refreshAppStyles();
            }
                        
            this.close();
        } catch (error) {
            console.error('❌ Error applying changes:', error);
            this.showErrorMessage('Failed to apply changes. Please try again.');
        }
    }

    private async resetPOSColor(): Promise<void> {
        try {
            if (!this.currentPOS) {
                console.error('❌ No POS selected for reset');
                return;
            }

            const defaultColors = ColorCustomizationService.getDefaultColorsForPOS(this.currentPOS);

            const normalizedLightColor: string = this.normalizeHexColor(defaultColors.light);
            const normalizedDarkColor: string = this.normalizeHexColor(defaultColors.dark);

            this.lightColorPicker.value = normalizedLightColor;
            this.darkColorPicker.value = normalizedDarkColor;
            this.lightHexInput.value = normalizedLightColor;
            this.darkHexInput.value = normalizedDarkColor;
            
            this.updatePreview();
                        
        } catch (error) {
            console.error('❌ Error resetting POS color:', error);
            this.showErrorMessage('Failed to reset colors. Please try again.');
        }
    }
    
    private showErrorMessage(message: string): void {
        console.error(`❌ ${message}`);
    }
}
