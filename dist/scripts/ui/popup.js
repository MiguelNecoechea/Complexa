/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/scripts/services/SettingsService.ts":
/*!*************************************************!*\
  !*** ./src/scripts/services/SettingsService.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SettingsService: () => (/* binding */ SettingsService)
/* harmony export */ });
/**
 * @fileoverview Provides functionality for managing popup settings in the extension.
 * This module handles reading and writing settings to Chrome's synchronized storage.
 */
/**
 * Service responsible for managing popup settings for the extension.
 *
 * This class provides functionality to retrieve and update user settings
 * that are stored in Chrome's synchronized storage. It defines default values
 * for all settings and ensures type safety when accessing or modifying them.
 */
class SettingsService {
    constructor() {
        this.defaultSettings = {
            enableDictionary: false,
            enableReadings: true,
            enableTextSegmentation: false,
            enableWordFilters: false,
            enableQuiz: false,
            enableKanjiExtraction: false,
            readingType: "hiragana",
        };
    }
    /**
     * Retrieves the current popup settings from Chrome's synchronized storage.
     *
     * @returns A promise that resolves to the current PopupSettings object.
     *          If a setting is not found in storage, its default value is used.
     */
    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(this.defaultSettings, (settings) => {
                resolve(settings);
            });
        });
    }
    /**
     * Updates a specific setting with a new value in Chrome's synchronized storage.
     *
     * @template K - Type parameter constrained to keys of PopupSettings
     * @param key - The setting key to update
     * @param value - The new value to assign to the setting
     * @returns A promise that resolves when the update operation completes
     */
    async updateSetting(key, value) {
        const settings = await this.getSettings();
        return new Promise((resolve) => {
            chrome.storage.sync.set({ ...settings, [key]: value }, resolve);
        });
    }
}


/***/ }),

/***/ "./src/scripts/services/TabService.ts":
/*!********************************************!*\
  !*** ./src/scripts/services/TabService.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TabService: () => (/* binding */ TabService)
/* harmony export */ });
/**
 * Service class for interacting with Chrome browser tabs in a Chrome extension.
 *
 * This class provides utility methods for working with Chrome tabs, including
 * retrieving the active tab, sending messages to tabs, and injecting scripts.
 *
 * @class TabService
 */
class TabService {
    /**
     * Gets the currently active tab in the current window.
     *
     * @method getActiveTab
     * @returns {Promise<chrome.tabs.Tab | null>} A promise that resolves to the active tab object,
     *   or null if no active tab is found.
     */
    async getActiveTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0] || null);
            });
        });
    }
    /**
     * Sends a message to a specific tab and returns the response.
     *
     * @method sendMessageToTab
     * @template T The expected type of the response (defaults to any)
     * @param {number} tabId - The ID of the tab to send the message to
     * @param {any} message - The message content to send to the tab
     * @returns {Promise<T>} A promise that resolves with the tab's response
     * @throws Will reject with Chrome runtime errors if message sending fails
     */
    async sendMessageToTab(tabId, message) {
        console.log("tab id: ", tabId);
        console.log("message: ", message);
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    /**
     * Injects a JavaScript file into a specific tab.
     *
     * @method injectScript
     * @param {number} tabId - The ID of the tab to inject the script into
     * @param {string} scriptPath - The path to the JavaScript file to inject
     * @returns {Promise<void>} A promise that resolves when the script is successfully injected
     * @throws Will throw an error if script injection fails
     */
    async injectScript(tabId, scriptPath) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: [scriptPath],
            });
        }
        catch (error) {
            console.error("Error injecting script: ", error);
            throw error;
        }
    }
}


/***/ }),

/***/ "./src/scripts/viewmodels/PopupViewModel.ts":
/*!**************************************************!*\
  !*** ./src/scripts/viewmodels/PopupViewModel.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PopupViewModel: () => (/* binding */ PopupViewModel)
