import {Token} from "../models/JapaneseTokens";
import {JishoEntry, JishoEntrySense} from "../models/Jisho";

interface ApiSense {
    english_definitions: string[];
    parts_of_speech: string[];
}

interface ApiEntry {
    slug: string;
    is_common: boolean;
    jlpt: string[];
    senses: ApiSense[];
}

interface ApiResponse {
    data: ApiEntry[];
}

export async function tokenizeBatch(texts: string[]): Promise<Token[][]> {
    const baseUrl: string = "http://localhost:8000/";
    const endpoint: string = "tokenize_batch";

    const clean: string[] = texts.map((t) => t.trim()).filter(Boolean);

    if (!clean.length) return [];

    const payload: {text: string}[] = clean.map((text: string): {text: string} => ({ text }));


    const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Batch tokenize failed: ${res.status}`);


    return (await res.json()) as Token[][];
}

export async function fetchJishoMeaning(word: string): Promise<JishoEntry[]> {
    const jishoURL: string = "https://jisho.org/api/v1/search/words?keyword="
    const encodedWord: string = encodeURIComponent(word);
    const url: string = `${jishoURL}${encodedWord}`;

    try {
        const response: Response = await fetch(url);

        if (!response.ok) return [];

        const {data} = (await response.json()) as ApiResponse;

        return data.map((item: ApiEntry): JishoEntry => ({
            slug: item.slug,
            is_common: item.is_common,
            jlpt: item.jlpt[0] ?? "",
            senses: item.senses.map((sense: ApiSense): JishoEntrySense => ({
                english_definitions: sense.english_definitions,
                pos: sense.parts_of_speech,
            })),
        }));
    } catch (error) {
        console.log(error);
        return [];
    }
}



