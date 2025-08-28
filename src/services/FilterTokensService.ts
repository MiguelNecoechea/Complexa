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

type TokenString = string;

function normalise(value: string): TokenString {
    return value.normalize("NFC").trim().toLowerCase();
}

export class FilterTokensService {
    private excluded: Set<string> = new Set<TokenString>();
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
            const list = result[STORAGE_KEY] as TokenString[] | undefined;

            if (Array.isArray(list)) list.forEach((t: string): Set<string> => this.excluded.add(t));

            this.loaded = true;
        } catch (err) {
            const result: {[key: string]: any} = await chrome.storage.local.get(STORAGE_KEY);
            const list = result[STORAGE_KEY] as TokenString[] | undefined;

            if (Array.isArray(list)) list.forEach((t: string): Set<string> => this.excluded.add(t));

            this.loaded = true;
        }

    }

    // Private functionality
    private async persist(): Promise<void> {
        const data = { [STORAGE_KEY]: this.getAll() };
        try {
            await chrome.storage.sync.set(data);
        } catch (err) {
            await chrome.storage.local.set(data);
        }
    }

    // Public functionality
    getAll(): string[] {
        return [...this.excluded.values()];
    }

    shouldExclude(token: Token): boolean {
        const str: string = normalise(token.surface);
        return this.excluded.has(str);
    }

    async add(...words: string[]): Promise<void> {
        words.forEach((word: string): Set<string> => this.excluded.add(normalise(word)));
        await this.persist();
    }

    async remove(...words: string[]): Promise<void> {
        words.forEach((word: string): boolean => this.excluded.delete(normalise(word)));
        await this.persist();
    }

    async clear(): Promise<void> {
        this.excluded.clear();
        await this.persist();
    }
}
