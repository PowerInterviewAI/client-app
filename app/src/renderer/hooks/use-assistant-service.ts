import { create } from 'zustand';

import { type VideoPanelHandle } from '@/components/custom/video-panel';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import { useConfigStore } from './use-config-store';

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
    try {
      set({ error: null });

      const electron = getElectron();
      if (!electron) {
        throw new Error('Electron API not available');
      }
      electron.appState.update({ runningState: RunningState.Starting });

      // Clear previous history
      await electron.tools.clearAll();

      const config = useConfigStore.getState().config;
      const { videoPanelRef } = get();

      // Start WebRTC if face swap is enabled
      if (config?.faceSwap && videoPanelRef?.current) {
        try {
          await Promise.all([videoPanelRef.current.startWebRTC(), electron.webRtc.startAgents()]);
        } catch (error) {
          console.error('Failed to start WebRTC or agents:', error);
          throw new Error('Failed to start face swap services');
        }
      }

      // Start transcription services
      await electron.transcription.start();

      // Sleep 3 seconds to ensure the assistant has fully started before allowing stop actions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update running state to Running after successful start
      electron.appState.update({ runningState: RunningState.Running });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start assistant';
      set({
        error: errorMessage,
      });
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

      // Stop WebRTC if face swap is enabled
      if (config?.faceSwap && videoPanelRef?.current) {
        videoPanelRef.current.stopWebRTC();
      }
      await electron.webRtc.stopAgents();

      // Stop assistant services
      await Promise.all([
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
