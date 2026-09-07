import { getElectron } from '@/lib/utils';
import { Language } from '@/types/language';

import { AudioWsStream, resolveMicDeviceId } from './live-transcription.service';

/**
 * Microphone-only capture for a mock interview.
 *
 * A sibling to `LiveTranscriptionService`, not a mode flag added to it. `AudioWsStream` itself is
 * reused unmodified - its `switchSeq`/`setLanguage`/`setStream` race guards are pinned by
 * source-level tests, and a mode flag threaded through `start`/`stop`/`setLanguage` would be
 * exactly the kind of change that could leak a mock-mode bug into the live path.
 *
 * The one thing that matters here is what this service does **not** do: it never calls
 * `getDisplayMedia` or `enableLoopbackAudio`. Capturing loopback would feed the interviewer's own
 * TTS voice back in as "interviewer audio" - digitally, at full fidelity - which is the acoustic
 * feedback problem the transmit gate in `mock-tts.service.ts` exists to solve, reopened through a
 * second door. It also never calls `electron.transcription.*` - answers are ingested through
 * `electron.mockInterview.ingestAnswer`, so a mock session never touches `transcriptService`,
 * never writes `appState.transcripts`, and never fires a live suggestion for a practice answer.
 */
class MockTranscriptionService {
  private micStream: MediaStream | null = null;
  private channel: AudioWsStream | null = null;

  async start(
    audioInputDeviceName: string,
    sessionToken: string,
    language: Language
  ): Promise<void> {
    const electron = getElectron();
    if (!electron) throw new Error('Electron API not available');
    await electron.transcription.setSessionToken(sessionToken);

    const micDeviceId = await resolveMicDeviceId(audioInputDeviceName);
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: micDeviceId
        ? {
            deviceId: { exact: micDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });

    const onTranscript = async (payload: { type: 'partial' | 'final'; text: string }) => {
      await electron.mockInterview.ingestAnswer(payload);
    };

    try {
      this.channel = new AudioWsStream('ch_1', this.micStream, language, onTranscript);
      await this.channel.start();
    } catch (error) {
      // The microphone is already open by this point, and a caller that never saw `start()`
      // return has no reason to think it needs stopping - `useMockInterview` only arms its own
      // teardown *after* this resolves. Left as it was, a failed start held the device with its
      // indicator light on for the life of the app, and every retry took another one.
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.channel?.stop();
    this.channel = null;

    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
  }

  /** The live mic stream, for the transmit gate and the level meter to attach to. */
  getStream(): MediaStream | null {
    return this.micStream;
  }
}

export const mockTranscriptionService = new MockTranscriptionService();
