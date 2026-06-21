import { useAppState } from '@/hooks/use-app-state';
import { RunningState } from '@/types/app-state';

export function TransitionOverlay() {
  const { appState } = useAppState();

  if (!appState) return null;

  const { runningState } = appState;
  if (runningState !== RunningState.Starting && runningState !== RunningState.Stopping) return null;

  const message = runningState === RunningState.Starting ? 'Starting...' : 'Stopping...';

  return (
    <div className="fixed inset-0 top-9 z-9998 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
