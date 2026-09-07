/**
 * The backend answers a pure-backchannel question with NO_SUGGESTION_NEEDED, and the live service
 * matches that string to drop the card instead of showing it. The match is the whole mechanism:
 * miss it and the sentinel itself is what the candidate reads mid-interview.
 *
 * Hint-only mode is what put pressure on it. That prompt asks for a bold headline on line 1, so
 * a model carrying the format over to the sentinel emits it wrapped in **, and a bare-string match
 * fails. Prefix matching also has to keep working, since this runs on every streamed chunk.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('suggestion-sentinel');

  const { isNoSuggestionSentinel } = await loadMain('utils/suggestion-sentinel.js');

  check('matches the bare sentinel', isNoSuggestionSentinel('NO_SUGGESTION_NEEDED'));
  check('matches a partial sentinel mid-stream', isNoSuggestionSentinel('NO_SUGGESTION'));
  check('matches the first chunk of one', isNoSuggestionSentinel('NO'));

  check('matches a bolded sentinel', isNoSuggestionSentinel('**NO_SUGGESTION_NEEDED**'));
  check('matches a bolded partial', isNoSuggestionSentinel('**NO_SUGG'));
  check('matches a bulleted sentinel', isNoSuggestionSentinel('- NO_SUGGESTION_NEEDED'));
  check('matches a trailing newline', isNoSuggestionSentinel('NO_SUGGESTION_NEEDED\n'));

  check('an empty answer is not the sentinel', !isNoSuggestionSentinel(''));
  check('bare emphasis alone is not the sentinel', !isNoSuggestionSentinel('**'));

  // Right-to-left sessions. A model writing Arabic or Hebrew routinely opens on a directional
  // mark, and U+200F is a format character rather than whitespace - it survives `\s`, leaves the
  // comparison starting on a character the sentinel does not, and puts NO_SUGGESTION_NEEDED on
  // screen as the answer to a question the backend had decided needed none. Which is the failure
  // the backend prompt singles out as the one that fails hardest.
  check(
    'matches a sentinel behind a right-to-left mark',
    isNoSuggestionSentinel('\u200fNO_SUGGESTION_NEEDED')
  );
  check(
    'matches one behind a mark and emphasis',
    isNoSuggestionSentinel('\u200f**NO_SUGGESTION_NEEDED**')
  );
  check('matches a partial behind a mark', isNoSuggestionSentinel('\u200fNO_SUGG'));
  check(
    'matches one with a trailing left-to-right mark',
    isNoSuggestionSentinel('NO_SUGGESTION_NEEDED\u200e')
  );
  check(
    'matches one behind a byte order mark',
    isNoSuggestionSentinel('\ufeffNO_SUGGESTION_NEEDED')
  );
  check(
    'matches one behind an ideographic space',
    isNoSuggestionSentinel('\u3000NO_SUGGESTION_NEEDED')
  );

  // And a real right-to-left answer opening on the same mark is still an answer.
  check(
    'a Hebrew answer behind a mark is kept',
    !isNoSuggestionSentinel('\u200fכן, הובלתי את המעבר מקצה לקצה.')
  );
  check(
    'an Arabic answer behind a mark is kept',
    !isNoSuggestionSentinel('\u200fنعم، قدت عملية الترحيل بالكامل.')
  );
  check('a mark alone is not the sentinel', !isNoSuggestionSentinel('\u200f'));

  // The other half: a real answer must never be swallowed, in either mode.
  check(
    'a hint-only headline is kept',
    !isNoSuggestionSentinel('**Cut p99 from 1.8s to 210ms on the orders API**')
  );
  check('a partial hint-only headline is kept', !isNoSuggestionSentinel('**Cut'));
  check('a prose answer is kept', !isNoSuggestionSentinel('No, I owned the migration end to end.'));
  check('a prose answer starting mid-word is kept', !isNoSuggestionSentinel('Nothing'));

  return failures;
}
