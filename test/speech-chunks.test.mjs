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

  const cantonese = splitIntoSpeechChunks('請你介紹一下自己。你最熟悉邊種技術？', 'zh-hk');
  check('Cantonese splits like the other CJK languages', cantonese.length === 2);

  // Each sentence is past MOCK_SPEECH_CHUNK_MIN_CHARS, so the split is the punctuation's doing.
  const marathi = splitIntoSpeechChunks(
    'तुमच्या मागील प्रकल्पाबद्दल आणि त्यातील तुमच्या भूमिकेबद्दल थोडक्यात सांगा। त्या प्रकल्पात तुम्ही कोणती तांत्रिक आव्हाने सोडवली?',
    'mr'
  );
  check('Marathi splits on the danda', marathi.length === 2);
  check('the first Marathi chunk keeps its danda', marathi[0].endsWith('।'));

  const urdu = splitIntoSpeechChunks(
    'براہ کرم اپنے پچھلے منصوبے اور اس میں اپنے کردار کے بارے میں مختصراً بتائیں۔ اس منصوبے میں آپ نے کون سے تکنیکی مسائل حل کیے؟',
    'ur'
  );
  check('Urdu splits on its own full stop', urdu.length === 2);

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
