import React, { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { Speaker, type Transcript } from '@/types/transcript';

import { Checkbox } from '../../ui/checkbox';

interface TranscriptionPanelProps {
  transcripts: Transcript[];
  style?: React.CSSProperties;
}

function TranscriptPanel({ transcripts, style }: TranscriptionPanelProps) {
  const { config, updateConfig } = useConfigStore();
  const username = config?.interviewConf?.username ?? '';
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(() => config?.autoScrollTranscript ?? true);
  const isStealth = useIsStealthMode();

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
    <Card className="relative flex flex-col h-full bg-card p-0 rounded-md" style={style}>
      <div className="border-b border-border p-2 shrink-0 flex items-center justify-between gap-4">
        <h3 className="font-semibold text-foreground text-xs">Transcription</h3>

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
              aria-label="Enable auto-scroll"
            />
            <span className="select-none">Auto-scroll</span>
          </label>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto mb-2">
        {transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">No transcripts yet</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {transcripts.map((item, idx) => (
              <div key={idx} className="space-y-1 pb-1 border-b border-border/50 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {item.speaker === Speaker.Self ? username : 'Interviewer'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-foreground/90 leading-relaxed text-wrap">
                  {item.text}
                </div>
              </div>
            ))}
            {/* This invisible div acts as scroll target */}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* scroll-to-bottom button removed; auto-scroll still available via toggle */}
    </Card>
  );
}

export default React.memo(TranscriptPanel);
