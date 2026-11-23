import { useEffect, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useMicLevel } from '@/hooks/use-mic-level';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { liveTranscriptionService } from '@/services/live-transcription.service';
import { RunningState } from '@/types/app-state';

const BAR_COUNT = 4;
const POLL_MS = 1000;

/**
 * Says, at a glance, that the session can hear: a small live microphone meter and whether the
 * transcription sockets are up. Without it a dead microphone or a dropped connection is invisible
 * until answers stop appearing - which is the one moment a candidate cannot afford to debug.
 *
 * Reads the service by polling rather than subscribing: the service has no events for either
 * value, and adding them would mean touching the socket lifecycle the language and device switches
 * depend on. Once a second is plenty for a connection status. The stream is polled too, because a
 * mid-session device change swaps it.
 *
 * The meter writes bar heights to the DOM from its own animation frame, the same way
 * `MicLevelMeter` does, so the control bar does not re-render at frame rate.
 */
export function LiveSignal() {
  const t = useT();
  const { runningState } = useAppState();
  const running = runningState === RunningState.Running;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!running) {
      setStream(null);
      setConnected(true);
      return;
    }
    const poll = () => {
      setStream(liveTranscriptionService.getMicStream());
      setConnected(liveTranscriptionService.isConnected());
    };
    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const levelRef = useMicLevel(running ? stream : null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      // Amplified like MicLevelMeter: ordinary speech sits well under a tenth of full scale.
      const level = Math.min(1, levelRef.current * 4);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        // Each bar lights at a higher threshold, so the meter reads as a level, not a pulse.
        const threshold = (i + 0.5) / BAR_COUNT;
        const on = level >= threshold * 0.8;
        bar.style.opacity = on ? '1' : '0.25';
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, levelRef]);

  if (!running) return null;

  const label = connected ? t.controlPanel.signal.listening : t.controlPanel.signal.reconnecting;
  const hint = connected
    ? t.controlPanel.signal.listeningHint
    : t.controlPanel.signal.reconnectingHint;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="status"
          aria-label={`${label}. ${hint}`}
          className={cn(
            'flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium',
            connected
              ? 'border-border text-muted-foreground'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              connected ? 'bg-emerald-500' : 'animate-pulse bg-destructive'
            )}
          />
          {/* The bar is full at the 840px minimum width, so "Listening" - the state nobody needs
              to read - is dropped there and the dot and meter carry it, with the tooltip and the
              aria-label holding the words. "Reconnecting" always shows: it is the one to notice. */}
          <span className={cn('max-w-28 truncate', connected && 'hidden min-[1000px]:inline')}>
            {label}
          </span>
          {connected && (
            <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
              {Array.from({ length: BAR_COUNT }, (_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    barsRef.current[i] = el;
                  }}
                  className="w-[3px] rounded-full bg-primary opacity-25 transition-opacity duration-75"
                  style={{ height: `${40 + i * 20}%` }}
                />
              ))}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
