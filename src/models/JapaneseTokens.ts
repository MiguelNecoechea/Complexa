// types/nlp.ts

/**
 * MorphFeatures:
 * A map of morphological feature names to their values.
 * Example keys: "Reading", "Inflection", etc.
 */
export type MorphFeatures = Record<string, string>;

/**
 * Token:
 * Represents one token as returned by the `/tokenize` endpoint.
 *
 * Properties:
 * - surface:  string
 *     The exact surface form from the input text.
 * - reading:  string
 *     The kana (or romaji) reading, if available.
 * - lemma:    string
 *     The lemma (base form) of the token.
 * - pos:      string
 *     Universal (coarse-grained) part-of-speech tag, e.g. "NOUN", "VERB".
 * - tag:      string
 *     Language-specific fine-grained POS tag, e.g. "名詞-普通名詞-一般".
 * - dep:      string
 *     Dependency relation label, e.g. "nmod", "ROOT".
 * - head:     string
 *     The surface form of the syntactic head token.
 * - morph:    MorphFeatures
 *     All morphological features as a key/value dictionary.
 * - offset:   number
 *     Character offset of this token in the original text.
 * - ent_iob:  string
 *     IOB code for named-entity tagging, e.g. "O", "B", "I".
 * - ent_type: string
 *     Named-entity type, e.g. "PERSON", or empty string if none.
 */
export interface Token {
    surface: string;
    reading: string;
    lemma: string;
    pos: string;
    tag: string;
    dep: string;
    head: string;
    morph: MorphFeatures;
    offset: number;
    ent_iob: string;
    ent_type: string;
    is_japanese: string;
}
