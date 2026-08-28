/**
 * Measures the coupling between the loopback reference and the microphone. Measures only - there
 * is deliberately no gating here, because this runs *before* the gate exists and is what its
 * constants get sized from.
 *
 * Three numbers come out of it, per machine:
 *
 *   delayMs      how far the mic's copy of the interviewer trails the loopback's, and crucially
 *                its SIGN. The acoustic path is always mic-after-speaker, but what is measured
 *                here is arrival order at the worklet, and Chromium's getDisplayMedia loopback
 *                path carries its own latency. If it is the slower of the two, the reference
 *                arrives after the echo it explains and the lag is negative - which a one-sided
 *                0..MAX search would miss entirely, on exactly the setup the gate exists for.
 *   correlation  peak height of the normalised cross-correlation at that lag. This is what
 *                separates a speaker setup from headphones, and what CORR_MIN gets set from.
 *   erlDb        echo return loss: how far below the reference the mic's copy sits. This is the
 *                residual echo level, so it is also the number the echoCancellation and
 *                autoGainControl A/B is scored on.
 */
const { ipcRenderer } = require('electron');

const FRAME_MS = 10;
const HISTORY_FRAMES = 400; // 4 s
const XCORR_INTERVAL_MS = 500;
const REPORT_INTERVAL_MS = 1000;

// Deliberately WIDER than the window the gate is expected to ship with (-300..+600 ms). The
// probe's whole job is to find out whether the real value lands near an edge, and a search that
// stops exactly where the proposed window stops cannot tell "the peak is at the edge" from "the
// window is too small".
const MIN_LAG_MS = -400;
const MAX_LAG_MS = 800;

// Frames quieter than this carry no reference to correlate against, and including them drags
// every estimate toward the noise floor.
const REF_FLOOR_DBFS = -55;

// Peak height alone cannot tell coupling from noise, and this is the single most important thing
// the probe has measured so far. The search takes the MAX over ~120 candidate lags, and the max of
// many correlations is biased upward, so unrelated signals score far higher than intuition
// suggests: measured 0.53 on pure silence and 0.57 on two independent bursty signals. A threshold
// of 0.5 - which looks entirely reasonable written down - would call both of those "coupled".
//
// Getting that wrong has an asymmetric cost. A false "coupled" on a HEADPHONE user is what leads a
// gate to start cutting a microphone that was never echoing anything.
//
// So the discriminator is peak PROMINENCE: how far the best lag stands above the typical lag. A
// real echo puts a sharp peak on an otherwise flat correlation surface; unrelated signals produce
// a surface that is uniformly mediocre, with a high maximum and no peak.
//
// CORR_MIN is kept alongside it as a cheap floor, not as the discriminator - on its own it is
// exactly the threshold shown above to be useless. Both must pass.
//
// A starting threshold, to be re-derived from real runs rather than trusted. Synthetic signals
// suggested a comfortable gap - 0.28 for an unrelated pair against 0.87-1.13 for a clean echo -
// but a live run of this probe on a silent room reached 0.47, which leaves almost nothing between
// the noise and the threshold. Both ends of the synthetic gap are optimistic: that echo is a
// perfectly scaled copy and a real one scores lower, while that "unrelated" pair shares a burst
// grid and so scores higher than truly unrelated audio.
//
// This is why the run-level verdict requires several coupled reports rather than one. A single
// report crossing this line is exactly what a quiet room produces from time to time.
//
// The per-second output prints the raw numbers whatever this is set to, which is the point:
// measure the real distribution first, then set it.
const CORR_MIN = 0.5;
const PROMINENCE_MIN = 0.5;

const MIN_OVERLAP_FRAMES = 50; // 0.5 s
const DISPLAY_MEDIA_TIMEOUT_MS = 20000;

const status = (text) => {
  document.getElementById('status').textContent = text;
};

const toDb = (power) => 10 * Math.log10(power + 1e-12);

