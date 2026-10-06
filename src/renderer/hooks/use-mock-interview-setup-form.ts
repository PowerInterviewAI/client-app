import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import { useT } from '@/i18n';
import { canStartSession, minimumStartCredits } from '@/lib/credit-gate';
import { getElectron } from '@/lib/utils';
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
  const t = useT();
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { config } = useConfigStore();
  const { devices: audioInputDevices, ready: audioDevicesReady } = useAudioInputDevices();

  const [seniority, setSeniority] = useState<MockSeniority>(MockSeniority.Mid);
  const [difficulty, setDifficulty] = useState<MockDifficulty>(MockDifficulty.Standard);
  const [questionCount, setQuestionCount] = useState(8);
  const [starting, setStarting] = useState(false);
  const [headphoneNoticeOpen, setHeadphoneNoticeOpen] = useState(false);

  const credits = appState?.credits;
  const creditsPerMinute = appState?.creditsPerMinute;

  const selectedAudioInputDeviceName = config?.audioInputDeviceName ?? '';
  const noAudioInputDevices = audioDevicesReady && audioInputDevices.length === 0;
  const audioInputDeviceNotFound =
    audioDevicesReady &&
    audioInputDevices.length > 0 &&
    selectedAudioInputDeviceName !== '' &&
    !audioInputDevices.some((d) => d.name === selectedAudioInputDeviceName);

  const checkCanStart = (): boolean => {
    if (!appState?.interviewConfigLoaded) {
      toast.error(t.controlPanel.checks.configUnavailable);
      void getElectron()?.account?.refresh();
      return false;
    }
    if (!appState?.interviewConfig?.fullName) {
      toast.error(t.controlPanel.checks.nameMissing);
      navigate('/account');
      return false;
    }
    if (!appState?.interviewConfig?.hasProfileData) {
      toast.error(t.controlPanel.checks.profileMissing);
      navigate('/account');
      return false;
    }
    if (noAudioInputDevices) {
      toast.error(t.controlPanel.checks.noMicrophone);
      return false;
    }
    if (audioInputDeviceNotFound) {
      toast.error(t.mockStartChecks.deviceNotFound(selectedAudioInputDeviceName));
      return false;
    }
    // Last of the checks, and the only one with somewhere to send the user. Any length may be
    // chosen: the session is billed by the minute and ends at zero with its report, so the
    // setup screen says how far the balance goes rather than refusing a length.
    if (!canStartSession(credits, creditsPerMinute)) {
      toast.error(t.creditGate.tooLow, {
        description: t.creditGate.tooLowHint(minimumStartCredits(creditsPerMinute), credits ?? 0),
        action: { label: t.creditGate.buyCredits, onClick: () => navigate('/payment') },
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
      toast.error(error instanceof Error ? error.message : t.mock.session.startFailed);
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
    creditsPerMinute,
    starting,
    headphoneNoticeOpen,
    setHeadphoneNoticeOpen,
    handleStartClick,
    startAfterNotice,
  };
}

export type MockInterviewSetupForm = ReturnType<typeof useMockInterviewSetupForm>;
