import { getElectron } from '@/lib/utils';
import { DEFAULT_LANGUAGE, Language } from '@/types/language';

const SAMPLE_RATE = 16000;
const MAX_WS_BUFFERED_BYTES = SAMPLE_RATE * 0.3;
const WS_OPEN_TIMEOUT_MS = 5000;
const WS_RETRY_MAX_ATTEMPTS = 5;
const WS_RETRY_BASE_DELAY_MS = 1000;
const WS_RETRY_MAX_DELAY_MS = 8000;
const GET_DISPLAY_MEDIA_TIMEOUT_MS = 20000;
const BACKEND_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : 'https://api.powerinterviewai.com';
const STREAMING_URL = `${BACKEND_BASE_URL.replace('http', 'ws')}/api/asr/streaming`;

/**
 * How many of these sockets a live session holds open: loopback (`ch_0`) and microphone
 * (`ch_1`).
 *
 * The backend divides the interview's per-minute price by this, so it is what makes the price a
 * price for the interview rather than for the socket. It used to assume the number rather than be
 * told it - a flat half per socket - which is correct for exactly this session and wrong for the
 * mock one, which opens a single socket and was therefore billed at half rate.
 */
export const LIVE_STREAM_CHANNELS = 2;

/** A mock interview captures the microphone only - see `mock-transcription.service.ts`. */
export const MOCK_STREAM_CHANNELS = 1;

/**
 * Whether this socket should be charged by the minute.
 *
 * A live interview is: every minute of a real interview is a minute of value the product is
 * delivering, and a clock is the right unit for it. A mock interview is not, and asks for
 * `Unmetered` - it pays per question, follow-up and report instead, and metering it as well would
 * bill one session twice. Most of a mock session's wall clock is the product generating a
 * question, speaking it, scoring the turn or writing the report, none of which the candidate can
 * act during, and the rest is think-time, which is the behaviour the feature exists to train.
 *
 * The backend does not take this on trust - see `stealthUnavailableReason`'s sibling reasoning in
 * `asr.py`: it is honoured only while a paid-for mock turn holds a billing lease open, so a
 * forged `metered=0` on a live session buys nothing.
 */
export const enum StreamMetering {
  Metered = 1,
  Unmetered = 0,
}

/**
 * The streaming URL for one channel.
 *
 * English is sent as no parameter at all rather than as `language=en`. The backend treats an
 * absent language as English, so an English session stays byte-identical to what shipped before
 * the picker existed - which is what the request looks like from every client released before it.
 *
 * `channels` does not get the same treatment, and the difference is worth naming: an absent
 * language means English on every deployment, whereas an absent `channels` means *two*, which is
 * a mock session's bill halved. It is sent whenever it is not the default for that reason - a
 * backend that predates the parameter ignores an unknown query parameter and bills exactly what
 * it billed before, so sending it costs nothing against an older deployment and is the whole fix
 * against a current one.
 *
 * `metered` follows `channels` exactly, and for the same reason it must: a mock session sends
 * **both**. An older backend ignores `metered` and bills the socket by the minute, which is what
 * `channels=1` is there to make correct; a current one honours `metered` and bills nothing here,
 * at which point `channels` is moot. Dropping `channels` once `metered` existed would halve every
 * mock interview's bill on every deployment that has not been updated yet.
 */
function buildStreamingUrl(
  language: Language,
  channels: number,
  metering: StreamMetering
): string {
  const params = new URLSearchParams();
  if (language !== DEFAULT_LANGUAGE) params.set('language', language);
  if (channels !== LIVE_STREAM_CHANNELS) params.set('channels', String(channels));
  if (metering !== StreamMetering.Metered) params.set('metered', String(metering));
  const query = params.toString();
  return query ? `${STREAMING_URL}?${query}` : STREAMING_URL;
}

// Inline AudioWorklet processor (runs off the main thread)
const AUDIO_WORKLET_CODE = `
class AudioSenderWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs) {
    // inputs[0][0] = Float32Array from the microphone / loopback (single channel)
    const input = inputs[0]?.[0];
    if (input && input.length > 0) {
      // Must copy the data - the original buffer is reused by the audio thread
      this.port.postMessage(new Float32Array(input));
    }

    // Zero the output buffer so nothing leaks to the speakers
    // (we still connect to a GainNode with gain = 0 for safety)
    const output = outputs[0]?.[0];
    if (output) {
      output.fill(0);
    }

    return true;
  }
}

registerProcessor('audio-sender-worklet', AudioSenderWorklet);
`;

export type Channel = 'ch_0' | 'ch_1';

