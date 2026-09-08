import { Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

interface MainGroupProps {
  /** Ends the session. Only ever reachable while the assistant is actually running. */
  onStop: () => void | Promise<void>;
}

/**
 * Stop - the one control in this slot, and the only one on the bar carrying a visible label. It
 * is the most consequential action on this screen and it changes what every other control means,
 * so it gets the row's whole contrast budget rather than sharing a grey pill with the settings.
 *
 * There is no Start here, and no Home. Starting a session is something you decide on the home
 * screen, where both kinds are named and described; leaving is what Stop already does, since it
 * ends the session and returns there. A Home button beside it was a second way off this screen
 * that did *not* end the session - and the navigation lock refuses it for the whole of an
 * interview anyway, so it was a live button on an idle console and a dead one everywhere else.
 *
 * **The label does not change with the running state.** It says Stop in every state and is
 * enabled in exactly one of them. Idle, Starting and Stopping have nothing to stop - Idle because
 * the start was cancelled at the headphone notice or the permission gate, or the route was opened
 * directly, the other two because a stop is already in flight or the session has not opened yet.
 * Relabelling it "Starting" and "Stopping" made the primary slot read as a progress indicator
 * that had swapped itself in for the control, when what is actually true is simpler and is what
 * the disabled state already says: this is Stop, and it is not available yet. The running state
 * is reported by the indicator and the tooltip, which are the surfaces for it.
 *
 * The width stays fixed at `w-24`. It used to be fixed because the label moved and an auto-width
 * primary would shift the rest of the bar sideways mid-session; now it is fixed because this is
 * the one action on the row and a button sized to the four letters of its own label would not
 * read as one.
 */
export function MainGroup({ onStop }: MainGroupProps) {
  const { runningState } = useAppState();

  const isRunning = runningState === RunningState.Running;

  const handleStopClick = async () => {
    try {
      // The handler may be sync or return a Promise. Awaited when it is one, because stopping
      // continues after the click - it asks about saving the interview and then leaves this
      // screen - and an unawaited rejection there would be silent.
      await onStop();
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
            onClick={() => void handleStopClick()}
            size="sm"
            className={cn(
              'h-8 w-24 gap-1.5 rounded-lg bg-destructive text-xs font-semibold cursor-pointer hover:bg-destructive/90',
              // The one thing that does follow the state, and it is not the label: a running
              // session is the one case where this button is asking to be noticed.
              isRunning && 'animate-pulse'
            )}
            disabled={!isRunning}
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Stop the assistant</p>
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
