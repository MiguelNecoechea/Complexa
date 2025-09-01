import {PopupSettings} from "../models/PopupSettings";
import { fetchJishoMeaning, tokenizeBatch }  from  "../api/apiHandler"
import { JishoLookupResponse, JishoEntry } from "../models/Jisho";
import MessageSender = chrome.runtime.MessageSender;
import { Token } from "../models/JapaneseTokens";

/**
 * Notifica a todas las pestañas activas sobre cambios en los colores
 */
async function notifyColorChangeToAllTabs(): Promise<void> {
    try {
        // Obtener todas las pestañas activas
        const tabs = await chrome.tabs.query({});
        
        // Enviar mensaje a cada pestaña
        const promises = tabs.map(async (tab) => {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: "COLORS_UPDATED",
                        type: "COLORS_UPDATED"
                    });
                } catch (error) {
                    // Es normal que algunas pestañas no respondan (ej: páginas sin content script)
                    console.warn(`⚠️ Could not notify tab ${tab.title}: ${error}`);
                }
            }
        });
        
        await Promise.allSettled(promises);
        
    } catch (error) {
        console.error("Error notifying tabs about color changes:", error);
    }
}

const ACTIONS = {
    TOKENIZE_PARAGRAPHS: "TOKENIZE_PARAGRAPHS",
    JISHO_LOOKUP:       "JISHO_LOOKUP",
    NOTIFY_COLOR_CHANGE: "NOTIFY_COLOR_CHANGE",
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
        case ACTIONS.NOTIFY_COLOR_CHANGE: {
            notifyColorChangeToAllTabs()
                .then((): void => sendResponse({ ok: true }))
                .catch((err: unknown): void => sendResponse({ ok: false, err }));
            return true;
        }
        default:
            sendResponse({ ok: false, err: `Unknown action: ${msg.action}` });
            return false;
    }
});

chrome.runtime.onInstalled.addListener((): void => {

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
            });
        });
    });
});

chrome.runtime.onStartup.addListener((): void => {
});
