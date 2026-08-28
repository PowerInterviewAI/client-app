/**
 * Hands both capture channels up to the main thread, frame-aligned.
 *
 * Two jobs beyond what the app's own worklet does today, and both are the reason this exists:
 * it reads *every* channel of each input rather than only channel 0 (a stereo loopback otherwise
 * loses its right channel, which is half the reference signal), and it batches to 10 ms frames so
 * the two streams arrive as matched pairs the correlator can index directly.
 *
 * A missing input is zero-padded rather than skipped. Dropping the frame instead would let the
 * two channels drift apart in frame count, and every delay estimate downstream is measured in
 * frames.
 */
class EchoProbeWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frameSize = Math.round(sampleRate * 0.01);
    this.ref = new Float32Array(this.frameSize);
    this.mic = new Float32Array(this.frameSize);
    this.filled = 0;
  }

  static sampleAt(input, index) {
    if (!input || input.length === 0) return 0;
    let sum = 0;
    let channels = 0;
    for (let c = 0; c < input.length; c++) {
      const channel = input[c];
      if (!channel || channel.length === 0) continue;
      sum += channel[index] || 0;
      channels++;
    }
    return channels > 0 ? sum / channels : 0;
  }

  static quantumLength(inputs) {
    for (const input of inputs) {
      if (input && input.length > 0 && input[0] && input[0].length > 0) return input[0].length;
    }
    return 128;
  }

  process(inputs) {
    const refIn = inputs[0];
    const micIn = inputs[1];
    const n = EchoProbeWorklet.quantumLength(inputs);

    for (let i = 0; i < n; i++) {
      this.ref[this.filled] = EchoProbeWorklet.sampleAt(refIn, i);
      this.mic[this.filled] = EchoProbeWorklet.sampleAt(micIn, i);
      this.filled++;

      if (this.filled === this.frameSize) {
        this.port.postMessage({
          ref: new Float32Array(this.ref),
          mic: new Float32Array(this.mic),
        });
        this.filled = 0;
      }
    }

    return true;
  }
}

registerProcessor('echo-probe', EchoProbeWorklet);
