import { File, Loader2, PauseCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { type CodeSuggestion, SuggestionState } from '@/types/suggestion';

import { Checkbox } from '../../ui/checkbox';
import { SafeMarkdown } from '../safe-markdown';

interface CodeSuggestionsPanelProps {
  codeSuggestions?: CodeSuggestion[];
  style?: React.CSSProperties;
}

function CodeSuggestionsPanel({ codeSuggestions = [], style }: CodeSuggestionsPanelProps) {
  const hasItems = codeSuggestions.length > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);

  const lastHotkeyAtRef = useRef<number>(0);
  const HOTKEY_SMOOTH_THRESHOLD = 150; // ms

  // Track previous length, state, and content to detect actual changes
  const prevLengthRef = useRef<number>(codeSuggestions.length);
  const prevLastStateRef = useRef<SuggestionState | null>(
    codeSuggestions.length > 0 ? codeSuggestions[codeSuggestions.length - 1].state : null
  );
  const prevLastContentRef = useRef<string>(
    codeSuggestions.length > 0 ? codeSuggestions[codeSuggestions.length - 1].suggestion_content : ''
  );

  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!autoScroll) return;

    const currentLength = codeSuggestions.length;
    const lastSuggestion = codeSuggestions[currentLength - 1];
    const currentLastState = lastSuggestion?.state ?? null;
    const currentLastContent = lastSuggestion?.suggestion_content ?? '';

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
  }, [codeSuggestions, autoScroll]);

  // Listen for hotkey scroll events from Electron main process
  useEffect(() => {
    if (typeof window === 'undefined' || !window?.electronAPI?.onHotkeyScroll) return;

    const unsubscribe = window.electronAPI.onHotkeyScroll(
      (section: string, direction: 'up' | 'down') => {
        if (section !== '1') return; // only handle for code suggestions section

        const container = containerRef.current;
        if (!container) return;

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
          <h3 className="font-semibold text-foreground text-xs">Code Suggestions</h3>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={autoScroll}
            onCheckedChange={(v) => setAutoScroll(v === true)}
            className="h-4 w-4 rounded border-border bg-background text-primary"
            aria-label="Enable auto-scroll"
          />
          <span className="text-xs text-muted-foreground">Auto-scroll</span>
        </label>
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto mb-2">
        {!hasItems && (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-sm text-muted-foreground">No code suggestions yet</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="p-4 space-y-3">
            {codeSuggestions.map((s, idx) => (
              <div
                key={idx}
                ref={idx === codeSuggestions.length - 1 ? lastItemRef : null}
                className="flex flex-col gap-3 pb-3 border-b border-border/40 last:border-0"
              >
                <div className="flex shrink-0">
                  {s.image_urls && s.image_urls.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2 overflow-x-auto">
                        {s.image_urls.map((url, i) =>
                          url ? (
                            <img
                              key={i}
                              src={url}
                              className="h-12 w-16 object-cover rounded-md border-2 border-blue-400 bg-muted"
                              alt={`thumb-${i}`}
                            />
                          ) : (
                            <div
                              key={i}
                              className="h-12 w-16 flex items-center justify-center rounded-md border-2 border-blue-400 bg-muted"
                            >
                              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                            </div>
                          )
                        )}
                      </div>
                      {(s.state === SuggestionState.Pending ||
                        s.state === SuggestionState.Loading) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-16 flex items-center justify-center rounded-md bg-muted">
                        <File className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {(s.state === SuggestionState.Pending ||
                        s.state === SuggestionState.Loading) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {(s.state === SuggestionState.Loading || s.state === SuggestionState.Success) && (
                    <div className="text-sm text-foreground/90 leading-relaxed">
                      <div className="text-sm">
                        <SafeMarkdown content={s.suggestion_content} />
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
            ))}
          </div>
        )}
      </div>

      {/* scroll-to-latest button removed; auto-scroll still available via toggle */}
    </Card>
  );
}

export default React.memo(CodeSuggestionsPanel);
