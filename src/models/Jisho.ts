export interface JishoEntrySense {
    english_definitions: string[];
    pos: string[];
}

export interface JishoEntry {
    slug: string;
    is_common: boolean;
    jlpt: string;
    senses: JishoEntrySense[];
}

export type JishoLookupResponse = | { ok: true;  data: JishoEntry[] } | { ok: false; err: unknown };