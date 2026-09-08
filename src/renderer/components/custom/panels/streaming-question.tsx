import { useEffect, useMemo, useState } from 'react';

/**
 * Longest the whole reveal is allowed to take, and the slowest it goes for a short question.
 *
 * A question is spoken at roughly 150 words a minute, so text revealed at that pace would arrive
 * exactly as slowly as the voice and the candidate could never read ahead of it. Revealing at
 * roughly twice speech puts the last word up well before the sentence finishes, which reads as
 * the question being written out rather than as the screen lagging the audio. The budget keeps a
 * long question from taking proportionally longer: past about 25 words it speeds up instead.
 */
const MS_PER_WORD = 120;
const MS_BUDGET = 3000;
const MS_MIN_PER_WORD = 30;

interface StreamingQuestionProps {
  text: string;
  /**
   * Whether this question is going to be spoken. False for a language with no voice, and for a
   * question whose synthesis failed - both of which put the text on screen with nothing to pace
   * it against.
   */
  spoken: boolean;
}

/**
 * The question the interviewer is asking right now, written out as it is spoken.
 *
 * The backend returns a question whole, so this is presentation and nothing else: the text is
 * complete in state throughout, and only how much of it is on screen changes. It exists because
 * a whole paragraph appearing at once, followed a second or two later by a voice starting to read
 * it, does not read as someone asking a question - it reads as a page loading and then a
 * recording playing.
 *
 * **The reveal and the voice start together, both on the question arriving.** It used to wait for
 * the first audio chunk to actually sound, with a 2.5-second fallback for the case where that
 * never happened. Synthesis is a network call, so that wait was routinely the whole of the
 * fallback: the words then went up after the wait rather than with the question, and the voice
 * arrived after them anyway. Waiting cannot make the two simultaneous - only starting them at the
 * same moment can - and the reveal's own pacing is what keeps the text alongside the speech from
 * there.
 *
 * Respects `prefers-reduced-motion`, where the whole question appears at once - this is
 * decoration on content the candidate has to read, so it is the animation that gives way.
 */
export function StreamingQuestion({ text, spoken }: StreamingQuestionProps) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  const [shown, setShown] = useState(0);

  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nothing to animate when the user has asked for less motion, and nothing to animate when the
  // question is not going to be spoken either.
  //
  // A reveal exists to keep the words in step with a voice. With no voice there is nothing to
  // keep step with, and pacing the text out anyway is the animation asking the candidate to wait
  // for a machine that is not doing anything - on the one path where reading the question *is*
  // the whole of being asked it, and where a cursor blinking after a half-written sentence reads
  // as the interviewer still thinking.
  const instant = reduceMotion || !spoken;

  // Declared before the reveal below so a new question resets the count first and the interval
  // that follows starts from the beginning of it rather than from the previous question's tail.
  useEffect(() => {
    setShown(0);
  }, [text]);

  useEffect(() => {
    if (instant) {
      setShown(words.length);
      return;
    }

    // Every other entry from the split is the whitespace between two words, so the count of real
    // words is half the array. Pacing on the array length instead would run the reveal at double
    // speed and make the budget below mean something other than it says.
    const wordCount = Math.max(1, Math.ceil(words.length / 2));
    const perWord = Math.max(MS_MIN_PER_WORD, Math.min(MS_PER_WORD, MS_BUDGET / wordCount));

    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= words.length) {
          window.clearInterval(id);
          return n;
        }
        // Two entries per tick: the next word and the space that follows it, so a tick always
        // advances by a whole word rather than sometimes only by a gap.
        return Math.min(words.length, n + 2);
      });
    }, perWord);

    return () => window.clearInterval(id);
  }, [instant, words]);

  const revealed = words.slice(0, shown).join('');
  const done = shown >= words.length;

  return (
    <p dir="auto" className="text-sm text-foreground/90 leading-relaxed wrap-break-word">
      {/* The full text is always in the DOM for assistive technology and for anything that reads
          the transcript, with only the not-yet-revealed part hidden from sight. A reveal that
          actually withheld the words would make the question unreadable to a screen reader for
          as long as the animation ran. */}
      <span aria-hidden="true">{revealed}</span>
      <span className="sr-only">{text}</span>
      {!done && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-3.5 w-1 translate-y-0.5 animate-pulse rounded-sm bg-foreground/50"
        />
      )}
    </p>
  );
}
