(function () {
  const ACTIONS = {
    UPDATE_SETTINGS: "updateSettings",
    GET_EXTRACTED_KANJI: "getExtractedKanji",
    INITIATE_CONTENT_SCRIPT: "initiateKanjiReadingScript",
  };

  class KanjiReadingScript {
    private settings = {
      enableReadings: false,
      enableDictionary: false,
      enableTextSegmentation: false,
      enableWordFilters: false,
      enableKanjiExtraction: false,
      readingType: "romaji",
    };

    constructor() {
      this.initialize();
    }

    private async initialize(): Promise<void> {
      // Load settings from storage
      await this.loadSettings();

      this.setupMessageListeners();

      console.log(
        "Kanji reading script initialized with settings:",
        this.settings,
      );
    }

    private async loadSettings(): Promise<void> {
      try {
        const result = await chrome.storage.sync.get([
          "enableReadings",
          "enableDictionary",
          "enableTextSegmentation",
          "enableWordFilters",
          "enableKanjiExtraction",
          "readingType",
        ]);

        this.settings = {
          enableReadings: result.enableReadings ?? false,
          enableDictionary: result.enableDictionary ?? false,
          enableTextSegmentation: result.enableTextSegmentation ?? false,
          enableWordFilters: result.enableWordFilters ?? false,
          enableKanjiExtraction: result.enableKanjiExtraction ?? false,
          readingType: result.readingType ?? "romaji",
        };
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }

    private setupMessageListeners(): void {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Kanji reading script received message:", message);

        if (message.action === ACTIONS.GET_EXTRACTED_KANJI) {
          // Extract the raw text from the page.
          const extractedText = this.extractAllTextFromPage();
          // Apply the ruby conversion function to wrap Kanji with ruby tags.
          const rubyText = this.addRubyReadings(extractedText);
          this.applyRubyReadingsToPage();
          // Return the processed text with ruby tags.
          sendResponse({ success: true, kanji: rubyText });
        } else if (message.action === ACTIONS.UPDATE_SETTINGS) {
          if (message.settings) {
            Object.assign(this.settings, message.settings);
            console.log("Settings updated:", this.settings);
          }
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Unknown action" });
        }
        return true;
      });
    }

    private extractAllTextFromPage(): string {
      return document.body.innerText.trim();
    }

    private addRubyReadings(text: string): string {
      const kanjiRegex = /([\u4e00-\u9faf])/g;
      return text.replace(kanjiRegex, (match) => {
        const reading = "dummy"; // TODO: Replace with actual lookup based on this.settings.readingType
        return `<ruby>${match}<rt>${reading}</rt></ruby>`;
      });
    }

    private applyRubyReadingsToPage(): void {
      // For demonstration, we update the entire body's HTML.
      // In production, you might want to selectively update certain nodes.
      const originalHTML = document.body.innerHTML;
      const updatedHTML = this.addRubyReadings(originalHTML);
      document.body.innerHTML = updatedHTML;
      console.log("Applied ruby readings to the page (sample implementation)");
    }
  }

  console.log("Initializing kanji reading script");
  const kanjiReader = new KanjiReadingScript();
})();
