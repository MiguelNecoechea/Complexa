export type ReadingTypes = "romaji" | "hiragana" | "katakana";
/**
 * Settings for the popup functionality.
 * Controls various features that can be enabled or disabled for the popup display.
 *
 * @interface PopupSettings
 * @property {boolean} enableDictionary - Enables or disables dictionary lookups in the popup
 * @property {boolean} enableReadings - Enables or disables displaying readings (e.g., pronunciations)
 * @property {boolean} enableReadingHelpers - Enables linguistics powered reading helping features.
 * @property {boolean} enableWordFilters - Enables or disables word filtering capabilities
 * @property {boolean} enableQuiz - Enables or disables quiz functionality within the popup
 * @property {boolean} enableKanjiExtraction - Enables or disables kanji extraction features
 * @property {ReadingTypes} readingType - Specifies the type of reading to display (availabe 'hiragana', 'romaji' and 'katakana')
 */
export interface PopupSettings {
    enableDictionary: boolean;
    enableReadings: boolean;
    enableReadingHelpers: boolean;
    enableWordFilters: boolean;
    readingType: ReadingTypes;
    darkMode?: boolean;
}
