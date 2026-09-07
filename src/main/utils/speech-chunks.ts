import { MOCK_SPEECH_CHUNK_MAX_CHARS, MOCK_SPEECH_CHUNK_MIN_CHARS } from '../consts.js';
import { Language } from '../types/language.js';
import { transcriptSeparator } from './transcript-join.js';

// Sentence-final punctuation, Latin and CJK. Japanese uses '。' rather than '.', which is why
// this needs to be language-aware at all - the same reason `transcriptSeparator` is.
const SENTENCE_END_LATIN = /[.!?]+(?=\s|$)/g;
const SENTENCE_END_CJK = /[。！？…]+/g;

const CJK_LANGUAGES: ReadonlySet<Language> = new Set([
  Language.Japanese,
  Language.Chinese,
  Language.Thai,
]);

/**
 * Split a question into sentence-level chunks for incremental TTS playback.
 *
 * Main does this rather than the renderer so the language-aware splitting rules live in one
 * place, on the process that already has the language-mirroring tests - the renderer only ever
 * asks for "chunk N of this question's audio" by index.
 *
 * Bounded on both ends. A piece shorter than `MOCK_SPEECH_CHUNK_MIN_CHARS` is carried forward and
 * combined with what follows, rather than finalized as its own chunk, so an abbreviation like
 * "Mr." does not register as a complete sentence and get spoken as a one-word utterance with a
 * pause after it. That merge is Latin-only: CJK sentence-final punctuation ('。' and friends) has
 * no equivalent ambiguity - there is no Japanese "Mr." that a period also terminates a sentence
 * with - and CJK carries more meaning per character, so a Latin-calibrated character-count
 * minimum would merge legitimate short Japanese sentences that never needed it. A run longer than
 * `MOCK_SPEECH_CHUNK_MAX_CHARS` with no punctuation is still split so one very long sentence does
 * not delay the first chunk's audio.
 */
export function splitIntoSpeechChunks(text: string, language: Language): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const isCjk = CJK_LANGUAGES.has(language);
  const pattern = isCjk ? SENTENCE_END_CJK : SENTENCE_END_LATIN;
  const separator = transcriptSeparator(language);

  const rawPieces: string[] = [];
  let lastIndex = 0;
  for (const match of trimmed.matchAll(pattern)) {
    const end = (match.index ?? 0) + match[0].length;
    rawPieces.push(trimmed.slice(lastIndex, end).trim());
    lastIndex = end;
  }
  const tail = trimmed.slice(lastIndex).trim();
  if (tail) rawPieces.push(tail);

  // Forward accumulation: a short piece is held rather than finalized, and combined with
  // whatever comes next until the result reaches the minimum - which is what lets three short
  // pieces in a row merge into one chunk instead of pairing off arbitrarily by position.
  const merged: string[] = [];
  let pending = '';
  for (const piece of rawPieces) {
    pending = pending ? `${pending}${separator}${piece}` : piece;
    if (isCjk || pending.length >= MOCK_SPEECH_CHUNK_MIN_CHARS) {
      merged.push(pending);
      pending = '';
    }
  }
  if (pending) merged.push(pending);

  const bounded: string[] = [];
  for (const piece of merged) {
    if (piece.length <= MOCK_SPEECH_CHUNK_MAX_CHARS) {
      bounded.push(piece);
      continue;
    }
    // No punctuation gave a natural break inside `MOCK_SPEECH_CHUNK_MAX_CHARS`; fall back to
    // splitting on whitespace so a single run-on sentence still yields a first chunk quickly.
    let rest = piece;
    while (rest.length > MOCK_SPEECH_CHUNK_MAX_CHARS) {
      let cut = rest.lastIndexOf(' ', MOCK_SPEECH_CHUNK_MAX_CHARS);
      if (cut <= 0) cut = MOCK_SPEECH_CHUNK_MAX_CHARS;
      bounded.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) bounded.push(rest);
  }

  return bounded.filter((piece) => piece.length > 0);
}
