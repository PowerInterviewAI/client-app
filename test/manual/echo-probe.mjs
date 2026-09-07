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
 *   pnpm exec electron test/manual/echo-probe.mjs --no-ns
 *
 * If the summary says the peak sits at the edge of the search window, it names the flag to widen
 * it with. The window is `--min-lag=` / `--max-lag=`, in ms, and it is signed:
 *
 *   pnpm exec electron test/manual/echo-probe.mjs --min-lag=-1000
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
const VALUES = ['seconds', 'device', 'min-lag', 'max-lag'];

// The lag search window, in ms, and deliberately WIDER than the window any gate is expected to
// ship with (-300..+600). The probe's job includes finding out whether the real value lands near
// an edge, and a search that stops exactly where the proposed window stops cannot tell "the peak
// is at the edge" from "the window is too small".
//
// Overridable because the first machine actually measured put its peak at -400, the floor of this
// default, which is the probe reporting that the window is too small - and the summary's answer to
// that is "widen it and re-run". That should not mean editing renderer.js.
const DEFAULT_MIN_LAG_MS = -400;
const DEFAULT_MAX_LAG_MS = 800;

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

/** A lag bound in ms, or its default. Rejected rather than coerced, for the `--seconds` reason. */
const lagMs = (name, fallback) => {
  const raw = value(name, null);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    console.error(`--${name} must be a number of milliseconds, got "${raw}"`);
    process.exit(2);
  }
  return parsed;
};

const minLagMs = lagMs('min-lag', DEFAULT_MIN_LAG_MS);
const maxLagMs = lagMs('max-lag', DEFAULT_MAX_LAG_MS);
if (minLagMs >= maxLagMs) {
  // Inverted or empty, the lag loop runs zero times, no estimate is ever produced, and the run
  // reports no correlated frames - which reads exactly like a headphone result.
  console.error(`--min-lag must be below --max-lag, got ${minLagMs} and ${maxLagMs}`);
  process.exit(2);
}

const options = {
  seconds,
  minLagMs,
  maxLagMs,
  device: value('device', ''),
  echoCancellation: !flag('--no-aec'),
  noiseSuppression: !flag('--no-ns'),
  autoGainControl: !flag('--no-agc'),
};

// Must run before the app is ready: it appends a Chromium feature switch as well as registering
// the two IPC handlers, and the switch is only read at startup.
loopbackPkg.initMain();

const num = (v, digits = 1) => (v === null || v === undefined ? '  --' : v.toFixed(digits));

/**
 * Quit with a real exit status.
 *
 * `process.exitCode = 1` followed by `app.quit()` does not survive: Electron ends the process
 * through its own path and the status comes out 0, so every failure here reported success to the
 * shell. Verified - a `--device` that does not exist printed its error and exited 0. `app.exit`
 * is the one that carries the code.
 *
 * The writes above it are `console.error`, which is synchronous to a TTY and to a pipe on the
 * platforms this runs on, so the message is out before the process goes.
 */
const quitWith = (code) => app.exit(code);

// Counted, not latched. A single coupled report out of forty is noise, not a speaker setup, and
// the whole reason prominence exists is that spurious single-report verdicts are reachable. A
// boolean here would let one of them decide the headline finding for the entire run.
let coupledReports = 0;
let totalReports = 0;
let lastFrames = 0;
let stalled = false;
let deadTracks = false;

// The loudest the reference ever got, as a percentage of frames above the floor. A run where this
// stays at zero played nothing for the microphone to re-capture, so it measured nothing about
// coupling - and that is a different answer from "headphones", which the summary used to offer as
// an equal possibility rather than ruling it out with the column it already had.
let peakRefActivePct = 0;
const REF_ACTIVE_MIN_PCT = 5;

// Whether the run reached an end of its own - a summary or a reported failure. Closing the window
// is an ordinary thing to do to a window, and without this it ends the process quietly at exit 0,
// which is indistinguishable from a run that completed and says nothing about the missing summary.
let finished = false;

ipcMain.handle('probe:options', () => options);

