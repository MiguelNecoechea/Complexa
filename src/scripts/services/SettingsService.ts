import { PopupSettings } from "../models/PopupSettings.js";

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

  async getSettings(): Promise<PopupSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.defaultSettings, (settings) => {
        resolve(settings as PopupSettings);
      });
    });
  }

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
