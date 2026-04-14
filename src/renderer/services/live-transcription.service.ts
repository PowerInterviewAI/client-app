import { getElectron } from '@/lib/utils';

const SAMPLE_RATE = 16000;
const MAX_WS_BUFFERED_BYTES = SAMPLE_RATE * 0.3;
const WS_OPEN_TIMEOUT_MS = 5000;
const WS_RETRY_MAX_ATTEMPTS = 5;
const WS_RETRY_BASE_DELAY_MS = 1000;
const WS_RETRY_MAX_DELAY_MS = 8000;
const BACKEND_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : 'https://api.powerinterviewai.com';
const STREAMING_URL = `${BACKEND_BASE_URL.replace('http', 'ws')}/api/asr/streaming`;

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

type Channel = 'ch_0' | 'ch_1';

class AudioWsStream {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private monitorGain: GainNode | null = null;
  private active = false;
  private stopping = false;
  private reconnectTimer: number | null = null;

  constructor(
    private readonly channel: Channel,
    private readonly stream: MediaStream,
    private readonly onTranscript: (payload: {
      channel: Channel;
      type: 'partial' | 'final';
      text: string;
    }) => Promise<void>
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
      this.ws?.send(pcm16);
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

  private async connectWithRetry(): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < WS_RETRY_MAX_ATTEMPTS; attempt++) {
      if (this.stopping) {
        throw new Error(`WebSocket connection stopped for ${this.channel}`);
      }
      try {
        await this.connectWebSocket();
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

  private connectWebSocket(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(STREAMING_URL);
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
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.stopping) return;
    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.stopping || !this.active) return;
      try {
        await this.connectWithRetry();
        console.info(`[LiveTranscription] Reconnected websocket for ${this.channel}`);
      } catch (error) {
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

  async start(audioInputDeviceName: string, sessionToken: string): Promise<void> {
    const electron = getElectron();
    if (!electron) throw new Error('Electron API not available');
    await electron.transcription.setSessionToken(sessionToken);

    const micDeviceId = await this.resolveMicDeviceId(audioInputDeviceName);
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: micDeviceId ? { deviceId: { exact: micDeviceId } } : true,
      video: false,
    });

    await electron.transcription.enableLoopbackAudio();
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true,
    });
    await electron.transcription.disableLoopbackAudio();

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

    const micChannel = new AudioWsStream('ch_1', this.micStream, onTranscript);
    const loopbackChannel = new AudioWsStream('ch_0', this.loopbackStream, onTranscript);
    this.channels = [micChannel, loopbackChannel];
    await Promise.all(this.channels.map((channel) => channel.start()));
  }

  async stop(): Promise<void> {
    await Promise.all(this.channels.map((channel) => channel.stop()));
    this.channels = [];

    this.micStream?.getTracks().forEach((track) => track.stop());
    this.loopbackStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.loopbackStream = null;
  }

  private async resolveMicDeviceId(deviceName: string): Promise<string | null> {
    if (!deviceName) return null;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const match = devices.find(
      (device) => device.kind === 'audioinput' && device.label === deviceName
    );
    return match?.deviceId ?? null;
  }
}

export const liveTranscriptionService = new LiveTranscriptionService();
