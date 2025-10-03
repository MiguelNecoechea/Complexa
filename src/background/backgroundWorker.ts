import {PopupSettings} from "../models/PopupSettings";
import { fetchJishoMeaning, tokenizeBatch }  from  "../api/apiHandler"
import { JishoLookupResponse, JishoEntry } from "../models/Jisho";
import MessageSender = chrome.runtime.MessageSender;
import { Token } from "../models/JapaneseTokens";
import Tab = chrome.tabs.Tab;

const ACTIONS = {
    TOKENIZE_PARAGRAPHS: "TOKENIZE_PARAGRAPHS",
    JISHO_LOOKUP:       "JISHO_LOOKUP",
    NOTIFY_COLOR_CHANGE: "NOTIFY_COLOR_CHANGE",
    POS_STATES_UPDATED: "POS_STATES_UPDATED",
} as const;

/**
 * Notifies all windows about color changes
 */
async function notifyColorChangeToAllTabs(): Promise<void> {
    try {
        const tabs: Tab[] = await chrome.tabs.query({});
        
        const promises: Promise<void>[] = tabs.map(async (tab: Tab): Promise<void> => {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: "COLORS_UPDATED",
                        type: "COLORS_UPDATED"
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not notify tab ${tab.title}: ${error}`);
                }
            }
        });
        
        await Promise.allSettled(promises);
        
    } catch (error) {
        console.error("Error notifying tabs about color changes:", error);
    }
}

/**
 * Notifies all active windows about the POS State
 */
async function notifyPOSStateChangeToAllTabs(): Promise<void> {
    try {
        const tabs: Tab[] = await chrome.tabs.query({});
        
        const promises: Promise<void>[] = tabs.map(async (tab: Tab): Promise<void> => {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: "POS_STATES_UPDATED",
                        type: "POS_STATES_UPDATED"
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not notify tab ${tab.title} about POS state change: ${error}`);
                }
            }
        });
        
        await Promise.allSettled(promises);
        
    } catch (error) {
        console.error("Error notifying tabs about POS state changes:", error);
    }
}


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
        case ACTIONS.POS_STATES_UPDATED: {
            notifyPOSStateChangeToAllTabs()
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

        chrome.storage.sync.get(defaults, (stored: {[key: string]: any}): void => {
            const newSettings: PopupSettings = { ...defaults, ...(stored as Partial<PopupSettings>) };

            chrome.storage.sync.set(newSettings, (): void => {
            });
        });
    });
});

chrome.runtime.onStartup.addListener((): void => {
});
