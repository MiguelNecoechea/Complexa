// Handles DOM traversal, messaging, and style injection
import { PopupSettings } from "../models/PopupSettings";
import { NlpApiClient } from "../api/server/nlpTools";

type Settings = PopupSettings;

class KanjiReadingScript {
    private settings: Settings = {
        enableDictionary: false,
        enableReadings: false,
        enableTextSegmentation: false,
        enableWordFilters: false,
        enableKanjiExtraction: false,
        enableQuiz: false,
        readingType: "romaji",
    };

    private currentPageHasReadings: boolean;

    private apiClient: NlpApiClient = new NlpApiClient();

    constructor() {
        this.initialize();
        this.currentPageHasReadings = false;
    }

    /* ─────────────────────────  BOOTSTRAP  ───────────────────────── */
    private async initialize(): Promise<void> {
        await this.loadSettings();

        this.setupMessageListeners();
        this.addRubyStyles();
    }

    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get(
                Object.keys(this.settings),
            );
            this.settings = { ...this.settings, ...result };
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    }

    /* ─────────────────────────  MESSAGING  ───────────────────────── */
    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(
            (message: any, sender, sendResponse) => {
                switch (message.action) {
                    case "addReadings":
                        this.addReadings()
                            .then(() => sendResponse({ success: true }))
                            .catch((err) =>
                                sendResponse({
                                    success: false,
                                    error: err.message,
                                }),
                            );
                        break;
                    case "updateSettings": {
                        const newSetting: Partial<Settings> = message.settings
                            ? message.settings
                            : (({ action, ...rest }) => rest)(message);

                        this.updateSetting(newSetting)
                            .then(() => sendResponse({ success: true }))
                            .catch((err) =>
                                sendResponse({
                                    success: false,
                                    error: err.message,
                                }),
                            );
                        break;
                    }

                    default:
                        sendResponse({
                            success: false,
                            error: "Unknown action",
                        });
                }

                return true;
            },
        );
    }

    private async updateSetting(newSetting: Partial<Settings>): Promise<void> {
        Object.assign(this.settings, newSetting);
        console.log("New settings →", this.settings);

        try {
            await chrome.storage.sync.set(this.settings);
            console.log("Settings saved!");
        } catch (err) {
            console.error("Failed to save settings:", err);
        }

        if ("readingType" in newSetting) {
            await this.apiClient.changeReadingMode(this.settings.readingType);
        }

        if (this.currentPageHasReadings) {
            // TODO: Update the readings without actually doing deep processing, maybe we don't even need api
        }
    }

    /* ─────────────────────  RUBY ANNOTATION FLOW  ─────────────────── */
    private async addReadings(): Promise<void> {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            { acceptNode: this.filterNode.bind(this) },
        );

        const tasks: Promise<void>[] = [];
        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
            tasks.push(this.annotateNode(node));
        }
        await Promise.all(tasks);
    }

    private filterNode(n: Node): number {
        if (!(n instanceof Text) || !n.data.trim())
            return NodeFilter.FILTER_REJECT;
        const tag = n.parentElement?.tagName;
        if (["SCRIPT", "STYLE", "RUBY", "RT", "RB"].includes(tag!))
            return NodeFilter.FILTER_REJECT;
        return /[\u4E00-\u9FAF]/.test(n.data)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
    }

    private async annotateNode(node: Text): Promise<void> {
        const html = await this.apiClient.annotateText(node.data);
        const frag = document.createRange().createContextualFragment(html);
        node.replaceWith(frag);
    }

    private addRubyStyles(): void {
        const style = document.createElement("style");
        style.textContent = `ruby { line-height: 1.8; } ruby rt { font-size: .55em; white-space: nowrap; }`;
        document.head.appendChild(style);
    }
}

console.log("Initializing kanji reading script");
const kanjiReader = new KanjiReadingScript();
