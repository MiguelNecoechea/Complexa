/**
 * @fileoverview Provides functionality for managing popup settings in the extension.
 * This module handles reading and writing settings to Chrome's synchronized storage.
 */

import { PopupSettings } from "../models/PopupSettings";
/**
 * Service responsible for managing popup settings for the extension.
 *
 * This class provides functionality to retrieve and update user settings
 * that are stored in Chrome's synchronized storage. It defines default values
 * for all settings and ensures type safety when accessing or modifying them.
 */
export class SettingsService {
  private defaultSettings: PopupSettings = {
    enableDictionary: false,
    enableReadings: true,
    enableTextSegmentation: false,
    enableWordFilters: false,
    enableQuiz: false,
    enableKanjiExtraction: false,
    readingType: "hiragana",
  };

  /**
   * Retrieves the current popup settings from Chrome's synchronized storage.
   *
   * @returns A promise that resolves to the current PopupSettings object.
   *          If a setting is not found in storage, its default value is used.
   */
  async getSettings(): Promise<PopupSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.defaultSettings, (settings) => {
        resolve(settings as PopupSettings);
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
  async updateSetting<K extends keyof PopupSettings>(
    key: K,
    value: PopupSettings[K],
  ): Promise<void> {
    const settings = await this.getSettings();
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ...settings, [key]: value }, resolve);
    });
  }
}
