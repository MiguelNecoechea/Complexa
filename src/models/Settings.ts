export interface Settings {
    enableReadings: boolean;
    enableDictionary: boolean;
    enableTextSegmentation: boolean;
    enableWordFilters: boolean;
    enableKanjiExtraction: boolean;
    enableQuiz: boolean;
    readingType: string;
    [key: string]: boolean | string;
}