/* harmony export */ });
/* harmony import */ var _services_SettingsService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/SettingsService */ "./src/scripts/services/SettingsService.ts");
/* harmony import */ var _services_TabService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../services/TabService */ "./src/scripts/services/TabService.ts");
// ViewModel for the extension popup, with clear separation of concerns and OOP-friendly services


class PopupViewModel {
    /**
     * @param settingsService - allows injecting a custom SettingsService (e.g. for testing)
     * @param tabService - allows injecting a custom TabService (e.g. for testing)
     */
    constructor(settingsService = new _services_SettingsService__WEBPACK_IMPORTED_MODULE_0__.SettingsService(), tabService = new _services_TabService__WEBPACK_IMPORTED_MODULE_1__.TabService()) {
        this.settingsService = settingsService;
        this.tabService = tabService;
    }
    /**
     * Loads and returns current popup settings. If readings are enabled,
     * injects the content script immediately.
     */
    async init() {
        this.settings = await this.settingsService.getSettings();
        if (this.settings.enableReadings) {
            await this.injectReadingScript();
        }
        return this.settings;
    }
    /**
     * Updates one setting, persists it, and notifies content script if needed.
     */
    async updateSetting(key, value) {
        await this.settingsService.updateSetting(key, value);
        if (key === "enableReadings") {
            if (value) {
                await this.injectReadingScript();
            }
            else {
            }
        }
        if (key === "readingType" && this.settings.enableReadings) {
            const tab = await this.tabService.getActiveTab();
            if (tab?.id) {
                await this.tabService.sendMessageToTab(tab.id, {
                    action: "changeReadingType",
                    readingType: value,
                });
            }
        }
    }
    /**
     * Requests kanji readings from the content script, injecting it first if necessary.
     */
    async requestAddReadings() {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id)
            return;
        await this.tabService.sendMessageToTab(tab.id, {
            action: "addReadings",
        });
    }
    /**
     * Ensures the content script is loaded into the active tab for annotation.
     */
    async injectReadingScript() {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id)
            return false;
        await this.tabService.injectScript(tab.id, "dist/scripts/content/JapaneseReadingContent.js");
        return true;
    }
}


/***/ }),

/***/ "./src/scripts/views/PopupView.ts":
/*!****************************************!*\
  !*** ./src/scripts/views/PopupView.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PopupView: () => (/* binding */ PopupView)
/* harmony export */ });
/* harmony import */ var _viewmodels_PopupViewModel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../viewmodels/PopupViewModel */ "./src/scripts/viewmodels/PopupViewModel.ts");

