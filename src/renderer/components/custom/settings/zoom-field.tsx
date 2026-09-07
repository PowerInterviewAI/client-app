import { Minus, Plus, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';

/**
 * Mirrors `ZOOM_MIN_FACTOR` / `ZOOM_MAX_FACTOR` / `ZOOM_STEP` in the main process
 * (`src/main/consts.ts`), as percentages because that is what this control shows and what the
 * `zoom:level-changed` broadcast carries. Main clamps whatever it is sent regardless - these
 * exist so the buttons disable at the ends rather than looking broken there.
 */
const MIN_PERCENT = 50;
const MAX_PERCENT = 300;
const STEP_PERCENT = 10;

/**
 * Interface zoom, on the configuration page and in the first-run wizard.
 *
 * Worth asking about during setup rather than leaving to a hotkey nobody has read yet: this
 * window spends an interview overlaying a video call, so it is small on purpose, and the size
 * that makes a suggestion readable at a glance is a property of the person and their screen. A
 * candidate squinting at the panel mid-question is not going to go looking for a zoom control.
 *
 * Reads the live factor from the window rather than the stored one, and follows the same
 * `zoom:level-changed` broadcast the control bar's `ZoomControl` does - so the hotkeys, that
 * control and this one can never disagree about what the current level is.
 */
export function ZoomField() {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.zoom) return;

    api.zoom
      .getFactor()
      .then((factor) => setPercent(Math.round(factor * 100)))
      .catch(() => setPercent(100));

    // Main is the source of truth: it broadcasts after every change, including the ones this
    // component did not make (the hotkeys, the control bar, a zoom restored on load).
    return api.zoom.onChange((next) => setPercent(next));
  }, []);

  const apply = (next: number) => {
    // Optimistic, then corrected by the broadcast main sends back. Without it the readout lags a
    // click behind on a slow round-trip, which on a control whose whole job is a number reads as
    // the button not having worked.
    setPercent(next);
    void window.electronAPI?.zoom.setFactor(next / 100);
  };

  const current = percent ?? 100;
  const ready = percent !== null;

  return (
    <div className="space-y-2">
      <Label id="zoom-field-label">Interface size</Label>
      <div
        className="flex items-center gap-2"
        role="group"
        aria-labelledby="zoom-field-label"
        aria-describedby="zoom-field-value"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Smaller"
          disabled={!ready || current <= MIN_PERCENT}
          onClick={() => apply(Math.max(MIN_PERCENT, current - STEP_PERCENT))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p
          id="zoom-field-value"
          className="w-16 text-center text-sm font-medium tabular-nums"
          role="status"
        >
          {ready ? `${current}%` : '—'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Larger"
          disabled={!ready || current >= MAX_PERCENT}
          onClick={() => apply(Math.min(MAX_PERCENT, current + STEP_PERCENT))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-1"
          disabled={!ready || current === 100}
          onClick={() => apply(100)}
        >
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Scales the whole app. The interview window is small on purpose - this is how you make the
        suggestions readable at a glance. Also on{' '}
        {HOTKEYS[Hotkey.ZoomInOutReset].combo}.
      </p>
    </div>
  );
}
