import {Settings} from "../models/Settings";

const BACKGROUND_ACTIONS = {
    INITIATE_KANJI_READING_SCRIPT: "initiateKanjiReadingScript",
};

chrome.runtime.onInstalled.addListener((): void => {
    console.log("Extension installed or updated");

    chrome.storage.sync.get(null, (items): void => {
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

        chrome.storage.sync.set(newSettings, (): void => {
            console.log("Default settings initialized");
        });
    });
});

chrome.runtime.onStartup.addListener((): void => {
    console.log("Extension started");
});
