/**
 * Japanese Text Model
 * Handles the data processing and business logic for Japanese text extraction
 */
class JapaneseTextModel {
  constructor() {
    this.japaneseTextSegments = [];
    this.statistics = {
      totalSegments: 0,
      totalCharacters: 0,
      hiraganaCount: 0,
      katakanaCount: 0,
      kanjiCount: 0
    };
  }

  /**
   * Check if text contains Japanese characters
   * @param {string} text - Text to check
   * @returns {boolean} - True if text contains Japanese characters
   */
  containsJapanese(text) {
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return japaneseRegex.test(text);
  }

  /**
   * Check if text is primarily Japanese (more than 50% Japanese characters)
   * @param {string} text - Text to check
   * @returns {boolean} - True if text is primarily Japanese
   */
  isPrimarilyJapanese(text) {
    if (!text || text.trim().length === 0) return false;
    
    let japaneseCount = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (this.containsJapanese(char)) {
        japaneseCount++;
      }
    }
    
    const japanesePercentage = japaneseCount / text.length;
    return japanesePercentage > 0.5; // More than 50% Japanese
  }

  /**
   * Count character types in text
   * @param {string} text - Text to analyze
   * @returns {Object} - Counts of different character types
   */
  countCharacterTypes(text) {
    let hiragana = 0;
    let katakana = 0;
    let kanji = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const code = char.charCodeAt(0);
      
      // Hiragana: U+3040 to U+309F
      if (code >= 0x3040 && code <= 0x309F) {
        hiragana++;
      }
      // Katakana: U+30A0 to U+30FF
      else if (code >= 0x30A0 && code <= 0x30FF) {
        katakana++;
      }
      // Kanji: U+4E00 to U+9FAF
      else if (code >= 0x4E00 && code <= 0x9FAF) {
        kanji++;
      }
    }

    return { hiragana, katakana, kanji };
  }

  /**
   * Process and store Japanese text
   * @param {Array} textSegments - Array of text segments
   */
  processJapaneseText(textSegments) {
    this.japaneseTextSegments = textSegments.filter(text => 
      this.containsJapanese(text) && this.isPrimarilyJapanese(text)
    );
    
    // Reset statistics
    this.statistics = {
      totalSegments: this.japaneseTextSegments.length,
      totalCharacters: 0,
      hiraganaCount: 0,
      katakanaCount: 0,
      kanjiCount: 0
    };
    
    // Calculate statistics
    this.japaneseTextSegments.forEach(segment => {
      this.statistics.totalCharacters += segment.length;
      const counts = this.countCharacterTypes(segment);
      this.statistics.hiraganaCount += counts.hiragana;
      this.statistics.katakanaCount += counts.katakana;
      this.statistics.kanjiCount += counts.kanji;
    });
    
    return {
      segments: this.japaneseTextSegments,
      statistics: this.statistics
    };
  }

  /**
   * Get the stored Japanese text segments
   * @returns {Array} - Array of Japanese text segments
   */
  getJapaneseTextSegments() {
    return this.japaneseTextSegments;
  }

  /**
   * Get statistics about the Japanese text
   * @returns {Object} - Statistics about the Japanese text
   */
  getStatistics() {
    return this.statistics;
  }
} 