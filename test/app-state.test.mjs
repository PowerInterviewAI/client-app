/**
 * The whole app state is broadcast to the renderer, and the health-check loops fire every 1-5s.
 * The interview config holds a CV and job description (up to 128k chars each), so main must send
 * a summary rather than the real thing, and must not broadcast at all when nothing changed.
 *
 * Broadcasts are coalesced on a short timer rather than sent per change: they fire on every
 * streamed token and every ASR partial, and each one clones a transcript array that grows for
 * the whole interview. So these checks flush explicitly rather than counting one send per
 * mutation. The two invariants above are unaffected and are what this file pins.
 *
 * Flushing explicitly is also the one path production never takes, so the coalesced path gets
 * its own check below. Every check here used to flush synchronously while the timer was still
 * pending - the single arrangement in which the send worked - and that blind spot let a release
 * ship in which the renderer received no state update at all, ever.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('app-state.service');

  const { appStateService } = await loadMain('services/app-state.service.js');
  const windowControl = await loadMain('services/window-control.service.js');

  const sent = [];
  windowControl.setWindowReference({
    isDestroyed: () => false,
    setSkipTaskbar: () => {},
    // Registering a window applies the surface state, which pins or releases the z-order too.
    setAlwaysOnTop: () => {},
    setVisibleOnAllWorkspaces: () => {},
    webContents: { send: (channel, payload) => sent.push({ channel, payload }) },
  });

  const cv = 'x'.repeat(200_000);
  const context = 'y'.repeat(150_000);
  appStateService.updateState({
    interviewConfig: { fullName: 'Jane', profileData: cv, context },
    interviewConfigLoaded: true,
  });

  // Main keeps the real values - the suggestion services read them from here.
  const state = appStateService.getState();
  check('main keeps the full CV', state.interviewConfig.profileData.length === cv.length);
  check('main keeps the full context', state.interviewConfig.context.length === context.length);

  const view = appStateService.getRendererState();
  check('renderer view exposes fullName', view.interviewConfig.fullName === 'Jane');
  check('renderer view exposes hasProfileData', view.interviewConfig.hasProfileData === true);
  check('renderer view drops profileData', !('profileData' in view.interviewConfig));
  check('renderer view drops context', !('context' in view.interviewConfig));
  check('renderer view keeps the loaded flag', view.interviewConfigLoaded === true);

  appStateService.flushRenderer();
  const payload = JSON.stringify(sent.at(-1).payload);
  check(`broadcast stays small (${payload.length} bytes)`, payload.length < 5_000);
  check('broadcast carries no CV', !payload.includes('xxxxxxxxxx'));

  // The ping loops re-report identical values; those must not reach the renderer. Prime both
  // updates first so the loop below carries no new information at all.
  appStateService.updateState({ isBackendLive: true });
  appStateService.updateState({ credits: 42, userRole: 'user', providedLLMModel: 'm' });
  appStateService.flushRenderer();
  const baseline = sent.length;
  for (let i = 0; i < 10; i++) {
    appStateService.updateState({ isBackendLive: true });
    appStateService.updateState({ credits: 42, userRole: 'user', providedLLMModel: 'm' });
  }
  // No-op updates must not even schedule a broadcast, so flushing produces nothing.
  appStateService.flushRenderer();
  check('identical updates do not broadcast', sent.length === baseline);

  appStateService.updateState({ isBackendLive: false });
  appStateService.flushRenderer();
  check('a real change still broadcasts', sent.length === baseline + 1);
  check('the change is applied', appStateService.getState().isBackendLive === false);

  // Nothing in src/ ever calls flushRenderer - the app relies entirely on the timer firing on
  // its own. So let it, with no flush at all, and check the send actually lands.
  const beforeCoalesced = sent.length;
  appStateService.updateState({ isBackendLive: true });
  await new Promise((resolve) => setTimeout(resolve, 200));
  check('a coalesced broadcast reaches the renderer', sent.length === beforeCoalesced + 1);
  check('the coalesced broadcast carries the change', sent.at(-1).payload.isBackendLive === true);

  appStateService.updateState({
    interviewConfig: { fullName: 'Jane', profileData: '   ', context: '' },
  });
  check(
    'whitespace-only profile is not reported as set',
    appStateService.getRendererState().interviewConfig.hasProfileData === false
  );

  // Clear resets the state through setPlaceholderState. It is the one mutator that used to skip
  // the broadcast, so the reset landed in main and the renderer kept showing the old content
  // until something unrelated happened to broadcast.
  appStateService.updateState({ transcripts: [{ timestamp: 1, text: 'stale', speaker: 'self' }] });
  appStateService.flushRenderer();
  const beforeClear = sent.length;
  appStateService.setPlaceholderState();
  appStateService.flushRenderer();
  check('clearing broadcasts to the renderer', sent.length === beforeClear + 1);
  check(
    'the broadcast carries the cleared transcripts',
    sent.at(-1).payload.transcripts?.[0]?.text === 'Transcripts will be here'
  );

  // hasMockContent is derived the same way hasHistory is - stripped from incoming updates and
  // recomputed from the mockInterview session, never trusted from the caller. It must also never
  // contaminate hasHistory, since a close guard reading `hasHistory || hasMockContent` would
  // otherwise treat the two subjects as one.
  const mockSession = (answers) => ({
    state: 'listening',
    setup: { role: 'Engineer', seniority: 'mid', difficulty: 'standard', question_count: 3 },
    currentQuestion: null,
    questionNumber: 1,
    answers,
    currentAnswerText: '',
    report: null,
    reportError: null,
    error: null,
  });

  appStateService.updateState({ mockInterview: mockSession([]) });
  check(
    'a mock session with no answers has no content',
    appStateService.getState().hasMockContent === false
  );
  check('and does not flip hasHistory', appStateService.getState().hasHistory === false);

  appStateService.updateState({
    mockInterview: mockSession([{ question: 'Q1', kind: 'technical', answer: '', skipped: true }]),
  });
  check('a skipped question is not content', appStateService.getState().hasMockContent === false);

  appStateService.updateState({
    mockInterview: mockSession([
      { question: 'Q1', kind: 'technical', answer: 'A real answer', skipped: false },
    ]),
  });
  check('a real answer is content', appStateService.getState().hasMockContent === true);

  appStateService.updateState({ hasMockContent: false });
  check(
    'an incoming hasMockContent is ignored',
    appStateService.getState().hasMockContent === true
  );

  // The mock session carries no CV field at all - there is nothing to broadcast that resembles
  // the live interviewConfig reduction, so the broadcast-size check above already covers it
  // structurally. This confirms the type-level guarantee holds through updateState too.
  check(
    'the mock session broadcasts with no profile_data field',
    !('profile_data' in appStateService.getRendererState().mockInterview)
  );

  appStateService.updateState({ mockInterview: null });

  return failures;
}
