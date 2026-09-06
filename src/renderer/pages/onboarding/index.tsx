import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LanguageField } from '@/components/custom/settings/language-field';
import { MicrophoneField } from '@/components/custom/settings/microphone-field';
import {
  ContextField,
  FullNameField,
  ProfileField,
} from '@/components/custom/settings/profile-fields';
import { SuggestionModeField } from '@/components/custom/settings/suggestion-mode-field';
import { TranscriptPanelField } from '@/components/custom/settings/transcript-panel-field';
import { Button } from '@/components/ui/button';
import { useAccountForm } from '@/hooks/use-account-form';
import { getElectron } from '@/lib/utils';

type StepId = 'profile' | 'context' | 'language' | 'microphone' | 'mode' | 'transcript';

interface Step {
  id: StepId;
  title: string;
  description: string;
}

/**
 * One thing per step, in the order a first interview needs them: who you are, what you are
 * interviewing for, then the four things that decide how the session behaves.
 *
 * Profile first because it is the only step that can block a start - the start sequence refuses
 * to run without a name and a CV - and the only one that is worth typing rather than picking.
 */
const STEPS: Step[] = [
  {
    id: 'profile',
    title: 'Tell us who you are',
    description:
      'Every suggestion is written from this, in your own experience and your own words. It is the one thing the app cannot run without.',
  },
  {
    id: 'context',
    title: 'What are you interviewing for?',
    description:
      'Optional, and worth the paste: with the job description in hand the assistant answers for that role rather than in general.',
  },
  {
    id: 'language',
    title: 'Pick your interview language',
    description: 'This sets both what gets transcribed and what your suggestions come back in.',
  },
  {
    id: 'microphone',
    title: 'Choose your microphone',
    description:
      'Pick the microphone you will actually be speaking into, then test it. Wear headphones during interviews - on speakers the app hears the interviewer through your microphone and goes quiet.',
  },
  {
    id: 'mode',
    title: 'How should suggestions read?',
    description: 'Change your mind at any time, including mid-interview.',
  },
  {
    id: 'transcript',
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
 * account fields need an explicit write, which happens on the way out of the context step, so a
 * user who closes the app halfway through still keeps what they typed.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const form = useAccountForm();

  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // Only the profile step gates progress: the name and CV are what the start sequence checks
  // before it will run anything, so letting the wizard past them would only move the failure
  // later.
  const canAdvance = step.id === 'profile' ? form.isComplete && form.loaded : true;

  /**
   * Record that setup is done and leave.
   *
   * The write has to land before the navigate, and it goes to the account rather than to local
   * config. Home gates on this exact flag, so leaving on a failed write would bounce the user
   * straight back here with no explanation - a loop, not a degraded state. On failure they stay
   * put and are told why.
   */
  const complete = async () => {
    const result = await getElectron()?.account?.setOnboardingCompleted(true);
    if (!result?.success) {
      console.error('Failed to record that setup is complete', result?.error);
      toast.error('Could not save your setup. Check your connection and try again.');
      return;
    }
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
      await complete();
    } finally {
      setFinishing(false);
    }
  };

  const handleNext = async () => {
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
        await complete();
      } finally {
        setFinishing(false);
      }
      return;
    }

    setStepIndex((i) => i + 1);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        <h1 className="text-xl font-semibold">{step.title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{step.description}</p>

        <div className="space-y-5">
          {step.id === 'profile' && (
            <>
              <FullNameField form={form} />
              <ProfileField form={form} />
              {form.loading && <p className="text-xs text-muted-foreground">Loading...</p>}
              {!form.loading && !form.loaded && (
                <p role="alert" className="text-xs text-destructive">
                  Could not reach your account. Check your connection - setup cannot be saved until
                  it comes back.
                </p>
              )}
            </>
          )}
          {step.id === 'context' && <ContextField form={form} />}
          {step.id === 'language' && <LanguageField />}
          {step.id === 'microphone' && <MicrophoneField />}
          {step.id === 'mode' && <SuggestionModeField />}
          {step.id === 'transcript' && <TranscriptPanelField />}
        </div>

        <div className="mt-8 flex items-center gap-2 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => void handleSkip()} disabled={finishing}>
            Skip setup
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((i) => i - 1)}
                disabled={finishing}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={() => void handleNext()} disabled={!canAdvance || finishing}>
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
    </div>
  );
}
