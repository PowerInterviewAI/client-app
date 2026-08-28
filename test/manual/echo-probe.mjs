/**
 * Manual measurement of how much of the interviewer's audio the microphone re-captures.
 *
 * When the candidate listens on speakers, the mic picks the interviewer up too, so the same words
 * arrive on both channels. `transcript.service.ts` attributes speaker purely by channel name, so
 * the echo is filed as the candidate - and a recent `Self` final is exactly what
 * `skipDueToRecentSelf` suppresses live suggestions on. The suppression is silent, which is what
 * makes it worth measuring rather than reasoning about.
 *
 * Nothing here gates or fixes anything. It reports three numbers, and the constants of any gate
 * built later have to be sized from them rather than guessed:
 *
 *   delayMs      arrival-order difference between the two channels, WITH ITS SIGN. Chromium's
 *                getDisplayMedia loopback path carries its own latency, and if it is the slower
 *                of the two, the reference arrives *after* the mic's echo of it. A gate that
 *                searched only 0..MAX would find no peak on precisely the machines that need it.
 *   correlation  peak height at that lag - what separates speakers from headphones.
 *   erlDb        how far below the reference the echo sits. Also the score for the A/B below.
 *
 * Not in `test/run.mjs`: it needs a desktop session, real speakers, and a person to play audio
 * into them. CI runs headless Linux.
 *
 *   cd client
 *   pnpm exec electron test/manual/echo-probe.mjs
 *   pnpm exec electron test/manual/echo-probe.mjs --seconds=60 --device="Microphone (Realtek)"
 *
 * The A/B the constraints work exists for - run each twice and compare `erlDb`:
 *
 *   pnpm exec electron test/manual/echo-probe.mjs --no-aec
 *   pnpm exec electron test/manual/echo-probe.mjs --no-agc
 *
 * Play a recorded interview through the speakers at a normal listening volume for the whole run,
 * and stay quiet - near-end speech is what poisons an ERL estimate.
 *
 * If `electron --version` prints a Node version rather than an Electron one, `ELECTRON_RUN_AS_NODE`
 * is set in your shell; clear it first.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import loopbackPkg from 'electron-audio-loopback';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);

const FLAGS = ['--no-aec', '--no-ns', '--no-agc'];
const VALUES = ['seconds', 'device'];

// Rejected rather than ignored, because the whole point of the flags is the A/B: a mistyped
// `--noaec` that is silently dropped runs with echo cancellation ON and reports a perfectly
// plausible number for the configuration you were trying to rule out.
const unknown = args.filter(
  (a) => !FLAGS.includes(a) && !VALUES.some((name) => a.startsWith(`--${name}=`))
);
if (unknown.length > 0) {
  console.error(`Unknown argument(s): ${unknown.join(' ')}`);
  console.error(`Expected: ${FLAGS.join(' ')} ${VALUES.map((v) => `--${v}=...`).join(' ')}`);
  process.exit(2);
}

const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};

const seconds = Number(value('seconds', 45));
if (!Number.isFinite(seconds) || seconds <= 0) {
  // Left unchecked this reaches setTimeout as NaN, which fires immediately - so the run ends
  // before it starts and reports "no correlated frames", which reads like a headphone result.
  console.error(`--seconds must be a positive number, got "${value('seconds', '')}"`);
  process.exit(2);
}

const options = {
  seconds,
  device: value('device', ''),
  echoCancellation: !flag('--no-aec'),
  noiseSuppression: !flag('--no-ns'),
  autoGainControl: !flag('--no-agc'),
};

// Must run before the app is ready: it appends a Chromium feature switch as well as registering
// the two IPC handlers, and the switch is only read at startup.
loopbackPkg.initMain();

const num = (v, digits = 1) => (v === null || v === undefined ? '  --' : v.toFixed(digits));

// Counted, not latched. A single coupled report out of forty is noise, not a speaker setup, and
// the whole reason prominence exists is that spurious single-report verdicts are reachable. A
// boolean here would let one of them decide the headline finding for the entire run.
let coupledReports = 0;
let totalReports = 0;
let lastFrames = 0;
let stalled = false;

ipcMain.handle('probe:options', () => options);

ipcMain.on('probe:ready', (_event, info) => {
  console.log(`\nmicrophone : ${info.micLabel}`);
  console.log(
    `  requested: aec=${options.echoCancellation} ns=${options.noiseSuppression} agc=${options.autoGainControl}`
  );
  console.log(
    `  applied  : aec=${info.micSettings.echoCancellation} ns=${info.micSettings.noiseSuppression} agc=${info.micSettings.autoGainControl}`
  );
  console.log(`loopback   : ${info.loopbackTracks} audio track(s)`);
  console.log(
    `\nPlay interviewer audio through the speakers for ${options.seconds}s. Stay quiet.\n`
  );
  console.log('    delayMs   corr   prom    erlDb   ref%   mic%   coupled');
  console.log('    -------   ----   ----    -----   ----   ----   -------');
});

ipcMain.on('probe:metrics', (_event, m) => {
  totalReports++;
  if (m.coupled) coupledReports++;

  // No new frames since the last report means the capture has stopped feeding the graph - an
  // unplugged device, or a suspended context. Every column below is then a stale reading of a
  // dead stream, which is worse than no reading at all because it looks like data.
  const advanced = m.frames - lastFrames;
  lastFrames = m.frames;
  if (advanced === 0) {
    stalled = true;
    console.log('    -- no audio frames received since the last report (capture stalled) --');
    return;
  }

  console.log(
    `    ${String(m.delayMs === null ? '--' : m.delayMs).padStart(7)}` +
      `   ${num(m.correlation, 2).padStart(4)}` +
      `   ${num(m.prominence, 2).padStart(4)}` +
      `   ${num(m.erlDb).padStart(6)}` +
      `   ${num(m.refActivePct, 0).padStart(4)}` +
      `   ${num(m.micActivePct, 0).padStart(4)}` +
      `   ${m.coupled ? 'yes' : 'no'}`
  );
});

ipcMain.on('probe:done', (_event, summary) => {
  console.log('\n=== summary ===');
  if (!summary.samples) {
    console.log('No correlated frames. Either this is a headphone setup (the good case), or no');
    console.log('audio was playing through the speakers during the run - check the ref% column.');
    console.log(`search window: ${summary.searchWindow[0]}..${summary.searchWindow[1]} ms`);
  } else {
    console.log(`accepted estimates : ${summary.samples}`);
    console.log(
      `delayMs            : median ${summary.delayMsMedian}, range ${summary.delayMsMin}..${summary.delayMsMax}`
    );
    console.log(`correlation        : median ${num(summary.correlationMedian, 2)}`);
    console.log(`prominence         : median ${num(summary.prominenceMedian, 2)}`);
    console.log(`erlDb              : median ${num(summary.erlDbMedian)}`);
    console.log(`search window      : ${summary.searchWindow[0]}..${summary.searchWindow[1]} ms`);

    const [lo, hi] = summary.searchWindow;
    if (summary.delayMsMedian <= lo + 50 || summary.delayMsMedian >= hi - 50) {
      console.log(
        '\nWARNING: the peak sits at the edge of the search window, so the true delay may'
      );
      console.log('lie outside it. Widen MIN_LAG_MS/MAX_LAG_MS in renderer.js and re-run before');
      console.log('treating this number as the real one.');
    }
    if (summary.delayMsMedian < 0) {
      console.log('\nNote: the delay is NEGATIVE - the loopback reference arrives after the mic');
      console.log('echo it explains. Any gate on this machine has to search signed lags and delay');
      console.log('the mic to keep its decisions causal.');
    }
  }
  const pct = totalReports > 0 ? Math.round((100 * coupledReports) / totalReports) : 0;
  console.log('');
  console.log(`coupled reports    : ${coupledReports}/${totalReports} (${pct}%)`);
  if (coupledReports === 0) {
    console.log('verdict            : no coupling (headphones, or nothing played through them)');
  } else if (coupledReports >= 3 && pct >= 20) {
    console.log('verdict            : coupled (speakers)');
  } else {
    console.log('verdict            : INCONCLUSIVE - too few coupled reports to call it either');
    console.log('                     way. Re-run with audio playing for the whole duration.');
  }
  if (stalled) {
    console.log('');
    console.log('WARNING: the capture stalled during this run, so the numbers above cover');
    console.log('less audio than the requested duration. Re-run before recording them.');
    console.log('audio than the requested duration. Re-run before recording them.');
  }
  app.quit();
});

ipcMain.on('probe:error', (_event, message) => {
  console.error('\nprobe failed:\n' + message);
  process.exitCode = 1;
  app.quit();
});

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 520,
    height: 200,
    title: 'Echo probe',
    webPreferences: {
      // A local, hand-run diagnostic that has to reach ipcRenderer from a plain script tag. The
      // shipped app does the opposite - see navigation-guard.ts - and nothing here loads remote
      // content.
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  await win.loadFile(path.join(HERE, 'echo-probe', 'index.html'));
});

app.on('window-all-closed', () => app.quit());
