/**
 * The mock transcript panel builds its feed from two sources that overlap, and the overlap is
 * invisible to a type checker, a linter and to any screenshot taken at the moment a question is
 * on screen.
 *
 * `answers` is the finished turns. `currentQuestion` is the one being asked - except it is not:
 * main folds a finished turn into `answers` and only replaces `currentQuestion` when the *next*
 * question is installed. Between those two points - Evaluating, Generating, Scoring, Stopping,
 * which is every gap between questions - the same question sits in both, so a panel that renders
 * `currentQuestion` whenever it is set shows that question, and the answer to it, twice.
 *
 * The guard is a state test, and removing it leaves code that compiles and reads fine. So it is
 * pinned here, source-level, like `audio-device-switch.test.mjs` and `rtl-rendering.test.mjs` -
 * this is renderer code and the renderer has no runtime harness in this directory.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-transcript-turns');

  const source = codeOnly(
    readSource(new URL('../src/renderer/components/custom/panels/mock-transcript-panel.tsx', import.meta.url))
  );

  check(
    'the live question is gated on a state, not merely on being set',
    /questionIsLive\s*=/.test(source) && /session\.currentQuestion && questionIsLive/.test(source)
  );

  // The two states in which the candidate can still act on the question, and the only two in
  // which it is not already in `answers`.
  check('and that state is Speaking', /questionIsLive[\s\S]{0,160}MockInterviewState\.Speaking/.test(source));
  check('or Listening', /questionIsLive[\s\S]{0,160}MockInterviewState\.Listening/.test(source));

  // Evaluating is the state the duplicate was most visible in - it is reached on every answer.
  check(
    'Evaluating never puts the question back on screen as a live turn',
    !/questionIsLive[\s\S]{0,160}MockInterviewState\.Evaluating/.test(source)
  );

  check(
    'the in-progress answer row waits for real transcribed text',
    /if \(session\.currentAnswerText\) \{/.test(source)
  );

  check(
    'an answered-but-empty turn is labelled rather than left blank',
    /turn\.skipped \|\| !turn\.text/.test(source) && source.includes('No answer')
  );

  return failures;
}
