import { ArrowDown } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { StreamingQuestion } from '@/components/custom/panels/streaming-question';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';
import { cn } from '@/lib/utils';
import {
  isMockInterviewSessionActive,
  type MockInterviewSessionState,
  MockInterviewState,
} from '@/types/mock-interview';

interface Turn {
  key: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  skipped?: boolean;
  isFollowUp?: boolean;
  /**
   * The question being asked right now, which is written out as it is spoken rather than
   * appearing whole. True for at most one turn, and only while the interviewer is still
   * speaking - once it is the candidate's turn the whole question stays on screen to be read.
   */
  streaming?: boolean;
  /** Whether that question is going to be spoken, which is what the reveal waits for. */
  spoken?: boolean;
}

/**
 * Every question-and-answer turn so far, plus the one in progress.
 *
 * Unlike `groupBySpeaker` in the live transcript panel, turns here are never merged: each entry
 * is already a whole question or a whole answer rather than an ASR final, so consecutive same-
 * speaker rows never occur except across a skipped question, where the candidate's row is kept
 * (as "Skipped") rather than dropped - losing the row would make the interviewer's next question
 * read as a second question the candidate never got, with no explanation for the gap.
 *
 * **`currentQuestion` outlives the turn it belongs to**, and reading it as "the live turn" is
 * what duplicated every question on screen. Main folds the finished turn into `answers` and only
 * replaces `currentQuestion` when the *next* question is installed, so between the two - through
 * Evaluating, Generating, Scoring and Stopping, which is every gap between questions - the same
 * question (and its answer) is present in both places at once. The state is the discriminator:
 * the question is live only while the candidate can still act on it, which is exactly `Speaking`
 * and `Listening`. Everywhere else it has either not been asked yet or is already in `answers`.
 */
function buildTurns(session: MockInterviewSessionState): Turn[] {
  const turns: Turn[] = [];

  session.answers.forEach((a, i) => {
    turns.push({ key: `q-${i}`, speaker: 'interviewer', text: a.question });
    turns.push({
      key: `a-${i}`,
      speaker: 'candidate',
      text: a.answer,
      skipped: a.skipped,
    });
  });

  const questionIsLive =
    session.state === MockInterviewState.Speaking || session.state === MockInterviewState.Listening;

  if (session.currentQuestion && questionIsLive) {
    turns.push({
      key: 'current-q',
      speaker: 'interviewer',
      text: session.currentQuestion.text,
      isFollowUp: session.currentQuestion.isFollowUp,
      streaming: session.state === MockInterviewState.Speaking,
      spoken: session.currentQuestion.hasAudio,
    });

    // Only once something has actually been transcribed. Pushed on entering `Listening` instead,
    // it was a row carrying the candidate's name and nothing else for as long as they were still
    // thinking - and the status line below the panel already says the microphone is open.
    if (session.currentAnswerText) {
      turns.push({ key: 'current-a', speaker: 'candidate', text: session.currentAnswerText });
    }
  }

  return turns;
}

interface MockTranscriptPanelProps {
  session: MockInterviewSessionState;
}

/**
 * The live-mode transcript dock's analogue for a mock session: every turn so far, in the same
 * speaker-labelled, scrollable shape - so the interview itself reads the way an interview
 * transcript reads, rather than as a single card that replaces its own content on every question.
 */
