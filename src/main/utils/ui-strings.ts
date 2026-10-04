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

  /**
   * Auth and account failures **this process authored**, which is the distinction that matters.
   *
   * The renderer has a parallel set in `t.auth.errors`, and they are not redundant: those are
   * for a rejection that arrived with no message at all, while these are the message. Every
   * `{ success: false, error }` below sets `error`, so the renderer's `result?.error || t...`
   * never reaches its fallback on these paths - which left the most frequently read error in
   * the app ("Invalid email or password") in English on a Russian install.
   *
   * Anything the backend sent is still preferred over both and passed through untouched.
   */
  authErrors: Record<
    | 'sendCodeFailed'
    | 'invalidCode'
    | 'signupFailed'
    | 'invalidCredentials'
    | 'loginFailed'
    | 'logoutFailed'
    | 'changePasswordFailed'
    | 'sendResetCodeFailed'
    | 'invalidResetCode'
    | 'resetFailed',
    string
  >;

  accountErrors: Record<
    'fetchFailed' | 'updateFailed' | 'onboardingFailed' | 'migrateFailed' | 'loadConfigFailed',
    string
  >;

  /**
   * The two transport failures `api/client.ts` names itself.
   *
   * These matter more than their size suggests. Every caller's fallback is
   * `response.error.message || uiStrings()...`, and on a timeout `message` *is* one of these -
   * so the English string wins over every translated fallback behind it. A dead or slow backend
   * is the most common failure the app has.
   *
   * A message thrown by the runtime (`fetch failed`) is still passed through: we did not write
   * it, which is the same line drawn for backend text.
   */
  transportErrors: Record<'timedOut' | 'networkFailed', string>;

  /** Same shape again for the payment service, whose every path sets its own message. */
  paymentErrors: Record<
    | 'getPlans'
    | 'getCurrencies'
    | 'createPayment'
    | 'getStatus'
    | 'getHistory'
    | 'getCredits'
    | 'pollingTimeout',
    string
  >;

  /**
   * Written onto a suggestion's `error` field, which the panel renders verbatim on the card the
   * candidate is reading mid-interview.
   */
  suggestionErrors: Record<
    | 'tooManyRequests'
    | 'generateFailed'
    | 'cannotReachServer'
    | 'responseTimedOut'
    | 'emptyResponse',
    string
  >;

  /**
   * Written onto the mock session's `error`, which `/mock-interview` deliberately surfaces - the
   * microphone one in particular is the explanation a candidate is owed for a session that
   * skipped its way through questions they were already billed for.
   */
  mockErrors: Record<
    | 'liveRunning'
    | 'firstQuestionFailed'
    | 'startFailed'
    | 'nothingRecorded'
    | 'endedBeforeScoring'
    | 'notEnoughCredits',
    string
  > & { firstQuestionFailedWith: (reason: string) => string };

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

    authErrors: {
      sendCodeFailed: 'Failed to send verification code',
      invalidCode: 'Invalid or expired verification code',
      signupFailed: 'Signup failed',
      invalidCredentials: 'Invalid email or password',
      loginFailed: 'Login failed',
      logoutFailed: 'Logout failed',
      changePasswordFailed: 'Change password failed',
      sendResetCodeFailed: 'Failed to send password reset code',
      invalidResetCode: 'Invalid or expired reset code',
      resetFailed: 'Password reset failed',
    },

    accountErrors: {
      fetchFailed: 'Failed to fetch account',
      updateFailed: 'Failed to update account',
      onboardingFailed: 'Failed to save your setup',
      migrateFailed: 'Failed to migrate local configuration',
      loadConfigFailed: 'Failed to load configuration',
    },

    transportErrors: {
      timedOut: 'The request timed out',
      networkFailed: 'Network request failed',
    },

    paymentErrors: {
      getPlans: 'Failed to get plans',
      getCurrencies: 'Failed to get available currencies',
      createPayment: 'Failed to create payment',
      getStatus: 'Failed to get payment status',
      getHistory: 'Failed to get payment history',
      getCredits: 'Failed to get credits',
      pollingTimeout: 'Payment polling timeout',
    },

    suggestionErrors: {
      tooManyRequests: 'Too many requests. Please try again later.',
      generateFailed: 'Failed to generate response.',
      cannotReachServer: 'Could not reach the server. Check your connection and try again.',
      responseTimedOut: 'The response timed out. Please try again.',
      emptyResponse: 'The model returned an empty response.',
    },

    mockErrors: {
      liveRunning: 'Stop the live interview before starting a mock interview.',
      firstQuestionFailed: 'Failed to generate the first question. Please try again.',
      firstQuestionFailedWith: (reason: string) =>
        `Could not generate the first question: ${reason}`,
      startFailed: 'Failed to start the mock interview',
      nothingRecorded:
        'The interview ended with nothing recorded. Check that the right microphone is selected and that it is not muted, then try again.',
      endedBeforeScoring: 'The interview was ended before scoring finished.',
      notEnoughCredits: 'Not enough credits',
    },

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

    authErrors: {
      sendCodeFailed: 'Не удалось отправить код подтверждения',
      invalidCode: 'Код подтверждения неверен или истёк',
      signupFailed: 'Не удалось создать учётную запись',
      invalidCredentials: 'Неверная почта или пароль',
      loginFailed: 'Не удалось войти',
      logoutFailed: 'Не удалось выйти',
      changePasswordFailed: 'Не удалось изменить пароль',
      sendResetCodeFailed: 'Не удалось отправить код сброса пароля',
      invalidResetCode: 'Код сброса неверен или истёк',
      resetFailed: 'Не удалось изменить пароль',
    },

    accountErrors: {
      fetchFailed: 'Не удалось получить данные учётной записи',
      updateFailed: 'Не удалось обновить учётную запись',
      onboardingFailed: 'Не удалось сохранить настройки',
      migrateFailed: 'Не удалось перенести локальные настройки',
      loadConfigFailed: 'Не удалось загрузить настройки',
    },

    transportErrors: {
      timedOut: 'Время ожидания запроса истекло',
      networkFailed: 'Сетевой запрос не удался',
    },

    paymentErrors: {
      getPlans: 'Не удалось получить тарифы',
      getCurrencies: 'Не удалось получить список доступных валют',
      createPayment: 'Не удалось создать платёж',
      getStatus: 'Не удалось получить статус платежа',
      getHistory: 'Не удалось получить историю платежей',
      getCredits: 'Не удалось получить баланс кредитов',
      pollingTimeout: 'Платёж не подтвердился вовремя',
    },

    suggestionErrors: {
      tooManyRequests: 'Слишком много запросов. Попробуйте позже.',
      generateFailed: 'Не удалось создать ответ.',
      cannotReachServer:
        'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.',
      responseTimedOut: 'Ответ не пришёл вовремя. Попробуйте снова.',
      emptyResponse: 'Модель вернула пустой ответ.',
    },

    mockErrors: {
      liveRunning: 'Остановите живое собеседование, прежде чем начинать пробное.',
      firstQuestionFailed: 'Не удалось создать первый вопрос. Попробуйте снова.',
      firstQuestionFailedWith: (reason: string) => `Не удалось создать первый вопрос: ${reason}`,
      startFailed: 'Не удалось начать пробное собеседование',
      nothingRecorded:
        'Собеседование закончилось, и ничего не записано. Проверьте, что выбран нужный микрофон и он не выключен, затем попробуйте снова.',
      endedBeforeScoring: 'Собеседование завершили до того, как закончилась оценка.',
      notEnoughCredits: 'Недостаточно кредитов',
    },

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
