/*
 * FilterTokensService.ts
 * ---------------------------------
 * A lightweight filtering utility that lets the user exclude specific tokens
 * from being wrapped with <span> elements (and therefore from receiving
 * furigana or POS colour‑coding) at runtime.
 *
 * The list of excluded words is persisted via the Chrome Storage API. By
 * default we try `chrome.storage.sync` so the user’s list roams across
 * signed‑in browsers. If we hit the sync quota or the feature is unavailable
 * (e.g. on Chromium without Google account), we transparently fall back to
 * `chrome.storage.local`. Nothing in the public API changes.
 *
 * The class is designed as a lazy singleton with an asynchronous init()
 * method so it can be safely imported and used it from anywhere in the content
 * scripts without worrying about race conditions.
 *
 */

import { Token } from "../models/JapaneseTokens";

const STORAGE_KEY = "excludedTokens" as const;

// Enhanced token storage interface
interface ExcludedToken {
    surface: string;
    reading?: string;
    pos?: string;
    lemma?: string;
}

type TokenString = string;

function normalise(value: string): TokenString {
    return value.normalize("NFC").trim().toLowerCase();
}

export class FilterTokensService {
    private excluded: Set<string> = new Set<TokenString>();
    private excludedTokens: Map<string, ExcludedToken> = new Map();
    private loaded: boolean = false;
    private static _instance: FilterTokensService | null = null;

    private constructor() {}

    static get instance(): FilterTokensService {
        if (!this._instance) this._instance = new FilterTokensService();

        return this._instance;
    }

    async init(): Promise<void> {
        if (this.loaded) return;

        try {
            const result: {[key: string]: any} = await chrome.storage.sync.get(STORAGE_KEY);
            this.load_data(result);
        } catch (err) {
            const result: {[key: string]: any} = await chrome.storage.local.get(STORAGE_KEY);
            this.load_data(result);
        }
    }

    // Private functionality
    private async persist(): Promise<void> {
        const data: ExcludedToken[] = this.getAllTokens();
        const storageData = { [STORAGE_KEY]: data };
        try {
            await chrome.storage.sync.set(storageData);
        } catch (err) {
            await chrome.storage.local.set(storageData);
        }
    }

    private load_data(result: {[key: string]: any}): void {
        const data: any = result[STORAGE_KEY];

        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'string') {
                // Old format
                data.forEach((surface: string): void => {
                    const normalized: string = normalise(surface);
                    this.excluded.add(normalized);
                    this.excludedTokens.set(normalized, { surface });
                });
            } else {
                // New format
                data.forEach((token: ExcludedToken): void => {
                    const normalized: string = normalise(token.surface);
                    this.excluded.add(normalized);
                    this.excludedTokens.set(normalized, token);
                });
            }
        }

        this.loaded = true;
    }

    getAllTokens(): ExcludedToken[] {
        return [...this.excludedTokens.values()];
    }

    shouldExclude(token: Token): boolean {
        const str: string = normalise(token.surface);
        return this.excluded.has(str);
    }

    async addToken(token: Token): Promise<void> {
        const normalized: string = normalise(token.surface);
        const excludedToken: ExcludedToken = {
            surface: token.surface,
            reading: token.reading,
            pos: token.pos,
            lemma: token.lemma
        };
        
        this.excluded.add(normalized);
        this.excludedTokens.set(normalized, excludedToken);
        await this.persist();
    }

}
