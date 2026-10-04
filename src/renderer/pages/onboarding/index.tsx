import { ArrowLeft, ArrowRight, Check, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingPage } from '@/components/custom/loading';
import { LanguageField } from '@/components/custom/settings/language-field';
import { MicrophoneField } from '@/components/custom/settings/microphone-field';
import { MockHintsField } from '@/components/custom/settings/mock-hints-field';
import {
  ContextField,
  FullNameField,
  ProfileField,
} from '@/components/custom/settings/profile-fields';
import { SuggestionModeField } from '@/components/custom/settings/suggestion-mode-field';
import { TranscriptPanelField } from '@/components/custom/settings/transcript-panel-field';
import { UiLanguageField } from '@/components/custom/settings/ui-language-field';
import { ZoomField } from '@/components/custom/settings/zoom-field';
import { Button } from '@/components/ui/button';
import { useAccountForm } from '@/hooks/use-account-form';
import { useAppState } from '@/hooks/use-app-state';
import { useOnboardingDismissed } from '@/hooks/use-onboarding-dismissed';
import { useT } from '@/i18n';
import { APP_NAME } from '@/lib/consts';
import { getElectron } from '@/lib/utils';

/**
 * The steps, in the order a first interview needs them.
 *
 * App language first, ahead of even the profile. Every other step is a question about an
 * interview; this one is a question about whether the user can read the questions. A wizard that
 * asks for a CV in a language someone does not speak has already failed, and picking here
 * re-renders this screen - its own heading included - in the language chosen.
 *
 * Profile second because it is the only step that can block progress - the start sequence
 * refuses to run without a name and a CV - and the only one worth typing rather than picking.
 *
 * The ids double as keys into `t.onboarding.steps`, so a step cannot be added without its copy:
 * a missing entry is a build error in both locales rather than a blank heading at runtime.
 */
const STEP_IDS = [
  'uiLanguage',
  'profile',
  'context',
  'language',
  'microphone',
  'mode',
  'mockHints',
  'zoom',
  'transcript',
] as const;

type StepId = (typeof STEP_IDS)[number];

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
 * Configuration can re-run the whole thing later - which is what lets this screen ask as much as
 * it does without any of it being a decision the user has to get right now.
 */
export default function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const { appState } = useAppState();
  const dismiss = useOnboardingDismissed((s) => s.dismiss);
  const form = useAccountForm();

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const step: StepId = STEP_IDS[stepIndex];
  const copy = t.onboarding.steps[step];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_IDS.length - 1;

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
  const profileBlocked = step === 'profile' && !(form.isComplete && form.loaded);

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
      ? t.onboarding.blocked.accountUnreachable
      : form.fullName.trim() === ''
        ? t.onboarding.blocked.needName
        : t.onboarding.blocked.needProfile;

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
    if (finished) toast.success(t.onboarding.allSet);
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
          toast.warning(t.onboarding.profileNotSavedOnSkip);
        }
      }

      // Left regardless of whether the durable write landed. Refusing to let someone out of a
      // wizard is a worse outcome than asking them again next launch, and Skip is the control
      // whose entire meaning is "let me out".
      if (!(await complete())) {
        toast.warning(t.onboarding.completionNotRecorded);
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
    if (step === 'profile' || step === 'context') {
      setFinishing(true);
      try {
        await form.save();
      } catch (error) {
        console.error('Failed to save your profile:', error);
        toast.error(error instanceof Error ? error.message : t.onboarding.saveProfileFailed);
        return;
      } finally {
        setFinishing(false);
      }
    }

    if (isLast) {
      setFinishing(true);
      try {
        // Finish stays put on a failed write, unlike Skip: the user has just worked through
        // every step, and leaving on a write that did not land means being asked again from the
        // top.
        if (!(await complete())) {
          toast.error(t.onboarding.finishFailed);
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
  // where `/` sends them, rather than rendering a wizard whose every step fails to save.
  if (appState?.isLoggedIn === false) return <Navigate to="/auth/login" replace />;
  if (appState?.isLoggedIn !== true) return <LoadingPage disclaimer={t.common.loading} />;

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
          {isFirstRun ? t.onboarding.firstRunEyebrow(APP_NAME) : t.onboarding.guideEyebrow}
        </p>

        <div className="mt-3 mb-6">
          <div className="mb-2 flex items-center gap-1.5" aria-hidden="true">
            {STEP_IDS.map((id, i) => (
              <div
                key={id}
                className={`h-1 flex-1 rounded-full ${
                  i < stepIndex ? 'bg-primary' : i === stepIndex ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            {t.onboarding.progress(stepIndex + 1, STEP_IDS.length, copy.label)}
          </p>
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {copy.title}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{copy.description}</p>

        {/* Floored rather than left to the content, so the footer does not jump up the screen
            between a step with two textareas and a step with one checkbox. */}
        <div className="min-h-64 space-y-5">
          {step === 'uiLanguage' && <UiLanguageField />}
          {step === 'profile' && (
            <>
              <FullNameField form={form} />
              <ProfileField form={form} />
              {form.loading && (
                <p className="text-xs text-muted-foreground" role="status">
                  {t.onboarding.loadingAccount}
                </p>
              )}
              {!form.loading && !form.loaded && (
                <div className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 p-3">
                  <p role="alert" className="text-xs text-destructive">
                    {t.onboarding.accountUnreachable}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={form.reload}
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.common.retry}
                  </Button>
                </div>
              )}
            </>
          )}
          {step === 'context' && <ContextField form={form} />}
          {step === 'language' && <LanguageField />}
          {step === 'microphone' && <MicrophoneField />}
          {step === 'mode' && <SuggestionModeField />}
          {step === 'mockHints' && <MockHintsField />}
          {step === 'zoom' && <ZoomField />}
          {step === 'transcript' && <TranscriptPanelField />}
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
              title={isFirstRun ? t.onboarding.skipTooltip : undefined}
            >
              {isFirstRun ? t.onboarding.skip : t.common.close}
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
                  {t.common.back}
                </Button>
              )}
              <Button type="submit" size="sm" disabled={profileBlocked || finishing}>
                {isLast ? t.common.finish : t.common.continue}
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
