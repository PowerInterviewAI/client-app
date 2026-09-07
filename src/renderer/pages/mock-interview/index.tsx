import { useEffect, useRef, useState } from 'react';
import { Navigate, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingPage } from '@/components/custom/loading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppState } from '@/hooks/use-app-state';
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
 * Leaving this route mid-session ends it outright, scoring whatever was answered and dropping
 * the rest, so it asks first - through `useBlocker` rather than a guard on each way out. The
 * ways out are the kind of list that grows without anyone remembering it exists: Home and the
 * two settings pages in the titlebar menu, the same entries in the command palette, and the
 * palette's own two Start actions, every one of them a single click. Closing the app is covered
 * separately by the window-close guard, which is what handles Alt+F4, the taskbar button and
 * Cmd+Q.
 */
export default function MockInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState } = useAppState();
  const {
    session,
    startSession,
    endSession,
    skipQuestion,
    answerFinished,
    repeatQuestion,
    answerReady,
    clear,
  } =
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
   * Asks before a navigation that would end the interview.
   *
   * The unmount fallback below scores whatever has been answered and drops the rest, which is the
   * right behaviour for a route that has genuinely been left - and the wrong thing to do without
   * asking, now that there are several one-click ways to leave: Home and the two settings pages
   * in the titlebar menu, the same entries in the command palette, and the palette's own two
   * Start actions. Every one of them is a single click away from ending a live interview.
   *
   * A blocker rather than a guard on each of those, because the list is exactly the kind that
   * grows without anyone remembering it exists: this catches the next one too.
   *
   * Signing out is deliberately not blocked. `isLoggedIn` going false is main saying the session
   * is over - an expired token, most often - and there is nothing to stay for.
   */
  const sessionActive = isMockInterviewSessionActive(session);
  const signedOut = appState?.isLoggedIn === false;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sessionActive && !signedOut && currentLocation.pathname !== nextLocation.pathname
  );

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

  const leaveConfirm = blocker.state === 'blocked' && (
    <Dialog
      open
      // Esc and the overlay mean "not now", which here is staying on the interview.
      onOpenChange={(next) => {
        if (!next) blocker.reset();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>End this mock interview?</DialogTitle>
          <DialogDescription>
            Leaving scores what you have answered so far and drops the rest. The report is not
            saved anywhere unless you export it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button className="flex-1" size="sm" variant="outline" onClick={() => blocker.reset()}>
            Stay
          </Button>
          <Button
            className="flex-1"
            size="sm"
            variant="destructive"
            onClick={() => blocker.proceed?.()}
          >
            End and leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (appState?.isLoggedIn === false) return <LoadingPage disclaimer="Redirecting to login…" />;
  if (appState?.isLoggedIn === null || !appState) return <LoadingPage disclaimer="Loading…" />;

  const state = session?.state ?? MockInterviewState.Idle;

  if (state === MockInterviewState.Finished) {
    return (
      // Both exits ask first. They are the only two paths that destroy a finished report from
      // inside the app, and the same content is guarded on the window close and in front of an
      // update install - so leaving these two unguarded meant the protection depended on which
      // way the user happened to leave.
      <ReportScreen
        session={session!}
        onExport={(format) => exportMockReport(format)}
        onPracticeAgain={async () => {
          if (!(await confirmDiscard('clear'))) return;
          await clear();
          // Setup has nowhere to happen on this route - back to the home screen, with a flag it
          // reads once to reopen the setup dialog itself, so "practise again" costs one click
          // rather than the two it would if this just landed on the launch cards.
          navigate('/', { state: { openMockSetup: true } });
        }}
        onDone={async () => {
          if (!(await confirmDiscard('clear'))) return;
          await clear();
          navigate('/');
        }}
      />
    );
  }

  if (state !== MockInterviewState.Idle && session) {
    return (
      <>
        <SessionScreen
          session={session}
          onSkip={skipQuestion}
          onDone={answerFinished}
          onRepeat={repeatQuestion}
          onEnd={endSession}
          onAnswerReady={answerReady}
        />
        {/* Rendered here and nowhere else: the blocker only blocks while a session is active,
            which is exactly the branch this is. */}
        {leaveConfirm}
      </>
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
