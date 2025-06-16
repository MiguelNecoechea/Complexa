// Functionality Imports
import { TextExtractionManager } from "./textExtractionManager";
import { KanjiReadingsProcessor } from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { Token } from "../models/JapaneseTokens";
import { APIHandler } from "../api/apiHandler";
import { SettingsService } from "../services/SettingsService";

// UI imports
import HoverTokenView from "../views/HoverTokenView";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";

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

    private tooltipReady: Boolean = false;
    private tokenFilter = FilterTokens.instance;

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
        if (this.tokenizedDOM.length) return; // only once (Not working i think)

        // this.tokenizedDOM = []; // TODO: Check if works
        this.tokenizedArrays = await this.initPromise;

        this.rawPageTextNodes.forEach((node, idx) => {
            const tokens = this.tokenizedArrays[idx] || [];
            const frag = document.createDocumentFragment();
            const row: HTMLElement[] = [];

            tokens.forEach((tok) => {
                const textNode = document.createTextNode(tok.surface);
                const span = document.createElement("span");

                if (this.tokenFilter.shouldExclude(tok)) {
                    frag.appendChild(document.createTextNode(tok.surface));
                    return;
                }

                // All token data into the span.
                span.textContent = tok.surface;
                span.dataset.surface = tok.surface;
                span.dataset.pos = tok.pos;
                span.dataset.lemma = tok.lemma;
                span.dataset.tag = tok.tag;
                span.dataset.dep = tok.dep;
                span.dataset.head = tok.head;

                span.dataset.offset = tok.offset.toString();
                span.dataset.ent_obj = tok.ent_iob;
                span.dataset.ent_type = tok.ent_type;

                // if (tok.morph != null) {
                //     const inflection: string = tok.morph["Inflection"];
                //     if (inflection) span.dataset.morph = inflection;
                // }

                if (tok.reading) span.dataset.reading = tok.reading;
                frag.appendChild(span);
                row.push(span);
            });

            node.parentNode?.replaceChild(frag, node);
            this.tokenizedDOM.push(row);
        });

        await this.mountHoverToolTip();
    }

    private async mountHoverToolTip(): Promise<void> {
        if (this.tooltipReady) return;

        const hoverHTML = await fetch(
            chrome.runtime.getURL("static/views/hoverView.html"),
        ).then((r) => r.text());

        document.body.insertAdjacentHTML("beforeend", hoverHTML);

        new HoverTokenView();

        this.tooltipReady = true;
    }
}

console.log("Linguistcs Manager Injected");
new LingusticsManager();
