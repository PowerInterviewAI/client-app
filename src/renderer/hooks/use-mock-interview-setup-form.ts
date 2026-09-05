import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import { getElectron } from '@/lib/utils';
import { getLanguageOption } from '@/types/language';
import type { MockInterviewSetup } from '@/types/mock-interview';
import { MockDifficulty, MockSeniority } from '@/types/mock-interview';

/**
 * State and validation shared by every place a mock interview can be configured and started -
 * the full-page setup screen and the control bar's setup dialog.
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

  const language = config?.language;
  const languageOption = getLanguageOption(language);

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
      navigate('/settings');
      return false;
    }
    if (!appState?.interviewConfig?.hasProfileData) {
      toast.error('Profile data is not set');
      navigate('/settings');
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
    starting,
    headphoneNoticeOpen,
    setHeadphoneNoticeOpen,
    languageOption,
    handleStartClick,
    startAfterNotice,
  };
}

export type MockInterviewSetupForm = ReturnType<typeof useMockInterviewSetupForm>;
