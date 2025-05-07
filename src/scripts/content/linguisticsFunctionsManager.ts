import { TextExtractionManager } from "./textExtractionManager";
import { KanjiReadingsProcessor } from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { Token } from "../models/JapaneseTokens";
import { APIHandler } from "../api/server/apiHandler";
import { SettingsService } from "../services/SettingsService";

const MESSAGE_TYPES = {
    ADD_READINGS: "addReadings",
    ADD_POS_ANOTATIONS: "addPosAnnotations",
    CHANGE_READING_TYPE: "changeReadingType",
};

export class LingusticsManager {
    private rawPageTextNodes: Text[];
    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private initPromise: Promise<Token[][]>;
    private apiHandler: APIHandler;
    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    constructor() {
        this.rawPageTextNodes = TextExtractionManager.extract(document.body);
        this.apiHandler = new APIHandler();
        this.initPromise = this.apiHandler.tokenizeNodes(this.rawPageTextNodes);
        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana");
        this.textColorizer = new JapaneseTextColoring();
        this.init();
    }

    private async init() {
        const mode = await SettingsService.getSetting("readingType");

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
                                await this.wrapTokens();
                                this.textColorizer.addPOSAnnotations();

                                this.kanjiReadingProcessor.addReadings();
                                sendResponse({ success: true });
                            } catch (err: any) {
                                sendResponse({
                                    success: false,
                                    error: err.message || err,
                                });
                            }
                        })();
                        return true;
                    case MESSAGE_TYPES.CHANGE_READING_TYPE:
                        this.kanjiReadingProcessor.changeReadingType(
                            message.readingType,
                        );
                        sendResponse({ success: true });
                        return false;
                    default:
                        sendResponse({
                            success: false,
                            error: "Unknown action",
                        });
                        return false;
                }
            },
        );
    }

    private async wrapTokens() {
        if (this.tokenizedDOM.length) return; // only once
        this.tokenizedArrays = await this.initPromise;

        this.rawPageTextNodes.forEach((node, idx) => {
            const tokens = this.tokenizedArrays[idx] || [];
            const frag = document.createDocumentFragment();
            const row: HTMLElement[] = [];

            tokens.forEach((tok) => {
                const span = document.createElement("span");
                span.textContent = tok.surface;
                span.dataset.pos = tok.pos;
                if (tok.reading) span.dataset.reading = tok.reading;
                frag.appendChild(span);
                row.push(span);
            });

            node.parentNode?.replaceChild(frag, node);
            this.tokenizedDOM.push(row);
        });
    }
}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
