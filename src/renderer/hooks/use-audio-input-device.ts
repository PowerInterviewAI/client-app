import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { currentTranslation } from '@/i18n';
import { liveTranscriptionService } from '@/services/live-transcription.service';

import { useConfigStore } from './use-config-store';

/**
 * The selected microphone, plus a setter that persists it and applies it to a running session.
 *
 * Shaped like `useInterviewLanguage`, and different from it in the one way that matters: the
 * input device is not a connection parameter, so nothing reconnects. The socket, the provider
 * session and any utterance in flight all survive a swap, which is why this control can stay
 * live during a call without warning the user that the transcript is about to gap.
 *
 * Persisted first, applied second, and never rolled back on failure. A failed swap leaves the
 * session on the microphone it already had - the audio does not stop - so reverting the setting
 * would only leave the user with no route to the device they picked, while leaving it set means
 * stopping and starting the assistant reaches it.
 *
 * That choice has a cost the toast alone does not cover: for the rest of the session the stored
 * device and the live one disagree, and the control shows the stored one. A toast is gone in
 * seconds, so `failedDeviceName` keeps the disagreement available to the dialog - otherwise the
 * candidate is looking at a picker that names a microphone nothing is listening to, with the
 * interviewer telling them they cannot be heard.
 */
export function useAudioInputDevice() {
  const { config } = useConfigStore();
  const [switching, setSwitching] = useState(false);
  const [failedDeviceName, setFailedDeviceName] = useState<string | null>(null);
  const deviceName = config?.audioInputDeviceName ?? '';

  // The same guard `useInterviewLanguage` takes, for the same reason. `micSwitchSeq` in the
  // service abandons a superseded swap, which resolves it as a success here; without this, a
  // swap the user has already moved off would clear the warning raised by the one that replaced
  // it and re-enable the picker while that one is still acquiring its device.
  const switchSeq = useRef(0);

  const setDevice = useCallback(async (name: string) => {
    const { config: current, updateConfig } = useConfigStore.getState();
    if (current?.audioInputDeviceName === name) return;

    const seq = ++switchSeq.current;

    try {
      await updateConfig({ audioInputDeviceName: name });
    } catch (e) {
      console.error('Failed to save the selected microphone', e);
      toast.error(currentTranslation().settingsToasts.saveMicrophoneFailed);
      return;
    }

    setSwitching(true);
    try {
      await liveTranscriptionService.setAudioInputDevice(name);
      if (seq !== switchSeq.current) return;
      // Cleared on success rather than only set on failure: a later swap that works is what
      // resolves the disagreement, and leaving the warning up after it would be its own lie.
      setFailedDeviceName(null);
    } catch (e) {
      if (seq !== switchSeq.current) return;
      // Unplugged, held by another app, or refused by permissions. The session is still running
      // on the previous device, so this is a warning rather than an error, and it says which
      // state the user is actually in - the setting took, the audio did not move.
      console.error('Failed to switch microphone', e);
      setFailedDeviceName(name);
      const t = currentTranslation();
      toast.warning(t.settingsToasts.microphoneSwapFailed, {
        description: t.settingsToasts.microphoneSwapFailedHint,
      });
    } finally {
      // Left set by a superseded swap: the one that replaced it is still in flight, and the
      // spinner belongs to that one until it finishes.
      if (seq === switchSeq.current) setSwitching(false);
    }
  }, []);

  /**
   * Drop the warning without changing the device.
   *
   * Stopping the assistant ends the disagreement by itself - the next start reads the stored
   * device - so the state that produced the warning no longer exists and neither should it.
   */
  const clearFailedDevice = useCallback(() => setFailedDeviceName(null), []);

  return { deviceName, switching, failedDeviceName, setDevice, clearFailedDevice };
}
