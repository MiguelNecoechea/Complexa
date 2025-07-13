import { Token, MorphFeatures } from "../models/JapaneseTokens";

export default class HoverTokenViewModel {
    private readonly DEFAULT_MESSAGE: string = "Data not found.";
    constructor(private readonly token: Token) {}

    get surface(): string {
        return this.token.surface;
    }

    get reading(): string {
        return this.token.reading || this.DEFAULT_MESSAGE;
    }

    get lemma(): string {
        return this.token.lemma || this.DEFAULT_MESSAGE;
    }

    get pos(): string {
        return this.token.pos;
    }

    get tag(): string {
        return this.token.tag || this.DEFAULT_MESSAGE;
    }

    get dep(): string {
        return this.token.dep || this.DEFAULT_MESSAGE;
    }

    get head(): string {
        return this.token.head || this.DEFAULT_MESSAGE;
    }

    get offset(): string {
        return String(this.token.offset);
    }

    get iob(): string {
        return this.token.ent_iob || this.DEFAULT_MESSAGE;
    }

    get entity(): string {
        return this.token.ent_type || this.DEFAULT_MESSAGE;
    }

    get morph(): string {
        const m: MorphFeatures = this.token.morph;
        return m && Object.keys(m).length ? JSON.stringify(m) : this.DEFAULT_MESSAGE;
    }
}
