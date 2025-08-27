import {PopupSettings} from "../models/PopupSettings";
import { fetchJishoMeaning, tokenizeBatch }  from  "../api/apiHandler"
import { JishoLookupResponse, JishoEntry } from "../models/Jisho";
import MessageSender = chrome.runtime.MessageSender;
import {Token} from "../models/JapaneseTokens";

const ACTIONS = {
    TOKENIZE_PARAGRAPHS: "TOKENIZE_PARAGRAPHS",
    JISHO_LOOKUP:       "JISHO_LOOKUP",
} as const;

chrome.runtime.onMessage.addListener((msg: { action: string; [k: string]: any }, _sender: MessageSender, sendResponse): boolean | void => {

    switch (msg.action) {
        case ACTIONS.TOKENIZE_PARAGRAPHS: {
            tokenizeBatch(msg.paragraphs as string[])
                .then((tokens: Token[][]): void => sendResponse({ ok: true, tokens }))
                .catch((err: unknown): void    => sendResponse({ ok: false, err }));
            return true;
        }
        case ACTIONS.JISHO_LOOKUP: {
            fetchJishoMeaning(msg.word as string)
                .then((data: JishoEntry[]): void => {
                    const res: JishoLookupResponse = { ok: true, data };
                    sendResponse(res);
                })
                .catch((err: unknown): void => sendResponse({ ok: false, err }));
            return true;
        }
        default:
            sendResponse({ ok: false, err: `Unknown action: ${msg.action}` });
            return false;
    }
});

chrome.runtime.onInstalled.addListener((): void => {
    console.log("Extension installed or updated");

    chrome.storage.sync.get(null, (): void => {
        const defaults: PopupSettings = {
            enableFurigana: false,
            enableColor: false,
            enableHover: false,
            enableWordFilters: false,
            readingType: "hiragana",
            darkMode: false
        };

        chrome.storage.sync.get(defaults, (stored): void => {
            const newSettings: PopupSettings = { ...defaults, ...(stored as Partial<PopupSettings>) };

            chrome.storage.sync.set(newSettings, (): void => {
                console.log("Default settings initialized");
            });
        });
    });
});

chrome.runtime.onStartup.addListener((): void => {
    console.log("Extension started");
});