ipcMain.on('probe:ready', (_event, info) => {
  console.log(`\nmicrophone : ${info.micLabel}`);
  console.log(
    `  requested: aec=${options.echoCancellation} ns=${options.noiseSuppression} agc=${options.autoGainControl}`
  );
  console.log(
    `  applied  : aec=${info.micSettings.echoCancellation} ns=${info.micSettings.noiseSuppression} agc=${info.micSettings.autoGainControl}`
  );
  // The A/B is scored by running with one flag off and comparing erlDb, which measures nothing if
  // the platform quietly declined to turn it off: two runs of the same configuration, reported as
  // a comparison. These constraints are advisory, so Chromium is free to ignore them and say so
  // only in getSettings(). This is the same failure as the mistyped `--noaec` the argument parser
  // rejects above, one layer down and not the operator's fault, so it is worth as much noise.
  const FLAG_KEYS = [
    ['aec', 'echoCancellation'],
    ['ns', 'noiseSuppression'],
    ['agc', 'autoGainControl'],
  ];
  const ignored = FLAG_KEYS.filter(
    ([, key]) => info.micSettings[key] !== undefined && info.micSettings[key] !== options[key]
  );
  const unreported = FLAG_KEYS.filter(([, key]) => info.micSettings[key] === undefined);
  if (ignored.length > 0) {
    const names = ignored.map(([short]) => short).join(' and ');
    console.log(
      `\nWARNING: this device did not apply ${names} as requested. An A/B that differs only in\n` +
        'that flag is then comparing two runs of the same configuration. Score erlDb on another\n' +
        'device, or drop that flag from the comparison.'
    );
  }
  if (unreported.length > 0) {
    const names = unreported.map(([short]) => short).join(', ');
    console.log(
      `\nNote: this device does not report ${names} back, so whether the request was honoured\n` +
        'cannot be confirmed from here.'
    );
  }

  console.log(`loopback   : ${info.loopbackTracks} audio track(s)`);
  if (info.loopbackTracks === 0) {
    // Said here rather than left to be inferred from an empty ref% column forty lines later.
    // With no reference there is nothing to correlate against, so the run can only report "no
    // coupling" - the headphone answer, for a reason that has nothing to do with headphones.
    console.log(
      '\nWARNING: the loopback capture carries no audio track, so there is no reference to\n' +
        'correlate against and every result below will read as "no coupling". Check that system\n' +
        'audio capture is permitted and re-run.'
    );
  }
  console.log(
    `\nPlay interviewer audio through the speakers for ${options.seconds}s. Stay quiet.\n`
  );
  console.log('    delayMs   corr   prom    erlDb   ref%   mic%   coupled');
  console.log('    -------   ----   ----    -----   ----   ----   -------');
});

