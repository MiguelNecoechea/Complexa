import { JishoEntry, JishoLookupResponse } from "../models/Jisho";

interface JishoLookupRequest {
    action: "JISHO_LOOKUP";
    word: string;
}


export interface IJishoService {
    lookup(word: string): Promise<JishoEntry>;
}

export class JishoService implements IJishoService {

    public lookup(word: string): Promise<JishoEntry> {
        return new Promise((resolve, reject): void => {
            const request: JishoLookupRequest = { action: "JISHO_LOOKUP", word };
            chrome.runtime.sendMessage<JishoLookupRequest, JishoLookupResponse>(request,
                (response: JishoLookupResponse): void => {
                    if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);

                    if (response?.ok) {
                        const dataArray: JishoEntry[] = response.data;
                        const first: JishoEntry = dataArray[0];
                        return first ? resolve(first) : reject(new Error("No definition"));
                    }

                    return reject(response?.err ?? new Error("Unknown error"));
                }

            );
        });
    }
}
