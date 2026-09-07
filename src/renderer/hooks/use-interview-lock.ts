import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

import { RunningState } from '@/types/app-state';
import { isMockInterviewSessionActive } from '@/types/mock-interview';

import { useAppState } from './use-app-state';

/**
 * Whether an interview is under way, in the sense that leaving the screen would end it.
 *
 * Both kinds count and neither can be read off the other. The live assistant carries its state on
 * `runningState`; a mock session deliberately leaves that on `Idle` - it hides no window surfaces
 * and holds no loopback socket - so a check on `runningState` alone waved every mock session
 * through. `isMockInterviewSessionActive` excludes `Finished`, so the report screen is not locked:
 * by then the microphone and the socket are already released and the two exits from it are the
 * only way forward.
 *
 * One hook rather than the copy of this expression that had accumulated in the titlebar menu, the
 * command palette, the home screen and both pages - they were already three subtly different
 * conditions, and the next surface to need it would have been a fourth.
 */
export function useInterviewLock(): { locked: boolean; liveActive: boolean; mockActive: boolean } {
  const { appState, runningState } = useAppState();

  const liveActive = runningState !== RunningState.Idle;
  const mockActive = isMockInterviewSessionActive(appState?.mockInterview ?? null);

  return { locked: liveActive || mockActive, liveActive, mockActive };
}

/**
 * Refuse every navigation off the current route while an interview is running.
 *
 * A hard block, not a confirmation. Leaving `/main` or `/mock-interview` mid-interview is not a
 * choice worth offering: the live assistant would keep streaming behind a screen that no longer
 * shows it, and a mock session ends outright, scoring whatever was answered and dropping the
 * rest. Both have a control on the screen that ends the session properly and *then* leaves, which
 * is the one route out this leaves standing - the block only sees navigations raised while the
 * session is still active, and those controls navigate after it is not.
 *
 * `useBlocker` rather than a guard on each way out, for the reason the mock route already gave:
 * the list of one-click exits (the titlebar menu, the command palette's Go-to group and its two
 * Start actions) is the kind that grows without anyone remembering this exists, and a blocker
 * catches the next one too. The surfaces are disabled as well, so the block is the backstop
 * rather than the user-facing story - a disabled menu item says why, a silently refused
 * navigation does not.
 *
 * Signing out is deliberately not blocked. `isLoggedIn` going false is main saying the session is
 * already over - an expired token, most often - and there is nothing left to stay for.
 */
export function useInterviewNavigationLock(active: boolean): void {
  const { appState } = useAppState();
  const signedOut = appState?.isLoggedIn === false;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && !signedOut && currentLocation.pathname !== nextLocation.pathname
  );

  // Reset in an effect rather than from the predicate: the predicate runs during the router's own
  // update and calling `reset()` there re-enters it. A blocked navigation leaves the history entry
  // where it was, so resetting is the whole of what "refuse it" means here.
  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);
}
