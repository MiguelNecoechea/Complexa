export interface JishoEntrySense {
    english: string[];
    pos: string[];
}

export interface JishoEntry {
    slug: string;
    reading: string;
    senses: JishoEntrySense[];
}
