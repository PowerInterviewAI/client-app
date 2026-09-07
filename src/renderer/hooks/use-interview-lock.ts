import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { create } from 'zustand';

import { RunningState } from '@/types/app-state';
import { isMockInterviewSessionActive } from '@/types/mock-interview';

import { useAppState } from './use-app-state';

/**
 * Set while the app is deliberately ending a session and leaving the screen it ran on.
 *
 * The lock below reads `runningState`, which lives in the main process and reaches the renderer
 * over a coalesced broadcast. `stopAssistant` writes `Idle` and does not await it, so
 * `useEndLiveSession` can reach its `navigate('/')` while this renderer still believes the session
 * is running - and the lock would then refuse the one navigation that is supposed to happen,
 * leaving the candidate on a console whose Stop button has already been used.
 *
 * A flag rather than a wait on the broadcast: what makes this navigation legitimate is that the
 * app itself asked for it, which is knowable here and now, whereas "has main told us yet" is a
 * race that would only be won most of the time.
 *
 * Cleared by the lock itself - when the guarded route unmounts, which is the exit having
 * succeeded, and whenever a session becomes active again, so a failed exit cannot leave the next
 * interview unguarded.
 */
const useInterviewExit = create<{ exiting: boolean; begin: () => void; clear: () => void }>(
  (set) => ({
    exiting: false,
    begin: () => set({ exiting: true }),
    clear: () => set({ exiting: false }),
  })
);

/** Announce that the app is ending the session and leaving - see `useInterviewExit`. */
export function beginInterviewExit(): void {
  useInterviewExit.getState().begin();
}

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
  const exiting = useInterviewExit((s) => s.exiting);

  // Cleared on unmount - the exit having worked - and again whenever a session becomes active, so
  // an exit that never navigated cannot leave the next interview unguarded. Both directions of
  // the `active` change run the cleanup first, which is harmless: `active` false already answers
  // the predicate on its own.
  useEffect(() => {
    if (active) useInterviewExit.getState().clear();
    return () => useInterviewExit.getState().clear();
  }, [active]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && !exiting && !signedOut && currentLocation.pathname !== nextLocation.pathname
  );

  // Reset in an effect rather than from the predicate: the predicate runs during the router's own
  // update and calling `reset()` there re-enters it. A blocked navigation leaves the history entry
  // where it was, so resetting is the whole of what "refuse it" means here.
  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);
}
