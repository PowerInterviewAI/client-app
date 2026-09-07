import { LIVE_SUGGESTION_NO_SUGGESTION } from '../consts.js';

/**
 * Whether a streamed live answer is the "no suggestion needed" sentinel, or is still a prefix of
 * one.
 *
 * Prefix-matched because it runs on every chunk: a sentinel that only matched once complete would
 * flash a half-written NO_SUGGESTION_NEEDED card into the panel first.
 *
 * Markdown emphasis is stripped before the comparison. Hint-only mode asks the model for a bold
 * headline on line 1, so a model that carries that format over to the sentinel emits
 * `**NO_SUGGESTION_NEEDED**`; a bare-string match would leave that sitting in the panel as a card.
 * The prompt asks for it bare, but the fallback costs one regex and the failure is visible
 * mid-interview.
 *
 * Format characters (`\p{Cf}`) go with it, and that is what makes the fallback hold in Arabic and
 * Hebrew. Models writing right-to-left routinely open a response with a directional mark, and
 * U+200F is not whitespace - it survives `\s`, leaves `bare` starting with a character the
 * sentinel does not, and puts `NO_SUGGESTION_NEEDED` on screen as the answer to a question the
 * backend had decided needed none. The class also covers the zero-width joiners and isolates, and
 * cannot make a real answer match: an answer only ever collides by being a genuine prefix of the
 * sentinel, which is the streaming case this function is built around.
 */
export function isNoSuggestionSentinel(answer: string): boolean {
  const bare = answer.replace(/^[\s*`#>\p{Cf}-]+/u, '').replace(/[\s*`\p{Cf}]+$/u, '');

  return bare.length > 0 && LIVE_SUGGESTION_NO_SUGGESTION.startsWith(bare);
}
