/**
 * Main App Script for Complexa
 * This script manages the excluded words display interface
 */

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

    // Initialize the excluded words manager
    new ExcludedWordsManager();
});
