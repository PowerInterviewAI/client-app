import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { RunningState } from '@/types/app-state';

interface MainGroupProps {
  stateConfig: {
    onClick: () => void;
    className: string;
    icon: React.ReactNode;
    label: string;
  };
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function MainGroup({ stateConfig, getDisabled }: MainGroupProps) {
  const { runningState } = useAppState();

  const { onClick, className, icon, label } = stateConfig;

  const handleStartStopClick = async () => {
    try {
      // Call the provided click handler. It may be sync or return a Promise.
      // eslint-disable-next-line
      const res = onClick() as any;

      // If we're currently running, the user is stopping — wait for any async stop
      // action to complete before asking about export.
      if (runningState === RunningState.Running) {
        if (res && typeof res.then === 'function') {
          try {
            await res;
          } catch (e) {
            // ignore errors from the stop action here; still show export prompt
            console.error('Error awaiting stop action', e);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleStartStopClick}
          size="sm"
          className={`h-8 w-16 text-xs font-medium rounded-full cursor-pointer ${className}`}
          disabled={getDisabled(runningState, false)}
        >
          {icon}
          <span hidden>{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start/Stop Assistant - {label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
