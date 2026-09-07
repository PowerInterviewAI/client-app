import { ArrowLeft, ArrowRight, Check, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingPage } from '@/components/custom/loading';
import { LanguageField } from '@/components/custom/settings/language-field';
import { MicrophoneField } from '@/components/custom/settings/microphone-field';
import {
  ContextField,
  FullNameField,
  ProfileField,
} from '@/components/custom/settings/profile-fields';
import { SuggestionModeField } from '@/components/custom/settings/suggestion-mode-field';
import { TranscriptPanelField } from '@/components/custom/settings/transcript-panel-field';
import { ZoomField } from '@/components/custom/settings/zoom-field';
import { Button } from '@/components/ui/button';
import { useAccountForm } from '@/hooks/use-account-form';
import { useAppState } from '@/hooks/use-app-state';
import { useOnboardingDismissed } from '@/hooks/use-onboarding-dismissed';
import { APP_NAME } from '@/lib/consts';
import { getElectron } from '@/lib/utils';

type StepId = 'profile' | 'context' | 'language' | 'microphone' | 'mode' | 'zoom' | 'transcript';

interface Step {
  id: StepId;
  /** Two or three words for the progress line. The heading below says the rest. */
  label: string;
  title: string;
  description: string;
}

/**
 * One thing per step, in the order a first interview needs them: who you are, what you are
 * interviewing for, then the five things that decide how the session looks and behaves.
 *
 * Profile first because it is the only step that can block a start - the start sequence refuses
 * to run without a name and a CV - and the only one that is worth typing rather than picking.
 */
const STEPS: Step[] = [
  {
    id: 'profile',
    label: 'Profile',
    title: 'Tell us who you are',
    description:
      'Every suggestion is written from this, in your own experience and your own words. It is the one thing the app cannot run without.',
  },
  {
    id: 'context',
    label: 'Job context',
    title: 'What are you interviewing for?',
    description:
      'Optional, and worth the paste: with the job description in hand the assistant answers for that role rather than in general.',
  },
  {
    id: 'language',
    label: 'Language',
    title: 'Pick your interview language',
    description: 'This sets both what gets transcribed and what your suggestions come back in.',
  },
  {
    id: 'microphone',
    label: 'Microphone',
    title: 'Choose your microphone',
    description:
      'Pick the microphone you will actually be speaking into, then test it. Wear headphones during interviews - on speakers the app hears the interviewer through your microphone and goes quiet.',
  },
  {
    id: 'mode',
    label: 'Suggestions',
    title: 'How should suggestions read?',
    description: 'Change your mind at any time, including mid-interview.',
  },
  {
    id: 'zoom',
    label: 'Size',
    title: 'Is this comfortable to read?',
    description:
      'The interview window is small on purpose, so it does not cover the call. Size it now, while you can take your time over it, rather than mid-question.',
  },
  {
    id: 'transcript',
    label: 'Transcript',
    title: 'One last thing',
    description: 'Whether to keep a live transcript on screen under your suggestions.',
  },
];

