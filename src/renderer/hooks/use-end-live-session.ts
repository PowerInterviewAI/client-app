import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from './use-app-state';
import { useAssistantService } from './use-assistant-service';
import { useSaveHistoryPrompt } from './use-save-history-guard';
import useTools from './use-tools';

/**
 * Stop the live assistant the way the user means it: end the session, offer to keep it, then
 * leave the console.
 *
 * Stopping used to only stop. The transcript stayed in main-process memory with nothing on
 * screen saying it was still there and nothing saying it was about to go, and the first prompt
 * about saving it arrived at the *start* of the next session - a question about an interview
 * the candidate had finished with an hour earlier. Asking here, while it is still the thing
 * they were just doing, is the only moment the question has an obvious answer.
 *
 * The prompt is unconditional in the sense that matters: it is not a guard the user can cancel
 * out of to stay put. The session has already ended by the time it appears and the buffers are
 * dropped immediately after, so the three buttons are the whole decision - save as one of two
 * formats, or let it go. It is skipped entirely when there is nothing but the placeholder copy
 * to lose, which is what `hasHistory` reports.
 *
 * Deliberately not what the stop *hotkey* does. That one is the stealth-mode escape - it fires
 * while the app is hidden during a screen share, where raising a modal dialog and navigating to
 * a dashboard is the opposite of what was asked for. It stops, and the next start still asks
 * about the transcript it left behind.
 */
export function useEndLiveSession() {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { stopAssistant } = useAssistantService();
  const { clearAll, setPlaceholderData } = useTools();

  const hasContent = (appState?.hasHistory ?? false) || (appState?.hasMockContent ?? false);

  return useCallback(async () => {
    try {
      await stopAssistant();
    } catch (error) {
      // Reported, not rethrown. `stopAssistant` puts the running state back to Idle in a
      // `finally` whatever happened, so the session is over either way and the user still needs
      // the chance to keep what it produced.
      console.error('Failed to stop the assistant cleanly:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to stop the assistant');
    }

    if (hasContent) {
      // The answer is not read: both of them lead to the same two steps. What it decides is
      // whether a file was written before the buffers go, which the dialog has already done by
      // the time this resolves.
      await useSaveHistoryPrompt.getState().prompt('stop');
    }

    try {
      // Both, for the same reason Clear does both: the placeholder state only rewrites what the
      // renderer shows, while the service buffers keep the real transcript until `clearAll`.
      await clearAll();
      await setPlaceholderData();
    } catch (error) {
      // Not fatal to leaving. A console that still holds the last session is untidy; being
      // stranded on it after asking to stop is worse.
      console.error('Failed to clear the finished session:', error);
    }

    navigate('/');
  }, [clearAll, hasContent, navigate, setPlaceholderData, stopAssistant]);
}
