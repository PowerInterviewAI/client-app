import { useEffect, useMemo, useState } from 'react';

import { mockTtsService } from '@/services/mock-tts.service';

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

/**
 * How long the reveal waits for the voice before giving up and showing the question anyway.
 *
 * Waiting for audio is what puts the words in step with the speech, but it is not worth an empty
 * question row: synthesis can be slow, and it can fail in ways that only surface later. Past this
 * the text is what matters and the alignment is not.
 */
const MS_WAIT_FOR_AUDIO = 2500;

/**
 * True once the interviewer's voice has begun for *this* question.
 *
 * Keyed on the question rather than kept as a bare "has spoken" flag, so the answer resets for
 * every new question: the listener records which question it fired for, and only that one reads
 * as started. Resubscribing per question rather than reading the key out of a ref - the
 * subscription is a set insert, and a ref written during render is not a thing to do for it.
 */
function useSpeechStarted(questionKey: string): boolean {
  const [startedFor, setStartedFor] = useState<string | null>(null);

  useEffect(() => mockTtsService.onAudioStart(() => setStartedFor(questionKey)), [questionKey]);

  return startedFor === questionKey;
}

interface StreamingQuestionProps {
  text: string;
  /**
   * Whether this question is going to be spoken. False for a language with no voice, and for a
   * question whose synthesis failed - both of which put the text on screen with nothing to wait
   * for.
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
 * The reveal starts with the sound rather than with the state change. `Speaking` begins before
 * there is any audio, since the first sentence still has to be synthesised, so timing the reveal
 * against the state would put the words up during that silence.
 *
 * Respects `prefers-reduced-motion`, where the whole question appears at once - this is
 * decoration on content the candidate has to read, so it is the animation that gives way.
 */
export function StreamingQuestion({ text, spoken }: StreamingQuestionProps) {
  const speechStarted = useSpeechStarted(text);
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  const [shown, setShown] = useState(0);

  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Armed when the wait for audio has run out. Kept as state rather than folded into the reveal
  // effect so that timer restarts with the question and nothing else.
  const [waitedForAudio, setWaitedForAudio] = useState(false);

  // Nothing to wait for when the question is not going to be spoken, and nothing to animate when
  // the user has asked for less motion.
  const started = reduceMotion || !spoken || speechStarted || waitedForAudio;

  useEffect(() => {
    setShown(0);
    setWaitedForAudio(false);
  }, [text]);

  useEffect(() => {
    if (!spoken || reduceMotion) return;
    const id = window.setTimeout(() => setWaitedForAudio(true), MS_WAIT_FOR_AUDIO);
    return () => window.clearTimeout(id);
  }, [text, spoken, reduceMotion]);

  useEffect(() => {
    if (!started) return;
    if (reduceMotion) {
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
  }, [started, reduceMotion, words]);

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
