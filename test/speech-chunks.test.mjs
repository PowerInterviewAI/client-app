/**
 * `splitIntoSpeechChunks` decides the sentence boundaries the mock interview synthesizes and
 * plays incrementally - a lookahead of one, so time-to-first-audio is the first sentence rather
 * than the whole question. Getting a boundary wrong is not a crash, it is a chunk that clips a
 * sentence mid-word or a chunk so short the TTS request overhead swamps the sentence itself.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('speech-chunks');

  const { splitIntoSpeechChunks } = await loadMain('utils/speech-chunks.js');

  check('empty input yields no chunks', splitIntoSpeechChunks('', 'en').length === 0);
  check('whitespace-only input yields no chunks', splitIntoSpeechChunks('   ', 'en').length === 0);

  const twoSentences = splitIntoSpeechChunks(
    'Tell me about a time you disagreed with a coworker. How did you resolve the conflict?',
    'en'
  );
  check('two real sentences split into two chunks', twoSentences.length === 2);
  check('the first chunk keeps its terminal punctuation', twoSentences[0].endsWith('.'));
  check(
    'the second chunk is the second sentence',
    twoSentences[1] === 'How did you resolve the conflict?'
  );

  // "Mr." is shorter than the minimum chunk length, so it must merge into the next sentence
  // rather than being spoken as its own one-word utterance.
  const abbreviation = splitIntoSpeechChunks('Mr. Lee asked about your background.', 'en');
  check('a short abbreviation is not its own chunk', abbreviation.length === 1);
  check('it merges into the following sentence', abbreviation[0].startsWith('Mr.'));

  // Japanese uses '。' rather than '.', the same reason transcript-join.ts is language-aware.
  const japanese = splitIntoSpeechChunks('自己紹介をしてください。得意な技術は何ですか？', 'ja');
  check('Japanese splits on its own sentence-final punctuation', japanese.length === 2);
  check('the first Japanese chunk ends on 。', japanese[0].endsWith('。'));

  // A run-on sentence with no punctuation must still be bounded, so the first chunk's audio does
  // not wait on the entire question being written out.
  const longWord = 'word '.repeat(80).trim();
  const bounded = splitIntoSpeechChunks(longWord, 'en');
  check('an unpunctuated run-on is still split', bounded.length > 1);
  check(
    'every chunk stays at or under the maximum',
    bounded.every((chunk) => chunk.length <= 240)
  );

  // A single short sentence is exactly one chunk - the common case for a mock-interview question.
  const single = splitIntoSpeechChunks('What is your greatest strength?', 'en');
  check('a single sentence is a single chunk', single.length === 1 && single[0].length > 0);

  return failures;
}
