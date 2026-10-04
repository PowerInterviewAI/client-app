import { ArrowDown } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useT } from '@/i18n';
import { Speaker, type Transcript } from '@/types/transcript';

import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';

// Every entry is from the same session, so the date carries no information and its width is
// what would push the speaker onto a line of its own.
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

interface SpeakerRun {
  speaker: Speaker;
  key: string;
  items: Transcript[];
}

/**
 * Collapse consecutive entries from one speaker into a single run.
 *
 * An ASR final is an acoustic endpoint, not the end of a turn, so one person talking produces a
 * string of entries that used to repeat their name on every line. Grouping prints it once, and -
 * the reason this exists - gives the label a block tall enough to stay pinned to while the rest of
 * the run scrolls past it.
 */
function groupBySpeaker(transcripts: Transcript[]): SpeakerRun[] {
  const runs: SpeakerRun[] = [];

  for (const item of transcripts) {
    const current = runs[runs.length - 1];

    if (current && current.speaker === item.speaker) {
      current.items.push(item);
      continue;
    }

    runs.push({
      speaker: item.speaker,
      key: `${runs.length}-${item.timestamp}`,
      items: [item],
    });
  }

  return runs;
}

interface TranscriptPanelProps {
  transcripts: Transcript[];
  isRunning?: boolean;
}

function TranscriptPanel({ transcripts, isRunning = false }: TranscriptPanelProps) {
  const t = useT();
  const { config, updateConfig } = useConfigStore();
  const { appState } = useAppState();
  const username = appState?.interviewConfig?.fullName ?? '';
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(() => config?.autoScrollTranscript ?? true);
  const isStealth = useIsStealthMode();

  const runs = useMemo(() => groupBySpeaker(transcripts), [transcripts]);

  useEffect(() => {
    if (typeof config?.autoScrollTranscript === 'boolean') {
      setAutoScroll(config.autoScrollTranscript);
    }
  }, [config?.autoScrollTranscript]);

  // Auto-scroll when 'transcripts' changes only if autoScroll is enabled
  useEffect(() => {
    if (!autoScroll) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, autoScroll]);

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
          <h3 className="font-semibold text-foreground text-xs">{t.panels.transcription}</h3>
        </div>

        {!isStealth && (
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
              aria-label={t.panels.enableAutoScroll}
            />
            <span className="select-none">{t.panels.autoScroll}</span>
          </label>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">{t.panels.noTranscripts}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/50 px-2 py-1">
              {runs.map((run) => {
                const speaker = run.speaker === Speaker.Self ? username : t.panels.interviewer;
                return (
                  <div key={run.key} className="flex gap-2 py-1 max-w-3xl mx-auto">
                    {/* Fixed-width column so wrapped/adjacent rows keep a stable left edge
                        regardless of speaker name length; long names truncate rather than
                        pushing the text column around.

                        sticky + self-start is what keeps the name on screen for the whole run:
                        it rides the top of the scrollport until the run's last line passes, so
                        scrolling into the middle of a long answer never leaves the reader
                        without a speaker. It needs no background of its own - the gutter is a
                        column the text never enters, so nothing scrolls underneath it. */}
                    <span
                      className="sticky top-1 self-start w-20 shrink-0 truncate text-xs font-semibold text-primary"
                      title={speaker}
                    >
                      {speaker}
                    </span>

                    <div className="min-w-0 flex-1">
                      {run.items.map((item, idx) => (
                        // content-visibility skips style, layout and paint for rows scrolled out
                        // of view, which is the cost that grew with transcript length. `auto` in
                        // contain-intrinsic-size remembers each row's last rendered size, so
                        // scroll position and scrollIntoView stay accurate without measurement
                        // plumbing. Kept per row rather than per run so a long run still skips
                        // the lines that are off screen.
                        <div
                          key={idx}
                          className="flex items-baseline gap-2 [content-visibility:auto] [contain-intrinsic-size:auto_1.25rem]"
                        >
                          {/* The interviewer may be speaking Arabic or Hebrew. Without this the
                              line inherits the panel's left-to-right base direction and the
                              sentence-final punctuation lands at the wrong end of it; `auto`
                              resolves per line from what was actually said, and is a no-op for
                              every Latin-script language. */}
                          <p
                            dir="auto"
                            className="flex-1 min-w-0 text-sm text-foreground/90 leading-snug text-wrap"
                          >
                            {item.text}
                          </p>
                          <time
                            dateTime={new Date(item.timestamp).toISOString()}
                            className="text-xs text-muted-foreground tabular-nums shrink-0"
                          >
                            {timeFormat.format(item.timestamp)}
                          </time>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Kept out of the divided list, or it would take a divider of its own */}
            <div ref={endRef} />
          </>
        )}
      </div>

      {!autoScroll && (
        <Button
          size="icon-sm"
          className="absolute bottom-3 right-3 rounded-full shadow-md bg-blue-600 text-white hover:bg-blue-600/90"
          onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label={t.panels.scrollToBottom}
        >
          <ArrowDown className="size-4" />
        </Button>
      )}
    </Card>
  );
}

export default React.memo(TranscriptPanel);
