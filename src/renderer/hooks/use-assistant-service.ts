import { toast } from 'sonner';
import { create } from 'zustand';

import { getElectron } from '@/lib/utils';
import { liveTranscriptionService } from '@/services/live-transcription.service';
import { RunningState } from '@/types/app-state';
import { DEFAULT_LANGUAGE } from '@/types/language';
import { isMockInterviewSessionActive } from '@/types/mock-interview';

import { getAppStateSnapshot } from './use-app-state';
import { useConfigStore } from './use-config-store';

interface AssistantService {
  error: string | null;

  // Actions
  startAssistant: () => Promise<void>;
  stopAssistant: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAssistantService = create<AssistantService>((set) => ({
  error: null,

  startAssistant: async () => {
    const electron = getElectron();
    if (!electron) {
      throw new Error('Electron API not available');
    }

    // Mutually exclusive with a mock session: both want the microphone and an ASR socket, and
    // running both would bill twice. There is no start hotkey for the live assistant, so this
    // one check covers every route into it.
    if (isMockInterviewSessionActive(getAppStateSnapshot()?.mockInterview ?? null)) {
      const message = 'Stop the mock interview before starting a live session.';
      set({ error: message });
      throw new Error(message);
    }

    try {
      set({ error: null });

      electron.appState.update({ runningState: RunningState.Starting });

      // Clear previous history
      await electron.tools.clearAll();

      const config = useConfigStore.getState().config;

      // Start transcription services
      await electron.transcription.start();
      // What the session opens on. Both of these can change mid-session after this, and neither
      // is re-read here: useInterviewLanguage reconnects the sockets for a language change, and
      // useAudioInputDevice swaps the microphone's stream in place for a device change.
      await liveTranscriptionService.start(
        config?.audioInputDeviceName ?? '',
        config?.sessionToken ?? '',
        config?.language ?? DEFAULT_LANGUAGE
      );

      // Sleep 3 seconds to ensure the assistant has fully started before allowing stop actions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update running state to Running after successful start
      electron.appState.update({ runningState: RunningState.Running });
    } catch (error) {
      // Tear down before resetting state. `electron.transcription.start()` may already have
      // succeeded, and leaving it active while runningState goes back to Idle strands the app
      // in a state where transcripts keep flowing (so live suggestions still fire) but every
      // action-suggestion hotkey refuses forever, because those gate on runningState.
      await Promise.allSettled([liveTranscriptionService.stop(), electron.transcription.stop()]);

      // Reset state to Idle so the button doesn't stay stuck on "Starting..."
      electron.appState.update({ runningState: RunningState.Idle });
      const errorMessage = error instanceof Error ? error.message : 'Failed to start assistant';
      set({ error: errorMessage });
      console.error('Start assistant error:', error);
      throw error;
    }
  },

  stopAssistant: async () => {
    set({ error: null });

    const electron = getElectron();
    if (!electron) {
      const message = 'Electron API not available';
      set({ error: message });
      throw new Error(message);
    }

    electron.appState.update({ runningState: RunningState.Stopping });

    try {
      // allSettled, not all: `all` rejects on the first teardown that throws and abandons the
      // rest, so one failing service left the other three running. Every one of these is a
      // best-effort release of something that must not outlive the session.
      const results = await Promise.allSettled([
        liveTranscriptionService.stop(),
        electron.transcription.stop(),
        electron.liveSuggestion.stop(),
        electron.actionSuggestion.stop(),
      ]);

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Stop assistant: some services failed to stop', failures);
        set({ error: 'Some services did not stop cleanly' });
        // Said out loud rather than left in store state nothing renders. The session is over
        // either way, but a channel that refused to close is the difference between "stopped"
        // and "still listening", and that is not something to discover from a log file.
        toast.warning('The assistant stopped, but not everything shut down cleanly', {
          description: 'Restart the app if transcription or suggestions keep arriving.',
        });
      }

      electron.setStealth(false); // Ensure stealth mode is turned off when stopping assistant

      // Sleep 3 seconds to ensure the assistant has fully stopped before allowing start actions
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      // Unconditional, and the reason this is a `finally`. Every control on the bar is disabled
      // while the state is Stopping, Stop included, so a throw on the way out used to leave the
      // app permanently frozen mid-teardown with no way back other than restarting it. Whatever
      // happened above, the session is over and the UI has to be able to say so.
      electron.appState.update({ runningState: RunningState.Idle });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
