import { Token } from "../models/JapaneseTokens";
export class APIHandler {
    private readonly apiUrl: string;
    private readonly endpoints: {
        TOKENIZE: string;
    };

    // Eventually it will be the place where is host :p
    constructor(baseUrl: string = "http://localhost:8000/") {
        this.apiUrl = baseUrl;
        this.endpoints = {
            TOKENIZE: "tokenize_batch",
        };
    }

    async tokenize(texts: string[]): Promise<Token[][]> {
        const clean = texts.map((t) => t.trim()).filter(Boolean);
        if (!clean.length) return [];

        return this.fetchBatch(clean);
    }

    private async fetchBatch(texts: string[]): Promise<Token[][]> {
        const payload = texts.map((t) => ({ text: t }));
        const res = await fetch(`${this.apiUrl}${this.endpoints.TOKENIZE}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`Batch tokenize failed: ${res.status}`);
        }
        return (await res.json()) as Token[][];
    }
}
