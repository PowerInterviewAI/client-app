import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import { RunningIndicator } from './running-indicator';

type Props = {
  runningState: RunningState;
  credits: number;
};

export default function StatusPanel({ runningState, credits }: Props) {
  const availableMinutes = Math.floor(credits / CREDITS_PER_MINUTE);
  const availableTime =
    availableMinutes <= 0
      ? credits > 0
        ? 'Less than 1 min'
        : 'No credits left'
      : `${availableMinutes.toLocaleString()} min${availableMinutes > 1 ? 's' : ''}`;

  return (
    <div id="status-panel" className="flex items-center justify-between text-muted-foreground p-1">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <RunningIndicator runningState={runningState} />
          <div
            className={cn(
              'text-xs font-bold ml-2',
              availableMinutes >= 5
                ? 'text-muted-foreground'
                : availableMinutes >= 1
                  ? 'text-yellow-600 animate-pulse'
                  : 'text-destructive animate-pulse'
            )}
          >
            {credits.toLocaleString()} credits ({availableTime})
          </div>
        </div>
        <div className="hidden sm:flex gap-x-2 gap-y-1 flex-wrap">
          {HOTKEYS.map(([k, d]) => (
            <div key={String(k)} className="flex items-center gap-1">
              <div className="px-1 py-0.5 rounded bg-muted text-[11px] font-semibold">{k}</div>
              <div className="text-[11px] font-semibold text-foreground">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
