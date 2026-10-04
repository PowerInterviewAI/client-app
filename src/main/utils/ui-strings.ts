import { configStore } from '../store/config.store.js';
import { UiLanguage } from '../types/ui-language.js';

/**
 * The main process's share of the app's chrome.
 *
 * Most of what a user reads is rendered in the renderer and translated there, through
 * `src/renderer/i18n`. These are the strings main writes itself, and there are two kinds:
 *
 * - the placeholder copy the panels show on launch and after every Clear, which main seeds
 *   because it owns the state the panels render;
 * - the push notifications main raises, which arrive in the renderer as toasts with nothing but
 *   a message and a severity. Those come from paths the renderer cannot see - a global hotkey
 *   pressed while the window is hidden, a session that expires, a Dock-level refusal.
 *
 * Table keyed by language, read off the config store, the same shape `export-labels.ts` uses.
 * Deliberately *not* that table: the exported report follows the **interview** language, because
 * it is handed to someone who was not there. This follows the **chrome** language, because it is
 * read by the person using the app.
 *
 * Backend error text is not here and is not translated. The client cannot translate a string it
 * did not write, and replacing a specific server message with a generic local one would lose the
 * only useful half of it.
 */
export interface UiStrings {
  /** Panel placeholder copy, so an app that has never run an interview has something to show. */
  placeholderTranscript: string;
  placeholderQuestion: string;
  placeholderLiveAnswer: string;
  placeholderActionAnswer: string;

  /** The session token expired under the user, from the health-check poll. */
  sessionExpired: string;

  /** One action-suggestion step refused because another is still running. */
  actionNames: Record<'screenshotCapture' | 'captureSuggestion', string>;
  actionBlocked: (runningAction: string) => string;

  /** Why entering stealth mode was refused; see `stealthUnavailableReason`. */
  stealthSignedOut: string;
  stealthDuringMock: string;
  stealthNotRunning: string;
  opacityStealthOnly: string;

  /**
   * The native save dialog's own title and file-type labels.
   *
   * Chrome rather than part of the document: the report inside the file follows the interview
   * language, but the window asking where to put it is being read by the person at the keyboard.
   * `.docx` and `.md` stay as they are - a file extension is not a word.
   */
  saveTranscriptTitle: string;
  saveMockReportTitle: string;
  saveImageTitle: string;
  markdownFilter: string;
  wordFilter: string;
  pngFilter: string;

  /** Action suggestions, refused for a reason the renderer's own gating cannot always see. */
  actionDuringMock: string;
  cannotClearImages: string;
  cannotCaptureScreenshot: string;
  maxCaptures: (max: number) => string;
  captureFailed: string;
  cannotGenerateSuggestion: string;
}

const STRINGS: Record<UiLanguage, UiStrings> = {
  [UiLanguage.English]: {
    placeholderTranscript: 'Transcripts will be here',
    placeholderQuestion: 'Interviewer questions will be here',
    placeholderLiveAnswer: 'Suggested answers will be here in real-time',
    placeholderActionAnswer:
      'Triggered suggestions will be here. For example, reply suggestion, coding test solution, diagram descriptions, etc.',

    sessionExpired: 'Your session expired, please log in again.',

    actionNames: {
      screenshotCapture: 'Screenshot capture',
      captureSuggestion: 'Action suggestion generation',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} is in progress. Try again a bit later.`,

    stealthSignedOut: 'You must be logged in to use stealth mode.',
    stealthDuringMock:
      'Stealth mode is off during a mock interview. This is practice, not a live call.',
    stealthNotRunning: 'Stealth mode is only available during a live interview.',
    opacityStealthOnly: 'Opacity toggle is only available in stealth mode.',

    saveTranscriptTitle: 'Save Transcript',
    saveMockReportTitle: 'Save Mock Interview Report',
    saveImageTitle: 'Save Image',
    markdownFilter: 'Markdown',
    wordFilter: 'Word Document',
    pngFilter: 'PNG Image',

    actionDuringMock: 'Action suggestions are unavailable during a mock interview.',
    cannotClearImages: 'Cannot clear images when assistant is not running',
    cannotCaptureScreenshot: 'Cannot capture screenshot when assistant is not running',
    maxCaptures: (max: number) =>
      `Maximum of ${max} screenshots reached. Please clear images and try again.`,
    captureFailed: 'Screenshot capture failed. Please try again.',
    cannotGenerateSuggestion: 'Cannot generate suggestion when assistant is not running',
  },

  [UiLanguage.Russian]: {
    placeholderTranscript: 'Здесь будет расшифровка',
    placeholderQuestion: 'Здесь будут вопросы интервьюера',
    placeholderLiveAnswer: 'Здесь в реальном времени будут появляться подсказки с ответами',
    placeholderActionAnswer:
      'Здесь будут подсказки по запросу: например, вариант ответа, решение задачи по программированию, описание схемы и так далее.',

    sessionExpired: 'Сессия истекла, войдите заново.',

    actionNames: {
      screenshotCapture: 'Создание снимка экрана',
      captureSuggestion: 'Создание подсказки по запросу',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} ещё выполняется. Попробуйте чуть позже.`,

    stealthSignedOut: 'Скрытый режим доступен только после входа.',
    stealthDuringMock:
      'В пробном собеседовании скрытый режим выключен. Это тренировка, а не настоящий звонок.',
    stealthNotRunning: 'Скрытый режим доступен только во время живого собеседования.',
    opacityStealthOnly: 'Прозрачность переключается только в скрытом режиме.',

    saveTranscriptTitle: 'Сохранить расшифровку',
    saveMockReportTitle: 'Сохранить отчёт о пробном собеседовании',
    saveImageTitle: 'Сохранить изображение',
    markdownFilter: 'Markdown',
    wordFilter: 'Документ Word',
    pngFilter: 'Изображение PNG',

    actionDuringMock: 'Подсказки по запросу недоступны во время пробного собеседования.',
    cannotClearImages: 'Нельзя очистить снимки, пока ассистент не запущен',
    cannotCaptureScreenshot: 'Нельзя сделать снимок экрана, пока ассистент не запущен',
    maxCaptures: (max: number) =>
      `Достигнут предел снимков экрана (${max}). Очистите их и попробуйте снова.`,
    captureFailed: 'Не удалось сделать снимок экрана. Попробуйте ещё раз.',
    cannotGenerateSuggestion: 'Нельзя создать подсказку, пока ассистент не запущен',
  },
};

/**
 * The strings for the chrome language currently on disk.
 *
 * Read per call rather than captured once at module load: these are used from paths that run for
 * the whole life of the process - a health-check poll, a global hotkey handler - and the setting
 * can change under any of them.
 */
export function uiStrings(): UiStrings {
  return STRINGS[configStore.getConfig().uiLanguage];
}
