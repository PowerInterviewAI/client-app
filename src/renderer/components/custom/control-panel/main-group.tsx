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
 * The slot holds this one button in every state and enables it only while the assistant is
 * actually running. Idle, Starting and Stopping have nothing to stop - Idle because the start was
 * cancelled at the headphone notice or the permission gate, or the route was opened directly, the
 * other two because a stop is already in flight or the session has not opened yet - so the button
 * stays put and greys out rather than swapping itself for a different control. A slot that
 * changes what it does under the cursor is worse than one that is visibly unavailable.
 *
 * Fixed width rather than auto: the label changes with the running state, and an auto-width
 * primary would shift the rest of the bar sideways at the exact moment the user is watching it.
 */
export function MainGroup({ stateConfig }: MainGroupProps) {
  const { runningState } = useAppState();

  const { onClick, className, icon, label } = stateConfig;

  const isRunning = runningState === RunningState.Running;

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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Wrapped: a disabled button fires no pointer events, and without this the tooltip
            explaining *why* it is disabled would be unreachable in exactly the states that
            need it. */}
        <span className="inline-flex shrink-0">
          <Button
            onClick={handleStopClick}
            size="sm"
            className={cn(
              'h-8 w-24 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer',
              className
            )}
            disabled={!isRunning}
          >
            {icon}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label} the assistant</p>
        {isRunning ? (
          <p className="text-xs text-muted-foreground">
            Ends the session, offers to save it, and returns home
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {runningState === RunningState.Idle
              ? 'Nothing is running - start an interview from the home screen'
              : 'Available once the session is running'}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
