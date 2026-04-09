import { ImageUp, Loader2, PauseCircle, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { type ActionSuggestion, SuggestionState } from '@/types/suggestion';

// when a question is too long we truncate it in the middle to keep the UI compact
const MAX_QUESTION_LENGTH = 256;
function truncateMiddle(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const half = Math.floor((maxLen - 3) / 2);
  return text.slice(0, half) + ' ... ... ... ' + text.slice(text.length - (maxLen - 3 - half));
}

import { Checkbox } from '../../ui/checkbox';
import { SafeMarkdown } from '../safe-markdown';

interface ActionSuggestionsPanelProps {
  actionSuggestions?: ActionSuggestion[];
  style?: React.CSSProperties;
}

function ActionSuggestionsPanel({ actionSuggestions = [], style }: ActionSuggestionsPanelProps) {
  const hasItems = actionSuggestions.length > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

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

  // scroll the final list item into view at the bottom of the container
  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const last = lastItemRef.current;
    if (!last) return;
    last.scrollIntoView({ behavior, block: 'end', inline: 'nearest' });
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
          // jump to bottom where the most recent element lives
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
    <Card className="relative flex flex-col w-full h-full bg-card p-0 rounded-md" style={style}>
      {/* Header */}
      <div className="border-b border-border p-2 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground text-xs">Triggered Suggestions</h3>
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
              aria-label="Enable auto-scroll"
            />
            <span className="text-xs text-muted-foreground">Auto-scroll</span>
          </label>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto mb-2">
        {!hasItems && (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-sm text-muted-foreground">No action suggestions yet</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="p-4 space-y-3">
            {actionSuggestions.map((s, idx) => (
              <div
                key={idx}
                ref={idx === actionSuggestions.length - 1 ? lastItemRef : null}
                className="flex gap-3 pb-3 border-b border-border/40 last:border-0"
              >
                {idx === actionSuggestions.length - 1 &&
                (s.state === SuggestionState.Pending || s.state === SuggestionState.Loading) ? (
                  <Loader2 className="h-4 w-4 mt-px text-accent shrink-0 animate-spin" />
                ) : s.state === SuggestionState.Stopped ? (
                  <PauseCircle className="h-4 w-4 mt-px text-muted-foreground shrink-0" />
                ) : (
                  <Zap className="h-4 w-4 mt-px text-accent shrink-0" />
                )}

                <div>
                  {s.last_question && s.last_question.trim() !== '' && (
                    <div className="flex text-xs text-muted-foreground mb-2">
                      <span>{truncateMiddle(s.last_question, MAX_QUESTION_LENGTH)}</span>
                    </div>
                  )}

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

                  <div className="flex-1">
                    {(s.state === SuggestionState.Loading ||
                      s.state === SuggestionState.Success) && (
                      <div className="text-sm text-foreground/90 leading-relaxed">
                        <div className="text-sm">
                          <SafeMarkdown content={s.answer} />
                        </div>
                      </div>
                    )}

                    {s.state === SuggestionState.Stopped && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <PauseCircle className="h-4 w-4" />
                        <span>Suggestion canceled</span>
                      </div>
                    )}

                    {s.state === SuggestionState.Error && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-1">
                        <p className="text-xs text-destructive">Failed to generate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* scroll-to-latest button removed; auto-scroll still available via toggle */}
    </Card>
  );
}

export default React.memo(ActionSuggestionsPanel);
