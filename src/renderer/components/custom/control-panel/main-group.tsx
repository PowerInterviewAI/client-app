import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
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

/**
 * Stop - the one filled control on the bar, and the only one carrying a visible label. It is the
 * most consequential action on this screen and it changes what every other control means, so it
 * gets the row's whole contrast budget rather than sharing a grey pill with the settings.
 *
 * There is no Start here any more. Starting a session is something you decide on the home screen,
 * where both kinds are named and described; this screen is the live assistant itself, and you
 * arrive on it with a session already coming up. A Start button here was a third way to do the
 * same thing, with its own split-button menu and its own memory of which mode you last used, all
 * to answer a question the home screen now asks outright.
 *
 * Idle is therefore a transient state on this route rather than its resting one - the start was
 * cancelled at the headphone notice or the permission gate, or the route was opened directly.
 * The slot holds a way back to where starting happens rather than going empty, because an idle
 * console with nothing in the primary position is a dead end.
 *
 * Fixed width rather than auto: the label changes with the running state, and an auto-width
 * primary would shift the rest of the bar sideways at the exact moment the user is watching it.
 */
export function MainGroup({ stateConfig, getDisabled }: MainGroupProps) {
  const navigate = useNavigate();
  const { runningState } = useAppState();

  const { onClick, className, icon, label } = stateConfig;

  const handleStopClick = async () => {
    try {
      // The handler may be sync or return a Promise. Awaited when it is one, because stopping
      // continues after the click - it asks about saving the interview and then leaves this
      // screen - and an unawaited rejection there would be silent.
      const result = onClick() as unknown;
      if (result && typeof (result as Promise<void>).then === 'function') {
        await result;
      }
    } catch (err) {
      console.error('Stop action failed', err);
    }
  };

  if (runningState === RunningState.Idle) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => navigate('/')}
            size="sm"
            variant="outline"
            className="h-8 w-24 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Nothing is running</p>
          <p className="text-xs text-muted-foreground">Start an interview from the home screen</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleStopClick}
          size="sm"
          className={cn('h-8 w-24 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer', className)}
          disabled={getDisabled(runningState, false)}
        >
          {icon}
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label} the assistant</p>
        {runningState === RunningState.Running && (
          <p className="text-xs text-muted-foreground">
            Ends the session, offers to save it, and returns home
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
