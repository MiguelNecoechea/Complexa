export class ReadingTools {
    private readonly apiUrl: string;
    private readonly endpoints: {
        ADD_READINGS: string;
        CHANGE_READING_MODE: string;
    };

    // Eventually it will be the place where is host :p
    constructor(baseUrl: string = "http://localhost:8000/") {
        this.apiUrl = baseUrl;
        this.endpoints = {
            ADD_READINGS: "annotate_html",
            CHANGE_READING_MODE: "change_reading_mode",
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
}
