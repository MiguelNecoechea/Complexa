import { PopupSettings, ReadingTypes } from "../models/PopupSettings";
import { PopupViewModel } from "../viewmodels/PopupViewModel";

const DOM_IDS = {
    LAUNCH_APP: "launch-app",
    ENABLE_FURIGANA: "enable-text-furigana",
    ENABLE_COLOR: "enable-text-colors",
    ENABLE_HOVER: "enable-text-hover",
    ENABLE_WORD_FILTERS: "enable-word-filters",
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
    KATAKANA_LABEL: "Katakana",
    ROMAJI_LABEL: "Romaji",
    HIRAGANA_LABEL: "Hiragana",
    ADD_READINGS: "Add Readings",
    ADD_READINGS_CLICKED: "Add readings button clicked",
    APP_HTML_PATH: "static/views/app.html",
    KANJI_REQUESTED: "Requesting extracted kanji from the current tab",
    KANJI_RECEIVED: "Received kanji from content script:",
    GETTING_KANJI_ERROR: "Error getting kanji from content script:",
};

export class PopupView {
    private viewModel: PopupViewModel = new PopupViewModel();
    private settings: PopupSettings = {
        enableFurigana: false,
        enableColor: false,
        enableHover: false,
        enableWordFilters: false,
        readingType: "hiragana",
        darkMode: false
    };

    async init(): Promise<void> {
        this.settings = await this.viewModel.init();
        this.setupUI();
        this.injectReadingControls();
        this.attachEventListeners();
    }

    private setupUI(): void {
        this.initializeCheckbox(DOM_IDS.ENABLE_WORD_FILTERS, this.settings.enableWordFilters);
        this.initializeCheckbox(DOM_IDS.ENABLE_FURIGANA, this.settings.enableFurigana);
        this.initializeCheckbox(DOM_IDS.ENABLE_COLOR, this.settings.enableColor);
        this.initializeCheckbox(DOM_IDS.ENABLE_HOVER, this.settings.enableHover);

        const darkModeSwitch = document.getElementById("dark-mode-switch") as HTMLInputElement;
        if (darkModeSwitch && this.settings.darkMode !== undefined) {
            darkModeSwitch.checked = this.settings.darkMode;
            this.setupDarkMode(this.settings.darkMode);
        }
    }

    private attachEventListeners(): void {

        const launchAppBtn = document.getElementById(DOM_IDS.LAUNCH_APP) as HTMLButtonElement;

        if (launchAppBtn) {
            launchAppBtn.addEventListener("click", (): void => {
                chrome.tabs.create({url: chrome.runtime.getURL(STRINGS.APP_HTML_PATH)});
            });
        }

        this.addSettingListener(DOM_IDS.ENABLE_FURIGANA, "enableFurigana");
        this.addSettingListener(DOM_IDS.ENABLE_COLOR, "enableColor");
        this.addSettingListener(DOM_IDS.ENABLE_HOVER, "enableHover");
        this.addSettingListener(DOM_IDS.ENABLE_WORD_FILTERS, "enableWordFilters");



        // Dark mode switch event
        const darkModeSwitch = document.getElementById("dark-mode-switch") as HTMLInputElement;
        if (darkModeSwitch) {
            darkModeSwitch.addEventListener("change", async (): Promise<void> => {
                await this.viewModel.updateSetting("darkMode", darkModeSwitch.checked);
                this.setupDarkMode(darkModeSwitch.checked);
            });
        }
    }

    private setupDarkMode(enabled: boolean): void {
        const body: HTMLElement = document.body;
        const popupContainer: Element | null = document.querySelector('.popup-container');
        const glass: Element | null = document.querySelector('.glassmorphism');
        const generalConfigs: Element | null = document.querySelector('.general-configs-container');
        const preferencesConfigs: Element | null = document.querySelector('.preferences-configs-container');

        if (enabled) {
            body.classList.add('dark-mode');
            if (popupContainer) popupContainer.classList.add('dark-mode');
            if (glass) glass.classList.add('dark-mode');
            if (generalConfigs) generalConfigs.classList.add('dark-mode');
            if (preferencesConfigs) preferencesConfigs.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
            if (popupContainer) popupContainer.classList.remove('dark-mode');
            if (glass) glass.classList.remove('dark-mode');
            if (generalConfigs) generalConfigs.classList.remove('dark-mode');
            if (preferencesConfigs) preferencesConfigs.classList.remove('dark-mode');
        }
    }

    private initializeCheckbox(id: string, checked: boolean): void {
        const checkbox = document.getElementById(id) as HTMLInputElement;
        if (checkbox) checkbox.checked = checked;

    }