/**
 * Resolve a stored device name to its current `deviceId`, or the system default if unset/unknown.
 *
 * Lifted out of `LiveTranscriptionService` (additive - the method itself is unchanged) so
 * `mock-transcription.service.ts` can resolve the same stored preference without depending on the
 * live service or duplicating this lookup.
 */
export async function resolveMicDeviceId(deviceName: string): Promise<string | null> {
  if (!deviceName) return null;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const match = devices.find(
    (device) => device.kind === 'audioinput' && device.label === deviceName
  );
  return match?.deviceId ?? null;
}

export class AudioWsStream {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private monitorGain: GainNode | null = null;
  private active = false;
  private stopping = false;
  private reconnectTimer: number | null = null;

  // Set while setLanguage() is tearing the socket down and bringing it back. The close it
  // causes is not a disconnect, so the ordinary reconnect must not also fire: two connects in
  // flight leave one socket orphaned and still relaying audio into a dead session.
  private switching = false;

  // Bumped per language switch, so a connect loop can tell it has been superseded while it was
  // awaiting - the same guard `micSwitchSeq` gives the device path, and needed here for the same
  // reason. `connectWebSocket` assigns `this.ws` synchronously, so an older loop that wakes from
  // its backoff after a newer one has already opened its socket overwrites the field with its
  // own. The newer socket is then unreferenced: nothing closes it on stop(), and the backend
  // session behind it stays open for the life of the app.
  private switchSeq = 0;

  constructor(
    private readonly channel: Channel,
    private stream: MediaStream,
    private language: Language,
    private readonly onTranscript: (payload: {
      channel: Channel;
      type: 'partial' | 'final';
      text: string;
    }) => Promise<void>,
    /**
     * How many sockets the session this stream belongs to holds open, so the backend can charge
     * the interview once rather than once per socket. Defaults to the live session's two, which
     * is what every caller wanted before a mock session existed.
     */
    private readonly channels: number = LIVE_STREAM_CHANNELS,
    private readonly metering: StreamMetering = StreamMetering.Metered
  ) {}

  async start() {
    this.stopping = false;
    await this.connectWithRetry();

    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);