const DOM_IDS = {
    LAUNCH_APP: "launch-app",
    ENABLE_READINGS: "enable-readings",
    ENABLE_DICTIONARY: "enable-dictionary",
    ENABLE_TEXT_SEGMENTATION: "enable-text-segmentation",
    ENABLE_WORD_FILTERS: "enable-word-filters",
    ENABLE_QUIZ: "enable-quiz",
    ENABLE_KANJI_EXTRACTION: "enable-kanji-extraction",
    READING_SELECTOR_WRAPPER: "reading-selector-wrapper",
    ADD_READINGS_BUTTON_CONTAINER: "add-readings-button-container",
    ADD_READINGS_BUTTON: "add-readings-button",
};
const CSS_CLASSES = {
    GENERAL_CONFIGS_CONTAINER: "general-configs-container",
    GENERAL_CONFIGS_ITEM: "general-configs-item",
    READING_SELECTOR_LABEL: "reading-selector-label",
    READING_OPTIONS: "reading-options",
    READING_OPTION: "reading-option",
    ACTIVE: "active",
    BUTTON: "button",
};
const STRINGS = {
    ENABLE_KANJI_EXTRACTION_LABEL: "Enable Kanji Extraction",
    READING_TYPE_LABEL: "Reading Type:",
    KATAKANA_LABEL: "Katakana",
    ROMAJI_LABEL: "Romaji",
    HIRAGANA_LABEL: "Hiragana",
    ADD_READINGS: "Add Readings",
    ADD_READINGS_CLICKED: "Add readings button clicked",
    SETTINGS_UPDATED: "Settings updated:",
    APP_HTML_PATH: "src/views/app.html",
    KANJI_REQUESTED: "Requesting extracted kanji from the current tab",
    KANJI_RECEIVED: "Received kanji from content script:",
    GETTING_KANJI_ERROR: "Error getting kanji from content script:",
};
class PopupView {
    constructor() {
        this.viewModel = new _viewmodels_PopupViewModel__WEBPACK_IMPORTED_MODULE_0__.PopupViewModel();
    }
    async init() {
        const settings = await this.viewModel.init();
        this.setupUI(settings);
        this.attachEventListeners();
    }
    setupUI(settings) {
        // Initialize all checkboxes based on settings
        this.initializeCheckbox(DOM_IDS.ENABLE_DICTIONARY, settings.enableDictionary);
        this.initializeCheckbox(DOM_IDS.ENABLE_READINGS, settings.enableReadings);
        this.initializeCheckbox(DOM_IDS.ENABLE_TEXT_SEGMENTATION, settings.enableTextSegmentation);
        this.initializeCheckbox(DOM_IDS.ENABLE_WORD_FILTERS, settings.enableWordFilters);
        this.initializeCheckbox(DOM_IDS.ENABLE_QUIZ, settings.enableQuiz);
        this.initializeCheckbox(DOM_IDS.ENABLE_KANJI_EXTRACTION, settings.enableKanjiExtraction);
        // Handle reading selector if readings are enabled
        if (settings.enableReadings) {
            this.createReadingSelector(settings.readingType);
        }
    }
    attachEventListeners() {
        // Launch app button
        const launchAppBtn = document.getElementById(DOM_IDS.LAUNCH_APP);
        if (launchAppBtn) {
            launchAppBtn.addEventListener("click", () => {
                chrome.tabs.create({
                    url: chrome.runtime.getURL(STRINGS.APP_HTML_PATH),
                });
            });
        }
        // Attach event listeners to all checkboxes
        this.addSettingListener(DOM_IDS.ENABLE_DICTIONARY, "enableDictionary");
        this.addSettingListener(DOM_IDS.ENABLE_TEXT_SEGMENTATION, "enableTextSegmentation");
        this.addSettingListener(DOM_IDS.ENABLE_WORD_FILTERS, "enableWordFilters");
        this.addSettingListener(DOM_IDS.ENABLE_QUIZ, "enableQuiz");
        this.addSettingListener(DOM_IDS.ENABLE_KANJI_EXTRACTION, "enableKanjiExtraction");
        // Special handling for enable readings due to UI dependencies
        const enableReadingsCheckbox = document.getElementById(DOM_IDS.ENABLE_READINGS);
        if (enableReadingsCheckbox) {
            enableReadingsCheckbox.addEventListener("click", async () => {
                const isChecked = enableReadingsCheckbox.checked;
                await this.viewModel.updateSetting("enableReadings", isChecked);
                const configsContainer = document.querySelector(`.${CSS_CLASSES.GENERAL_CONFIGS_CONTAINER}`);
                const existingSelector = document.getElementById(DOM_IDS.READING_SELECTOR_WRAPPER);
                const buttonContainer = document.getElementById(DOM_IDS.ADD_READINGS_BUTTON_CONTAINER);
                if (isChecked && !existingSelector && configsContainer) {
                    const settings = await this.viewModel.init();
                    this.createReadingSelector(settings.readingType);
                }
                else if (!isChecked && existingSelector && configsContainer) {
                    configsContainer.removeChild(existingSelector);
                    if (buttonContainer)
                        configsContainer.removeChild(buttonContainer);
                }
            });
        }
    }
    initializeCheckbox(id, checked) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = checked;
        }
    }
    addSettingListener(id, settingKey) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener("click", () => {
                this.viewModel.updateSetting(settingKey, checkbox.checked);
            });
        }
    }
    createReadingSelector(activeType) {
        const katakana = "katakana";
        const hiragana = "hiragana";
        const romaji = "romaji";
        const configsContainer = document.querySelector(`.${CSS_CLASSES.GENERAL_CONFIGS_CONTAINER}`);
        if (!configsContainer)
            return;
        // Create the selector wrapper
        const selectorWrapper = document.createElement("div");
        selectorWrapper.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
        selectorWrapper.id = DOM_IDS.READING_SELECTOR_WRAPPER;
        // Add label
        const selectorLabel = document.createElement("div");
        selectorLabel.className = CSS_CLASSES.READING_SELECTOR_LABEL;
        selectorLabel.textContent = STRINGS.READING_TYPE_LABEL;
        selectorWrapper.appendChild(selectorLabel);
        // Create options container
        const optionsContainer = document.createElement("div");
        optionsContainer.className = CSS_CLASSES.READING_OPTIONS;
        const options = [
            { value: romaji, label: STRINGS.ROMAJI_LABEL },
            { value: hiragana, label: STRINGS.HIRAGANA_LABEL },
            { value: katakana, label: STRINGS.KATAKANA_LABEL },
        ];
        options.forEach((option) => {
            const optionElement = document.createElement("div");
            optionElement.className =
                CSS_CLASSES.READING_OPTION +
                    (option.value === activeType ? ` ${CSS_CLASSES.ACTIVE}` : "");
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.label;
            optionElement.addEventListener("click", () => {
                document
                    .querySelectorAll(`.${CSS_CLASSES.READING_OPTION}`)
                    .forEach((opt) => {
                    opt.classList.remove(CSS_CLASSES.ACTIVE);
                });
                optionElement.classList.add(CSS_CLASSES.ACTIVE);
                this.viewModel.updateSetting("readingType", option.value);
            });
            optionsContainer.appendChild(optionElement);
        });
        selectorWrapper.appendChild(optionsContainer);
        // Create add readings button
        const buttonContainer = document.createElement("div");
        buttonContainer.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
        buttonContainer.id = DOM_IDS.ADD_READINGS_BUTTON_CONTAINER;
        const addReadingsButton = document.createElement("button");
        addReadingsButton.className = CSS_CLASSES.BUTTON;
        addReadingsButton.id = DOM_IDS.ADD_READINGS_BUTTON;
        addReadingsButton.textContent = STRINGS.ADD_READINGS;
        addReadingsButton.style.width = "100%";
        addReadingsButton.addEventListener("click", async () => {
            console.log(STRINGS.ADD_READINGS_CLICKED);
            const kanji = await this.viewModel.requestAddReadings();
        });
        buttonContainer.appendChild(addReadingsButton);
        // Insert elements in the correct order
        const enableReadingsCheckbox = document.getElementById(DOM_IDS.ENABLE_READINGS);
        const enableReadingsElement = enableReadingsCheckbox?.closest(`.${CSS_CLASSES.GENERAL_CONFIGS_ITEM}`);
        if (enableReadingsElement && enableReadingsElement.nextSibling) {
            configsContainer.insertBefore(selectorWrapper, enableReadingsElement.nextSibling);
            configsContainer.insertBefore(buttonContainer, selectorWrapper.nextSibling);
        }
        else {
            configsContainer.appendChild(selectorWrapper);
            configsContainer.appendChild(buttonContainer);
        }
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************************!*\
  !*** ./src/scripts/ui/popup.ts ***!
  \*********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _views_PopupView__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../views/PopupView */ "./src/scripts/views/PopupView.ts");
/**
 * Imports the PopupView class from the PopupView.js module.
 *
 * The PopupView class is responsible for handling popup windows or dialogs
 * in the application. It contains methods to create, display, and manage
 * popup content that will be initialized when the DOM is fully loaded.
 *
 * @see PopupView.js for the implementation details
 */

// Local constants - defined directly in this file to avoid dependencies
document.addEventListener("DOMContentLoaded", () => {
    const popupView = new _views_PopupView__WEBPACK_IMPORTED_MODULE_0__.PopupView();
    popupView.init();
});

})();

/******/ })()
;
//# sourceMappingURL=popup.js.map