export class SettingsService {
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
    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(this.defaultSettings, (settings) => {
                resolve(settings);
            });
        });
    }
    async updateSetting(key, value) {
        const settings = await this.getSettings();
        return new Promise((resolve) => {
            chrome.storage.sync.set({ ...settings, [key]: value }, resolve);
        });
    }
}
