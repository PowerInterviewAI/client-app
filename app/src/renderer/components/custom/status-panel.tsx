import { Keyboard } from 'lucide-react';

import CreditsDisplay from '@/components/custom/credits-display';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Hotkey, HOTKEY_GROUPS, HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';
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
      <RunningIndicator runningState={runningState} />
      <CreditsDisplay credits={credits} className="ml-2" />
      <div className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-6 flex items-center justify-center rounded hover:bg-muted text-xs font-medium gap-1 px-2"
            aria-label="Hotkeys"
            title="Show keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" /> Show Hotkeys
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="w-2xl rounded-md p-2">
          <div className="space-y-2">
            {HOTKEY_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="text-[12px] font-semibold text-background mb-1 uppercase">
                  {group.label}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {group.keys.map((hk) => {
                    const info = HOTKEYS[hk];
                    return (
                      <div key={hk} className="flex items-center gap-1">
                        <div
                          className={cn(
                            'px-1 py-0.5 rounded text-[11px] font-semibold',
                            hk === Hotkey.StopAll
                              ? 'bg-destructive/80 text-destructive-foreground'
                              : hk === Hotkey.ToggleStealth
                                ? 'bg-primary/80 text-primary-foreground'
                                : 'bg-muted text-foreground'
                          )}
                        >
                          {info.combo}
                        </div>
                        <div className="text-[11px] font-semibold text-background">
                          {info.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
