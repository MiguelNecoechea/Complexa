// Handles DOM traversal, messaging, and style injection
import { PopupSettings } from "../models/PopupSettings";
import { ReadingTools } from "../api/server/readingTools";
import * as wanakana from "wanakana";

class KanjiReadingScript {
    private apiClient: ReadingTools = new ReadingTools();
    private readingsAdded: boolean = false;

    constructor() {
        this.initialize();
    }

    /* ─────────────────────────  BOOTSTRAP  ───────────────────────── */
    private async initialize(): Promise<void> {
        this.setupMessageListeners();
        this.addRubyStyles();
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
                    case "changeReadingType":
                        this.apiClient
                            .changeReadingMode(message.readingType)
                            .then(() => sendResponse({ success: true }))
                            .catch((e) =>
                                sendResponse({
                                    success: false,
                                    error: e.message,
                                }),
                            );

                        if (this.readingsAdded) {
                            this.changeReadingType(message.readingType);
                        }
                        break;
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
        this.readingsAdded = true;
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

    /* ─────────────────── CLEAR & RE-ANNOTATE ─────────────────── */
    private clearReadings(): void {
        document.querySelectorAll("ruby").forEach((ruby) => {
            let surface = "";
            // collect only the original surface text nodes, drop <rt>
            ruby.childNodes.forEach((n) => {
                if (n.nodeType === Node.TEXT_NODE) {
                    surface += n.textContent;
                }
            });
            const textNode = document.createTextNode(surface);
            ruby.replaceWith(textNode);
        });
        this.readingsAdded = false;
    }

    private changeReadingType(mode: "hiragana" | "katakana" | "romaji"): void {
        // If not yet annotated, fall back to API call
        if (!this.readingsAdded) {
            this.addReadings();
            return;
        }

        // Convert each <rt> without touching the network
        document.querySelectorAll("ruby rt").forEach((rt) => {
            const base = rt.textContent || "";
            let converted: string;
            switch (mode) {
                case "katakana":
                    converted = wanakana.toKatakana(base);
                    break;
                case "romaji":
                    converted = wanakana.toRomaji(base);
                    break;
                default:
                    converted = wanakana.toHiragana(base);
            }
            rt.textContent = converted;
        });
    }

    /* ─────────────────────────  STYLES  ───────────────────────── */
    private addRubyStyles(): void {
        const style = document.createElement("style");
        style.textContent = `ruby { line-height: 1.65; } ruby rt { font-size: .55em; white-space: nowrap; }`;
        document.head.appendChild(style);
    }
}

console.log("Initializing JapaneseReadingContent script");
const kanjiReader = new KanjiReadingScript();
