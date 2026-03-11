import { Loader2, PauseCircle, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useConfigStore } from '@/hooks/use-config-store';

const MAX_QUESTION_LENGTH = 256;

function truncateMiddle(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const half = Math.floor((maxLen - 3) / 2);
  return text.slice(0, half) + ' ... ... ... ' + text.slice(text.length - (maxLen - 3 - half));
}

import { Card } from '@/components/ui/card';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { type LiveSuggestion, SuggestionState } from '@/types/suggestion';

import { Checkbox } from '../../ui/checkbox';

interface SuggestionsPanelProps {
  suggestions?: LiveSuggestion[];
  style?: React.CSSProperties;
}

function LiveSuggestionsPanel({ suggestions = [], style }: SuggestionsPanelProps) {
  const hasItems = suggestions.length > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

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

  // helper: scroll last item into view at the bottom of container (conventional for newest)
  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const last = lastItemRef.current;
    if (!last) return;
    last.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
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
          // scroll to bottom where latest suggestion lives
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
    <Card className="relative flex flex-col w-full h-full bg-card p-0" style={style}>
      {/* Header */}
      <div className="border-b border-border px-4 pt-4 pb-2 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
      <div ref={containerRef} className="flex-1 overflow-y-auto mb-2">
        {!hasItems && (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-sm text-muted-foreground">No suggestions yet</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="p-4 space-y-3">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                ref={idx === suggestions.length - 1 ? lastItemRef : null}
                className="flex gap-3 pb-3 border-b border-border/40 last:border-0"
              >
                {idx === suggestions.length - 1 &&
                (s.state === SuggestionState.Pending || s.state === SuggestionState.Loading) ? (
                  <Loader2 className="h-4 w-4 mt-px text-accent shrink-0 animate-spin" />
                ) : s.state === SuggestionState.Stopped ? (
                  <PauseCircle className="h-4 w-4 mt-px text-muted-foreground shrink-0" />
                ) : (
                  <Zap className="h-4 w-4 mt-px text-accent shrink-0" />
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {truncateMiddle(s.last_question, MAX_QUESTION_LENGTH)}
                  </div>

                  {(s.state === SuggestionState.Loading || s.state === SuggestionState.Success) && (
                    <div className="text-sm font-semibold text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      🪄 {s.answer}
                    </div>
                  )}

                  {s.state === SuggestionState.Stopped && (
                    <div className="text-sm font-semibold text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      🪄 {s.answer} ...
                    </div>
                  )}

                  {s.state === SuggestionState.Error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-1">
                      <p className="text-xs text-destructive">Failed to generate</p>
                    </div>
                  )}

                  {s.state === SuggestionState.Idle && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Idle — no generation yet
                    </div>
                  )}
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

export default React.memo(LiveSuggestionsPanel);
