/**
 * Action suggestions are blocked during a mock interview today only as a side effect of mock mode
 * never setting `RunningState.Running` - all three entry points below gate on that first. That is
 * emergent, not designed: the day mock interview reuses `RunningState` for its own purposes (a
 * genuinely tempting refactor, since it would reuse the surface-hiding machinery), the four global
 * hotkeys that reach these methods go live during practice with nothing failing anywhere.
 *
 * So this drives `runningState` to `Running` *and* a mock session active at the same time - the
 * future state the explicit guard exists to catch - rather than only the ordinary Idle case,
 * which would pass on the emergent behaviour alone and prove nothing about the guard.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-action-suggestion-block');

  const { appStateService } = await loadMain('services/app-state.service.js');
  const { actionSuggestionService } = await loadMain('services/suggestion-action.service.js');

  const activeMockSession = {
    state: 'listening',
    setup: { role: 'Engineer', seniority: 'mid', difficulty: 'standard', question_count: 3 },
    currentQuestion: null,
    questionNumber: 1,
    answers: [],
    currentAnswerText: '',
    report: null,
    reportError: null,
    error: null,
  };

  // The adversarial case: RunningState forced to Running, as if mock mode had been changed to set
  // it. If the explicit guard were ever removed, these three would go on to their old
  // `runningState !== Running` check, find it satisfied, and proceed - taking a screenshot,
  // billing a suggestion, mid-practice-session.
  appStateService.updateState({ runningState: 'running', mockInterview: activeMockSession });

  const before = actionSuggestionService.getSuggestions().length;

  await actionSuggestionService.clearImages();
  check('clearImages refuses during a mock interview even with runningState=Running', true);

  await actionSuggestionService.captureScreenshot();
  check(
    'captureScreenshot takes no screenshot during a mock interview',
    actionSuggestionService.getSuggestions().length === before
  );
  check(
    'and does not report having uploaded anything',
    actionSuggestionService.hasUploadedImages() === false
  );

  await actionSuggestionService.startGenerateSuggestion();
  check(
    'startGenerateSuggestion refuses during a mock interview even with runningState=Running',
    true
  );

  // Once the mock session ends, the ordinary RunningState gate takes back over - these are not
  // permanently disabled by having run once during a mock session.
  appStateService.updateState({ runningState: 'idle', mockInterview: null });
  await actionSuggestionService.captureScreenshot();
  check(
    'after the mock session ends, the ordinary Idle refusal still works',
    actionSuggestionService.getSuggestions().length === before
  );

  return failures;
}
