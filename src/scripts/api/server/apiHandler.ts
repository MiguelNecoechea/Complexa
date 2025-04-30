import { Token } from "../../models/JapaneseTokens";
export class APIHandler {
    private readonly apiUrl: string;
    private readonly endpoints: {
        ADD_READINGS: string;
        CHANGE_READING_MODE: string;
        TOKENIZE: string;
    };

    // Eventually it will be the place where is host :p
    constructor(baseUrl: string = "http://localhost:8000/") {
        this.apiUrl = baseUrl;
        this.endpoints = {
            ADD_READINGS: "annotate_html",
            CHANGE_READING_MODE: "change_reading_mode",
            TOKENIZE: "tokenize",
        };
    }

    /**
     * Sends raw text to the backend and returns HTML with <ruby> annotations.
     */
    async annotateText(text: string): Promise<string> {
        const res = await fetch(
            `${this.apiUrl}${this.endpoints.ADD_READINGS}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            },
        );
        if (!res.ok) {
            throw new Error(`API ${res.status}: ${await res.text()}`);
        }
        return res.text();
    }

    /**
     * Requests the backend to switch reading mode (e.g., romaji ↔ kana).
     */
    async changeReadingMode(mode: string): Promise<void> {
        const res = await fetch(
            `${this.apiUrl}${this.endpoints.CHANGE_READING_MODE}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // rename the field to "text" so it matches your TextRequest
                body: JSON.stringify({ text: mode }),
            },
        );
        if (!res.ok) {
            throw new Error(`API ${res.status}: ${await res.text()}`);
        }
    }

    /**
     * Send each extracted text node to the `/tokenize` API,
     * collect all tokens, and store them in `this.tokenizedTextNodes`.
     */
    async tokenizeNodes(textNodes: Text[]): Promise<Token[][]> {
        // 1. Grab the raw text, trim out empty strings
        const texts = textNodes
            .map((node) => node.textContent?.trim() || "")
            .filter((text) => text.length > 0);

        // 2. Fire off all tokenize requests in parallel
        const tokenArrays: Token[][] = await Promise.all(
            texts.map(async (text) => {
                const res = await fetch(
                    `${this.apiUrl}${this.endpoints.TOKENIZE}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text }),
                    },
                );

                if (!res.ok) {
                    throw new Error(`Tokenize failed: ${res.status}`);
                }

                const tokens = (await res.json()) as Token[];

                return tokens;
            }),
        );

        return tokenArrays;
    }
}
