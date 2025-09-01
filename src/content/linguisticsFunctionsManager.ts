import { TextExtractionManager } from "./textExtractionManager";
import { KanjiReadingsProcessor} from "./linguisticsContents/JapaneseReadingContent";
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
    REFRESH_SETTINGS: "refreshSettings",
    COLORS_UPDATED: "COLORS_UPDATED"
};

export class LinguisticsManager {
    private paragraphs: Paragraph[];

    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    private tokenFilter: FilterTokensService = FilterTokensService.instance;
    private tokenWrapper: TokenWrapper;

    constructor() {
        this.paragraphs = TextExtractionManager.extract(document.querySelector("main") ?? document.body);
        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana", this.tokenFilter);
        this.textColorizer = new JapaneseTextColoring(this.tokenFilter);
        this.tokenWrapper = new TokenWrapper();
        this.init().then(
            (): void => {
                console.log("Extension manager initialized.");
            }
        );
    }

    private async remoteTokenize(paragraphs: string[]): Promise<Token[][]> {

        try {
            const response = await chrome.runtime.sendMessage<{ action: string; paragraphs: string[]; },
                { ok: boolean; tokens?: Token[][]; err?: any; }>(
                {action: "TOKENIZE_PARAGRAPHS", paragraphs}
            );

            return response.tokens!;
        } catch (error) {
            console.error("Toknizer request failed", error);
            alert("Tokenizer service is unavailable");
            throw error;
        }

    }

    private async init(): Promise<void> {
        const mode: ReadingTypes = await SettingsService.getSetting("readingType");
        HoverTokenViewModel.updateReadingMode(mode);
        this.kanjiReadingProcessor = new KanjiReadingsProcessor(mode, this.tokenFilter);
        this.setupMessageListeners();
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender: MessageSender, sendResponse: (response?: any) => void): boolean => {
                // Usar action o type para compatibilidad
                const actionType = message.action || message.type;
                
                switch (actionType) {
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
                    case MESSAGE_TYPES.REFRESH_SETTINGS:
                        this.handleRefreshSettings().then(
                            (): void => sendResponse({ ok: true }),
                            (err: any): void => sendResponse({ ok: false, err }),
                        );
                        return true;
                    case MESSAGE_TYPES.COLORS_UPDATED:
                        this.handleColorsUpdated().then(
                            (): void => sendResponse({ ok: true }),
                            (err: any): void => sendResponse({ ok: false, err }),
                        );
                        return true;
                    default:
                        sendResponse({ success: false, error: "Unknown action" });
                        return false;
                }
            },
        );
    }

    private tokensMisaligned(): boolean {
        if (!this.tokenizedArrays.length || this.tokenizedArrays.length !== this.paragraphs.length) return true;

        for(let i: number = 0; i < this.tokenizedArrays.length; i++) {
            const text: string = this.paragraphs[i]!.text;
            const tokens: Token[] = this.tokenizedArrays[i]!;

            for (const token of tokens) {
                const slice: string = text.slice(token.offset, token.offset + token.surface.length);
                if (slice !== token.surface) return true;
            }
        }
        return false;
    }

    private async ensureWrapped(): Promise<void> {
        if (this.tokenizedDOM.length) return;
        if (document.querySelector("span.lingua-token")) return;

        if (!this.paragraphs.length) {
            this.paragraphs = TextExtractionManager.extract(
                document.querySelector("main") ?? document.body,
            );
        }

        await this.tokenFilter.init();

        const { enableHover, enableWordFilters } = await SettingsService.getSettings();

        if (this.tokensMisaligned()) {
            this.tokenizedArrays = await this.remoteTokenize(
                this.paragraphs.map((p: Paragraph): string => p.text),
            );
        }

        this.tokenizedDOM = await this.tokenWrapper.wrap(this.paragraphs, this.tokenizedArrays, enableHover);
    }

    // Listener functions
    private async handleAddReadings(): Promise<void> {
        try {
            await this.ensureWrapped();
            const { enableColor, enableFurigana, enableWordFilters } = await SettingsService.getSettings();
            if (enableColor) this.textColorizer.addPOSAnnotations(enableWordFilters);
            if (enableFurigana) this.kanjiReadingProcessor.addReadings(enableWordFilters);

        } catch (err: any) {}
    }

    private async handleChangeReadingType(readingType: ReadingTypes, sendResponse: (response: any) => void): Promise<void> {
        this.kanjiReadingProcessor.changeReadingType(readingType);
        HoverTokenViewModel.updateReadingMode(readingType);
        await SettingsService.updateSetting("readingType", readingType);
        sendResponse({ success: true });
    }

    private async handleRefreshSettings(): Promise<void> {
        const { enableFurigana, enableColor, enableHover, enableWordFilters } = await SettingsService.getSettings();

        if (enableFurigana || enableColor || enableHover || enableWordFilters) await this.handleAddReadings();

        await this.tokenWrapper.setHoverEnabled(enableHover);

        if (enableFurigana) this.kanjiReadingProcessor.addReadings(enableWordFilters);
        else this.kanjiReadingProcessor.removeReadings();

        if (enableColor) this.textColorizer.addPOSAnnotations(enableWordFilters);
        else this.textColorizer.removePOSAnnotations();
    }

    /**
     * Maneja la actualización automática de colores cuando se cambian desde la app
     */
    private async handleColorsUpdated(): Promise<void> {
        try {            
            const enableWordFilters: boolean  = await SettingsService.getSetting("enableWordFilters");
            const colorEnabled: boolean = await SettingsService.getSetting("enableColor");
            
            if (!colorEnabled) {
                return;
            }

            const coloredSpans: NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>("span[data-pos]");
            
            if (coloredSpans.length === 0) {
                return;
            }
            
            await this.textColorizer.addPOSAnnotations(enableWordFilters);
                        
        } catch (error) {
            console.error("❌ Error updating colors:", error);
        }
    }

}

console.log("Linguistics Manager Injected");
new LinguisticsManager();
