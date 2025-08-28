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
import { FilterTokensService } from "../services/FilterTokensService";
import {PopupSettings, ReadingTypes} from "../models/PopupSettings";
import MessageSender = chrome.runtime.MessageSender;

const MESSAGE_TYPES = {
    ADD_READINGS: "addReadings",
    CHANGE_READING_TYPE: "changeReadingType",
    PING: "ping",
};

export class LinguisticsManager {
    private readonly paragraphs: Paragraph[];

    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    private tokenFilter: FilterTokensService = FilterTokensService.instance;
    private tokenWrapper: TokenWrapper;

    constructor() {
        this.paragraphs = TextExtractionManager.extract(document.querySelector("main") ?? document.body);
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

        try {
            const response = await chrome.runtime.sendMessage<{ action: string; paragraphs: string[]; },
                { ok: boolean; tokens?: Token[][]; err?: any; }>(
                {action: "TOKENIZE_PARAGRAPHS", paragraphs}
            );
            if (!response.ok) throw response.err ?? new Error("Tokenize failed");
            return response.tokens!;
        } catch (error) {
            console.error("Toknizer request failed", error);
            alert("Tokenizer service is unavailable");
            throw error;
        }

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
                    case MESSAGE_TYPES.PING:
                        sendResponse({ ok: true });
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
        if (document.querySelector("span.lingua-token")) return;

        const { enableHover, enableWordFilters } = await SettingsService.getSettings();

        if (!this.tokenizedArrays.length) {
            this.tokenizedArrays = await this.remoteTokenize(
                this.paragraphs.map((p: Paragraph): string => p.text)
            );
        }

        this.tokenizedDOM = await this.tokenWrapper.wrap(
            this.paragraphs,
            this.tokenizedArrays,
            enableHover,
            enableWordFilters,
        );

    }

    // Listener functions
    private async handleAddReadings(): Promise<void> {
        try {
            await this.ensureWrapped();
            const colorEnabled: boolean = await SettingsService.getSetting("enableColor");
            const furiganaEnabled: boolean = await SettingsService.getSetting("enableFurigana");
            if (colorEnabled) this.textColorizer.addPOSAnnotations();
            if (furiganaEnabled) this.kanjiReadingProcessor.addReadings();

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

console.log("Linguistics Manager Injected");
new LinguisticsManager();
