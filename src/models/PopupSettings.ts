export type ReadingTypes = "romaji" | "hiragana" | "katakana";
/**
 * Settings for the popup functionality.
 * Controls various features that can be enabled or disabled for the popup display.
 *
 * @interface PopupSettings
 * @property {boolean} enableFurigana - Enables or disables displaying readings (e.g., pronunciations)
 * @property {boolean} enableColor - Enables or disables the coloring based on UPOS (e.g., verbs, nouns)
 * @property {boolean} enableHover - Enables or disables the hover information of the tokens.
 * @property {boolean} enableWordFilters - Enables or disables word filtering capabilities
 * @property {ReadingTypes} readingType - Specifies the type of reading to display (available 'hiragana', 'romaji' and 'katakana')
 */
export interface PopupSettings {
    enableFurigana: boolean;
    enableColor: boolean;
    enableHover: boolean;
    enableWordFilters: boolean;
    readingType: ReadingTypes;
    darkMode?: boolean;
}
