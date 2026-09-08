import { BookOpen, CreditCard, LogOut, Mic, Play, SettingsIcon, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MockInterviewSetupDialog } from '@/components/custom/mock-interview-setup-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import { cn } from '@/lib/utils';
import { mockSessionPrice, RunningState } from '@/types/app-state';
import type { MockInterviewSetup } from '@/types/mock-interview';
import { isMockInterviewSessionActive } from '@/types/mock-interview';

/**
 * The shortest interview the setup dialog offers, and therefore the cheapest one there is.
 *
 * Mirrored from `QUESTION_COUNTS` in `mock-interview-setup-fields.tsx` rather than imported, so
 * this card does not pull the whole form in to ask one question. A copy that drifts *up* would
 * hide the card from someone who could afford a session; one that drifts down would offer a
 * dialog in which every length is disabled - the second is the recoverable direction, and it is
 * the one a stale copy of a list whose first entry only ever shrinks would take.
 */
const SHORTEST_MOCK_QUESTION_COUNT = 3;

interface LaunchCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * One of the two ways to start. A card rather than a button because the choice between them is
 * the whole point of this screen, and a title alone does not say which one a first-time user
 * wants - the description under it does.
 *
 * The icon sits above the title rather than beside it, and the pair share a row rather than
 * stacking. Side by side each card is about half as wide, which is where a description that used
 * to be one line becomes three; taking the 40px icon out of that width is what pays for them, and
 * it is the same trade the whole screen is making - see the page's own note.
 *
 * `disabled` is a real removal from the tab order and not just a grey fill: the one case that
 * uses it - a mock interview while the live assistant runs - is refused by the main process
 * anyway, so leaving it clickable would route the user to a screen that only reports an error.
 */
