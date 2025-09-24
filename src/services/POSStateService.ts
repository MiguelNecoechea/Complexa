/**
 * POSStateService.ts
 * ---------------------------------
 * Service to manage the enabled/disabled state of POS (Parts of Speech) categories.
 * 
 * This service provides persistent storage for POS states using Chrome's storage API.
 * By default, all POS categories are enabled, but users can disable specific ones
 * through the configuration modal.
 * 
 * The service uses a singleton pattern to ensure consistent state across the application.
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

export class POSStateService {
    private static readonly STORAGE_KEY = 'pos_states';
    private static instance: POSStateService;
    private posStates: { [key: string]: boolean } = {};
    private isInitialized: boolean = false;

    private constructor() {
        // Private constructor for singleton pattern
    }

    public static getInstance(): POSStateService {
        if (!POSStateService.instance) {
            POSStateService.instance = new POSStateService();
        }
        return POSStateService.instance;
    }

    /**
     * Initialize the service by loading states from storage
     * This should be called before using other methods
     */
    public async init(): Promise<void> {
        if (this.isInitialized) return;
        
        await this.loadStates();
        this.isInitialized = true;
    }

    private async loadStates(): Promise<void> {
        try {
            const result = await chrome.storage.local.get(POSStateService.STORAGE_KEY);
            this.posStates = result[POSStateService.STORAGE_KEY] || {};
            
            // Initialize all POS as enabled by default if not set
            for (const pos of Object.keys(POS_CATEGORIES)) {
                if (!(pos in this.posStates)) {
                    this.posStates[pos] = true; // Default to enabled
                }
            }
            
        } catch (error) {
            console.error('❌ Error loading POS states:', error);
            // Initialize with all POS enabled as fallback
            for (const pos of Object.keys(POS_CATEGORIES)) {
                this.posStates[pos] = true;
            }
        }
    }

    private async saveStates(): Promise<void> {
        try {
            await chrome.storage.local.set({
                [POSStateService.STORAGE_KEY]: this.posStates
            });
        } catch (error) {
            console.error('❌ Error saving POS states:', error);
        }
    }

    /**
     * Set the enabled/disabled state for a specific POS
     */
    public async setPOSState(pos: string, enabled: boolean): Promise<void> {
        if (!this.isInitialized) {
            await this.init();
        }
        
        this.posStates[pos.toUpperCase()] = enabled;
        await this.saveStates();
    }

    /**
     * Get the enabled/disabled state for a specific POS
     */
    public getPOSState(pos: string): boolean {
        if (!this.isInitialized) {
            console.warn('⚠️ POSStateService not initialized, returning default state');
            return true;
        }
        
        return this.posStates[pos.toUpperCase()] ?? true; // Default to enabled
    }

}

// Export singleton instance getter function for convenience
export function getPOSStateService(): POSStateService {
    return POSStateService.getInstance();
}
