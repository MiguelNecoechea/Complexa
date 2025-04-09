/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*********************************************!*\
  !*** ./src/scripts/content/kanjiReading.ts ***!
  \*********************************************/

(function () {
    // Local constants - defined directly in this file to avoid dependencies
    const ACTIONS = {
        UPDATE_SETTINGS: 'updateSettings',
        GET_EXTRACTED_KANJI: 'getExtractedKanji',
        INITIATE_CONTENT_SCRIPT: 'initiateKanjiReadingScript'
    };
    class KanjiReadingScript {
        constructor() {
            this.settings = {
                enableReadings: false,
                enableDictionary: false,
                enableTextSegmentation: false,
                enableWordFilters: false,
                enableKanjiExtraction: false,
                readingType: 'romaji'
            };
            this.initialize();
        }
        /**
         * Initialize the kanji reading script
         */
        async initialize() {
            // Load settings from storage
            await this.loadSettings();
            // Listen for messages from the extension
            this.setupMessageListeners();
            console.log('Kanji reading script initialized with settings:', this.settings);
        }
        /**
         * Load settings from Chrome storage
         */
        async loadSettings() {
            try {
                const result = await chrome.storage.sync.get([
                    'enableReadings',
                    'enableDictionary',
                    'enableTextSegmentation',
                    'enableWordFilters',
                    'enableKanjiExtraction',
                    'readingType'
                ]);
                this.settings = {
                    enableReadings: result.enableReadings ?? false,
                    enableDictionary: result.enableDictionary ?? false,
                    enableTextSegmentation: result.enableTextSegmentation ?? false,
                    enableWordFilters: result.enableWordFilters ?? false,
                    enableKanjiExtraction: result.enableKanjiExtraction ?? false,
                    readingType: result.readingType ?? 'romaji'
                };
            }
            catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        setupMessageListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('Kanji reading script received message:', message);
                if (message.action === ACTIONS.GET_EXTRACTED_KANJI) {
                    // Extract kanji from the page and return them
                    const extractedKanji = this.extractKanjiFromPage();
                    sendResponse({ success: true, kanji: extractedKanji });
                }
                else if (message.action === ACTIONS.UPDATE_SETTINGS) {
                    // Update local settings
                    if (message.settings) {
                        Object.assign(this.settings, message.settings);
                        console.log('Settings updated:', this.settings);
                    }
                    sendResponse({ success: true });
                }
                else {
                    // Default response for unhandled actions
                    sendResponse({ success: false, error: "Unknown action" });
                }
                // Return true to indicate async response will be sent
                return true;
            });
        }
        // Entry point for extracting paragraphs containing kanji from the page
        // This method identifies text blocks/paragraphs that contain kanji characters
        // to enable more accurate morphological analysis later
        extractKanjiFromPage() {
            // Define the kanji character range
            const kanjiRange = '\\u4e00-\\u9faf'; // Kanji characters
            const kanjiRegex = new RegExp(`[${kanjiRange}]`);
            // Get all paragraph elements
            const paragraphs = [];
            // Method 1: Get text from paragraph-like elements
            const paragraphElements = document.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, td, article, section');
            paragraphElements.forEach(element => {
                const text = element.textContent?.trim() || '';
                // Only include paragraphs that contain kanji and have reasonable length
                if (text.length > 0 && kanjiRegex.test(text)) {
                    paragraphs.push(text);
                }
            });
            // Method 2: If no paragraph elements with kanji were found, 
            // split the entire body text by newlines and find kanji-containing lines
            if (paragraphs.length === 0) {
                const bodyText = document.body.textContent || '';
                const textBlocks = bodyText.split(/\n+/).map(block => block.trim());
                textBlocks.forEach(block => {
                    if (block.length > 0 && kanjiRegex.test(block)) {
                        paragraphs.push(block);
                    }
                });
            }
            // Filter out duplicates and very short texts
            const filteredParagraphs = [...new Set(paragraphs)].filter(paragraph => paragraph.length >= 2 // Minimum meaningful length
            );
            console.log('Extracted paragraphs containing kanji:', filteredParagraphs);
            return filteredParagraphs;
        }
    }
    console.log('Initializing kanji reading script');
    const kanjiReader = new KanjiReadingScript();
})();

/******/ })()
;
//# sourceMappingURL=kanjiReading.js.map