function meanSquare(frame) {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return sum / (frame.length || 1);
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Pearson correlation of the two log-energy envelopes with the reference shifted by `lag` frames.
 *
 * Envelopes rather than the waveforms themselves: the echo path filters the signal heavily, so
 * sample-level correlation collapses while the energy contour survives. Positive `lag` means the
 * mic trails the reference.
 */
function correlateAt(refDb, micDb, lag) {
  const lo = Math.max(0, lag);
  const hi = Math.min(micDb.length, refDb.length + lag);
  const n = hi - lo;
  if (n < MIN_OVERLAP_FRAMES) return null;

  let sumRef = 0;
  let sumMic = 0;
  for (let f = lo; f < hi; f++) {
    sumRef += refDb[f - lag];
    sumMic += micDb[f];
  }
  const meanRef = sumRef / n;
  const meanMic = sumMic / n;

  let num = 0;
  let devRef = 0;
  let devMic = 0;
  for (let f = lo; f < hi; f++) {
    const dr = refDb[f - lag] - meanRef;
    const dm = micDb[f] - meanMic;
    num += dr * dm;
    devRef += dr * dr;
    devMic += dm * dm;
  }
  if (devRef <= 0 || devMic <= 0) return null;
  return num / Math.sqrt(devRef * devMic);
}

class CouplingMeter {
  constructor() {
    this.refDb = [];
    this.micDb = [];
    this.lastXcorrAt = 0;
    this.lag = null;
    this.correlation = null;
    this.prominence = null;
    this.erlDb = null;
    this.samples = [];
    this.frames = 0;
  }

  push(ref, mic) {
    this.frames++;
    this.refDb.push(toDb(meanSquare(ref)));
    this.micDb.push(toDb(meanSquare(mic)));
    if (this.refDb.length > HISTORY_FRAMES) this.refDb.shift();
    if (this.micDb.length > HISTORY_FRAMES) this.micDb.shift();

    // Paced on the wall clock, which is fine here because frames genuinely arrive at 100/s from a
    // live capture. Worth knowing before this is copied into the gate: it makes the class
    // untestable from synthetic input, since a test loop feeds thousands of frames in a few
    // milliseconds and no interval ever elapses. A gate that needs unit tests should pace on a
    // frame counter instead.
    const now = performance.now();
    if (now - this.lastXcorrAt >= XCORR_INTERVAL_MS) {
      this.lastXcorrAt = now;
      this.estimate();
    }
  }

  estimate() {
    const minLag = Math.round(MIN_LAG_MS / FRAME_MS);
    const maxLag = Math.round(MAX_LAG_MS / FRAME_MS);

    let bestLag = null;
    let bestCorr = -2;
    const all = [];
    for (let lag = minLag; lag <= maxLag; lag++) {
      const corr = correlateAt(this.refDb, this.micDb, lag);
      if (corr === null) continue;
      all.push(corr);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    if (bestLag === null) return;

    this.lag = bestLag;
    this.correlation = bestCorr;
    // Against the median rather than the mean: a true echo's peak is broad enough to span several
    // lags, and those neighbours would drag a mean up with it and hide the very prominence being
    // measured.
    this.prominence = bestCorr - median(all);

    // Only over frames with a live reference, or the ratio is two noise floors divided.
    const ratios = [];
    const lo = Math.max(0, bestLag);
    const hi = Math.min(this.micDb.length, this.refDb.length + bestLag);
    for (let f = lo; f < hi; f++) {
      const refFrame = this.refDb[f - bestLag];
      if (refFrame < REF_FLOOR_DBFS) continue;
      ratios.push(this.micDb[f] - refFrame);
    }
    this.erlDb = median(ratios);

    // All three conditions, and each rules out a different way of being wrong: a live reference
    // (or the ratio is two noise floors divided), a peak worth having, and a peak that actually
    // stands out from its neighbours rather than merely topping a flat surface.
    if (this.isCoupled()) {
      this.samples.push({
        delayMs: bestLag * FRAME_MS,
        correlation: bestCorr,
        prominence: this.prominence,
        erlDb: this.erlDb,
      });
    }
  }

  activePct(series) {
    if (series.length === 0) return 0;
    const active = series.filter((db) => db >= REF_FLOOR_DBFS).length;
    return (100 * active) / series.length;
  }

  isCoupled() {
    return (
      this.correlation !== null &&
      this.correlation >= CORR_MIN &&
      this.prominence !== null &&
      this.prominence >= PROMINENCE_MIN &&
      this.erlDb !== null
    );
  }

  snapshot() {
    return {
      delayMs: this.lag === null ? null : this.lag * FRAME_MS,
      correlation: this.correlation,
      prominence: this.prominence,
      erlDb: this.erlDb,
      refActivePct: this.activePct(this.refDb),
      micActivePct: this.activePct(this.micDb),
      coupled: this.isCoupled(),
      // Reported so a stalled capture is visible. Nothing else here would show it: push() simply
      // stops being called, the report timer keeps firing, and the same numbers print every
      // second looking exactly like a steady measurement.
      frames: this.frames,
    };
  }

  summary() {
    if (this.samples.length === 0) return { samples: 0, searchWindow: [MIN_LAG_MS, MAX_LAG_MS] };
    const delays = this.samples.map((s) => s.delayMs);
    const corrs = this.samples.map((s) => s.correlation);
    const proms = this.samples.map((s) => s.prominence);
    const erls = this.samples.map((s) => s.erlDb).filter((v) => v !== null);
    return {
      samples: this.samples.length,
      delayMsMedian: median(delays),
      delayMsMin: Math.min(...delays),
      delayMsMax: Math.max(...delays),
      correlationMedian: median(corrs),
      prominenceMedian: median(proms),
      erlDbMedian: median(erls),
      searchWindow: [MIN_LAG_MS, MAX_LAG_MS],
    };
  }
}

async function resolveMicDeviceId(deviceName) {
  if (!deviceName) return null;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const match = devices.find((d) => d.kind === 'audioinput' && d.label === deviceName);
  return match ? match.deviceId : null;
}

async function main() {
  const options = await ipcRenderer.invoke('probe:options');

  status('acquiring microphone...');
  // enumerateDevices only fills in labels once a capture has been granted, so an unconstrained
  // open comes first and is released immediately.
  const priming = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  priming.getTracks().forEach((t) => t.stop());

  const deviceId = await resolveMicDeviceId(options.device);
  if (options.device && !deviceId) {
    throw new Error('No audio input device named "' + options.device + '"');
  }

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: options.echoCancellation,
      noiseSuppression: options.noiseSuppression,
      autoGainControl: options.autoGainControl,
    },
    video: false,
  });

  status('acquiring loopback...');
  await ipcRenderer.invoke('enable-loopback-audio');
  let displayStream;
  try {
    // Bounded the same way live-transcription.service.ts bounds it. Unbounded, a loopback that
    // never resolves leaves the probe sitting silently with no output and nothing to read.
    displayStream = await Promise.race([
      navigator.mediaDevices.getDisplayMedia({ audio: true, video: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Loopback capture timed out')), DISPLAY_MEDIA_TIMEOUT_MS)
      ),
    ]);
  } finally {
    await ipcRenderer.invoke('disable-loopback-audio').catch(() => {});
  }
  displayStream.getVideoTracks().forEach((track) => {
    track.stop();
    displayStream.removeTrack(track);
  });

  const micTrack = micStream.getAudioTracks()[0];
  ipcRenderer.send('probe:ready', {
    micLabel: micTrack ? micTrack.label : '(none)',
    micSettings: micTrack ? micTrack.getSettings() : {},
    loopbackTracks: displayStream.getAudioTracks().length,
  });

  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule('worklet.js');

  const node = new AudioWorkletNode(ctx, 'echo-probe', {
    numberOfInputs: 2,
    numberOfOutputs: 1,
  });

  const refSource = ctx.createMediaStreamSource(displayStream);
  const micSource = ctx.createMediaStreamSource(micStream);
  refSource.connect(node, 0, 0);
  micSource.connect(node, 0, 1);

  // Same silent sink the app uses: the graph needs a path to the destination to be pulled, and
  // nothing here may reach the speakers - that would feed back into the very signal being measured.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  node.connect(sink);
  sink.connect(ctx.destination);

  const meter = new CouplingMeter();
  node.port.onmessage = (event) => meter.push(event.data.ref, event.data.mic);

  status('measuring - play interviewer audio through the speakers now');

  const reportTimer = setInterval(() => {
    ipcRenderer.send('probe:metrics', { ...meter.snapshot(), sampleRate: ctx.sampleRate });
  }, REPORT_INTERVAL_MS);

  setTimeout(() => {
    clearInterval(reportTimer);
    ipcRenderer.send('probe:done', meter.summary());
    micStream.getTracks().forEach((t) => t.stop());
    displayStream.getTracks().forEach((t) => t.stop());
    ctx.close();
  }, options.seconds * 1000);
}

main().catch((error) => {
  status('failed: ' + error.message);
  ipcRenderer.send('probe:error', String(error && error.stack ? error.stack : error));
});
