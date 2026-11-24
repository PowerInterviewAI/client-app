import { ArrowRight, Clock, Crown, Mic, Radio, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AmbientBackground } from '@/components/custom/ambient-background';
import ContextReminderDialog from '@/components/custom/context-reminder-dialog';
import { MockInterviewSetupDialog } from '@/components/custom/mock-interview-setup-dialog';
import { useAppState } from '@/hooks/use-app-state';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';
import { useConfigStore } from '@/hooks/use-config-store';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { isMac } from '@/lib/consts';
import { canStartSession } from '@/lib/credit-gate';
import {
  freeTimeLabel,
  isSubscriptionActive,
  planKey,
  subscriptionOf,
  type SubscriptionSummary,
} from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';
import type { MockInterviewSetup } from '@/types/mock-interview';
import { isMockInterviewSessionActive } from '@/types/mock-interview';

interface LaunchCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  /** The recommended path gets the accent treatment; the other stays quiet beside it. */
  emphasis?: boolean;
}

/**
 * One of the two ways to start. A card rather than a button because the choice between them is
 * the whole point of this screen, and a title alone does not say which one a first-time user
 * wants - the description under it does.
 *
 * `disabled` is a real removal from the tab order and not just a grey fill: the one case that
 * uses it - a mock interview while the live assistant runs - is refused by the main process
 * anyway, so leaving it clickable would route the user to a screen that only reports an error.
 */
function LaunchCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  emphasis = false,
}: LaunchCardProps) {
  return (
    <div
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
        'group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border p-5 outline-none transition-all duration-200',
        emphasis
          ? 'border-primary/30 bg-gradient-to-br from-primary/[0.16] via-card/75 to-card/75 backdrop-blur-xl'
          : 'bg-card/75 backdrop-blur-xl',
        disabled
          ? 'cursor-not-allowed opacity-55'
          : cn(
              'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
              'focus-visible:ring-[3px] focus-visible:ring-ring/50',
              emphasis ? 'hover:border-primary/60' : 'hover:border-foreground/20'
            )
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          emphasis
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'bg-secondary text-foreground ring-1 ring-border'
        )}
      >
        {icon}
      </div>
      {/* Not a heading: the card is a button, whose content is presentational, so a heading
          inside it is invalid and is not exposed as one anyway. The title and description are
          read as the button's name. */}
      <p className="mt-4 text-base font-semibold tracking-tight">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      {!disabled && (
        <ArrowRight
          aria-hidden="true"
          className={cn(
            'absolute right-5 top-5 h-4 w-4 transition-all duration-200',
            '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
            'group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
            emphasis ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      )}
    </div>
  );
}

/**
 * The app's front door: the two things you can start, and the plan that pays for them.
 *
 * Account, Configuration, Documentation and signing out live on the navigation rail beside this
 * screen, so what is left here is only the choice it exists for.
 *
 * Both launch cards start a session; neither implements starting one. Live hands off to `/main`,
 * which owns the whole start sequence - the microphone checks, the headphone notice, the macOS
 * permission gate and the save-history guard - and mock hands off to `/mock-interview` with the
 * setup this page's dialog collected. Duplicating either flow here is how the two would drift
 * apart.
 */
