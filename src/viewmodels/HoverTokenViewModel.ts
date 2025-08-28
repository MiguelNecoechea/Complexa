import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { JishoEntry } from "../models/Jisho";
import { IJishoService } from "../services/JishoService";
import { FilterTokensService } from "../services/./FilterTokensService";
import * as wanakana from "wanakana";
import {ReadingTypes} from "../models/PopupSettings";

export default class HoverTokenViewModel {
    private readonly DEFAULT_MESSAGE: string = "Data not found.";
    private static readingMode:ReadingTypes = "katakana";

    private _token: Token | null = null;

    constructor(
        private readonly jisho: IJishoService,
        private readonly filterTokens: typeof FilterTokensService = FilterTokensService
    ) {}

    setToken(token: Token | null): void {
        this._token = token;
    }

    get token(): Token | null {
        return this._token;
    }

    get surface(): string      { return this._token?.surface ?? ""; }
    get reading(): string      { return this.transformReading(this._token?.reading)}
    get lemma(): string        { return this._token?.lemma   || this.DEFAULT_MESSAGE; }
    get pos(): string          { return this._token?.pos     ?? ""; }
    get tag(): string          { return this._token?.tag     || this.DEFAULT_MESSAGE; }
    get dep(): string          { return this._token?.dep     || this.DEFAULT_MESSAGE; }
    get head(): string         { return this._token?.head    || this.DEFAULT_MESSAGE; }
    get offset(): string       { return String(this._token?.offset ?? 0); }
    get iob(): string          { return this._token?.ent_iob || this.DEFAULT_MESSAGE; }
    get entity(): string       { return this._token?.ent_type|| this.DEFAULT_MESSAGE; }
    get morph(): string {
        const m: MorphFeatures | undefined = this._token?.morph;
        return m && Object.keys(m).length ? JSON.stringify(m) : this.DEFAULT_MESSAGE;
    }

    transformReading(rawReading: string | undefined): string {
        let convertedReading: string;

        if (rawReading === undefined) return this.DEFAULT_MESSAGE;

        switch (HoverTokenViewModel.readingMode) {
            case "hiragana":
                convertedReading = wanakana.toHiragana(rawReading);
                break;
            case "romaji":
                convertedReading = wanakana.toRomaji(rawReading);
                break;
            default:
                convertedReading = wanakana.toKatakana(rawReading);
        }

        return convertedReading;
    }

    async exclude(): Promise<string> {
        if (!this._token) return "";
        await this.filterTokens.instance.add(this._token.surface);
        return this._token.surface;
    }

    async lookup(): Promise<JishoEntry> {
        if (!this._token) throw new Error("No token selected");
        const queryWord: string = this._token.lemma || this._token.surface;
        return this.jisho.lookup(queryWord);
    }

    public static updateReadingMode(newReadingMode: ReadingTypes): void {
        this.readingMode = newReadingMode;
    }

}