ipcMain.on('probe:metrics', (_event, m) => {
  // Both health checks run *before* the report is counted. A report the probe is about to refuse
  // to print is not evidence either way, and `coupled` on such a report is the verdict of an
  // estimate that ran against audio which is no longer arriving - counting it would let a dead
  // capture vote on the run's headline finding, which is the one thing these counters exist to
  // stop.
  //
  // No new frames means the graph itself is not running: a suspended AudioContext, or a closed
  // one. Every column below would then be a stale reading of a dead graph, which is worse than no
  // reading at all because it looks like data.
  //
  // It does NOT catch an unplugged microphone. The worklet is pulled by the destination for the
  // life of the context and zero-pads a missing input by design, so frames keep arriving at 100/s
  // after a track dies, with the columns quietly decaying toward the noise floor. That case is
  // what `deadTracks` covers.
  const advanced = m.frames - lastFrames;
  lastFrames = m.frames;
  if (advanced === 0) {
    if (m.frames === 0) {
      // Before the first frame, not after the last one. The graph has not started yet, which is
      // an ordinary first second - flagging it as a stall would put a "re-run this" warning on
      // the summary of a run that then went perfectly.
      console.log('    -- waiting for the first audio frame --');
      return;
    }
    stalled = true;
    console.log('    -- no audio frames received since the last report (capture stalled) --');
    return;
  }

  if (m.deadTracks.length > 0) {
    deadTracks = true;
    console.log(`    -- ${m.deadTracks.join(' and ')} stopped delivering audio --`);
    return;
  }

  totalReports++;
  if (m.coupled) coupledReports++;
  if (m.refActivePct > peakRefActivePct) peakRefActivePct = m.refActivePct;

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
  finished = true;
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
    // Said because the two disagree on purpose and it reads as an error otherwise. The table
    // above samples whatever the latest estimate was, once a second; these medians cover only the
    // estimates that passed the coupling test, of which there are two per printed row. So they
    // are drawn from a different and better population, and will read higher than any single row.
    console.log('                     (medians over accepted estimates only, which run twice per');
    console.log('                     printed row - so they read higher than the table above)');
    console.log(`search window      : ${summary.searchWindow[0]}..${summary.searchWindow[1]} ms`);

    const [lo, hi] = summary.searchWindow;
    const atFloor = summary.delayMsMedian <= lo + 50;
    if (atFloor || summary.delayMsMedian >= hi - 50) {
      // Names the flag to re-run with, and the value, rather than a constant to go and edit. This
      // warning is not exotic: it fired on the first machine measured.
      const widened = atFloor
        ? `--min-lag=${Math.round(lo - (hi - lo) / 2)}`
        : `--max-lag=${Math.round(hi + (hi - lo) / 2)}`;
      console.log(
        '\nWARNING: the peak sits at the edge of the search window, so the true delay may'
      );
      console.log(`lie outside it. Re-run with ${widened} before treating this number as`);
      console.log('the real one.');
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
  // Nothing was measured at all: every report was discarded as stalled or dead, or the run was
  // too short to produce one. Reaching the "no coupling" branch here would be the worst version
  // of the failure this whole summary is built to avoid - a confident headphone verdict from a
  // probe that never took a single valid reading.
  if (totalReports === 0) {
    console.log('verdict            : NOTHING MEASURED - not one valid report in the whole run.');
    console.log('                     Every report was discarded (see any warning below), or the');
    console.log('                     run was shorter than the one-second report interval.');
  }
  // The reference was silent throughout, so nothing was ever played for the microphone to
  // re-capture. That is not evidence of headphones, and the old wording offered the two as equal
  // readings of the same result while the ref% column had already told them apart. A run measures
  // coupling only if something was coupling-capable in the first place.
  else if (peakRefActivePct < REF_ACTIVE_MIN_PCT) {
    console.log('verdict            : NOTHING PLAYED - the loopback reference stayed silent for');
    console.log('                     the whole run (ref% never rose), so there was nothing for');
    console.log('                     the microphone to re-capture. This says nothing either way');
    console.log('                     about coupling. Start the audio first, then re-run.');
  }
  // The two counters measure different things and can disagree: estimates run twice a second,
  // reports are sampled once a second, so intermittent coupling can be accepted into `samples`
  // without a single report tick ever landing on it. "No coupling" therefore has to clear both,
  // or the summary prints a confident headphone verdict directly underneath a non-zero count of
  // accepted coupled estimates.
  else if (coupledReports === 0 && !summary.samples) {
    console.log('verdict            : no coupling (headphones - audio was playing and the mic did');
    console.log('                     not pick it up)');
  } else if (coupledReports >= 3 && pct >= 20) {
    console.log('verdict            : coupled (speakers)');
  } else {
    console.log('verdict            : INCONCLUSIVE - too few coupled reports to call it either');
    // The remedy has to match the reason. "Play audio for the whole run" is the right advice only
    // when the reference was patchy; told to someone whose ref% sat at 80 all run it is simply
    // wrong, and it sends them to re-run the thing they already did correctly. A reference that
    // was solid throughout means the coupling itself is marginal on this machine, which is a
    // finding rather than a mistake.
    if (peakRefActivePct >= 50) {
      console.log('                     way, though the reference was playing throughout. The');
      console.log('                     coupling is marginal here rather than absent: re-run to');
      console.log(
        '                     see whether it is stable, and record it as marginal if so.'
      );
    } else {
      console.log('                     way, and the reference was only intermittently active.');
      console.log('                     Re-run with audio playing for the whole duration.');
    }
  }
  if (stalled) {
    console.log('');
    console.log('WARNING: the capture stalled during this run, so the numbers above cover');
    console.log('less audio than the requested duration. Re-run before recording them.');
  }
  if (deadTracks) {
    console.log('');
    console.log('WARNING: a capture track ended mid-run - a device was unplugged, or the screen');
    console.log('share was stopped from the sharing bar. Reports after that point were discarded,');
    console.log('so this run covers less audio than requested. Re-run before recording it.');
  }
  app.quit();
});

ipcMain.on('probe:error', (_event, failure) => {
  finished = true;
  // The stack is omitted for the failures the renderer marks as the operator's to fix - a
  // mistyped `--device`, a loopback that was never permitted. Their message is the whole answer,
  // and for the device case it is a list of names to copy, which a stack trace only buries.
  console.error('\nprobe failed:\n' + (failure.stack || failure.message));
  quitWith(1);
});

app
  .whenReady()
  .then(async () => {
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
  })
  // Without this a failed load rejects into nothing: the window stays up showing "starting...",
  // no report ever arrives, and the probe waits for a run that will not begin.
  .catch((error) => {
    finished = true;
    console.error('\nprobe failed to start:\n' + (error && error.stack ? error.stack : error));
    quitWith(1);
  });

app.on('window-all-closed', () => {
  // Reached two ways: after `probe:done` or `probe:error` asked the app to quit, which is the
  // ordinary end, and by the operator closing the window mid-run. Only the second one needs
  // saying - it produces no summary at all, and silently exiting 0 would leave a half-run looking
  // like a clean one in a scrollback that no longer shows where it stopped.
  if (!finished) {
    console.error('\nThe probe window was closed before the run finished, so there is no summary');
    console.error('and the reports above cover only part of the requested duration. Re-run and');
    console.error('let it reach its own end, or pass a shorter --seconds.');
    quitWith(1);
    return;
  }
  app.quit();
});
