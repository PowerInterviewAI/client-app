import { ArrowUp, Loader, PauseCircle, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useConfigStore } from '@/hooks/use-config-store';

const MAX_QUESTION_LENGTH = 256;

import { Card } from '@/components/ui/card';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import {
  newestTimestamp,
  stripDanglingEmphasis,
  truncateMiddle,
  withHardBreaks,
} from '@/lib/suggestions';
import { SuggestionMode } from '@/types/llm';
import { type LiveSuggestion, SuggestionState } from '@/types/suggestion';

import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { SafeMarkdown } from '../safe-markdown';
import SuggestionReveal from './suggestion-reveal';

/**
 * Render one answer in the format it was generated in.
 *
 * Both modes go through `SafeMarkdown`: the normal-mode prompt asks for light formatting, and a
 * model that reaches for bold or a bullet there used to put the asterisks on screen literally.
 * Keyed off the suggestion's own mode rather than the current setting, so toggling mid-interview
 * leaves cards already on screen alone - what the mode still decides is the presentation around
 * the Markdown, not whether it is parsed.
 *
 * `trailing` marks a stopped stream as unfinished. Appended to the content rather than rendered
 * beside it, so it lands inline at the end of the last line instead of on a block of its own.
 */
function SuggestionAnswer({
  suggestion,
  trailing,
}: {
  suggestion: LiveSuggestion;
  trailing?: boolean;
}) {
  const suffix = trailing ? ' ...' : '';
  const answer = stripDanglingEmphasis(suggestion.answer);

  if (suggestion.mode === SuggestionMode.HintOnly) {
    return (
      // The headline is the line that has to land in a glance. SafeMarkdown gives it weight - it
      // renders as `strong` at 600 over regular body - and the size bump here is what separates it
      // from the bullets under it. Full-strength foreground rather than text-accent: the accent is
      // an oklch 0.77 orange, which reads as a highlight on the dark card and as low-contrast body
      // text on the light one. Applied here, not in SafeMarkdown, because the action panel renders
      // whole documents through the same component and has no headline line to promote.
      <div className="text-sm text-foreground leading-relaxed [&>p:first-child]:text-[0.95rem] [&_ul]:mt-1 [&_li]:my-0.5">
        <SafeMarkdown content={answer + suffix} />
      </div>
    );
  }

  return (
    // The wand stays a marker in its own column rather than a character prepended to the content:
    // inside the Markdown it would swallow whatever structure the answer opens with.
    <div className="flex gap-1.5 text-sm text-foreground leading-relaxed">
      <span aria-hidden="true" className="shrink-0">
        🪄
      </span>
      <div className="min-w-0 flex-1">
        <SafeMarkdown content={withHardBreaks(answer) + suffix} />
      </div>
    </div>
  );
}

interface LiveSuggestionsPanelProps {
  suggestions?: LiveSuggestion[];
  style?: React.CSSProperties;
  isRunning?: boolean;
}