/**
 * First-run setup.
 *
 * Reached from `pages/index.tsx` when the signed-in account has not been through it, and never
 * again once finished or skipped. The flag lives on the account, not on this machine, so it
 * follows the user to a new device and a second account on a shared one gets its own run of it.
 *
 * Every step renders the same component the configuration and account pages use, so there is one
 * definition of each setting and no way for the wizard to teach a control that then looks
 * different everywhere else. The settings themselves persist as they are changed; only the
 * account fields need an explicit write, which happens on the way out of each of the two steps
 * that collect them, so a user who closes the app halfway through still keeps what they typed.
 *
 * Nothing here is a trap. Skip is on every step, every setting has a working default, and
 * Configuration can re-run the whole thing later - which is what lets this screen ask six
 * questions without any of them being a decision the user has to get right now.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const dismiss = useOnboardingDismissed((s) => s.dismiss);
  const form = useAccountForm();

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // The same screen serves two arrivals. A first run is compulsory and its way out is Skip; a
  // run started from Configuration's *Run setup* is neither, and calling that one "first-time
  // setup" with a "Skip for now" button describes something the user is not doing.
  const isFirstRun = !(appState?.onboardingCompleted ?? false);

  // Moved on every step change. Without it the focus ring stays on the Continue button that was
  // just pressed, so a keyboard or screen-reader user is told nothing about the screen having
  // changed under them - and this is the one navigation in the app where a button press replaces
  // the whole page rather than following a link.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  // Only the profile step gates progress: the name and CV are what the start sequence checks
  // before it will run anything, so letting the wizard past them would only move the failure
  // later.
  const profileBlocked = step.id === 'profile' && !(form.isComplete && form.loaded);

  /**
   * Why Continue is disabled, named after the thing that is missing.
   *
   * A disabled button with no explanation is the most common way a wizard strands someone: they
   * can see they cannot go on and cannot see what to do about it. Two distinct causes reach this
   * button and they need different answers - one is something to type, the other is something to
   * retry - so it is not one message.
   */
  const blockedReason = !profileBlocked
    ? null
    : !form.loaded
      ? 'Your account could not be reached, so nothing typed here can be saved yet.'
      : form.fullName.trim() === ''
        ? 'Add your full name to continue.'
        : 'Add your profile to continue.';

  /**
   * Record on the account that setup is done. Reports whether the write landed, so Finish can
   * stay put on a failure while Skip leaves regardless.
   */
  const complete = async (): Promise<boolean> => {
    const result = await getElectron()?.account?.setOnboardingCompleted(true);
    if (!result?.success) {
      console.error('Failed to record that setup is complete', result?.error);
      return false;
    }
    return true;
  };

  /**
   * Leave the wizard.
   *
   * `dismiss()` is not redundant with the write above. That write resolves over one IPC message
   * and the app state carrying its result arrives over another, with nothing ordering the two -
   * so home still read "setup pending" on this navigate and sent the user straight back in. The
   * wizard ran twice, every time. The account flag is what makes setup done; this is what makes
   * it done *now*.
   */
  const leave = (finished: boolean) => {
    dismiss();
    // Said out loud, because the screen they land on says nothing about setup, and a wizard that
    // simply vanishes leaves the user unsure whether it took.
    if (finished) toast.success('You are all set');
    navigate('/', { replace: true });
  };

  const handleSkip = async () => {
    setFinishing(true);
    try {
      // Skipping abandons the rest of the wizard, not what has already been typed into it. A user
      // who pastes a CV and then decides they would rather set the rest up later should not find
      // the CV gone too. Best-effort: a failure here cannot be allowed to stop them leaving,
      // which is the entire point of Skip, so it warns and goes anyway.
      if (form.loaded && form.isComplete) {
        try {
          await form.save();
        } catch (e) {
          console.error('Failed to save your profile before skipping setup:', e);
          toast.warning('Setup skipped, but your profile was not saved. Try again from Account.');
        }
      }

      // Left regardless of whether the durable write landed. Refusing to let someone out of a
      // wizard is a worse outcome than asking them again next launch, and Skip is the control
      // whose entire meaning is "let me out".
      if (!(await complete())) {
        toast.warning('Setup skipped, but we could not record that. It may be offered again.');
      }
      leave(false);
    } finally {
      setFinishing(false);
    }
  };

  const handleNext = async () => {
    // Guarded here as well as on the button: this also runs on Enter, where the disabled state of
    // a button submit is not what decides whether the form is submitted.
    if (profileBlocked || finishing) return;

    // Written on the way out of each account step rather than once at the end. These two steps
    // hold the only content in the wizard the user typed, and a window closed on step 4 should
    // not mean pasting a CV in a second time. Re-saving on the second step, and again if they go
    // back and forward, costs one idempotent write; the alternative costs the user their CV.
    if (step.id === 'profile' || step.id === 'context') {
      setFinishing(true);
      try {
        await form.save();
      } catch (error) {
        console.error('Failed to save your profile:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save your profile');
        return;
      } finally {
        setFinishing(false);
      }
    }

    if (isLast) {
      setFinishing(true);
      try {
        // Finish stays put on a failed write, unlike Skip: the user has just answered six
        // questions, and leaving on a write that did not land means being asked all six again.
        if (!(await complete())) {
          toast.error('Could not save your setup. Check your connection and try again.');
          return;
        }
        leave(true);
      } finally {
        setFinishing(false);
      }
      return;
    }

    setStepIndex((i) => i + 1);
  };

  // Signed out, this screen has no account to read or write and every step would fail. Sent
  // where `/` sends them, rather than rendering six steps that cannot save.
  if (appState?.isLoggedIn === false) return <Navigate to="/auth/login" replace />;
  if (appState?.isLoggedIn !== true) return <LoadingPage disclaimer="Loading…" />;

  return (
    <div className="flex-1 overflow-auto">
      {/* A form, so Enter advances from any single-line field - the fastest way through a wizard,
          and the first thing a keyboard user tries. The two long fields are textareas, which keep
          Enter for newlines. */}
      <form
        className="mx-auto w-full max-w-2xl px-6 py-8"
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext();
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isFirstRun ? `Set up ${APP_NAME}` : 'Setup guide'}
        </p>

        <div className="mt-3 mb-6">
          <div className="mb-2 flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${
                  i < stepIndex ? 'bg-primary' : i === stepIndex ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            Step {stepIndex + 1} of {STEPS.length} &middot; {step.label}
          </p>
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {step.title}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{step.description}</p>

        {/* Floored rather than left to the content, so the footer does not jump up the screen
            between a step with two textareas and a step with one checkbox. */}
        <div className="min-h-64 space-y-5">
          {step.id === 'profile' && (
            <>
              <FullNameField form={form} />
              <ProfileField form={form} />
              {form.loading && (
                <p className="text-xs text-muted-foreground" role="status">
                  Loading your account&hellip;
                </p>
              )}
              {!form.loading && !form.loaded && (
                <div className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 p-3">
                  <p role="alert" className="text-xs text-destructive">
                    Could not reach your account. Nothing typed here can be saved until it comes
                    back.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={form.reload}
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                  </Button>
                </div>
              )}
            </>
          )}
          {step.id === 'context' && <ContextField form={form} />}
          {step.id === 'language' && <LanguageField />}
          {step.id === 'microphone' && <MicrophoneField />}
          {step.id === 'mode' && <SuggestionModeField />}
          {step.id === 'zoom' && <ZoomField />}
          {step.id === 'transcript' && <TranscriptPanelField />}
        </div>

        <div className="mt-8 border-t pt-4">
          {blockedReason && (
            <p className="mb-3 text-xs text-muted-foreground" role="status">
              {blockedReason}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => void handleSkip()}
              disabled={finishing}
              title={
                isFirstRun ? 'You can run setup again later from Configuration' : undefined
              }
            >
              {isFirstRun ? 'Skip for now' : 'Close'}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {!isFirst && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStepIndex((i) => i - 1)}
                  disabled={finishing}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
              )}
              <Button type="submit" size="sm" disabled={profileBlocked || finishing}>
                {isLast ? 'Finish' : 'Continue'}
                {isLast ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
