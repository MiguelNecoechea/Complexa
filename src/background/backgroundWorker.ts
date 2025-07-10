import {Settings} from "../models/Settings";

const BACKGROUND_ACTIONS = {
    INITIATE_KANJI_READING_SCRIPT: "initiateKanjiReadingScript",
};



function setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message:", message);

        if (message.action === BACKGROUND_ACTIONS.INITIATE_KANJI_READING_SCRIPT) {
            console.log("Initiating kanji reading script");

            if (message.tabId) {
                console.log("Target tab ID:", message.tabId);

                try {
                    chrome.scripting.executeScript({
                            target: { tabId: message.tabId, allFrames: true },
                            files: ["dist/scripts/content/kanjiReading.js"],
                        }).then(() => {
                            console.log("Kanji reading script injected successfully");
                            sendResponse({ success: true });
                        }).catch((error) => {
                            console.error("Error injecting kanji reading script:", error);
                            sendResponse({success: false, error: error.message});
                        });
                    return true;
                } catch (error) {
                    console.error(
                        "Exception while injecting kanji reading script:",
                        error,
                    );
                    sendResponse({ success: false, error: String(error) });
                }
            } else {
                console.error("No tabId provided in message");
                sendResponse({ success: false, error: "No tabId provided" });
            }
        } else if (message.action === "JISHO_LOOKUP") {
            console.log("Trying to search :p")
        }

        return false;
    });
}



chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated");

    chrome.storage.sync.get(null, (items) => {
        const defaults: Settings = {
            enableReadings: false,
            enableDictionary: false,
            enableTextSegmentation: false,
            enableWordFilters: false,
            enableKanjiExtraction: false,
            enableQuiz: false,
            readingType: "hiragana",
        };

        const newSettings: Settings = { ...defaults };
        for (const key in items) {
            if (key in newSettings) {
                newSettings[key] = (items as Record<string, any>)[key];
            }
        }

        chrome.storage.sync.set(newSettings, () => {
            console.log("Default settings initialized");
        });
    });
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Extension started");
});

setupMessageListeners();
