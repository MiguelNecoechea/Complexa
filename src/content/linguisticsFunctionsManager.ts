import { TextExtractionManager } from "./textExtractionManager";
import {KanjiReadingsProcessor} from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { TokenWrapper } from "./linguisticsContents/TokenWrapper";
import { SettingsService } from "../services/SettingsService";
import HoverTokenViewModel from "../viewmodels/HoverTokenViewModel"


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
    JISHO_LOOKUP: "JISHO_LOOKUP",
};

export class LingusticsManager {
    private readonly paragraphs: Paragraph[];
    private readonly initPromise: Promise<Token[][]>;

    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    private tokenFilter: FilterTokens = FilterTokens.instance;
    private tokenWrapper: TokenWrapper;

    constructor() {
        this.paragraphs = TextExtractionManager.extract(document.querySelector("main") ?? document.body);
        this.initPromise = this.remoteTokenize(this.paragraphs.map((p: Paragraph): string => p.text));
        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana");
        this.textColorizer = new JapaneseTextColoring();
        this.tokenWrapper = new TokenWrapper(this.tokenFilter);
        this.init().then(
            (): void => {
                console.log("Extension manager initialized.");
            }
        )
    }

    private async remoteTokenize(paragraphs: string[]): Promise<Token[][]> {
        const resp = await chrome.runtime.sendMessage<{ action: string; paragraphs: string[]; },
            { ok: boolean; tokens?: Token[][]; err?: any; }>(
            {action: "TOKENIZE_PARAGRAPHS", paragraphs}
        );
        if (!resp.ok) throw resp.err ?? new Error("Tokenize failed");
        return resp.tokens!;
    }

    private async init(): Promise<void> {
        const mode: ReadingTypes = await SettingsService.getSetting("readingType");
        await this.tokenFilter.init();
        HoverTokenViewModel.updateReadingMode(mode);
        this.kanjiReadingProcessor = new KanjiReadingsProcessor(mode);
        this.setupMessageListeners();
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender: MessageSender, sendResponse: (response?: any) => void): boolean => {
                switch (message.action) {
                    case MESSAGE_TYPES.ADD_READINGS:
                        this.handleAddReadings().then(
                            (): void => sendResponse({ ok: true }),
                            (err: any): void => sendResponse({ ok: false, err }),
                        );
                        return true;
                    case MESSAGE_TYPES.CHANGE_READING_TYPE:
                        this.handleChangeReadingType(message.readingType, sendResponse).then(
                            (): void => sendResponse({ ok: true }),
                            (err: any): void => sendResponse({ ok: false, err }),
                        )
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
    private async handleAddReadings(): Promise<void> {
        try {
            await this.ensureWrapped();
            this.textColorizer.addPOSAnnotations();
            this.kanjiReadingProcessor.addReadings();
        } catch (err: any) {
        }
    }

    private async handleChangeReadingType(readingType: ReadingTypes, sendResponse: (response: any) => void): Promise<void> {
        this.kanjiReadingProcessor.changeReadingType(readingType);
        HoverTokenViewModel.updateReadingMode(readingType);
        await SettingsService.updateSetting("readingType", readingType);
        sendResponse({ success: true });
    }

}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
