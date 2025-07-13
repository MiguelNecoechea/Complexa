import { TextExtractionManager } from "./textExtractionManager";
import {KanjiReadingsProcessor, ReadingMode} from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { APIHandler } from "../api/apiHandler";
import { TokenWrapper } from "./linguisticsContents/TokenWrapper";
import { SettingsService } from "../services/SettingsService";

// Custom types
import { Paragraph } from "../models/Paragraph";
import { Token } from "../models/JapaneseTokens";

// UI imports
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";
import {ReadingTypes} from "../models/PopupSettings";
import MessageSender = chrome.runtime.MessageSender;

const MESSAGE_TYPES = {
    ADD_READINGS: "addReadings",
    ADD_POS_ANOTATIONS: "addPosAnnotations",
    CHANGE_READING_TYPE: "changeReadingType",
};

export class LingusticsManager {
    private readonly paragraphs: Paragraph[];
    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private readonly initPromise: Promise<Token[][]>;
    private apiHandler: APIHandler;
    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    private tokenFilter: FilterTokens = FilterTokens.instance;
    private tokenWrapper: TokenWrapper;

    constructor() {
        this.paragraphs = TextExtractionManager.extract(document.querySelector("main") ?? document.body);
        this.apiHandler = new APIHandler();
        this.initPromise = this.apiHandler.tokenize(this.paragraphs.map((p) => p.text));
        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana");
        this.textColorizer = new JapaneseTextColoring();
        this.tokenWrapper = new TokenWrapper(this.tokenFilter);
        this.init();
    }

    private async init(): Promise<void> {
        const mode: ReadingTypes = await SettingsService.getSetting("readingType");
        await this.tokenFilter.init();
        this.kanjiReadingProcessor = new KanjiReadingsProcessor(mode);
        this.setupMessageListeners();
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender: MessageSender, sendResponse: (response?: any) => void): boolean => {
                switch (message.action) {
                    case MESSAGE_TYPES.ADD_READINGS:
                        this.handleAddReadings(sendResponse);
                        return true;

                    case MESSAGE_TYPES.CHANGE_READING_TYPE:
                        this.handleChangeReadingType(message.readingType, sendResponse);
                        return false;

                    default:
                        sendResponse({ success: false, error: "Unknown action" });
                        return false;
                }
            },
        );
    }
    private async ensureWrapped(): Promise<void> {
        if (this.tokenizedDOM.length) return;

        this.tokenizedArrays = await this.initPromise;
        this.tokenizedDOM = await this.tokenWrapper.wrap(this.paragraphs, this.tokenizedArrays);
    }

    // Listener functions
    private async handleAddReadings(sendResponse: (response: any) => void): Promise<void> {
        try {
            await this.ensureWrapped();
            this.textColorizer.addPOSAnnotations();
            this.kanjiReadingProcessor.addReadings();
            sendResponse({ success: true });
        } catch (err: any) {
            sendResponse({ success: false, error: err.message || err });
        }
    }

    private handleChangeReadingType(readingType: ReadingMode, sendResponse: (response: any) => void): void {
        this.kanjiReadingProcessor.changeReadingType(readingType);
        sendResponse({ success: true });
    }

}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
