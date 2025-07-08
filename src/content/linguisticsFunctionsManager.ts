import { TextExtractionManager } from "./textExtractionManager";
import { KanjiReadingsProcessor } from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { APIHandler } from "../api/apiHandler";
import { TokenWrapper } from "./linguisticsContents/TokenWrapper";
import { SettingsService } from "../services/SettingsService";

// Custom types
import { Paragraph } from "../models/Paragraph";
import { Token } from "../models/JapaneseTokens";

// UI imports
import HoverTokenView from "../views/HoverTokenView";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";

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

    private tooltipReady: Boolean = false;

    private tokenFilter = FilterTokens.instance;
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
        const mode = await SettingsService.getSetting("readingType");
        await this.tokenFilter.init();
        this.kanjiReadingProcessor = new KanjiReadingsProcessor(mode);
        this.setupMessageListeners();
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender, sendResponse) => {
                switch (message.action) {
                    case MESSAGE_TYPES.ADD_READINGS:
                        (async () => {
                            try {
                                await this.ensureWrapped();
                                this.textColorizer.addPOSAnnotations();
                                this.kanjiReadingProcessor.addReadings();
                                sendResponse({ success: true });
                            } catch (err: any) {
                                sendResponse({success: false, error: err.message || err});
                            }
                        })();
                        return true;
                    case MESSAGE_TYPES.CHANGE_READING_TYPE:
                        this.kanjiReadingProcessor.changeReadingType(message.readingType);
                        sendResponse({ success: true });
                        return false;
                    default:
                        sendResponse({success: false, error: "Unknown action"});
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
}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
