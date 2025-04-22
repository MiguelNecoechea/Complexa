import { BrowserLevel } from "browser-level";
import { Word, Xref, Simplified } from "./interfaces";

// Custom types
type KanaOrKanji = "kana" | "kanji";

let db: BrowserLevel | null = null;

/*
Initializes the database
*/
export async function initDB(): Promise<void> {
  if (!db) {
    db = new BrowserLevel("database");
    await db.open();
  }
}

/**
 * Helper function that iterates over values in a key range using BrowserLevel's iterator.
 * It takes the start (gte) and exclusive end (lt) keys, and the limit.
 * If limit is negative, the limit is omitted.
 */
async function iterateValues(
  gte: string,
  lt: string,
  limit: number,
): Promise<string[]> {
  if (!db)
    throw new Error("Database not initialized, initDb() must be called first.");

  const results: string[] = [];
  const options: any = { gte, lt, keys: false, valueAsBuffer: false };

  if (limit >= 0) options.limit = limit;

  const it = db.iterator(options);

  try {
    while (true) {
      const entry = await it.next();
      if (entry === undefined) break;
      const [, value] = entry;
      results.push(value);
    }
  } catch (error) {
    throw error;
  }
  return results;
}

/**
 * Converts an array of database IDs into an array of Word objects.
 */
async function idsToWords(ids: string[]): Promise<Word[]> {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");

  const wordPromises = ids.map(async (id) => {
    const data = await db?.get(`raw/words/${id}`);
    if (data !== undefined) {
      return JSON.parse(data) as Word;
    } else {
      throw new Error("An unknown error happened");
    }
  });

  return await Promise.all(wordPromises);
}

async function searchBeginning(
  prefix: string,
  key: KanaOrKanji = "kanji",
  limit: number,
): Promise<Word[]> {
  const gte = `indexes/${key}/${prefix}`;
  const lt = gte + "\uFE0F";
  const ids = await iterateValues(gte, lt, limit);
  return idsToWords(ids);
}

async function searchAnywhere(
  text: string,
  key: KanaOrKanji = "kanji",
  limit: number,
): Promise<Word[]> {
  const gte = `indexes/partial-${key}/${text}`;
  const lt = gte + "\uFE0F";
  const ids = await iterateValues(gte, lt, limit);
  return idsToWords(ids);
}

/**
 * Retrieves words by an exact-match lookup (using the key as a prefix).
 * This simply calls the beginning search with the text appended with '-' as in your original code.
 */
export async function get(
  text: string,
  key: KanaOrKanji = "kanji",
): Promise<Word[]> {
  return searchBeginning(text + "-", key, -1);
}

/**
 * Retrieves words that are related based on a cross-reference.
 * For a two-element cross-reference ([string, string]), it will split the second element on '・'
 * and filter matches from the 'kanji' index that have a corresponding reading in the 'kana' array.
 * For other cases, it performs a search on both 'kanji' and 'kana' indexes and de-duplicates.
 */
export async function getXrefs(xref: Xref): Promise<Word[]> {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");

  const [first, second] = xref;
  if (typeof second === "string") {
    // Assume cross-reference as [kanji, reading] (or similar).
    const reb = second.split("・")[0];
    const kebHits = await get(first, "kanji");
    return kebHits.filter((w) => w.kana.some((k) => k.text === reb));
  } else {
    // When only one element is given or second is a number.
    const hitsKanji = await get(first, "kanji");
    const hitsKana = await get(first, "kana");
    const combined = [...hitsKanji, ...hitsKana];
    const seen = new Set<string>();
    return combined.filter((hit) => {
      if (seen.has(hit.id)) return false;
      seen.add(hit.id);
      return true;
    });
  }
}

/**
 * Retrieves words whose kana readings begin with the specified prefix.
 */
export const readingBeginning = async (
  prefix: string,
  limit = -1,
): Promise<Word[]> => searchBeginning(prefix, "kana", limit);

/**
 * Retrieves words whose kana readings contain the specified text.
 */
export const readingAnywhere = async (
  text: string,
  limit = -1,
): Promise<Word[]> => searchAnywhere(text, "kana", limit);

/**
 * Retrieves words whose kanji forms begin with the specified prefix.
 */
export const kanjiBeginning = async (
  prefix: string,
  limit = -1,
): Promise<Word[]> => searchBeginning(prefix, "kanji", limit);

/**
 * Retrieves words whose kanji forms contain the specified text.
 */
export const kanjiAnywhere = async (
  text: string,
  limit = -1,
): Promise<Word[]> => searchAnywhere(text, "kanji", limit);

/**
 * Retrieves the tags stored in the database.
 */
export const getTags = async (): Promise<Simplified["tags"]> => {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  const tagsData = await db.get("raw/tags");

  if (tagsData == undefined) throw Error("Unexpected error happened.");

  return JSON.parse(tagsData);
};

/**
 * Retrieves a specific field (other than words) from the database.
 */
export const getField = async <T extends keyof Omit<Simplified, "words">>(
  key: T,
): Promise<string> => {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");

  const data = await db.get(`raw/${key}`);

  if (data === undefined) throw new Error(`Field ${key} not found in database`);

  return data;
};
