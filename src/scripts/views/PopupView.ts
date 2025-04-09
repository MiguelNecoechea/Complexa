import { PopupSettings } from "../models/PopupSettings";
import { PopupViewModel } from "../viewmodels/PopupViewModel";

const DOM_IDS = {
  LAUNCH_APP: "launch-app",
  ENABLE_READINGS: "enable-readings",
  ENABLE_DICTIONARY: "enable-dictionary",
  ENABLE_TEXT_SEGMENTATION: "enable-text-segmentation",
  ENABLE_WORD_FILTERS: "enable-word-filters",
  ENABLE_QUIZ: "enable-quiz",
  ENABLE_KANJI_EXTRACTION: "enable-kanji-extraction",
  READING_SELECTOR_WRAPPER: "reading-selector-wrapper",
  ADD_READINGS_BUTTON_CONTAINER: "add-readings-button-container",
  ADD_READINGS_BUTTON: "add-readings-button",
};

const CSS_CLASSES = {
  GENERAL_CONFIGS_CONTAINER: "general-configs-container",
  GENERAL_CONFIGS_ITEM: "general-configs-item",
  READING_SELECTOR_LABEL: "reading-selector-label",
  READING_OPTIONS: "reading-options",
  READING_OPTION: "reading-option",
  ACTIVE: "active",
  BUTTON: "button",
};

const STRINGS = {
  ENABLE_KANJI_EXTRACTION_LABEL: "Enable Kanji Extraction",
  READING_TYPE_LABEL: "Reading Type:",
  ROMAJI: "romaji",
  HIRAGANA: "hiragana",
  ROMAJI_LABEL: "Romaji",
  HIRAGANA_LABEL: "Hiragana",
  ADD_READINGS: "Add Readings",
  ADD_READINGS_CLICKED: "Add readings button clicked",
  SETTINGS_UPDATED: "Settings updated:",
  APP_HTML_PATH: "src/views/app.html",
  KANJI_REQUESTED: "Requesting extracted kanji from the current tab",
  KANJI_RECEIVED: "Received kanji from content script:",
  GETTING_KANJI_ERROR: "Error getting kanji from content script:",
};

export class PopupView {
  private viewModel = new PopupViewModel();

  async init() {
    const settings = await this.viewModel.init();
    this.setupUI(settings);
    this.attachEventListeners();
  }

  private setupUI(settings: PopupSettings): void {
    // Initialize all checkboxes based on settings
    this.initializeCheckbox(
      DOM_IDS.ENABLE_DICTIONARY,
      settings.enableDictionary,
    );
    this.initializeCheckbox(DOM_IDS.ENABLE_READINGS, settings.enableReadings);
    this.initializeCheckbox(
      DOM_IDS.ENABLE_TEXT_SEGMENTATION,
      settings.enableTextSegmentation,
    );
    this.initializeCheckbox(
      DOM_IDS.ENABLE_WORD_FILTERS,
      settings.enableWordFilters,
    );
    this.initializeCheckbox(DOM_IDS.ENABLE_QUIZ, settings.enableQuiz);
    this.initializeCheckbox(
      DOM_IDS.ENABLE_KANJI_EXTRACTION,
      settings.enableKanjiExtraction,
    );

    // Handle reading selector if readings are enabled
    if (settings.enableReadings) {
      this.createReadingSelector(settings.readingType);
    }
  }

