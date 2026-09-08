import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import { MOCK_MAX_FOLLOW_UPS_PER_QUESTION } from '@/lib/consts';
import { getElectron } from '@/lib/utils';
import { mockSessionCeiling, mockSessionPrice } from '@/types/app-state';
import type { MockInterviewSetup } from '@/types/mock-interview';
import { MockDifficulty, MockSeniority } from '@/types/mock-interview';

/**
 * State and validation for configuring and starting a mock interview, held apart from
 * `MockInterviewSetupDialog` so how the form behaves does not depend on where it is presented.
 *
 * Holds only what is per-session: seniority, question count and difficulty. The interview
 * language is not among them - it is one stored setting the live assistant reads too, edited in
 * the dialog through the shared `LanguageField` rather than copied into this form.
 *
 * Deliberately asks for nothing the account already has. `checkCanStart` reads
 * `interviewConfig.fullName`/`hasProfileData` off the shared account state the live assistant
 * already uses - a mock session is scored against the same profile and job context, not a copy
 * gathered here, so there is nothing to duplicate and nothing that can drift out of sync with it.
 */
export function useMockInterviewSetupForm(onStart: (setup: MockInterviewSetup) => Promise<void>) {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { config } = useConfigStore();
  const { devices: audioInputDevices, ready: audioDevicesReady } = useAudioInputDevices();

  const [seniority, setSeniority] = useState<MockSeniority>(MockSeniority.Mid);
  const [difficulty, setDifficulty] = useState<MockDifficulty>(MockDifficulty.Standard);
  const [questionCount, setQuestionCount] = useState(8);
  const [starting, setStarting] = useState(false);
  const [headphoneNoticeOpen, setHeadphoneNoticeOpen] = useState(false);

  // What a session costs, or `null` on a backend that predates per-turn pricing - which still
  // meters a mock by the minute, so there is nothing to quote and nothing to gate. Never read as
  // free: no price and a price of zero are different answers.
  const pricing = appState?.mockPricing ?? null;
  const credits = appState?.credits ?? 0;

  /** What a mock of `count` questions is guaranteed to cost, or null when the backend has no prices. */
  const priceOf = (count: number): number | null =>
    pricing === null ? null : mockSessionPrice(pricing, count);

  /** The most it could cost, if every question drew the maximum number of follow-ups. */
  const ceilingOf = (count: number): number | null =>
    pricing === null
      ? null
      : mockSessionCeiling(pricing, count, MOCK_MAX_FOLLOW_UPS_PER_QUESTION);

  /**
   * Whether this balance can see a session of `count` questions through to its report.
   *
   * Tested against the guaranteed price rather than the ceiling. Follow-ups are charged as they
   * are delivered and declined by the backend when paying for one would eat into what remains, so
   * reserving the worst case here would refuse a session that will almost certainly not cost it.
   */
  const canAfford = (count: number): boolean => {
    const price = priceOf(count);
    return price === null || credits >= price;
  };

  const selectedAudioInputDeviceName = config?.audioInputDeviceName ?? '';
  const noAudioInputDevices = audioDevicesReady && audioInputDevices.length === 0;
  const audioInputDeviceNotFound =
    audioDevicesReady &&
    audioInputDevices.length > 0 &&
    selectedAudioInputDeviceName !== '' &&
    !audioInputDevices.some((d) => d.name === selectedAudioInputDeviceName);

  const checkCanStart = (): boolean => {
    if (!appState?.interviewConfigLoaded) {
      toast.error('Could not load your saved configuration. Reconnecting - try again in a moment.');
      void getElectron()?.account?.refresh();
      return false;
    }
    if (!appState?.interviewConfig?.fullName) {
      toast.error('Full name is not set');
      navigate('/account');
      return false;
    }
    if (!appState?.interviewConfig?.hasProfileData) {
      toast.error('Profile data is not set');
      navigate('/account');
      return false;
    }
    if (noAudioInputDevices) {
      toast.error('No microphone was detected. Connect one and try again.');
      return false;
    }
    if (audioInputDeviceNotFound) {
      toast.error(
        `Audio input device "${selectedAudioInputDeviceName}" is not found. Choose a different one from the main screen's audio settings.`
      );
      return false;
    }
    // Last of the checks, and the only one with somewhere to send the user. A mock that stops
    // half-way is worse than one that never began, so the whole session is paid for up front or
    // not started - the same guarantee the backend enforces at the first question. The dialog
    // already disables the counts this would refuse, so reaching here means every length is out
    // of reach.
    if (!canAfford(questionCount)) {
      const price = priceOf(questionCount);
      toast.error(`Not enough credits for a ${questionCount}-question mock interview`, {
        description: `It costs ${price} credits and you have ${credits}.`,
        action: { label: 'Buy credits', onClick: () => navigate('/payment') },
      });
      return false;
    }
    return true;
  };

  const startAfterNotice = async () => {
    setStarting(true);
    try {
      // Empty rather than absent, and never collected: the account's job context already
      // names the role, a backend that knows that frames the interview from it, and one that
      // predates the change still requires the field - where omitting it is a 422 on every
      // question rather than a degraded prompt. See `MockInterviewSetup.role`.
      await onStart({
        role: '',
        seniority,
        difficulty,
        question_count: questionCount,
      });
    } catch (error) {
      console.error('Failed to start mock interview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start the mock interview');
    } finally {
      setStarting(false);
    }
  };

  const handleStartClick = () => {
    if (!checkCanStart()) return;
    setHeadphoneNoticeOpen(true);
  };

  return {
    seniority,
    setSeniority,
    difficulty,
    setDifficulty,
    questionCount,
    setQuestionCount,
    credits,
    priceOf,
    ceilingOf,
    canAfford,
    starting,
    headphoneNoticeOpen,
    setHeadphoneNoticeOpen,
    handleStartClick,
    startAfterNotice,
  };
}

export type MockInterviewSetupForm = ReturnType<typeof useMockInterviewSetupForm>;
