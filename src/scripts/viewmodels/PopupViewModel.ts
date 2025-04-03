/**
 * Imports the PopupSettings interface from the models directory.
 *
 * PopupSettings represents the configuration options for the popup interface,
 * including settings like:
 * - enableKanjiExtraction: Controls whether kanji extraction is active
 * - Other popup-related configuration options
 *
 * This model is used throughout the PopupViewModel to:
 * - Initialize the popup's state with current settings
 * - Update settings when changes are made in the popup
 * - Maintain consistency between the popup UI and the application's configuration
 */
import { PopupSettings } from "../models/PopupSettings.js";
import { SettingsService } from "../services/SettingsService.js";
import { TabService } from "../services/TabService.js";

export class PopupViewModel {
  private settingsService = new SettingsService();
  private tabService = new TabService();
  private settings: PopupSettings | null = null;

  /**
   * Initializes the popup's settings by retrieving them from the settings service.
   *
   * @returns {Promise<PopupSettings>} A promise that resolves to the current popup settings
   */
  async init(): Promise<PopupSettings> {
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
  async updateSetting<K extends keyof PopupSettings>(
    key: K,
    value: PopupSettings[K],
  ): Promise<void> {
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
        } catch (error) {
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
  async requestKanj(): Promise<string[]> {
    const tab = await this.tabService.getActiveTab();

    if (!tab?.id) {
      return [];
    }

    try {
      const response = await this.tabService.sendMessageToTab(tab.id, {
        action: "getExtractedKanji",
      });

      return response?.kanji || [];
    } catch (error) {
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
      } catch (error) {
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
  async injectKanjiReadingScript(): Promise<boolean> {
    const tab = await this.tabService.getActiveTab();

    if (!tab?.id) {
      console.error("No active tab found for script injection");
      return false;
    }

    try {
      await this.tabService.injectScript(
        tab.id,
        "dist/scripts/content/kanjiReading.js",
      );
      console.log("Successfully injected kanjiReading script");
      return true;
    } catch (error) {
      console.error("Error injecting kanjiReading script:", error);
      return false;
    }
  }
}
