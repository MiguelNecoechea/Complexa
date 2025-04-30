import { TextExtractionManager } from "./textExtractionManager";
import { KanjiReadingsProcessor } from "./linguisticsContents/JapaneseReadingContent";
import { Token } from "../models/JapaneseTokens";
import { APIHandler } from "../api/server/apiHandler";

const MESSAGE_TYPES = {
    ADD_READINGS: "addReadings",
    ADD_POS_ANOTATIONS: "addPosAnnotations",
    CHANGE_READING_TYPE: "changeReadingType",
};

export class LingusticsManager {
    private rawPageTextNodes: Text[];
    private tokenizedTextNodes: Token[][] = [];
    private initPromise: Promise<Token[][]>;
    private apiHandler: APIHandler;
    private kanjiReadingProcessor: KanjiReadingsProcessor;

    constructor() {
        this.rawPageTextNodes = TextExtractionManager.extract(document.body);

        this.apiHandler = new APIHandler();

        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana");

        this.initPromise = this.apiHandler.tokenizeNodes(this.rawPageTextNodes);

        this.setupMessageListeners();
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender, sendResponse) => {
                switch (message.action) {
                    case MESSAGE_TYPES.ADD_READINGS:
                        // fire off an async IIFE so we can use await
                        (async () => {
                            try {
                                this.tokenizedTextNodes =
                                    await this.initPromise;

                                this.kanjiReadingProcessor.addReadings(
                                    this.rawPageTextNodes,
                                    this.tokenizedTextNodes,
                                );

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
}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