function LiveSuggestionsPanel({
  suggestions = [],
  style,
  isRunning = false,
}: LiveSuggestionsPanelProps) {
  const hasItems = suggestions.length > 0;

  // newest first: the incoming array is chronological, the panel renders it reversed
  const orderedSuggestions = useMemo(() => [...suggestions].reverse(), [suggestions]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // anything newer than this reveals itself on arrival; whatever was already on screen when the
  // panel mounted does not. Bumped after commit so the entering item gets one render as "new".
  const [lastRevealedAt, setLastRevealedAt] = useState(() => newestTimestamp(suggestions));

  useEffect(() => {
    const newest = newestTimestamp(suggestions);
    setLastRevealedAt((prev) => (newest > prev ? newest : prev));
  }, [suggestions]);

  const { config, updateConfig } = useConfigStore();

  const lastHotkeyAtRef = useRef<number>(0);
  const HOTKEY_SMOOTH_THRESHOLD = 150; // ms

  const [autoScroll, setAutoScroll] = useState<boolean>(
    () => config?.autoScrollLiveSuggestions ?? true
  );
  const isStealth = useIsStealthMode();

  useEffect(() => {
    if (typeof config?.autoScrollLiveSuggestions === 'boolean') {
      setAutoScroll(config.autoScrollLiveSuggestions);
    }
  }, [config?.autoScrollLiveSuggestions]);

  // Track previous length, state, and content to detect actual changes
  const prevLengthRef = useRef<number>(suggestions.length);
  const prevLastStateRef = useRef<SuggestionState | null>(
    suggestions.length > 0 ? suggestions[suggestions.length - 1].state : null
  );
  const prevLastContentRef = useRef<string>(
    suggestions.length > 0 ? suggestions[suggestions.length - 1].answer : ''
  );

  // the newest suggestion sits at the top of the list
  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior });
  };

  // auto-scroll when suggestions change
  useEffect(() => {
    if (!autoScroll) return;

    const currentLength = suggestions.length;
    const lastSuggestion = suggestions[currentLength - 1];
    const currentLastState = lastSuggestion?.state ?? null;
    const currentLastContent = lastSuggestion?.answer ?? '';

    // Only scroll when:
    // 1. A new item is added (length increased)
    // 2. The last item transitioned to SUCCESS (generation completed)
    // 3. The last item's content changed while LOADING (generation in progress)
    const lengthChanged = currentLength !== prevLengthRef.current;
    const becameSuccess =
      lastSuggestion &&
      prevLastStateRef.current !== SuggestionState.Success &&
      currentLastState === SuggestionState.Success;
    const contentChangedWhileLoading =
      lastSuggestion &&
      currentLastState === SuggestionState.Loading &&
      currentLastContent !== prevLastContentRef.current;

    if (lengthChanged || becameSuccess || contentChangedWhileLoading) {
      scrollToLatest('smooth');
    }

    // Update refs for next comparison
    prevLengthRef.current = currentLength;
    prevLastStateRef.current = currentLastState;
    prevLastContentRef.current = currentLastContent;
  }, [suggestions, autoScroll]);

  // Listen for hotkey scroll events from Electron main process
  useEffect(() => {
    if (typeof window === 'undefined' || !window?.electronAPI?.onHotkeyScroll) return;

    const unsubscribe = window.electronAPI.onHotkeyScroll(
      (section: string, direction: 'up' | 'down' | 'end') => {
        if (section !== '0') return; // only handle for interview suggestions section

        const container = containerRef.current;
        if (!container) return;

        if (direction === 'end') {
          // scroll to top where latest suggestion lives
          scrollToLatest('smooth');
          return;
        }

        const distance = Math.max(Math.round(container.clientHeight * 0.5), 100);
        const top = direction === 'up' ? -distance : distance;

        const now = Date.now();
        const dt = now - (lastHotkeyAtRef.current || 0);
        const behavior: ScrollBehavior = dt < HOTKEY_SMOOTH_THRESHOLD ? 'auto' : 'smooth';
        lastHotkeyAtRef.current = now;

        container.scrollBy({ top, behavior });
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (e) {
        console.error('Failed to unsubscribe from hotkey scroll events', e);
      }
    };
  }, [containerRef]);

  return (
    <Card
      className="relative flex flex-col w-full h-full bg-card p-0 rounded-md gap-1"
      style={style}
    >
      {/* Header */}
      <div className="px-2 py-1.5 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isRunning && (
            <span
              className="h-2 w-2 rounded-full bg-destructive animate-pulse shrink-0"
              aria-hidden="true"
            />
          )}
          <h3 className="font-semibold text-foreground text-xs">Live Suggestions</h3>
        </div>

        {!isStealth && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={(v) => {
                const enabled = v === true;
                setAutoScroll(enabled);
                updateConfig({ autoScrollLiveSuggestions: enabled }).catch((e) =>
                  console.error('Failed to persist auto-scroll setting', e)
                );
              }}
              className="h-4 w-4 rounded border-border bg-background text-primary"
              aria-label="Enable auto-scroll"
            />
            <span className="text-xs text-muted-foreground">Auto-scroll</span>
          </label>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {!hasItems && (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-sm text-muted-foreground">No suggestions yet</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="px-2 pb-2">
            {orderedSuggestions.map((s, idx) => (
              <SuggestionReveal
                key={s.timestamp}
                animate={s.timestamp > lastRevealedAt}
                className="border-b border-border/40 last:border-0"
              >
                {/* Skip style, layout and paint for cards scrolled out of view. Applied here
                    rather than on SuggestionReveal's wrapper, which is an animating grid that
                    size containment would fight. The newest card - the streaming one - is
                    always on screen, so containment never applies to it. */}
                <div className="py-3 [content-visibility:auto] [contain-intrinsic-size:auto_6rem]">
                  {/* The question is what says which turn this answer belongs to, and on an answer
                      taller than the panel it used to scroll away and leave the reader holding an
                      answer with no question. Pinned for as long as its own card is in view - the
                      card's paint containment is what stops it at the card's last line.

                      Unlike the transcript's speaker label this sits over the answer rather than
                      beside it, so it needs bg-card to keep the text scrolling underneath from
                      showing through, and line-clamp-2 so a 256-character question cannot pin a
                      third of the panel open. The full text stays on the title. */}
                  <div className="sticky top-0 z-10 flex gap-3 bg-card pb-2">
                    {idx === 0 &&
                    (s.state === SuggestionState.Pending || s.state === SuggestionState.Loading) ? (
                      <Loader className="h-4 w-4 mt-px text-accent shrink-0 animate-spin" />
                    ) : s.state === SuggestionState.Stopped ? (
                      <PauseCircle className="h-4 w-4 mt-px text-muted-foreground shrink-0" />
                    ) : (
                      <Zap className="h-4 w-4 mt-px text-accent shrink-0" />
                    )}
                    {/* min-w-0: a flex item defaults to min-width:auto, so one long unbroken
                        token would widen the card past the panel instead of wrapping */}
                    <div
                      dir="auto"
                      className="min-w-0 flex-1 text-xs text-muted-foreground wrap-break-word line-clamp-2"
                      title={s.last_question}
                    >
                      {truncateMiddle(s.last_question, MAX_QUESTION_LENGTH)}
                    </div>
                  </div>

                  {/* icon column (w-4) plus its gap (gap-3), so the answer keeps the left edge it
                      had when the icon was a flex sibling of the whole card body */}
                  <div className="min-w-0 pl-7">
                    {(s.state === SuggestionState.Loading ||
                      s.state === SuggestionState.Success) && <SuggestionAnswer suggestion={s} />}

                    {s.state === SuggestionState.Stopped && (
                      <SuggestionAnswer suggestion={s} trailing />
                    )}

                    {s.state === SuggestionState.Error && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-1">
                        <p className="text-xs text-destructive">{s.error}</p>
                      </div>
                    )}

                    {s.state === SuggestionState.Idle && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Idle - no generation yet
                      </div>
                    )}
                  </div>
                </div>
              </SuggestionReveal>
            ))}
          </div>
        )}
      </div>

      {!autoScroll && hasItems && (
        <Button
          size="icon-sm"
          className="absolute bottom-3 right-3 rounded-full shadow-md bg-blue-600 text-white hover:bg-blue-600/90"
          onClick={() => scrollToLatest('smooth')}
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </Card>
  );
}

export default React.memo(LiveSuggestionsPanel);
