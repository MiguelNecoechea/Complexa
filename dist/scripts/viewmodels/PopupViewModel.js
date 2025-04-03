import { SettingsService } from "../services/SettingsService.js";
import { TabService } from "../services/TabService.js";
export class PopupViewModel {
    constructor() {
        this.settingsService = new SettingsService();
        this.tabService = new TabService();
        this.settings = null;
    }
    /**
     * Initializes the popup's settings by retrieving them from the settings service.
     *
     * @returns {Promise<PopupSettings>} A promise that resolves to the current popup settings
     */
    async init() {
        this.settings = await this.settingsService.getSettings();
        if (this.settings.enableReadings) {
            await this.injectKanjiReadingScript();
        }
        return this.settings;
    }
    /**
     * Updates the specified setting with a new value and syncs it to the settings service.
     * If the setting is enableKanjiExtraction, notifies the active tab of the change.
     *
     * @param {K} key - The key of the setting to update
     * @param {PopupSettings[K]} value - The new value for the setting
     * @returns {Promise<void>} A promise that resolves when the setting is updated
     * @template K - Type parameter extending keyof PopupSettings
     */
    async updateSetting(key, value) {
        await this.settingsService.updateSetting(key, value);
        if (this.settings) {
            this.settings[key] = value;
        }
        if (key === "enableKanjiExtraction") {
            const tab = await this.tabService.getActiveTab();
            if (tab?.id) {
                try {
                    await this.tabService.sendMessageToTab(tab.id, {
                        action: "updateSettings",
                        settings: { [key]: value },
                    });
                }
                catch (error) {
                    console.error("Error sending message to tab:", error);
                }
            }
        }
        this.settings = await this.settingsService.getSettings();
    }
    /**
     * Requests the extracted kanji from the active tab.
     *
     * @returns {Promise<string[]>} A promise that resolves to an array of extracted kanji characters
     */
    async requestKanj() {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) {
            return [];
        }
        try {
            const response = await this.tabService.sendMessageToTab(tab.id, {
                action: "getExtractedKanji",
            });
            return response?.kanji || [];
        }
        catch (error) {
            console.error("Error sending message to tab:", error);
            console.log("Trying to inject the reading script");
            try {
                const wasSuccesful = await this.injectKanjiReadingScript();
                if (wasSuccesful) {
                    console.log("Script Successfully injected");
                    const response = await this.tabService.sendMessageToTab(tab.id, {
                        action: "getExtractedKanji",
                    });
                    return response?.kanji || [];
                }
            }
            catch (error) {
                console.error("An unexpected error happened: ", error);
            }
            return [];
        }
    }
    /**
     * Injects the kanjiReading script into the active tab.
     * This allows for real-time kanji reading functionality on the current page.
     *
     * @returns {Promise<boolean>} A promise that resolves to true if injection was successful, false otherwise
     */
    async injectKanjiReadingScript() {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) {
            console.error("No active tab found for script injection");
            return false;
        }
        try {
            await this.tabService.injectScript(tab.id, "dist/scripts/content/kanjiReading.js");
            console.log("Successfully injected kanjiReading script");
            return true;
        }
        catch (error) {
            console.error("Error injecting kanjiReading script:", error);
            return false;
        }
    }
}
