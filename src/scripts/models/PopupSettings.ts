/**
 * Settings for the popup functionality.
 * Controls various features that can be enabled or disabled for the popup display.
 *
 * @interface PopupSettings
 * @property {boolean} enableDictionary - Enables or disables dictionary lookups in the popup
 * @property {boolean} enableReadings - Enables or disables displaying readings (e.g., pronunciations)
 * @property {boolean} enableTextSegmentation - Enables or disables text segmentation features
 * @property {boolean} enableWordFilters - Enables or disables word filtering capabilities
 * @property {boolean} enableQuiz - Enables or disables quiz functionality within the popup
 * @property {boolean} enableKanjiExtraction - Enables or disables kanji extraction features
 * @property {string} readingType - Specifies the type of reading to display (e.g., 'hiragana', 'romaji')
 */
export interface PopupSettings {
  enableDictionary: boolean;
  enableReadings: boolean;
  enableTextSegmentation: boolean;
  enableWordFilters: boolean;
  enableQuiz: boolean;
  enableKanjiExtraction: boolean;
  readingType: string;
}