  private attachEventListeners(): void {
    // Launch app button
    const launchAppBtn = document.getElementById(
      DOM_IDS.LAUNCH_APP,
    ) as HTMLButtonElement;
    if (launchAppBtn) {
      launchAppBtn.addEventListener("click", () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL(STRINGS.APP_HTML_PATH),
        });
      });
    }

    // Attach event listeners to all checkboxes
    this.addSettingListener(DOM_IDS.ENABLE_DICTIONARY, "enableDictionary");
    this.addSettingListener(
      DOM_IDS.ENABLE_TEXT_SEGMENTATION,
      "enableTextSegmentation",
    );
    this.addSettingListener(DOM_IDS.ENABLE_WORD_FILTERS, "enableWordFilters");
    this.addSettingListener(DOM_IDS.ENABLE_QUIZ, "enableQuiz");
    this.addSettingListener(
      DOM_IDS.ENABLE_KANJI_EXTRACTION,
      "enableKanjiExtraction",
    );

    // Special handling for enable readings due to UI dependencies
    const enableReadingsCheckbox = document.getElementById(
      DOM_IDS.ENABLE_READINGS,
    ) as HTMLInputElement;
    if (enableReadingsCheckbox) {
      enableReadingsCheckbox.addEventListener("click", async () => {
        const isChecked = enableReadingsCheckbox.checked;
        await this.viewModel.updateSetting("enableReadings", isChecked);

        const configsContainer = document.querySelector(
          `.${CSS_CLASSES.GENERAL_CONFIGS_CONTAINER}`,
        );
        const existingSelector = document.getElementById(
          DOM_IDS.READING_SELECTOR_WRAPPER,
        );
        const buttonContainer = document.getElementById(
          DOM_IDS.ADD_READINGS_BUTTON_CONTAINER,
        );

        if (isChecked && !existingSelector && configsContainer) {
          const settings = await this.viewModel.init();
          this.createReadingSelector(settings.readingType);
        } else if (!isChecked && existingSelector && configsContainer) {
          configsContainer.removeChild(existingSelector);
          if (buttonContainer) configsContainer.removeChild(buttonContainer);
        }
      });
    }
  }

  private initializeCheckbox(id: string, checked: boolean): void {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = checked;
    }
  }

  private addSettingListener(
    id: string,
    settingKey: keyof PopupSettings,
  ): void {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener("click", () => {
        this.viewModel.updateSetting(settingKey, checkbox.checked);
      });
    }
  }

  private createReadingSelector(activeType: string): void {
    const configsContainer = document.querySelector(
      `.${CSS_CLASSES.GENERAL_CONFIGS_CONTAINER}`,
    );
    if (!configsContainer) return;

    // Create the selector wrapper
    const selectorWrapper = document.createElement("div");
    selectorWrapper.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
    selectorWrapper.id = DOM_IDS.READING_SELECTOR_WRAPPER;

    // Add label
    const selectorLabel = document.createElement("div");
    selectorLabel.className = CSS_CLASSES.READING_SELECTOR_LABEL;
    selectorLabel.textContent = STRINGS.READING_TYPE_LABEL;
    selectorWrapper.appendChild(selectorLabel);

    // Create options container
    const optionsContainer = document.createElement("div");
    optionsContainer.className = CSS_CLASSES.READING_OPTIONS;

    const options = [
      { value: STRINGS.ROMAJI, label: STRINGS.ROMAJI_LABEL },
      { value: STRINGS.HIRAGANA, label: STRINGS.HIRAGANA_LABEL },
    ];

    options.forEach((option) => {
      const optionElement = document.createElement("div");
      optionElement.className =
        CSS_CLASSES.READING_OPTION +
        (option.value === activeType ? ` ${CSS_CLASSES.ACTIVE}` : "");
      optionElement.dataset.value = option.value;
      optionElement.textContent = option.label;

      optionElement.addEventListener("click", () => {
        document
          .querySelectorAll(`.${CSS_CLASSES.READING_OPTION}`)
          .forEach((opt) => {
            opt.classList.remove(CSS_CLASSES.ACTIVE);
          });
        optionElement.classList.add(CSS_CLASSES.ACTIVE);
        this.viewModel.updateSetting("readingType", option.value);
      });

      optionsContainer.appendChild(optionElement);
    });

    selectorWrapper.appendChild(optionsContainer);

    // Create add readings button
    const buttonContainer = document.createElement("div");
    buttonContainer.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
    buttonContainer.id = DOM_IDS.ADD_READINGS_BUTTON_CONTAINER;

    const addReadingsButton = document.createElement("button");
    addReadingsButton.className = CSS_CLASSES.BUTTON;
    addReadingsButton.id = DOM_IDS.ADD_READINGS_BUTTON;
    addReadingsButton.textContent = STRINGS.ADD_READINGS;
    addReadingsButton.style.width = "100%";

    addReadingsButton.addEventListener("click", async () => {
      console.log(STRINGS.ADD_READINGS_CLICKED);
      const kanji = await this.viewModel.requestKanj();
      if (kanji.length > 0) {
        console.log(STRINGS.KANJI_RECEIVED, kanji);
        // Process the kanji here
      }
    });

    buttonContainer.appendChild(addReadingsButton);

    // Insert elements in the correct order
    const enableReadingsCheckbox = document.getElementById(
      DOM_IDS.ENABLE_READINGS,
    ) as HTMLInputElement;
    const enableReadingsElement = enableReadingsCheckbox?.closest(
      `.${CSS_CLASSES.GENERAL_CONFIGS_ITEM}`,
    );

    if (enableReadingsElement && enableReadingsElement.nextSibling) {
      configsContainer.insertBefore(
        selectorWrapper,
        enableReadingsElement.nextSibling,
      );
      configsContainer.insertBefore(
        buttonContainer,
        selectorWrapper.nextSibling,
      );
    } else {
      configsContainer.appendChild(selectorWrapper);
      configsContainer.appendChild(buttonContainer);
    }
  }
}