export default function HomePage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { appState, runningState } = useAppState();
  const { config, isLoading: configLoading } = useConfigStore();
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  // The live assistant and a mock interview are mutually exclusive - both want the microphone and
  // an ASR socket, and the main process refuses the second one. Said here rather than left to
  // that refusal, so the card names the state instead of routing the user to an error.
  const liveSessionActive = runningState !== RunningState.Idle;

  // The other half of the same exclusion. Reachable while a mock session is winding down: leaving
  // that route ends the session, and it stays active through `Stopping`/`Scoring`.
  const mockSessionActive = isMockInterviewSessionActive(appState?.mockInterview ?? null);

  // A released client can outrun the backend deployment that adds the feature. Only an explicit
  // `false` closes the card: `null` means the probe has not answered yet, and treating that as
  // unavailable would grey the card out for the first seconds of every launch.
  const mockUnsupported = appState?.mockInterviewSupported === false;

  // One rule decides whether either card may start a session: subscribed, or at least a minute of
  // the free hour left. A card that cannot start says so and goes to the subscription page instead
  // of into a start that would be refused.
  const creditsTooLow = !canStartSession(
    appState?.credits,
    appState?.creditsPerMinute,
    appState?.subscribed
  );

  const [mockSetupOpen, setMockSetupOpen] = useState(false);
  const [liveContextOpen, setLiveContextOpen] = useState(false);

  // "Practise again" on the mock report has nowhere of its own to configure the next session, so
  // it comes back here with a flag rather than making the candidate find the card again. Guarded
  // per history entry and cleared by the replace, the same shape the live handoff uses on
  // `/main`: a Back to this entry then finds nothing to reopen.
  const consumedNavKey = useRef<string | null>(null);
  useEffect(() => {
    const navState = location.state as { openMockSetup?: boolean; openLiveStart?: boolean } | null;
    if (!navState?.openMockSetup && !navState?.openLiveStart) return;
    if (consumedNavKey.current === location.key) return;

    // Consumed before the checks below, not after: the flag is spent either way, so that clearing
    // the router state cannot leave a stale request to reopen this dialog on a later Back.
    consumedNavKey.current = location.key;
    navigate(location.pathname, { replace: true, state: null });

    // The command palette's live start, sent here so the context is confirmed before `/main`.
    if (navState.openLiveStart) {
      if (liveSessionActive) navigate('/main');
      else if (!mockSessionActive) setLiveContextOpen(true);
      return;
    }

    if (liveSessionActive) return;
    // "Practise again" sits on a report the candidate is still reading when the backend can be
    // rolled back under them.
    if (mockUnsupported) return;
    setMockSetupOpen(true);
    // Both guards are read at the moment the request arrives and are not triggers for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]);

  // The account's own email, not the remembered credential: `config.email` is blank whenever the
  // user declined "remember me", which would report a signed-in user as not signed in.
  const email = appState?.accountEmail || config?.email;
  const subscription = subscriptionOf(appState);
  const now = useNow();
  const planSummary = describePlan(
    t,
    subscription,
    appState?.credits,
    appState?.creditsPerMinute,
    now
  );
  // appState starts null before the first IPC round-trip resolves, and the config arrives over a
  // second one - both need to settle before "no data" is trustworthy.
  const accountReady = !configLoading && config !== undefined && appState !== null;
  const subscribed = isSubscriptionActive(subscription, now);
  const firstName =
    appState?.interviewConfig?.fullName?.trim().split(' ')[0] || email?.split('@')[0];
  const planText = accountReady ? (planSummary ?? t.home.planUnavailable) : t.common.loading;

  const handleStartLive = () => {
    // `/main`'s control panel runs the start sequence on arrival. Handed through router state
    // rather than started here so there is exactly one implementation of it. Already running,
    // this is just the way back to the interview.
    // Asked here rather than on `/main`, so reviewing the context is a step to the account page
    // and not a start abandoned halfway through on the live console.
    if (liveSessionActive) navigate('/main');
    else setLiveContextOpen(true);
  };

  // The dialog has already validated and shown its own headphone notice by the time this runs.
  // Starting the session itself happens on `/mock-interview`, not here, so that only one
  // `useMockInterview()` instance is ever mounted at once - starting it from this page as well
  // would leave two instances reacting to the same `Speaking` transition for the moment before
  // the route swap finishes, which is what plays the question's audio twice.
  const handleMockInterviewStart = async (setup: MockInterviewSetup) => {
    setMockSetupOpen(false);
    navigate('/mock-interview', { state: { pendingSetup: setup } });
  };

  return (
    // `min-h-full` rather than `h-full` so centring gives way to scrolling once the content is
    // taller than the window, which only happens well past the default zoom. Built to fit
    // MIN_WIDTH x MIN_HEIGHT (840x600) less the titlebar and the rail.
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <AmbientBackground />
      <div className="relative flex-1 overflow-auto">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-3xl px-8 py-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {firstName ? t.home.welcome(firstName) : t.home.welcomeAnonymous}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t.home.subtitle}</p>
              </div>

              {/* The plan as a status chip that is also the way to change it. */}
              <button
                type="button"
                onClick={() => navigate('/payment')}
                aria-label={`${t.home.planLabel}: ${planText}. ${t.home.subscribe}`}
                className={cn(
                  'inline-flex max-w-full items-center gap-2 rounded-full border bg-background/40 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors',
                  'hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  subscribed ? 'border-primary/30 text-primary' : 'text-muted-foreground'
                )}
              >
                {subscribed ? (
                  <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate tabular-nums">{planText}</span>
                {!subscribed && (
                  <>
                    <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border" />
                    <span className="shrink-0 text-foreground">{t.home.subscribe}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <LaunchCard
                emphasis
                icon={<Radio className="h-5 w-5" aria-hidden="true" />}
                title={liveSessionActive ? t.home.live.resumeTitle : t.home.live.title}
                description={
                  liveSessionActive
                    ? t.home.live.running
                    : mockSessionActive
                      ? t.home.live.mockRunning
                      : creditsTooLow
                        ? t.home.live.unaffordable
                        : t.home.live.ready
                }
                onClick={
                  !liveSessionActive && creditsTooLow ? () => navigate('/payment') : handleStartLive
                }
                disabled={!liveSessionActive && mockSessionActive}
              />
              <LaunchCard
                icon={<Mic className="h-5 w-5" aria-hidden="true" />}
                title={t.home.mock.title}
                description={
                  mockUnsupported
                    ? t.home.mock.unsupported
                    : liveSessionActive
                      ? t.home.mock.liveRunning
                      : creditsTooLow
                        ? t.home.mock.unaffordable
                        : t.home.mock.ready
                }
                onClick={() => (creditsTooLow ? navigate('/payment') : setMockSetupOpen(true))}
                disabled={liveSessionActive || mockUnsupported}
              />
            </div>

            {/* The command palette reaches everything on the rail and more, and nothing on screen
              said it existed. */}
            <button
              type="button"
              onClick={() => openCommandPalette(true)}
              className="mx-auto mt-6 flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {t.titlebar.searchActions}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-foreground/80">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>
          </div>
        </div>
      </div>

      <ContextReminderDialog
        open={liveContextOpen}
        onOpenChange={setLiveContextOpen}
        hasContext={appState?.interviewConfig?.hasContextData ?? false}
        onProceed={() => navigate('/main', { state: { autoStartLive: true } })}
        onEditContext={() => navigate('/account')}
      />

      <MockInterviewSetupDialog
        open={mockSetupOpen}
        onOpenChange={setMockSetupOpen}
        onStart={handleMockInterviewStart}
      />
    </div>
  );
}

/** The plan chip's text: the active plan and its end date, or the free time left. */
function describePlan(
  t: ReturnType<typeof useT>,
  subscription: SubscriptionSummary,
  credits: number | undefined,
  creditsPerMinute: number | undefined,
  now: number
): string | undefined {
  if (isSubscriptionActive(subscription, now) && subscription.expiresAt !== null) {
    return t.payment.buy.subscribedUntil(
      t.creditsDisplay.planNames[planKey(subscription.plan)],
      t.creditsDisplay.dateTime(subscription.expiresAt)
    );
  }
  if (credits === undefined) return undefined;
  return freeTimeLabel(t, credits, creditsPerMinute);
}