function MockTranscriptPanel({ session }: MockTranscriptPanelProps) {
  const { appState } = useAppState();
  const { config, updateConfig } = useConfigStore();
  const username = appState?.interviewConfig?.fullName || 'You';
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(() => config?.autoScrollTranscript ?? true);
  // A callback ref rather than a `useRef`, because the observer below has to be re-attached when
  // this element is swapped out - the empty state renders in its place until the first question.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);

  /**
   * Scrolls this panel's own scroller, and nothing else.
   *
   * It used to be `endRef.scrollIntoView({ behavior: 'smooth' })` on a sentinel at the end of the
   * list, which reaches upward by definition: it brings the element into view inside *every*
   * scrollable ancestor, and Chromium counts a box with `overflow: hidden` as one. The session
   * screen's panel-and-status column is exactly that, and while a question was being spoken with
   * the transcript already longer than the panel it had something to scroll - so each smooth
   * scroll here dragged the column too, taking the status line and the control bar under it up
   * with it before they settled back. `session.tsx` closes the other half of that by clamping
   * the wrappers so the column has nothing to scroll; scrolling this element by name means the
   * panel could not move anything above it even if it did.
   */
  const scrollToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (typeof config?.autoScrollTranscript === 'boolean') {
      setAutoScroll(config.autoScrollTranscript);
    }
  }, [config?.autoScrollTranscript]);

  // Keyed on values, never on `session` or on any object hanging off it. Main broadcasts a fresh
  // session on every write - which during a question includes every streamed token of the live
  // hint - and the whole state is structure-cloned across IPC, so *every* array and object in it
  // arrives with a new identity each time however little changed. Memoising on any of those
  // rebuilt this list and re-armed the smooth scroll below dozens of times a second for content
  // that was identical. `answers.length` is a sound proxy for the list: entries are appended and
  // never edited in place, and the only other reset is back to empty.
  const turns = useMemo(
    () => buildTurns(session),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      session.answers.length,
      session.currentQuestion?.text,
      session.currentQuestion?.isFollowUp,
      // Read into the live turn, and it moves without the text moving: `speechFailed` flips it
      // for the question already on screen. It currently rides along on the state change in the
      // same broadcast, which is exactly why leaving it out would be invisible until it did not.
      session.currentQuestion?.hasAudio,
      session.currentAnswerText,
      session.state,
    ]
  );
  const totalQuestions = session.setup?.question_count ?? 0;
  // Clamped to the total once it's known; passed through unchanged before then (there is nothing
  // to clamp against yet).
  const questionNumber =
    totalQuestions > 0 ? Math.min(session.questionNumber, totalQuestions) : session.questionNumber;
  const progressValue = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;
  const isRunning = isMockInterviewSessionActive(session);

  /**
   * Follows the transcript whenever the content itself grows, not only when `turns` changes.
   *
   * `turns` is a list of finished strings, so watching it alone misses the reveal entirely: the
   * question arrives whole and `StreamingQuestion` writes it out in the DOM, so for the whole
   * time the voice is speaking - which is most of what there is to follow - the effect below
   * never fires and the panel sat still, catching up only on the next state change. That is the
   * "auto-scroll only works once the voice ends" of it. The same gap covers anything else that
   * changes height on its own: a reflow when the dock is resized, or a font finishing loading.
   *
   * A ResizeObserver on the list is the general form - it fires on the content box actually
   * getting taller, whatever made it taller - and only at the moments that matter, since
   * revealing a word mid-line does not change the height at all.
   *
   * Instant rather than smooth, and this is the path essentially every auto-scroll now takes
   * (a new turn grows the list too, so the observer fires there as well and its scroll lands on
   * top of the effect below). Growth arrives a line at a time, and re-targeting a running smooth
   * animation on every wrap leaves the panel permanently trailing the text it is meant to be
   * showing. Smooth is kept for the button, where the reader asked for one long jump.
   */
  useEffect(() => {
    if (!autoScroll || !contentEl || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => scrollToEnd('auto'));
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [autoScroll, contentEl, scrollToEnd]);

  // Covers what the observer cannot see: a turn swapped for one of the same height, and the first
  // render after the list appears, before the observer above is attached to it.
  useEffect(() => {
    if (!autoScroll) return;
    scrollToEnd('auto');
  }, [turns, autoScroll, scrollToEnd]);

  return (
    <Card className="relative flex flex-col w-full h-full bg-card p-0 rounded-md gap-1">
      <div className="px-2 py-1.5 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isRunning && (
            <span
              className="h-2 w-2 rounded-full bg-destructive animate-pulse shrink-0"
              aria-hidden="true"
            />
          )}
          <h3 className="font-semibold text-foreground text-xs">Mock Interview</h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {totalQuestions > 0 && (
            <span className="text-xs text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </span>
          )}
          {/* Same control and the same stored preference as the live transcript dock. Without it
              every ASR partial pulled the panel back to the bottom, so re-reading an earlier
              answer mid-interview was not possible while the candidate was still speaking. */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={(v) => {
                const enabled = v === true;
                setAutoScroll(enabled);
                updateConfig({ autoScrollTranscript: enabled }).catch((e) =>
                  console.error('Failed to persist auto-scroll setting', e)
                );
              }}
              className="h-4 w-4 rounded border-border bg-background"
              aria-label="Enable auto-scroll"
            />
            <span className="select-none">Auto-scroll</span>
          </label>
        </div>
      </div>

      {totalQuestions > 0 && <Progress value={progressValue} className="h-1 rounded-none shrink-0" />}

      {/* `overflow-x-hidden` is not decoration: `overflow-y-auto` on its own leaves the other
          axis computing to `auto` rather than staying visible, so the vertical scrollbar
          appearing on a long transcript narrowed the content by ten pixels and could bring a
          horizontal one in behind it - which shortens the content box again. Turn text wraps
          (`wrap-break-word`), so there is nothing here that horizontal scrolling would reach. */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
        {turns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">Preparing your first question…</p>
          </div>
        ) : (
          <div ref={setContentEl} className="divide-y divide-border/50">
            {turns.map((turn) => (
              <div key={turn.key} className="flex gap-2 py-2 max-w-3xl mx-auto">
                <span
                  className={cn(
                    'w-20 shrink-0 truncate text-xs font-semibold',
                    turn.speaker === 'candidate' ? 'text-primary' : 'text-foreground'
                  )}
                  title={turn.speaker === 'candidate' ? username : 'Interviewer'}
                >
                  {turn.speaker === 'candidate' ? username : 'Interviewer'}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  {turn.isFollowUp && (
                    <Badge variant="secondary" className="text-[10px]">
                      Follow-up
                    </Badge>
                  )}
                  {/* An answered turn can still be empty - "Done answering" pressed with nothing
                      transcribed, or the silence backstop firing on a dead microphone - and that
                      is not the same as a skip. Left as the bare text it would render a speaker
                      label above an empty line, which reads as a rendering fault rather than as
                      what happened. The export says the same thing with its own placeholder. */}
                  {turn.skipped || !turn.text ? (
                    <p className="text-sm text-muted-foreground italic">
                      {turn.skipped ? 'Skipped' : 'No answer'}
                    </p>
                  ) : turn.streaming ? (
                    <StreamingQuestion text={turn.text} spoken={turn.spoken ?? false} />
                  ) : (
                    <p
                      dir="auto"
                      className="text-sm text-foreground/90 leading-relaxed wrap-break-word"
                    >
                      {turn.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!autoScroll && (
        <Button
          size="icon-sm"
          className="absolute bottom-3 right-3 rounded-full shadow-md bg-blue-600 text-white hover:bg-blue-600/90"
          onClick={() => scrollToEnd()}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-4" />
        </Button>
      )}
    </Card>
  );
}

export default React.memo(MockTranscriptPanel);