    // 1. Load the AudioWorklet (required once per AudioContext)
    const workletBlob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(workletBlob);
    try {
      await this.ctx.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl); // clean up immediately
    }

    // 2. Create the worklet node (replaces ScriptProcessorNode)
    this.workletNode = new AudioWorkletNode(this.ctx, 'audio-sender-worklet', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });

    this.monitorGain = this.ctx.createGain();
    this.monitorGain.gain.value = 0;

    // Receive raw Float32 audio buffers from the worklet (off-main-thread)
    this.workletNode.port.onmessage = (event) => {
      if (!this.active || this.ws?.readyState !== WebSocket.OPEN) return;
      if ((this.ws?.bufferedAmount ?? 0) > MAX_WS_BUFFERED_BYTES) {
        console.log(`[AudioWsStream] ws buffer full of ${this.channel} channel, dropping data`);
        return;
      }

      const float32 = event.data as Float32Array;
      const pcm16 = this.convertTo16kPcm(float32, this.ctx?.sampleRate ?? SAMPLE_RATE);
      this.ws?.send(pcm16.buffer as ArrayBuffer);
    };

    // Wire up the audio graph exactly like the old ScriptProcessor version
    this.source.connect(this.workletNode);
    this.workletNode.connect(this.monitorGain);
    this.monitorGain.connect(this.ctx.destination);

    this.active = true;
  }

  async stop() {
    this.active = false;
    this.stopping = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.monitorGain?.disconnect();

    this.workletNode = null;
    this.source = null;
    this.monitorGain = null;

    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close();
    }
    this.ctx = null;

    if (this.ws && this.ws.readyState < WebSocket.CLOSING) {
      this.ws.close();
    }
    this.ws = null;
  }

  /**
   * Point this channel at a different audio source, without reconnecting.
   *
   * Unlike the language, the input device is not a connection parameter - it is only what feeds
   * the worklet - so the socket, the provider session and any utterance in flight all survive.
   * That is why this costs no gap in the transcript where `setLanguage` costs a second or two,
   * and why it is safe to leave the control live during a call.
   *
   * The caller owns stopping the old stream, and must do it *after* this resolves: the tracks
   * are still feeding the graph until the source below is replaced.
   */
  async setStream(stream: MediaStream): Promise<void> {
    this.stream = stream;

    // No context yet: start() has not reached one, or stop() tore it down. The field above is
    // enough, because start() builds its source from it.
    if (!this.ctx) return;

    // Deliberately **not** also gated on `workletNode`. start() creates `source` from
    // `this.stream` and only assigns `workletNode` after `await addModule()`, so there is a real
    // window where a context and a source exist and the node does not. Returning early there
    // would leave `source` bound to the stream the caller is about to stop, and start() would
    // then wire that dead source into the graph - a channel that relays silence for the rest of
    // the session, with the socket up and nothing to show it went wrong.
    this.source?.disconnect();

    // Built on the existing AudioContext on purpose. Its sampleRate is fixed at construction and
    // `convertTo16kPcm` reads it, so making a new context here would silently resample against
    // the wrong rate; `createMediaStreamSource` handles a device that runs at another rate.
    this.source = this.ctx.createMediaStreamSource(stream);

    // Only if the node is already there. If it is not, start() has not reached its own
    // `source.connect(workletNode)` yet, and that line reads `this.source` - which is now this one.
    if (this.workletNode) this.source.connect(this.workletNode);
  }

  /**
   * Re-open this channel's socket on a different language.
   *
   * The language is a connection parameter, so there is no way to change it in place: the socket
   * has to go and come back. That costs a gap of a second or two in this channel's transcription
   * and orphans whatever utterance was mid-flight, which is why the caller is expected to be a
   * deliberate user action rather than anything automatic.
   */
  async setLanguage(language: Language): Promise<void> {
    if (language === this.language) return;
    this.language = language;

    // Keyed on the socket rather than on `active`, which start() only sets *after* its first
    // connect returns. In that window a socket already exists on the old language and would
    // never be reconnected, leaving the channel transcribing in a language nobody selected.
    // No socket means start() has not run or stop() has cleared it, and start() reads the field.
    if (this.stopping || !this.ws) return;

    // Claimed before anything is torn down, so an earlier switch or a woken reconnect that is
    // still inside `connectWithRetry` sees it has been superseded and stops rather than racing
    // this one for `this.ws`.
    const seq = ++this.switchSeq;

    this.switching = true;
    try {
      // Cancel a pending backoff reconnect first, or it wakes up later and opens a second socket.
      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.ws && this.ws.readyState < WebSocket.CLOSING) {
        this.ws.close();
      }
      // Reported here rather than left to onclose. `new WebSocket` below assigns `this.ws`
      // synchronously, so by the time the old socket's close event fires it is no longer the
      // current one and that handler correctly ignores it - which would swallow this too, and
      // leave the orphaned partial gating live suggestions for the rest of the session.
      this.reportDisconnected();
      await this.connectWithRetry();
    } catch (error) {
      // Stopped while the new socket was coming up. That is the assistant shutting down, not a
      // failed switch, and reporting it would toast an error over a deliberate action.
      if (this.stopping) return;

      // Superseded by a later switch, which now owns the channel: it has its own connect in
      // flight and its own backoff to fall back on. Scheduling a reconnect here would open a
      // second socket beside that one, and throwing would warn the user about a language they
      // have already moved off.
      if (seq !== this.switchSeq) return;

      // Hand the channel back to the ordinary backoff loop before reporting. Five failed
      // attempts is a provider or network problem, not a permanent one, and without this the
      // channel stays silent until the assistant is stopped and started - a worse outcome than
      // the language change the user asked for simply taking longer to land.
      this.scheduleReconnect();
      throw error;
    } finally {
      // Only the switch that still owns the channel clears the flag. An older one clearing it
      // would re-arm the ordinary reconnect underneath the newer switch's own close.
      if (seq === this.switchSeq) this.switching = false;
    }
  }

  /**
   * Tell main this channel's session ended mid-utterance.
   *
   * A reconnect - dropped or deliberate - starts a fresh backend session, so any in-flight
   * utterance never gets its final, and the orphaned partial gates live suggestions.
   */
  private reportDisconnected(): void {
    getElectron()
      ?.transcription.channelDisconnected(this.channel)
      .catch((error) => console.error('Failed to report channel disconnect:', error));
  }

  private async connectWithRetry(): Promise<void> {
    // Captured at entry, not read per attempt: this loop belongs to whichever switch, start or
    // reconnect began it, and a bump means a newer switch has taken the channel over.
    const seq = this.switchSeq;

    let lastError: unknown;
    for (let attempt = 0; attempt < WS_RETRY_MAX_ATTEMPTS; attempt++) {
      if (this.stopping) {
        throw new Error(`WebSocket connection stopped for ${this.channel}`);
      }
      // Checked before the socket is built rather than only after. The next line assigns
      // `this.ws`, so a superseded loop waking from its backoff would otherwise overwrite the
      // socket the newer switch has already opened and leave that one unreferenced.
      if (seq !== this.switchSeq) {
        throw new Error(`WebSocket connect superseded for ${this.channel}`);
      }
      try {
        await this.connectWebSocket(seq);
        return;
      } catch (error) {
        lastError = error;
        const delayMs = Math.min(
          WS_RETRY_BASE_DELAY_MS * Math.pow(2, attempt),
          WS_RETRY_MAX_DELAY_MS
        );
        console.warn(
          `[LiveTranscription] WebSocket connect failed for ${this.channel} (attempt ${attempt + 1}/${WS_RETRY_MAX_ATTEMPTS}), retrying in ${delayMs}ms`,
          error
        );
        await this.sleep(delayMs);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Failed to open websocket for ${this.channel}`);
  }

  private connectWebSocket(seq: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Rebuilt per attempt rather than captured once, so a reconnect cannot outlive the
      // language the session opened with.
      const ws = new WebSocket(buildStreamingUrl(this.language, this.channels, this.metering));
      this.ws = ws;
      let settled = false;

      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          ws.close();
        } catch {
          // noop
        }
        reject(new Error(`WebSocket open timed out for ${this.channel}`));
      }, WS_OPEN_TIMEOUT_MS);

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        // Superseded while this socket was still opening - up to WS_OPEN_TIMEOUT_MS of window,
        // which is long enough to cover a second pick from the menu. The newer switch's socket
        // is the one in `this.ws`; keeping this one bound would leave two open on the same
        // session, only one of which stop() can ever close.
        if (seq !== this.switchSeq) {
          try {
            ws.close();
          } catch {
            // noop
          }
          reject(new Error(`WebSocket connect superseded for ${this.channel}`));
          return;
        }
        this.bindWebSocketHandlers(ws);
        resolve();
      };

      ws.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        reject(new Error(`Failed to open websocket for ${this.channel}`));
      };
    });
  }

  private bindWebSocketHandlers(ws: WebSocket): void {
    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const result = JSON.parse(event.data);
        const type = result?.type;
        const text = String(result?.content ?? '').trim();
        if ((type === 'partial' || type === 'final') && text) {
          this.onTranscript({
            channel: this.channel,
            type,
            text,
          }).catch((error) => console.error('Failed to ingest transcript:', error));
        }
      } catch (error) {
        console.error('Failed to parse transcript event:', error);
      }
    };

    ws.onclose = () => {
      if (this.stopping || !this.active) return;
      // A close from a socket that is no longer the current one is not a disconnect; it is the
      // tail of a replacement that already happened. Reconnecting on it would clobber the live
      // socket with a second one.
      if (this.ws !== ws) return;

      this.reportDisconnected();

      // setLanguage owns both the report and the reconnect for the close it caused itself, and
      // reconnects immediately rather than after the backoff delay this would wait out.
      if (this.switching) return;

      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.stopping) return;
    const seq = this.switchSeq;
    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.stopping || !this.active) return;
      // A switch started after this was scheduled, and owns the channel now. setLanguage only
      // clears a timer that is still pending, so one that had already fired reaches here on its
      // own and would reconnect on the language the user has just moved off.
      if (seq !== this.switchSeq) return;
      try {
        await this.connectWithRetry();
        console.info(`[LiveTranscription] Reconnected websocket for ${this.channel}`);
      } catch (error) {
        // Superseded mid-connect - by a switch that began while this loop was awaiting. Retrying
        // would put a second socket beside the one that switch is opening, so the channel is
        // left to it; its own catch hands the channel back to this loop if it fails.
        if (seq !== this.switchSeq) return;
        console.error(`[LiveTranscription] Reconnect failed for ${this.channel}:`, error);
        this.scheduleReconnect();
      }
    }, WS_RETRY_BASE_DELAY_MS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private convertTo16kPcm(input: Float32Array, inputRate: number): Int16Array {
    if (inputRate === SAMPLE_RATE) return this.floatTo16BitPcm(input);
    const ratio = inputRate / SAMPLE_RATE;
    const outputLength = Math.max(1, Math.floor(input.length / ratio));
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      output[i] = input[Math.min(input.length - 1, Math.floor(i * ratio))];
    }
    return this.floatTo16BitPcm(output);
  }

  private floatTo16BitPcm(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }
}

class LiveTranscriptionService {
  private micStream: MediaStream | null = null;
  private loopbackStream: MediaStream | null = null;
  private channels: AudioWsStream[] = [];

  // Held separately from `channels` because the microphone is the only one a device change can
  // move: ch_0 is loopback, captured from the call rather than from a device the user picks.
  private micChannel: AudioWsStream | null = null;

  // Bumped per device change, so a swap can tell it has been superseded while it was awaiting.
  // Two changes in flight resolve in completion order, not request order, so without this the
  // slower one lands last and the session ends up on a device the user already moved off.
  private micSwitchSeq = 0;

  async start(
    audioInputDeviceName: string,
    sessionToken: string,
    language: Language = DEFAULT_LANGUAGE
  ): Promise<void> {
    const electron = getElectron();
    if (!electron) throw new Error('Electron API not available');
    await electron.transcription.setSessionToken(sessionToken);

    const micDeviceId = await resolveMicDeviceId(audioInputDeviceName);
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: micDeviceId ? { deviceId: { exact: micDeviceId } } : true,
      video: false,
    });

    let displayStream: MediaStream;
    try {
      await electron.transcription.enableLoopbackAudio();
      displayStream = await Promise.race([
        navigator.mediaDevices.getDisplayMedia({ audio: true, video: true }),
        new Promise<never>((_, reject) =>
          window.setTimeout(
            () => reject(new Error('Screen capture timed out. Please try again.')),
            GET_DISPLAY_MEDIA_TIMEOUT_MS
          )
        ),
      ]);
    } finally {
      await electron.transcription.disableLoopbackAudio().catch(() => {});
    }

    displayStream.getVideoTracks().forEach((track) => {
      track.stop();
      displayStream.removeTrack(track);
    });
    this.loopbackStream = displayStream;

    const onTranscript = async (payload: {
      channel: Channel;
      type: 'partial' | 'final';
      text: string;
    }) => {
      await electron.transcription.ingest(payload);
    };

    const micChannel = new AudioWsStream('ch_1', this.micStream, language, onTranscript);
    const loopbackChannel = new AudioWsStream('ch_0', this.loopbackStream, language, onTranscript);
    this.micChannel = micChannel;
    this.channels = [micChannel, loopbackChannel];
    await Promise.all(this.channels.map((channel) => channel.start()));
  }

  /**
   * Switch both channels to a new language mid-session.
   *
   * A no-op when nothing is running: the channels array is empty until start(), and start()
   * takes the language it is called with. Suggestions need no equivalent - every request reads
   * the config store when it is built, so the next one already follows the new setting.
   */
  async setLanguage(language: Language): Promise<void> {
    // allSettled, not all: `all` rejects on the first failure and leaves the other channel's
    // rejection unhandled, which surfaces as an unhandledrejection rather than as this throw.
    const results = await Promise.allSettled(
      this.channels.map((channel) => channel.setLanguage(language))
    );

    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
  }

  /**
   * Switch the microphone mid-session.
   *
   * A no-op when nothing is running: `micChannel` is null until start(), and start() resolves
   * the device from the config store itself, so a change made while stopped is already applied
   * by the time anything reads it.
   *
   * The new stream is acquired *before* anything is torn down, and the old one is stopped only
   * once the swap has succeeded. A device that is unplugged, in use, or refused by permissions
   * therefore leaves the session running on the microphone it already had, which is the whole
   * reason this is not a stop-and-start. Only ch_1 moves; ch_0 is loopback audio from the call.
   */
  async setAudioInputDevice(deviceName: string): Promise<void> {
    const channel = this.micChannel;
    if (!channel) return;

    const seq = ++this.micSwitchSeq;

    const deviceId = await resolveMicDeviceId(deviceName);
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false,
    });

    // Stopped, or superseded by a later change, while getUserMedia was resolving. Releasing the
    // stream here matters in both cases: nothing else holds a reference to it, so the device
    // would stay open with its indicator light on for the life of the app.
    if (this.micChannel !== channel || seq !== this.micSwitchSeq) {
      nextStream.getTracks().forEach((track) => track.stop());
      return;
    }

    const previous = this.micStream;
    try {
      await channel.setStream(nextStream);
    } catch (error) {
      nextStream.getTracks().forEach((track) => track.stop());
      throw error;
    }

    this.micStream = nextStream;
    previous?.getTracks().forEach((track) => track.stop());
  }

  async stop(): Promise<void> {
    await Promise.all(this.channels.map((channel) => channel.stop()));
    this.channels = [];
    this.micChannel = null;

    this.micStream?.getTracks().forEach((track) => track.stop());
    this.loopbackStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.loopbackStream = null;
  }
}

export const liveTranscriptionService = new LiveTranscriptionService();
