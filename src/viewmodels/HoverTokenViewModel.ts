import { Token, MorphFeatures } from "../models/JapaneseTokens";
import { JishoEntry } from "../models/Jisho";
import { IJishoService } from "../services/JishoService";
import { FilterTokens } from "../appFunctions/WordFilters/FilterTokens";

export default class HoverTokenViewModel {
    private readonly DEFAULT_MESSAGE = "Data not found.";

    private _token: Token | null = null;

    constructor(
        private readonly jisho: IJishoService,
        private readonly filterTokens: typeof FilterTokens = FilterTokens
    ) {}

    setToken(token: Token | null): void {
        this._token = token;
    }

    get token(): Token | null {
        return this._token;
    }

    get surface(): string      { return this._token?.surface ?? ""; }
    get reading(): string      { return this._token?.reading || this.DEFAULT_MESSAGE; }
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

}
