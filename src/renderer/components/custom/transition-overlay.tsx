import { Loader } from 'lucide-react';

import { useAppState } from '@/hooks/use-app-state';
import { RunningState } from '@/types/app-state';

export function TransitionOverlay() {
  const { appState } = useAppState();

  if (!appState) return null;

  const { runningState } = appState;
  if (runningState !== RunningState.Starting && runningState !== RunningState.Stopping) return null;

  const message = runningState === RunningState.Starting ? 'Starting...' : 'Stopping...';

  return (
    <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
