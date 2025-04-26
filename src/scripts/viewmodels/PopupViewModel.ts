// ViewModel for the extension popup, with clear separation of concerns and OOP-friendly services

import { PopupSettings } from "../models/PopupSettings";
import { SettingsService } from "../services/SettingsService";
import { TabService } from "../services/TabService";

export class PopupViewModel {
    private settingsService: SettingsService;
    private tabService: TabService;
    public settings!: PopupSettings;

    /**
     * @param settingsService - allows injecting a custom SettingsService (e.g. for testing)
     * @param tabService - allows injecting a custom TabService (e.g. for testing)
     */
    constructor(
        settingsService: SettingsService = new SettingsService(),
        tabService: TabService = new TabService(),
    ) {
        this.settingsService = settingsService;
        this.tabService = tabService;
    }

    /**
     * Loads and returns current popup settings. If readings are enabled,
     * injects the content script immediately.
     */
    async init(): Promise<PopupSettings> {
        this.settings = await this.settingsService.getSettings();
        if (this.settings.enableReadings) {
            await this.injectKanjiReadingScript();
        }
        return this.settings;
    }

    /**
     * Updates one setting, persists it, and notifies content script if needed.
     */
    async updateSetting<K extends keyof PopupSettings>(
        key: K,
        value: PopupSettings[K],
    ): Promise<void> {
        // Update local state and persist
        this.settings[key] = value;
        await this.settingsService.updateSetting(key, value);
        console.log("updating settings with k: ", key, " and v: ", value);
        // Notify content script for keys affecting page behavior
        if (this.shouldNotifyContentScript(key)) {
            await this.notifyContentScript({ [key]: value });
        }
    }

    /**
     * Determines which settings changes require a content-script update
     */
    private shouldNotifyContentScript<K extends keyof PopupSettings>(
        key: K,
    ): boolean {
        const contentKeys: Array<keyof PopupSettings> = [
            "enableReadings",
            "enableKanjiExtraction",
            "readingType",
        ];
        return contentKeys.includes(key);
    }

    /**
     * Sends an "updateSettings" message to the active tab with the changed settings
     */
    private async notifyContentScript(
        payload: Partial<PopupSettings>,
    ): Promise<void> {
        const tab = await this.tabService.getActiveTab();
        if (tab?.id) {
            try {
                await this.tabService.sendMessageToTab(tab.id, {
                    action: "updateSettings",
                    settings: payload,
                });
            } catch (err) {
                console.error("Failed to notify content script:", err);
            }
        }
    }

    /**
     * Requests kanji readings from the content script, injecting it first if necessary.
     */
    async requestAddReadings(): Promise<void> {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) return;

        try {
            const response = await this.tabService.sendMessageToTab(tab.id, {
                action: "addReadings",
            });
            return response?.kanji ?? [];
        } catch {
            // Try injecting script and retry once
            const injected = await this.injectKanjiReadingScript();
            if (!injected) return;
            const retry = await this.tabService.sendMessageToTab(tab.id, {
                action: "addReadings",
            });
        }
    }

    /**
     * Ensures the content script is loaded into the active tab for annotation.
     */
    async injectKanjiReadingScript(): Promise<boolean> {
        const tab = await this.tabService.getActiveTab();
        if (!tab?.id) {
            console.error("No active tab found for script injection");
            return false;
        }

        try {
            await this.tabService.injectScript(
                tab.id,
                "dist/scripts/content/JapaneseReadingContent.js",
            );
            console.log("Injected kanjiReading script");
            return true;
        } catch (err) {
            console.error("Script injection failed:", err);
            return false;
        }
    }
}