    private addSettingListener(id: string, settingKey: keyof PopupSettings): void {
        const checkbox = document.getElementById(id) as HTMLInputElement;
        if (checkbox) {
            checkbox.addEventListener("change", async (): Promise<void> => {
                await this.viewModel.updateSetting(settingKey, checkbox.checked);
                await this.updateSettings();
            });
        }
    }

    private createReadingSelector(activeType: string): HTMLDivElement {
        const katakana: ReadingTypes = "katakana";
        const hiragana: ReadingTypes = "hiragana";
        const romaji: ReadingTypes = "romaji";

        const selectorWrapper: HTMLDivElement = document.createElement("div");
        const selectorLabel: HTMLDivElement = document.createElement("div");

        selectorWrapper.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
        selectorWrapper.id = DOM_IDS.READING_SELECTOR_WRAPPER;
        selectorLabel.className = CSS_CLASSES.READING_SELECTOR_LABEL;
        selectorLabel.textContent = STRINGS.READING_TYPE_LABEL;

        selectorWrapper.appendChild(selectorLabel);

        const optionsContainer: HTMLDivElement = document.createElement("div");
        optionsContainer.className = CSS_CLASSES.READING_OPTIONS;

        const options = [
            { value: romaji, label: STRINGS.ROMAJI_LABEL },
            { value: hiragana, label: STRINGS.HIRAGANA_LABEL },
            { value: katakana, label: STRINGS.KATAKANA_LABEL },
        ];

        options.forEach((option): void => {
            const optionElement: HTMLDivElement = document.createElement("div");

            optionElement.dataset.value = option.value;
            optionElement.textContent = option.label;
            optionElement.className = CSS_CLASSES.READING_OPTION +
                (option.value === activeType ? ` ${CSS_CLASSES.ACTIVE}` : "");


            optionElement.addEventListener("click", (): void => {
                document.querySelectorAll(`.${CSS_CLASSES.READING_OPTION}`).forEach((opt: Element): void => {
                    opt.classList.remove(CSS_CLASSES.ACTIVE);
                });
                optionElement.classList.add(CSS_CLASSES.ACTIVE);
                this.viewModel.updateSetting("readingType", option.value);
            });

            optionsContainer.appendChild(optionElement);
        });

        selectorWrapper.appendChild(optionsContainer);

        return selectorWrapper;
    }

    private createAddReadingsButton(): HTMLDivElement {
        const buttonContainer: HTMLDivElement = document.createElement("div");
        buttonContainer.className = CSS_CLASSES.GENERAL_CONFIGS_ITEM;
        buttonContainer.id = DOM_IDS.ADD_READINGS_BUTTON_CONTAINER;

        const addReadingsButton: HTMLButtonElement = document.createElement("button");
        addReadingsButton.className = CSS_CLASSES.BUTTON;
        addReadingsButton.id = DOM_IDS.ADD_READINGS_BUTTON;
        
        const buttonContent: HTMLDivElement = document.createElement("div");
        buttonContent.style.display = "flex";
        buttonContent.style.alignItems = "center";
        buttonContent.style.justifyContent = "center";
        buttonContent.style.gap = "8px";
        
        const icon: HTMLImageElement = document.createElement("img");
        icon.src = "/static/assets/icons/ui/add-reading.svg";
        icon.alt = "";
        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.opacity = "0.9";
        icon.style.filter = "brightness(0) invert(1)";
        
        const text: Text = document.createTextNode(STRINGS.ADD_READINGS);
        
        buttonContent.appendChild(icon);
        buttonContent.appendChild(text);
        addReadingsButton.appendChild(buttonContent);
        addReadingsButton.style.width = "100%";

        addReadingsButton.addEventListener("click", async (): Promise<void> => {
            await this.viewModel.requestAddReadings();
        });

        buttonContainer.append(addReadingsButton);
        return buttonContainer;
    }

    private removeReadingControls(): void {
        document.getElementById(DOM_IDS.READING_SELECTOR_WRAPPER)?.remove();
        document.getElementById(DOM_IDS.ADD_READINGS_BUTTON_CONTAINER)?.remove();
    }

    private injectReadingControls(): void {
        const container: Element | null = document.querySelector(`.${CSS_CLASSES.GENERAL_CONFIGS_CONTAINER}`);

        if (!container) return;

        if (this.settings.enableFurigana) container.appendChild(this.createReadingSelector(this.settings.readingType));

        if (this.settings.enableFurigana || this.settings.enableColor || this.settings.enableHover) {
            container.appendChild(this.createAddReadingsButton());
        }
    }

    private async updateSettings(): Promise<void> {
        this.settings = await this.viewModel.getCurrentSettings();
        this.removeReadingControls();
        this.injectReadingControls();
    }
}
