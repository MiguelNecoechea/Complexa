// Functionality Imports
import { TextExtractionManager } from "./textExtractionManager";
import {
    KanjiReadingsProcessor,
    ReadingMode,
} from "./linguisticsContents/JapaneseReadingContent";
import { JapaneseTextColoring } from "./linguisticsContents/JapaneseTextColoring";
import { APIHandler } from "../api/apiHandler";
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
    private paragraphs: Paragraph[];
    private tokenizedArrays: Token[][] = [];
    private tokenizedDOM: HTMLElement[][] = [];

    private initPromise: Promise<Token[][]>;
    private apiHandler: APIHandler;
    private kanjiReadingProcessor: KanjiReadingsProcessor;
    private textColorizer: JapaneseTextColoring;

    private readingMode: ReadingMode = "hiragana";
    private tooltipReady: Boolean = false;
    private tokenFilter = FilterTokens.instance;

    constructor() {
        this.paragraphs = TextExtractionManager.extract(
            document.querySelector("main") ?? document.body,
        );
        this.apiHandler = new APIHandler();
        this.initPromise = this.apiHandler.tokenize(
            this.paragraphs.map((p) => p.text),
        );
        this.kanjiReadingProcessor = new KanjiReadingsProcessor("hiragana");
        this.textColorizer = new JapaneseTextColoring();
        this.init();
    }

    private async init() {
        const mode = await SettingsService.getSetting("readingType");
        await this.tokenFilter.init();
        this.kanjiReadingProcessor = new KanjiReadingsProcessor(mode);
        this.readingMode = mode;
        (window as any).readingMode = mode;
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
                        this.readingMode = message.readingType as ReadingMode;
                        (window as any).readingMode = this.readingMode;
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
        if (this.tokenizedDOM.length) return;

        this.tokenizedArrays = await this.initPromise;
        let tokenIdx = 0;

        this.paragraphs.forEach((para) => {
            const tokens = this.tokenizedArrays[tokenIdx++] || [];
            const row: HTMLElement[] = [];

            let tIdx = 0;
            let charCount = 0;

            para.textNodes.forEach((node) => {
                const start = charCount;
                const end = start + node.data.length;
                const frag = document.createDocumentFragment();
                let localPos = 0;

                while (tIdx < tokens.length && tokens[tIdx].offset < end) {
                    const tok = tokens[tIdx];
                    if (
                        tok.offset >= start &&
                        tok.offset + tok.surface.length <= end
                    ) {
                        const rel = tok.offset - start;
                        if (rel > localPos) {
                            frag.appendChild(
                                document.createTextNode(
                                    node.data.slice(localPos, rel),
                                ),
                            );
                        }

                        if (
                            this.tokenFilter.shouldExclude(tok) ||
                            !this.isJapanese(tok.surface)
                        ) {
                            frag.appendChild(
                                document.createTextNode(tok.surface),
                            );
                        } else {
                            const span = document.createElement("span");
                            span.textContent = tok.surface;
                            span.dataset.index = tIdx.toString();
                            span.dataset.surface = tok.surface;
                            span.dataset.pos = tok.pos;
                            span.dataset.lemma = tok.lemma;
                            span.dataset.tag = tok.tag;
                            span.dataset.dep = tok.dep;
                            span.dataset.head = tok.head.toString();
                            span.dataset.offset = tok.offset.toString();
                            span.dataset.ent_obj = tok.ent_iob;
                            span.dataset.ent_type = tok.ent_type;

                            if (tok.morph)
                                span.dataset.morph = JSON.stringify(tok.morph);

                            if (tok.reading) span.dataset.reading = tok.reading;

                            frag.appendChild(span);
                            row.push(span);
                        }

                        localPos = rel + tok.surface.length;
                        tIdx++;
                    } else {
                        break;
                    }
                }
                if (localPos < node.data.length) {
                    frag.appendChild(
                        document.createTextNode(node.data.slice(localPos)),
                    );
                }
                node.parentNode?.replaceChild(frag, node);
                charCount = end;
            });

            this.tokenizedDOM.push(row);
        });

        await this.mountHoverToolTip();
    }

    private isJapanese(text: string): boolean {
        return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text);
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
