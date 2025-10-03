/**
 * POSFilterUtility.ts
 * ---------------------------------
 * Content script utility to filter tokens based on POS enabled/disabled states.
 * 
 * This utility works with POSStateService to determine which tokens should be
 * processed for readings and coloring based on their part of speech.
 * 
 * Since content scripts don't have direct access to the POSStateService (which lives
 * in the UI context), this utility uses chrome.storage to check POS states directly.
 */

import { Token } from '../models/JapaneseTokens';

// Define the POS types we support - all 11 categories (matching POSStateService)
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

export class POSFilterUtility {
    private static readonly STORAGE_KEY: string = 'pos_states';
    private static posStates: { [key: string]: boolean } | null = null;
    private static isInitialized: boolean = false;

    /**
     * Initialize by loading POS states from chrome storage
     */
    public static async init(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const result: {[key: string]: any} = await chrome.storage.local.get(this.STORAGE_KEY);
            this.posStates = result[this.STORAGE_KEY] || {};
            
            // Initialize all POS as enabled by default if not set
            for (const pos of Object.keys(POS_CATEGORIES)) {
                if (!(pos in this.posStates!)) {
                    this.posStates![pos] = true; // Default to enabled
                }
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error loading POS states for filtering:', error);
            // Fallback: enable all POS
            this.posStates = {};
            for (const pos of Object.keys(POS_CATEGORIES)) {
                this.posStates[pos] = true;
            }
            this.isInitialized = true;
        }
    }

    /**
     * Check if a POS is enabled (not filtered out)
     */
    public static isPOSEnabled(pos: string): boolean {
        if (!this.isInitialized || !this.posStates) {
            console.warn('⚠️ POSFilterUtility not initialized, defaulting to enabled');
            return true; // Default to enabled if not initialized
        }

        return this.posStates[pos.toUpperCase()] ?? true;
    }

    /**
     * Check if a token should be processed (not filtered out)
     * Returns true if the token's POS is enabled
     */
    public static shouldProcessToken(token: Token): boolean {
        if (!token.pos) return true; // Process tokens without POS info

        return this.isPOSEnabled(token.pos);
    }

    /**
     * Refresh the POS states from storage (useful if states change during runtime)
     */
    public static async refresh(): Promise<void> {
        this.isInitialized = false;
        this.posStates = null;
        await this.init();
    }

}
