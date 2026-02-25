import CreditsDisplay from '@/components/custom/credits-display';
import { HOTKEYS } from '@/lib/hotkeys';
import { RunningState } from '@/types/app-state';

import { RunningIndicator } from './running-indicator';

type Props = {
  runningState: RunningState;
  credits: number;
};

export default function StatusPanel({ runningState, credits }: Props) {
  // calculate and formatting handled by CreditsDisplay component

  return (
    <div id="status-panel" className="flex items-center justify-between text-muted-foreground p-1">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <RunningIndicator runningState={runningState} />
          <CreditsDisplay credits={credits} className="ml-2" />
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
