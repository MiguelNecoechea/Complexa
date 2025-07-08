// ViewModel for the extension popup, with clear separation of concerns and OOP-friendly services

import { PopupSettings } from "../models/PopupSettings";
import { SettingsService } from "../services/SettingsService";
import { TabService } from "../services/TabService";

export class PopupViewModel {
    private tabService: TabService;
    public settings!: PopupSettings;

    /**
     * @param settingsService - allows injecting a custom SettingsService (e.g. for testing)
     * @param tabService - allows injecting a custom TabService (e.g. for testing)
     */
    constructor(tabService: TabService = new TabService()) {
        this.tabService = tabService;
    }

    /**
     * Loads and returns current popup settings. If readings are enabled,
     * injects the content script immediately.
     */
    async init(): Promise<PopupSettings> {
        this.settings = await SettingsService.getSettings();
        if (this.settings.enableReadings) {
            await this.injectManagerScript();
        }
        return this.settings;
    }

    /**
     * Updates one setting, persists it, and notifies content script if needed.
     */
    async updateSetting<K extends keyof PopupSettings>(key: K, value: PopupSettings[K]): Promise<void> {
        await SettingsService.updateSetting(key, value);

        if (key === "enableReadings") {
            if (value) await this.injectManagerScript();
        }

        if (key === "readingType" && this.settings.enableReadings) {
            const tab = await this.tabService.getActiveTab();
            if (tab?.id) {
                await this.tabService.sendMessageToTab(tab.id, {action: "changeReadingType", readingType: value});
            }
        }
    }

    /**
     * Requests kanji readings from the content script, injecting it first if necessary.
     */
    async requestAddReadings(): Promise<void> {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) return;
        await this.tabService.sendMessageToTab(tab.id, {action: "addReadings"});
    }

    /**
     * Ensures the content script is loaded into the active tab for annotation.
     */
    private async injectManagerScript(): Promise<boolean> {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) return false;
        await this.tabService.injectScript(tab.id, "dist/scripts/content/linguisticsFunctionsManager.js");
        return true;
    }
}
