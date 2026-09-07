import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingPage } from '@/components/custom/loading';
import { useAppState } from '@/hooks/use-app-state';
import { useInterviewNavigationLock } from '@/hooks/use-interview-lock';
import { useMockInterview } from '@/hooks/use-mock-interview';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import useTools from '@/hooks/use-tools';
import { getElectron } from '@/lib/utils';
import {
  isMockInterviewSessionActive,
  type MockInterviewSetup,
  MockInterviewState,
} from '@/types/mock-interview';

import { ReportScreen } from './report';
import { SessionScreen } from './session';

/**
 * Mock interview: styled after the live control bar's own panels now rather than against them -
 * see `session.tsx`. It still needs no always-on-top and no taskbar/Dock hiding:
 * `shouldHideSurfaces()` only reacts to stealth and `RunningState.Running`, and a mock session
 * sets neither.
 *
 * Setup lives on the home screen, through `MockInterviewSetupDialog` - this route is reached
 * only with a setup already handed off through router state (`pendingSetup`), and its job is to
 * run the session and show the report, nothing else. Idle with no setup to start is not a state
 * this route presents on its own: it sends the candidate home, which is where starting - and the
 * dialog that used to be a page here - actually is. "Practise again" is what reaches that
 * fallback most often, since clearing a finished session back to Idle is the whole of what it
 * does.
 *
 * Navigating away mid-session is refused outright - see `useInterviewNavigationLock`. Ending the
 * interview is what the End control on the session screen does, and it leaves through the report
 * rather than past it. Closing the app is covered separately by the window-close guard, which is
 * what handles Alt+F4, the taskbar button and Cmd+Q.
 */
