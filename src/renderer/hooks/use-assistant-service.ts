import { create } from 'zustand';

import { type VideoPanelHandle } from '@/components/custom/video-panel';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import { useConfigStore } from './use-config-store';
import { liveTranscriptionService } from '@/services/live-transcription.service';

interface AssistantService {
  error: string | null;
  videoPanelRef: React.RefObject<VideoPanelHandle> | null;

  // Actions
  startAssistant: () => Promise<void>;
  stopAssistant: () => Promise<void>;
  setError: (error: string | null) => void;
  setVideoPanelRef: (ref: React.RefObject<VideoPanelHandle> | null) => void;
}

export const useAssistantService = create<AssistantService>((set, get) => ({
  error: null,
  videoPanelRef: null,

  startAssistant: async () => {
    const electron = getElectron();
    if (!electron) {
      throw new Error('Electron API not available');
    }

    try {
      set({ error: null });

      // On macOS, verify Screen Recording permission before starting.
      // desktopCapturer.getSources() returns [] when permission is denied, which
      // causes the electron-audio-loopback handler to throw without resolving
      // getDisplayMedia(), hanging the start flow indefinitely.
      const screenStatus = await electron.permissions.checkScreenRecording();
      if (screenStatus === 'denied' || screenStatus === 'restricted') {
        throw new Error(
          'Screen Recording permission is required. Go to System Settings → Privacy & Security → Screen Recording, enable Power Interview AI, then restart the app.'
        );
      }

      electron.appState.update({ runningState: RunningState.Starting });

      // Clear previous history
      await electron.tools.clearAll();

      const config = useConfigStore.getState().config;
      const { videoPanelRef } = get();

      // Do something here for face swap
      if (config?.faceSwap && videoPanelRef?.current) {
      }

      // Start transcription services
      await electron.transcription.start();
      await liveTranscriptionService.start(
        config?.audioInputDeviceName ?? '',
        config?.sessionToken ?? ''
      );

      // Sleep 3 seconds to ensure the assistant has fully started before allowing stop actions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update running state to Running after successful start
      electron.appState.update({ runningState: RunningState.Running });
    } catch (error) {
      // Reset state to Idle so the button doesn't stay stuck on "Starting..."
      electron.appState.update({ runningState: RunningState.Idle });
      const errorMessage = error instanceof Error ? error.message : 'Failed to start assistant';
      set({ error: errorMessage });
      console.error('Start assistant error:', error);
      throw error;
    }
  },

  stopAssistant: async () => {
    try {
      set({ error: null });

      const electron = getElectron();
      if (!electron) {
        throw new Error('Electron API not available');
      }
      electron.appState.update({ runningState: RunningState.Stopping });

      const config = useConfigStore.getState().config;
      const { videoPanelRef } = get();

      // Do something here for face swap
      if (config?.faceSwap && videoPanelRef?.current) {
      }

      // Stop assistant services
      await Promise.all([
        liveTranscriptionService.stop(),
        electron.transcription.stop(),
        electron.liveSuggestion.stop(),
        electron.actionSuggestion.stop(),
      ]);

      electron.setStealth(false); // Ensure stealth mode is turned off when stopping assistant

      // Sleep 3 seconds to ensure the assistant has fully stopped before allowing start actions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update running state to Idle after successful stop
      electron.appState.update({ runningState: RunningState.Idle });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop assistant';
      set({
        error: errorMessage,
      });
      console.error('Stop assistant error:', error);
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setVideoPanelRef: (ref: React.RefObject<VideoPanelHandle> | null) => {
    set({ videoPanelRef: ref });
  },
}));
