/**
 * Main App Script for Complexa
 * This script manages the excluded words display interface
 */

import { LIGHT_POS_COLORS } from '../content/linguisticsContents/DetermineTextColor';
import { ColorCustomizationService } from '../services/ColorCustomizationService';
import { POSStateService, getPOSStateService } from '../services/POSStateService';
import { ColorConfigModel } from './components/ColorConfigModel';
import { ExcludedWordsManager } from './managers/ExcludedWordsManager';

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
    const color: string = hex.replace('#', '');
    
    // Parse RGB values
    const r: number = parseInt(color.substring(0, 2), 16);
    const g: number = parseInt(color.substring(2, 4), 16);
    const b: number = parseInt(color.substring(4, 6), 16);
    
    // Add amount to each channel, cap at 255
    const newR: number = Math.min(255, r + amount);
    const newG: number = Math.min(255, g + amount);
    const newB: number = Math.min(255, b + amount);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Function to inject dynamic styles based on current colors from ColorCustomizationService
async function injectPOSStyles(): Promise<void> {
    // Remove existing dynamic styles
    const existingStyle: HTMLElement | null = document.getElementById('dynamic-pos-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const style: HTMLStyleElement = document.createElement('style');
    style.id = 'dynamic-pos-styles';
    
    let css: string = '';
    
    try {
        // Obtener colores actuales del servicio (incluye personalizaciones)
        const currentColors = await ColorCustomizationService.getPOSColors();
        
        // Iterar sobre todas las categorías POS
        for (const [pos, category] of Object.entries(POS_CATEGORIES)) {
            const color: string = currentColors[pos] || '#000000';
            
            const lightColor: string = lightenColor(color, 30);
            const r: number = parseInt(lightColor.substring(1, 3), 16);
            const g: number = parseInt(lightColor.substring(3, 5), 16);
            const b: number = parseInt(lightColor.substring(5, 7), 16);
            
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
        Object.keys(LIGHT_POS_COLORS).forEach((pos: string): void => {
            const color: string = LIGHT_POS_COLORS[pos as keyof typeof LIGHT_POS_COLORS] || '#000000';
            const category = POS_CATEGORIES[pos as keyof typeof POS_CATEGORIES];
            if (!category) return;
            
            const lightColor: string = lightenColor(color, 30);
            const r: number = parseInt(lightColor.substring(1, 3), 16);
            const g: number = parseInt(lightColor.substring(3, 5), 16);
            const b: number = parseInt(lightColor.substring(5, 7), 16);
            
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

// Map POS types to their exact categories
function getPOSCategory(pos: string): string {
    const posUpper: string = pos.toUpperCase();
    return POS_CATEGORIES[posUpper as keyof typeof POS_CATEGORIES] || 'noun'; // default to noun if unknown
}

// Global function to access POS state service
function getPOSStateManager(): POSStateService {
    return getPOSStateService();
}

document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
    console.log('App page loaded');

    // Initialize POS state service
    const posStateService: POSStateService = getPOSStateService();
    await posStateService.init();

    // Initialize color preview modal (solo visual)
    const colorModal = new ColorConfigModel();

    // Inject dynamic POS styles from ColorCustomizationService (ahora con colores dinámicos)
    await injectPOSStyles();

    // Initialize the excluded words manager
    new ExcludedWordsManager();

    // Bind config button events (solo para preview visual)
    document.querySelectorAll('.pos-config-btn').forEach((button: Element): void => {
        button.addEventListener('click', async (e: Event): Promise<void> => {
            e.stopPropagation();
            const pos: string | undefined = (button as HTMLElement).dataset.pos;
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
    window.refreshAppStyles = async (): Promise<void> => {
        await injectPOSStyles();
    };
}