export default function MockInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState } = useAppState();
  const { session, startSession, endSession, answerFinished, answerReady, clear } =
    useMockInterview();
  const { exportMockReport } = useTools();
  const { confirmDiscard } = useSaveHistoryGuard();
  const redirectedToLogin = useRef(false);
  const endedOnUnmount = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // The control bar's setup dialog has already collected and validated a setup and shown its own
  // headphone notice by the time it navigates here - it hands the result off through router state
  // rather than calling `startSession` itself, so only one `useMockInterview()` instance is ever
  // mounted while the session starts (see the dialog's own comment on this).
  const pendingSetup = (location.state as { pendingSetup?: MockInterviewSetup } | null)
    ?.pendingSetup;
  const autoStartRequested = useRef(false);
  // Tracks the request itself rather than being derived from `pendingSetup`, which stays in the
  // router state for the whole life of this route. Deriving it stranded "Practise again": that
  // clears the session back to Idle, and a handed-off setup plus a one-shot request flag were
  // both still true, so the render sat on this loading screen forever waiting for a start that
  // had already happened and would never happen again.
  //
  // Seeded from `pendingSetup` rather than starting `false` unconditionally, and that is no
  // longer cosmetic now that the Idle fallback below redirects. React fires a child's mount
  // effect before this component's own later ones, so a first render that reached the Idle
  // branch here - true on every fresh navigation, since `session` has not caught up to the
  // broadcast yet - would have mounted `<Navigate>` and sent the candidate straight back to
  // /main before the effect that starts the session ever ran. Seeding this true when a setup is
  // waiting keeps that render on the loading screen instead.
  const [autoStarting, setAutoStarting] = useState(() => Boolean(pendingSetup));

  useEffect(() => {
    if (!pendingSetup || autoStartRequested.current) return;
    if (sessionRef.current && sessionRef.current.state !== MockInterviewState.Idle) return;
    autoStartRequested.current = true;
    setAutoStarting(true);
    startSession(pendingSetup).catch((error) => {
      console.error('Failed to auto-start mock interview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start the mock interview');
      setAutoStarting(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSetup]);

  // Cleared when the session actually moves off Idle, not when the IPC call resolves: the state
  // broadcast and that call's own reply are separate messages, so clearing on the reply can leave
  // a frame with no start in flight and the state still Idle - which renders the very setup form
  // the dialog just stood in for. A start that fails clears it in its own catch instead, and
  // `start()` in main throws rather than landing back on Idle silently, so neither path hangs.
  useEffect(() => {
    if (!autoStarting) return;
    if (session && session.state !== MockInterviewState.Idle) setAutoStarting(false);
  }, [autoStarting, session]);

  useEffect(() => {
    getElectron()?.setStealth(false);
  }, []);

  useEffect(() => {
    if (appState?.isLoggedIn !== false || redirectedToLogin.current) return;
    redirectedToLogin.current = true;
    navigate('/auth/login', { replace: true });
  }, [appState?.isLoggedIn, navigate]);

  /**
   * Leaving mid-session is refused outright rather than confirmed.
   *
   * It used to raise an "end and leave?" dialog, which made ending the interview a side effect of
   * navigating - and the ways to navigate are exactly the kind of list that grows quietly: Home
   * and the two settings pages in the titlebar menu, the same entries in the command palette, and
   * the palette's own two Start actions. Every one of them was a click away from scoring a
   * half-finished interview. Ending it is now only what the End control on the session screen
   * does, and that leaves through the report rather than past it.
   *
   * The unmount fallback below stays as a belt for a route that is genuinely torn down (a reload,
   * a sign-out) rather than navigated away from.
   */
  useInterviewNavigationLock(isMockInterviewSessionActive(session));

  // Ends an in-progress session if this page unmounts without going through the report screen -
  // see the module docstring for why this is a fallback rather than the intended UX. Reads
  // `sessionRef` rather than `session` directly: this effect only runs once (mount/unmount), so a
  // cleanup closing over `session` would see whatever it was at mount - almost always `null`,
  // before a session has even started - never the live state at the moment the page actually
  // unmounts. The ref is kept current on every render instead.
  useEffect(() => {
    return () => {
      if (endedOnUnmount.current) return;
      const state = sessionRef.current?.state;
      if (state && state !== MockInterviewState.Idle && state !== MockInterviewState.Finished) {
        endedOnUnmount.current = true;
        void endSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (appState?.isLoggedIn === false) return <LoadingPage disclaimer="Redirecting to login…" />;
  if (appState?.isLoggedIn === null || !appState) return <LoadingPage disclaimer="Loading…" />;

  const state = session?.state ?? MockInterviewState.Idle;

  if (state === MockInterviewState.Finished) {
    return (
      // Both exits ask first, and each names what it is about to do rather than sharing the
      // live assistant's "clear" wording - see save-history-dialog.tsx. They are the only two
      // paths that destroy a finished report from inside the app, and the same content is
      // guarded on the window close and in front of an update install, so leaving these two
      // unguarded meant the protection depended on which way the user happened to leave.
      //
      // A report that has already been exported is not asked about at all: `confirmDiscard`
      // reads `hasMockContent`, which main drops once the session has been written to a file.
      <ReportScreen
        session={session!}
        onExport={(format) => exportMockReport(format)}
        onPracticeAgain={async () => {
          if (!(await confirmDiscard('mock-again'))) return;
          await clear();
          // Setup has nowhere to happen on this route - back to the home screen, with a flag it
          // reads once to reopen the setup dialog itself, so "practise again" costs one click
          // rather than the two it would if this just landed on the launch cards.
          navigate('/', { state: { openMockSetup: true } });
        }}
        onDone={async () => {
          if (!(await confirmDiscard('mock-done'))) return;
          await clear();
          navigate('/');
        }}
      />
    );
  }

  if (state !== MockInterviewState.Idle && session) {
    return (
      <SessionScreen
        session={session}
        onDone={answerFinished}
        onEnd={endSession}
        onAnswerReady={answerReady}
      />
    );
  }

  // The handed-off start is still in flight: this waits for the state to move rather than
  // rendering anything of its own. A start that fails clears the flag in its own `catch`, so the
  // branch below is still reachable rather than this being a dead end.
  if (autoStarting) {
    return <LoadingPage disclaimer="Starting mock interview…" />;
  }

  // Idle with nothing pending - a start that just failed (the toast already said why), or this
  // route opened directly with no handoff at all. Either way, starting lives on the home screen.
  return <Navigate to="/" replace />;
}