function LaunchCard({ icon, title, description, onClick, disabled = false }: LaunchCardProps) {
  return (
    <Card
      role="button"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'gap-3 py-4',
        disabled
          ? 'cursor-not-allowed opacity-60 outline-none'
          : 'cursor-pointer outline-none transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50'
      )}
    >
      <CardHeader className="gap-1.5 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            {icon}
          </div>
          <CardTitle className="truncate text-sm">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * The app's front door: the two things you can start, the places you can go, and the way out.
 *
 * `/` used to redirect straight into the control console, which is dense, unlabelled and assumes
 * you already know what the app does. Everything reachable from here is named in the words a
 * candidate would use, not the ones the codebase uses.
 *
 * Both launch buttons start a session; neither implements starting one. Live hands off to
 * `/main`, which owns the whole start sequence - the microphone checks, the headphone notice, the
 * macOS permission gate and the save-history guard - and mock hands off to `/mock-interview` with
 * the setup this page's dialog collected. Duplicating either flow here is how the two would
 * drift apart.
 *
 * This is now the only place either kind of session begins. The control bar used to carry a split
 * Start button of its own, which meant two screens answering the same question and a stored
 * preference deciding which one a button meant.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState, runningState } = useAppState();
  const { config, isLoading: configLoading } = useConfigStore();
  const { logout } = useAuth();
  const { confirmDiscard } = useSaveHistoryGuard();

  // The live assistant and a mock interview are mutually exclusive - both want the microphone and
  // an ASR socket, and the main process refuses the second one. Said here rather than left to
  // that refusal, so the card names the state instead of routing the user to an error.
  const liveSessionActive = runningState !== RunningState.Idle;

  // The other half of the same exclusion. The mock card names an active live session; without
  // this the live card said nothing about an active mock one, and clicking it routed the
  // candidate to `/main` for a start `startAssistant` refuses - an error toast on a screen they
  // had no reason to be sent to. Reachable while a mock session is winding down: leaving that
  // route ends the session, and it stays active through `Stopping`/`Scoring`.
  const mockSessionActive = isMockInterviewSessionActive(appState?.mockInterview ?? null);

  // Signing out tears down the token a mock session's next request needs, and a mock session
  // deliberately leaves `runningState` on Idle - so the live check alone does not cover it.
  const anySessionActive = liveSessionActive || mockSessionActive;

  // A released client can outrun the backend deployment that adds the feature. Only an explicit
  // `false` closes the card: `null` means the probe has not answered yet, and treating that as
  // unavailable would grey the card out for the first seconds of every launch.
  const mockUnsupported = appState?.mockInterviewSupported === false;

  // The cheapest mock the setup dialog offers, so this card can say "you cannot afford any of
  // them" rather than sending the candidate into a dialog where every length is disabled.
  //
  // Only when the backend has quoted prices. Without them a mock is still metered by the minute
  // and there is nothing to check, which is what an older deployment does - so the absence must
  // never read as unaffordable.
  const shortestMockPrice = appState?.mockPricing
    ? mockSessionPrice(appState.mockPricing, SHORTEST_MOCK_QUESTION_COUNT)
    : null;
  const mockUnaffordable = shortestMockPrice !== null && (appState?.credits ?? 0) < shortestMockPrice;

  const [mockSetupOpen, setMockSetupOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // "Practise again" on the mock report has nowhere of its own to configure the next session, so
  // it comes back here with a flag rather than making the candidate find the card again. Guarded
  // per history entry and cleared by the replace, the same shape the live handoff uses on
  // `/main`: a Back to this entry then finds nothing to reopen.
  const consumedNavKey = useRef<string | null>(null);
  useEffect(() => {
    const navState = location.state as { openMockSetup?: boolean } | null;
    if (!navState?.openMockSetup) return;
    if (consumedNavKey.current === location.key) return;

    // Consumed before the check below, not after: the flag is spent either way, so that clearing
    // the router state cannot leave a stale request to reopen this dialog on a later Back.
    consumedNavKey.current = location.key;
    navigate(location.pathname, { replace: true, state: null });

    // Not reachable through the UI - every surface that sets this flag is either inside a
    // finished mock session or hidden while the assistant runs - but opening a setup dialog for
    // a session the main process would refuse is a bad enough failure to be worth one line.
    if (liveSessionActive) return;

    // The same reasoning for a backend that cannot serve the session at all. Reachable in a way
    // the live check is not: "Practise again" sits on a report the candidate is still reading
    // when the backend is rolled back under them.
    if (mockUnsupported) return;
    setMockSetupOpen(true);
    // Both guards are read at the moment the request arrives and are not triggers for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]);

  // The account's own email, not the remembered credential: `config.email` is blank whenever the
  // user declined "remember me", which would report a signed-in user as not signed in.
  const email = appState?.accountEmail || config?.email;
  const credits = appState?.credits;
  // appState starts null before the first IPC round-trip resolves, and the config arrives over a
  // second one - both need to settle before "no data" is trustworthy.
  const accountReady = !configLoading && config !== undefined && appState !== null;
  const firstName =
    appState?.interviewConfig?.fullName?.trim().split(' ')[0] || email?.split('@')[0];

  const handleStartLive = () => {
    // `/main`'s control panel runs the start sequence on arrival. Handed through router state
    // rather than started here so there is exactly one implementation of it. Already running,
    // this is just the way back to the interview - the flag would be ignored, but not sending it
    // is what keeps the card's label honest.
    if (liveSessionActive) navigate('/main');
    else navigate('/main', { state: { autoStartLive: true } });
  };

  // The dialog has already validated and shown its own headphone notice by the time this runs.
  // Starting the session itself happens on `/mock-interview`, not here, so that only one
  // `useMockInterview()` instance is ever mounted at once - starting it from this page as well
  // would leave two instances reacting to the same `Speaking` transition for the moment before
  // the route swap finishes, which is what plays the question's audio twice.
  const handleSignOut = async () => {
    // Signing out drops the interview from memory and nothing has written it to disk unless it
    // was exported, so it asks first - the same guard Clear, Start, Stop and closing the app use.
    if (!(await confirmDiscard('signout'))) return;

    setSigningOut(true);
    try {
      await logout();
    } catch (err) {
      // Read off the caught error rather than the hook's `error` state - `logout` sets it and
      // throws in the same tick, so this closure's copy is still last render's value.
      console.error('Sign out failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to sign out');
      setSigningOut(false);
      return;
    }
    // No `setSigningOut(false)` on success: signing out redirects to the login screen and this
    // page unmounts, and clearing the flag first would flash "Sign out" back for a frame.
  };

  const handleMockInterviewStart = async (setup: MockInterviewSetup) => {
    setMockSetupOpen(false);
    navigate('/mock-interview', { state: { pendingSetup: setup } });
  };

  return (
    // Centred both ways, not just horizontally. `mx-auto` alone left the column pinned to the
    // top of a window that is usually much taller than it, so the whole screen sat in the upper
    // third with an empty half below it. The inner wrapper is `min-h-full` rather than `h-full`
    // so that centring gives way to scrolling once the content is taller than the window - which
    // at the sizes below only happens well past the default zoom, and clipping the sign-out row
    // instead would be worse than a scrollbar nobody normally sees.
    //
    // **The layout is built to fit the smallest window the app allows**, which is MIN_WIDTH x
    // MIN_HEIGHT (840x600) from `main/consts.ts`, less the 36px titlebar. It did not: a single
    // narrow column of full-width rows ran about 580px against 564px of room, so the front door
    // opened on a scrollbar and a sign-out button below the fold. Nothing here was removed to
    // fix that - the screen is the same six things - they are laid out across the width the
    // window already has instead of down a column half of it wide. The two launch cards share a
    // row, the account strip carries Buy Credits on its own line rather than above one, and the
    // three navigations are one row of three. Vertical rhythm went from 8/6-step gaps to 4, and
    // the outer padding from py-10 to py-6.
    <div className="flex-1 overflow-auto">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-3xl px-6 py-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Practise against an AI interviewer, or get live help during a real call.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <LaunchCard
              icon={<Mic className="h-4 w-4" aria-hidden="true" />}
              title="Start mock interview"
              description={
                mockUnsupported
                  ? 'Not available on this server yet. Update the app, or try again later.'
                  : liveSessionActive
                    ? 'Stop the live assistant first - the two cannot share your microphone.'
                    : mockUnaffordable
                      ? `Not enough credits - the shortest mock costs ${shortestMockPrice}. Buy more to practise.`
                      : 'The AI asks, you answer out loud, and you get a scored report at the end.'
              }
              onClick={() => (mockUnaffordable ? navigate('/payment') : setMockSetupOpen(true))}
              disabled={liveSessionActive || mockUnsupported}
            />
            <LaunchCard
              icon={<Play className="h-4 w-4" aria-hidden="true" />}
              title={liveSessionActive ? 'Back to your interview' : 'Start live assistant'}
              description={
                liveSessionActive
                  ? 'Your live assistant is already running.'
                  : mockSessionActive
                    ? 'Finish the mock interview first - the two cannot share your microphone.'
                    : 'Transcribes your real interview and suggests answers as it happens.'
              }
              onClick={handleStartLive}
              disabled={!liveSessionActive && mockSessionActive}
            />
          </div>

          {/* A bordered strip rather than a Card: the same rule around the same content, without
              the 48px of vertical padding a Card carries for content that is one line tall. */}
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="truncate text-sm font-medium">
                {accountReady ? (email ?? 'Not signed in') : 'Loading...'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-sm font-medium">
                {accountReady ? (credits ?? 'Unavailable') : 'Loading...'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => navigate('/payment')}
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Buy Credits
            </Button>
          </div>

          {/* Documentation joins the other two navigations rather than sitting on a row of its
              own under them - it is the same kind of thing, and the row it used to share with
              Sign out made a destination and the way out of the app look like a pair. */}
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/account')}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Account
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/configuration')}
            >
              <SettingsIcon className="h-4 w-4" aria-hidden="true" />
              Configuration
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/documentation')}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Documentation
            </Button>
          </div>

          {/* Signing out was only ever in the titlebar menu and the command palette, which is a
              strange place for the one action that ends everything else on this screen. Refused
              while a session is running, for the same reason the titlebar menu refuses it: it
              tears down the credentials the running assistant is streaming on. */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={anySessionActive || signingOut}
              title={anySessionActive ? 'Stop the interview before signing out' : undefined}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </div>

      <MockInterviewSetupDialog
        open={mockSetupOpen}
        onOpenChange={setMockSetupOpen}
        onStart={handleMockInterviewStart}
      />
    </div>
  );
}
