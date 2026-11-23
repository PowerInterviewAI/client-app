import { Language } from '../types/language.js';

/**
 * Languages written without spaces between words.
 *
 * Kept in step with the backend's `_UNSPACED_LANGUAGES` in `app/services/asr_service.py`, which
 * applies the same rule when it rejoins the segments of a single utterance. This one covers the
 * other half: transcripts that arrived as separate finals and are merged here because they fell
 * inside `TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS` of each other.
 */
const UNSPACED_LANGUAGES: ReadonlySet<Language> = new Set([
  Language.Japanese,
  Language.Chinese,
  Language.Cantonese,
  Language.ChineseTraditional,
  Language.Thai,
]);

/**
 * What to put between two transcript blocks being merged into one.
 *
 * A space is a word boundary in English and a visible defect in Japanese, and it does not stop at
 * the panel: `cleaned` is what the suggestion request carries, so the model is asked to answer a
 * question with breaks nobody spoke. The backend already avoids inserting them inside an
 * utterance; joining with a space here would put them back at every merge.
 */
export function transcriptSeparator(language: Language): string {
  return UNSPACED_LANGUAGES.has(language) ? '' : ' ';
}
