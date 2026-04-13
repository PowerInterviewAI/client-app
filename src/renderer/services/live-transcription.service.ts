import { getElectron } from '@/lib/utils';

const SAMPLE_RATE = 16000;
const PROCESSOR_BUFFER_SIZE = 4096;
const MAX_WS_BUFFERED_BYTES = 512 * 1024;
const BACKEND_BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.powerinterviewai.com';
const STREAMING_URL = `${BACKEND_BASE_URL.replace('http', 'ws')}/api/asr/streaming`;

type Channel = 'ch_0' | 'ch_1';

class AudioWsStream {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private monitorGain: GainNode | null = null;
  private active = false;

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
    this.ws = new WebSocket(STREAMING_URL);
    await new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket not initialized'));
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error(`Failed to open websocket for ${this.channel}`));
    });

    this.ws.onmessage = (event) => {
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

    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1);
    this.monitorGain = this.ctx.createGain();
    this.monitorGain.gain.value = 0;
    this.processor.onaudioprocess = (event) => {
      if (!this.active || this.ws?.readyState !== WebSocket.OPEN) return;
      if ((this.ws?.bufferedAmount ?? 0) > MAX_WS_BUFFERED_BYTES) return;
      const float32 = event.inputBuffer.getChannelData(0);
      const pcm16 = this.convertTo16kPcm(float32, this.ctx?.sampleRate ?? SAMPLE_RATE);
      this.ws?.send(pcm16);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.monitorGain);
    this.monitorGain.connect(this.ctx.destination);
    this.active = true;
  }

  async stop() {
    this.active = false;
    this.processor?.disconnect();
    this.source?.disconnect();
    this.monitorGain?.disconnect();
    this.processor = null;
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
