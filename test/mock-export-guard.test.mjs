/**
 * The two questions `AppState` answers about a mock report, and why they are two.
 *
 * `hasMockContent` means "does a report exist at all". `hasUnsavedMockContent` means "is there
 * something a save would capture that is not captured yet". They were one flag until exporting
 * stopped raising the save prompt, and collapsing them breaks whichever caller loses:
 *
 * - Read as "exists", the prompt on the report screen's Done and Practise again asks the
 *   candidate to save the file they saved thirty seconds ago, and so does the window close.
 * - Read as "unsaved", the control bar's Export menu answers "there is nothing to export yet"
 *   when asked for Markdown after Word, and the save dialog stops choosing the mock export.
 *
 * Both failures are silent - a button that says the wrong thing, not an error - so the split is
 * pinned here rather than left to the two call sites agreeing.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-export-guard');

  const { appStateService } = await loadMain('services/app-state.service.js');

  const answered = [
    { question: 'Tell me about yourself.', kind: 'behavioral', answer: 'I am an engineer.', skipped: false },
  ];

  const session = (over = {}) => ({
    state: 'finished',
    setup: { role: '', seniority: 'mid', difficulty: 'standard', question_count: 1 },
    currentQuestion: null,
    questionNumber: 1,
    answers: answered,
    currentAnswerText: '',
    liveHints: [],
    report: null,
    reportError: null,
    exported: false,
    error: null,
    ...over,
  });

  try {
    appStateService.updateState({ mockInterview: session() });
    check('an answered session has content', appStateService.getState().hasMockContent === true);
    check(
      'and it is unsaved until it is written out',
      appStateService.getState().hasUnsavedMockContent === true
    );

    // A fresh object every time, the way main broadcasts it - `answers` keeps its identity here,
    // which is exactly the fast path in `withMockContent`. `exported` moves without the array
    // moving, so a fast path keyed on the array alone returns the stale answer.
    appStateService.updateState({ mockInterview: session({ exported: true }) });
    check(
      'exporting retires the guard',
      appStateService.getState().hasUnsavedMockContent === false
    );
    check(
      'but the report still exists, so the export surfaces can still reach it',
      appStateService.getState().hasMockContent === true
    );

    // The flag is derived, never accepted. It crosses IPC inside a `Partial<AppState>` the
    // renderer composes, and the close guard trusts it - a caller that set it directly would
    // switch the save prompt off with no symptom anywhere.
    appStateService.updateState({ hasUnsavedMockContent: true, hasMockContent: true });
    check(
      'a caller cannot set the unsaved flag',
      appStateService.getState().hasUnsavedMockContent === false
    );
    check(
      'nor the content flag',
      appStateService.getState().hasMockContent === true
    );

    // A session whose only turns were skipped has nothing a save could capture, so neither flag
    // is true - the same standard `exportMockReport`'s own guard applies.
    appStateService.updateState({
      mockInterview: session({
        answers: [{ question: 'Skipped one.', kind: 'technical', answer: '', skipped: true }],
      }),
    });
    check(
      'a session of skips has no content',
      appStateService.getState().hasMockContent === false
    );
    check(
      'and nothing to save',
      appStateService.getState().hasUnsavedMockContent === false
    );
  } finally {
    appStateService.updateState({ mockInterview: null });
  }

  return failures;
}
