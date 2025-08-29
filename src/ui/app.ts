/**
 * Main App Script for Complexa
 * This script manages the excluded words display interface
 */

import { LIGHT_POS_COLORS } from '../content/linguisticsContents/DetermineTextColor';

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

// Function to inject dynamic styles based on LIGHT_POS_COLORS
function injectPOSStyles(): void {
    const style = document.createElement('style');
    style.id = 'dynamic-pos-styles';
    
    let css = '';
    
    Object.entries(LIGHT_POS_COLORS).forEach(([pos, color]) => {
        const category = POS_CATEGORIES[pos as keyof typeof POS_CATEGORIES];
        if (!category) return;
        
        const lightColor = lightenColor(color, 30);
        const r = parseInt(lightColor.substring(1, 3), 16);
        const g = parseInt(lightColor.substring(3, 5), 16);
        const b = parseInt(lightColor.substring(5, 7), 16);
        
        css += `
        /* ${pos} - Original: ${color} -> Light: ${lightColor} */
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('App page loaded');

    // Inject dynamic POS styles from DetermineTextColor
    injectPOSStyles();

    // Initialize the excluded words manager
    new ExcludedWordsManager();
});
