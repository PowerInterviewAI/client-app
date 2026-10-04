import { ArrowUp, ImageUp, Loader, PauseCircle, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useT } from '@/i18n';
import { newestTimestamp, truncateMiddle } from '@/lib/suggestions';
import { type ActionSuggestion, SuggestionState } from '@/types/suggestion';

// when a question is too long we truncate it in the middle to keep the UI compact
const MAX_QUESTION_LENGTH = 256;

import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { SafeMarkdown } from '../safe-markdown';
import SuggestionReveal from './suggestion-reveal';

// the screenshot tray is re-created with a fresh timestamp on every broadcast, so it needs a
// key of its own or it would remount - and replay its reveal - on each capture
const PENDING_PROMPT_KEY = 'pending-prompt';

function isPendingPrompt(s: ActionSuggestion): boolean {
  return s.state === SuggestionState.Idle || s.state === SuggestionState.Uploading;
}

interface ActionSuggestionsPanelProps {
  actionSuggestions?: ActionSuggestion[];
  style?: React.CSSProperties;
  isRunning?: boolean;
}

function ActionSuggestionsPanel({
  actionSuggestions = [],
  style,
  isRunning = false,
}: ActionSuggestionsPanelProps) {
  const t = useT();
  const hasItems = actionSuggestions.length > 0;

  // newest first: the incoming array is chronological, the panel renders it reversed
  const orderedSuggestions = useMemo(() => [...actionSuggestions].reverse(), [actionSuggestions]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // anything newer than this reveals itself on arrival; whatever was already on screen when the
  // panel mounted does not. Bumped after commit so the entering item gets one render as "new".
  const [lastRevealedAt, setLastRevealedAt] = useState(() => newestTimestamp(actionSuggestions));

  useEffect(() => {
    const newest = newestTimestamp(actionSuggestions);
    setLastRevealedAt((prev) => (newest > prev ? newest : prev));
  }, [actionSuggestions]);

  const { config, updateConfig } = useConfigStore();

  // local state mirrors persisted preference but falls back to true if config not yet loaded
  const [autoScroll, setAutoScroll] = useState<boolean>(
    () => config?.autoScrollActionSuggestions ?? true
  );
  const isStealth = useIsStealthMode();

  // stay in sync when config store updates (e.g. after initial load)
  useEffect(() => {
    if (typeof config?.autoScrollActionSuggestions === 'boolean') {
      setAutoScroll(config.autoScrollActionSuggestions);
    }
  }, [config?.autoScrollActionSuggestions]);

  const lastHotkeyAtRef = useRef<number>(0);
  const HOTKEY_SMOOTH_THRESHOLD = 150; // ms

  // Track previous length, state, and content to detect actual changes
  const prevLengthRef = useRef<number>(actionSuggestions.length);
  const prevLastStateRef = useRef<SuggestionState | null>(
    actionSuggestions.length > 0 ? actionSuggestions[actionSuggestions.length - 1].state : null
  );
  const prevLastContentRef = useRef<string>(
    actionSuggestions.length > 0 ? actionSuggestions[actionSuggestions.length - 1].answer : ''
  );

  // the newest suggestion sits at the top of the list
  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior });
  };

  useEffect(() => {
    if (!autoScroll) return;

    const currentLength = actionSuggestions.length;
    const lastSuggestion = actionSuggestions[currentLength - 1];
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
  }, [actionSuggestions, autoScroll]);

  // Listen for hotkey scroll events from Electron main process
  useEffect(() => {
    if (typeof window === 'undefined' || !window?.electronAPI?.onHotkeyScroll) return;

    const unsubscribe = window.electronAPI.onHotkeyScroll(
      (section: string, direction: 'up' | 'down' | 'end') => {
        if (section !== '1') return; // only handle for action suggestions section

        const container = containerRef.current;
        if (!container) return;

        // choose scroll behavior based on direction
        if (direction === 'end') {
          // jump to top where the most recent element lives
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
          <h3 className="font-semibold text-foreground text-xs">{t.panels.triggeredSuggestions}</h3>
        </div>

        {!isStealth && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={(v) => {
                const enabled = v === true;
                setAutoScroll(enabled);
                updateConfig({ autoScrollActionSuggestions: enabled }).catch((e) =>
                  console.error('Failed to persist auto-scroll setting', e)
                );
              }}
              className="h-4 w-4 rounded border-border bg-background text-primary"
              aria-label={t.panels.enableAutoScroll}
            />
            <span className="text-xs text-muted-foreground">{t.panels.autoScroll}</span>
          </label>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {!hasItems && (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.panels.noTriggeredSuggestions}</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="px-2 pb-2">
            {orderedSuggestions.map((s, idx) => (
              <SuggestionReveal
                key={isPendingPrompt(s) ? PENDING_PROMPT_KEY : s.timestamp}
                animate={s.timestamp > lastRevealedAt}
                className="border-b border-border/40 last:border-0"
              >
                {/* Same as the live panel: skip off-screen work. Worth more per card here,
                    since these carry screenshots and markdown with code blocks. */}
                <div className="py-3 [content-visibility:auto] [contain-intrinsic-size:auto_8rem]">
                  {/* Same as the live panel: the prompt stays pinned while its own card is in
                      view, so a long answer never leaves the reader without the question that
                      produced it. bg-card because the answer scrolls underneath it, and
                      line-clamp-2 so a long prompt cannot pin a third of the panel open. */}
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
                    {s.last_question && s.last_question.trim() !== '' && (
                      <div
                        dir="auto"
                        className="min-w-0 flex-1 text-xs text-muted-foreground wrap-break-word line-clamp-2"
                        title={s.last_question}
                      >
                        {truncateMiddle(s.last_question, MAX_QUESTION_LENGTH)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 pl-7">
                    {s.image_urls && s.image_urls.length > 0 && (
                      <div className="flex shrink-0 mb-2">
                        <div className="flex gap-2 overflow-x-auto">
                          {s.image_urls.map((url, i) =>
                            url ? (
                              <img
                                key={i}
                                src={url}
                                className="h-12 w-16 object-cover rounded-md border border-blue-400 bg-muted"
                                alt={`thumb-${i}`}
                              />
                            ) : (
                              <div
                                key={i}
                                className="h-12 w-16 flex items-center justify-center rounded-md border border-blue-400 bg-muted"
                              >
                                <ImageUp className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {(s.state === SuggestionState.Loading ||
                      s.state === SuggestionState.Success) && (
                      <div className="text-sm text-foreground leading-relaxed">
                        <SafeMarkdown content={s.answer} />
                      </div>
                    )}

                    {s.state === SuggestionState.Stopped && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <PauseCircle className="h-4 w-4" />
                        <span>{t.panels.suggestionCanceled}</span>
                      </div>
                    )}

                    {s.state === SuggestionState.Error && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-1">
                        <p className="text-xs text-destructive">{s.error}</p>
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
          aria-label={t.panels.scrollToTop}
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </Card>
  );
}

export default React.memo(ActionSuggestionsPanel);
