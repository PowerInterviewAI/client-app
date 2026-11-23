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
    'getPlans' | 'getCurrencies' | 'createPayment' | 'getStatus' | 'getHistory',
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
      notEnoughCredits: 'Out of free time',
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
      notEnoughCredits: 'Бесплатное время закончилось',
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

  [UiLanguage.Spanish]: {
    placeholderTranscript: 'Aquí aparecerá la transcripción',
    placeholderQuestion: 'Aquí aparecerán las preguntas del entrevistador',
    placeholderLiveAnswer: 'Aquí aparecerán las respuestas sugeridas en tiempo real',
    placeholderActionAnswer:
      'Aquí aparecerán las sugerencias a petición. Por ejemplo, una respuesta sugerida, la solución de una prueba de código, la descripción de un diagrama, etc.',

    sessionExpired: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',

    authErrors: {
      sendCodeFailed: 'No se pudo enviar el código de verificación',
      invalidCode: 'Código de verificación no válido o caducado',
      signupFailed: 'No se pudo completar el registro',
      invalidCredentials: 'Correo o contraseña incorrectos',
      loginFailed: 'No se pudo iniciar sesión',
      logoutFailed: 'No se pudo cerrar sesión',
      changePasswordFailed: 'No se pudo cambiar la contraseña',
      sendResetCodeFailed: 'No se pudo enviar el código de restablecimiento',
      invalidResetCode: 'Código de restablecimiento no válido o caducado',
      resetFailed: 'No se pudo restablecer la contraseña',
    },

    accountErrors: {
      fetchFailed: 'No se pudo obtener la cuenta',
      updateFailed: 'No se pudo actualizar la cuenta',
      onboardingFailed: 'No se pudo guardar la configuración',
      migrateFailed: 'No se pudo migrar la configuración local',
      loadConfigFailed: 'No se pudo cargar la configuración',
    },

    transportErrors: {
      timedOut: 'La solicitud tardó demasiado',
      networkFailed: 'La solicitud de red falló',
    },

    paymentErrors: {
      getPlans: 'No se pudieron obtener los planes',
      getCurrencies: 'No se pudieron obtener las monedas disponibles',
      createPayment: 'No se pudo crear el pago',
      getStatus: 'No se pudo obtener el estado del pago',
      getHistory: 'No se pudo obtener el historial de pagos',
    },

    suggestionErrors: {
      tooManyRequests: 'Demasiadas solicitudes. Inténtalo más tarde.',
      generateFailed: 'No se pudo generar la respuesta.',
      cannotReachServer: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      responseTimedOut: 'La respuesta tardó demasiado. Inténtalo de nuevo.',
      emptyResponse: 'El modelo devolvió una respuesta vacía.',
    },

    mockErrors: {
      liveRunning: 'Detén la entrevista en directo antes de empezar una de práctica.',
      firstQuestionFailed: 'No se pudo generar la primera pregunta. Inténtalo de nuevo.',
      firstQuestionFailedWith: (reason: string) =>
        `No se pudo generar la primera pregunta: ${reason}`,
      startFailed: 'No se pudo iniciar la entrevista de práctica',
      nothingRecorded:
        'La entrevista terminó sin nada grabado. Comprueba que está seleccionado el micrófono correcto y que no está silenciado, y vuelve a intentarlo.',
      endedBeforeScoring: 'La entrevista terminó antes de completar la puntuación.',
      notEnoughCredits: 'Sin tiempo gratis',
    },

    actionNames: {
      screenshotCapture: 'La captura de pantalla',
      captureSuggestion: 'La generación de sugerencias a petición',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} sigue en curso. Inténtalo de nuevo en un momento.`,

    stealthSignedOut: 'Debes iniciar sesión para usar el modo sigiloso.',
    stealthDuringMock:
      'El modo sigiloso está desactivado durante una entrevista de práctica. Esto es práctica, no una llamada real.',
    stealthNotRunning: 'El modo sigiloso solo está disponible durante una entrevista en directo.',
    opacityStealthOnly: 'La opacidad solo se puede cambiar en modo sigiloso.',

    saveTranscriptTitle: 'Guardar transcripción',
    saveMockReportTitle: 'Guardar informe de la entrevista de práctica',
    saveImageTitle: 'Guardar imagen',
    markdownFilter: 'Markdown',
    wordFilter: 'Documento de Word',
    pngFilter: 'Imagen PNG',

    actionDuringMock: 'Las sugerencias a petición no están disponibles durante una entrevista de práctica.',
    cannotClearImages: 'No se pueden borrar las imágenes si el asistente no está en marcha',
    cannotCaptureScreenshot: 'No se puede hacer una captura si el asistente no está en marcha',
    maxCaptures: (max: number) =>
      `Se alcanzó el máximo de ${max} capturas. Borra las imágenes e inténtalo de nuevo.`,
    captureFailed: 'No se pudo hacer la captura de pantalla. Inténtalo de nuevo.',
    cannotGenerateSuggestion: 'No se puede generar una sugerencia si el asistente no está en marcha',
  },

  [UiLanguage.Portuguese]: {
    placeholderTranscript: 'A transcrição vai aparecer aqui',
    placeholderQuestion: 'As perguntas do entrevistador vão aparecer aqui',
    placeholderLiveAnswer: 'As respostas sugeridas vão aparecer aqui em tempo real',
    placeholderActionAnswer:
      'As sugestões sob demanda vão aparecer aqui. Por exemplo, uma sugestão de resposta, a solução de um teste de código, a descrição de um diagrama etc.',

    sessionExpired: 'Sua sessão expirou. Entre de novo.',

    authErrors: {
      sendCodeFailed: 'Não foi possível enviar o código de verificação',
      invalidCode: 'Código de verificação inválido ou expirado',
      signupFailed: 'Não foi possível concluir o cadastro',
      invalidCredentials: 'E-mail ou senha incorretos',
      loginFailed: 'Não foi possível entrar',
      logoutFailed: 'Não foi possível sair',
      changePasswordFailed: 'Não foi possível alterar a senha',
      sendResetCodeFailed: 'Não foi possível enviar o código de redefinição',
      invalidResetCode: 'Código de redefinição inválido ou expirado',
      resetFailed: 'Não foi possível redefinir a senha',
    },

    accountErrors: {
      fetchFailed: 'Não foi possível obter a conta',
      updateFailed: 'Não foi possível atualizar a conta',
      onboardingFailed: 'Não foi possível salvar a configuração',
      migrateFailed: 'Não foi possível migrar a configuração local',
      loadConfigFailed: 'Não foi possível carregar a configuração',
    },

    transportErrors: {
      timedOut: 'A solicitação demorou demais',
      networkFailed: 'A solicitação de rede falhou',
    },

    paymentErrors: {
      getPlans: 'Não foi possível obter os planos',
      getCurrencies: 'Não foi possível obter as moedas disponíveis',
      createPayment: 'Não foi possível criar o pagamento',
      getStatus: 'Não foi possível obter a situação do pagamento',
      getHistory: 'Não foi possível obter o histórico de pagamentos',
    },

    suggestionErrors: {
      tooManyRequests: 'Solicitações demais. Tente mais tarde.',
      generateFailed: 'Não foi possível gerar a resposta.',
      cannotReachServer: 'Não foi possível acessar o servidor. Verifique sua conexão e tente de novo.',
      responseTimedOut: 'A resposta demorou demais. Tente de novo.',
      emptyResponse: 'O modelo devolveu uma resposta vazia.',
    },

    mockErrors: {
      liveRunning: 'Pare a entrevista ao vivo antes de começar uma simulada.',
      firstQuestionFailed: 'Não foi possível gerar a primeira pergunta. Tente de novo.',
      firstQuestionFailedWith: (reason: string) =>
        `Não foi possível gerar a primeira pergunta: ${reason}`,
      startFailed: 'Não foi possível iniciar a entrevista simulada',
      nothingRecorded:
        'A entrevista terminou sem nada gravado. Verifique se o microfone certo está selecionado e se não está mudo, e tente de novo.',
      endedBeforeScoring: 'A entrevista foi encerrada antes de terminar a avaliação.',
      notEnoughCredits: 'Seu tempo grátis acabou',
    },

    actionNames: {
      screenshotCapture: 'A captura de tela',
      captureSuggestion: 'A geração de sugestão sob demanda',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} ainda está em andamento. Tente de novo daqui a pouco.`,

    stealthSignedOut: 'Você precisa entrar para usar o modo furtivo.',
    stealthDuringMock:
      'O modo furtivo fica desligado durante a entrevista simulada. Isto é treino, não uma chamada real.',
    stealthNotRunning: 'O modo furtivo só está disponível durante uma entrevista ao vivo.',
    opacityStealthOnly: 'A opacidade só pode ser alternada no modo furtivo.',

    saveTranscriptTitle: 'Salvar transcrição',
    saveMockReportTitle: 'Salvar relatório da entrevista simulada',
    saveImageTitle: 'Salvar imagem',
    markdownFilter: 'Markdown',
    wordFilter: 'Documento do Word',
    pngFilter: 'Imagem PNG',

    actionDuringMock: 'As sugestões sob demanda ficam indisponíveis durante a entrevista simulada.',
    cannotClearImages: 'Não é possível apagar as imagens com o assistente parado',
    cannotCaptureScreenshot: 'Não é possível tirar captura de tela com o assistente parado',
    maxCaptures: (max: number) =>
      `Limite de ${max} capturas atingido. Apague as imagens e tente de novo.`,
    captureFailed: 'Não foi possível tirar a captura de tela. Tente de novo.',
    cannotGenerateSuggestion: 'Não é possível gerar sugestão com o assistente parado',
  },

  [UiLanguage.German]: {
    placeholderTranscript: 'Hier erscheint das Transkript',
    placeholderQuestion: 'Hier erscheinen die Fragen des Interviewers',
    placeholderLiveAnswer: 'Hier erscheinen Antwortvorschläge in Echtzeit',
    placeholderActionAnswer:
      'Hier erscheinen Vorschläge auf Abruf. Zum Beispiel ein Antwortvorschlag, die Lösung einer Programmieraufgabe, Beschreibungen von Diagrammen usw.',

    sessionExpired: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',

    authErrors: {
      sendCodeFailed: 'Bestätigungscode konnte nicht gesendet werden',
      invalidCode: 'Ungültiger oder abgelaufener Bestätigungscode',
      signupFailed: 'Registrierung fehlgeschlagen',
      invalidCredentials: 'E-Mail oder Passwort ist falsch',
      loginFailed: 'Anmeldung fehlgeschlagen',
      logoutFailed: 'Abmeldung fehlgeschlagen',
      changePasswordFailed: 'Passwort konnte nicht geändert werden',
      sendResetCodeFailed: 'Code zum Zurücksetzen konnte nicht gesendet werden',
      invalidResetCode: 'Ungültiger oder abgelaufener Code zum Zurücksetzen',
      resetFailed: 'Zurücksetzen des Passworts fehlgeschlagen',
    },

    accountErrors: {
      fetchFailed: 'Konto konnte nicht abgerufen werden',
      updateFailed: 'Konto konnte nicht aktualisiert werden',
      onboardingFailed: 'Deine Einrichtung konnte nicht gespeichert werden',
      migrateFailed: 'Lokale Einstellungen konnten nicht übernommen werden',
      loadConfigFailed: 'Einstellungen konnten nicht geladen werden',
    },

    transportErrors: {
      timedOut: 'Die Anfrage hat zu lange gedauert',
      networkFailed: 'Netzwerkanfrage fehlgeschlagen',
    },

    paymentErrors: {
      getPlans: 'Tarife konnten nicht abgerufen werden',
      getCurrencies: 'Verfügbare Währungen konnten nicht abgerufen werden',
      createPayment: 'Zahlung konnte nicht erstellt werden',
      getStatus: 'Zahlungsstatus konnte nicht abgerufen werden',
      getHistory: 'Zahlungsverlauf konnte nicht abgerufen werden',
    },

    suggestionErrors: {
      tooManyRequests: 'Zu viele Anfragen. Bitte versuche es später erneut.',
      generateFailed: 'Antwort konnte nicht erzeugt werden.',
      cannotReachServer: 'Server nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
      responseTimedOut: 'Die Antwort hat zu lange gedauert. Bitte versuche es erneut.',
      emptyResponse: 'Das Modell hat eine leere Antwort geliefert.',
    },

    mockErrors: {
      liveRunning: 'Beende das Live-Interview, bevor du ein Probeinterview startest.',
      firstQuestionFailed: 'Die erste Frage konnte nicht erzeugt werden. Bitte versuche es erneut.',
      firstQuestionFailedWith: (reason: string) =>
        `Die erste Frage konnte nicht erzeugt werden: ${reason}`,
      startFailed: 'Probeinterview konnte nicht gestartet werden',
      nothingRecorded:
        'Das Interview wurde ohne Aufnahme beendet. Prüfe, ob das richtige Mikrofon gewählt und nicht stummgeschaltet ist, und versuche es erneut.',
      endedBeforeScoring: 'Das Interview wurde beendet, bevor die Bewertung fertig war.',
      notEnoughCredits: 'Gratiszeit aufgebraucht',
    },

    actionNames: {
      screenshotCapture: 'Die Bildschirmaufnahme',
      captureSuggestion: 'Das Erzeugen eines Vorschlags auf Abruf',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} läuft noch. Versuche es gleich noch einmal.`,

    stealthSignedOut: 'Für den Tarnmodus musst du angemeldet sein.',
    stealthDuringMock:
      'Im Probeinterview ist der Tarnmodus aus. Das ist Übung, kein echtes Gespräch.',
    stealthNotRunning: 'Der Tarnmodus ist nur während eines Live-Interviews verfügbar.',
    opacityStealthOnly: 'Die Deckkraft lässt sich nur im Tarnmodus umschalten.',

    saveTranscriptTitle: 'Transkript speichern',
    saveMockReportTitle: 'Bericht zum Probeinterview speichern',
    saveImageTitle: 'Bild speichern',
    markdownFilter: 'Markdown',
    wordFilter: 'Word-Dokument',
    pngFilter: 'PNG-Bild',

    actionDuringMock: 'Vorschläge auf Abruf sind im Probeinterview nicht verfügbar.',
    cannotClearImages: 'Bilder können nur gelöscht werden, wenn der Assistent läuft',
    cannotCaptureScreenshot: 'Screenshots sind nur möglich, wenn der Assistent läuft',
    maxCaptures: (max: number) =>
      `Maximal ${max} Screenshots erreicht. Lösche die Bilder und versuche es erneut.`,
    captureFailed: 'Screenshot fehlgeschlagen. Bitte versuche es erneut.',
    cannotGenerateSuggestion: 'Vorschläge sind nur möglich, wenn der Assistent läuft',
  },

  [UiLanguage.French]: {
    placeholderTranscript: 'La transcription apparaîtra ici',
    placeholderQuestion: 'Les questions du recruteur apparaîtront ici',
    placeholderLiveAnswer: 'Les réponses suggérées apparaîtront ici en temps réel',
    placeholderActionAnswer:
      'Les suggestions à la demande apparaîtront ici. Par exemple, une proposition de réponse, la solution d’un test de code, la description d’un schéma, etc.',

    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',

    authErrors: {
      sendCodeFailed: 'Impossible d’envoyer le code de vérification',
      invalidCode: 'Code de vérification invalide ou expiré',
      signupFailed: 'Échec de l’inscription',
      invalidCredentials: 'Adresse e-mail ou mot de passe incorrect',
      loginFailed: 'Échec de la connexion',
      logoutFailed: 'Échec de la déconnexion',
      changePasswordFailed: 'Impossible de modifier le mot de passe',
      sendResetCodeFailed: 'Impossible d’envoyer le code de réinitialisation',
      invalidResetCode: 'Code de réinitialisation invalide ou expiré',
      resetFailed: 'Échec de la réinitialisation du mot de passe',
    },

    accountErrors: {
      fetchFailed: 'Impossible de récupérer le compte',
      updateFailed: 'Impossible de mettre à jour le compte',
      onboardingFailed: 'Impossible d’enregistrer votre configuration',
      migrateFailed: 'Impossible de migrer la configuration locale',
      loadConfigFailed: 'Impossible de charger la configuration',
    },

    transportErrors: {
      timedOut: 'La requête a expiré',
      networkFailed: 'La requête réseau a échoué',
    },

    paymentErrors: {
      getPlans: 'Impossible d’obtenir les formules',
      getCurrencies: 'Impossible d’obtenir les devises disponibles',
      createPayment: 'Impossible de créer le paiement',
      getStatus: 'Impossible d’obtenir le statut du paiement',
      getHistory: 'Impossible d’obtenir l’historique des paiements',
    },

    suggestionErrors: {
      tooManyRequests: 'Trop de requêtes. Veuillez réessayer plus tard.',
      generateFailed: 'Impossible de générer la réponse.',
      cannotReachServer: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
      responseTimedOut: 'La réponse a pris trop de temps. Veuillez réessayer.',
      emptyResponse: 'Le modèle a renvoyé une réponse vide.',
    },

    mockErrors: {
      liveRunning: 'Arrêtez l’entretien en direct avant de démarrer un entretien d’entraînement.',
      firstQuestionFailed: 'Impossible de générer la première question. Veuillez réessayer.',
      firstQuestionFailedWith: (reason: string) =>
        `Impossible de générer la première question : ${reason}`,
      startFailed: 'Impossible de démarrer l’entretien d’entraînement',
      nothingRecorded:
        'L’entretien s’est terminé sans aucun enregistrement. Vérifiez que le bon micro est sélectionné et qu’il n’est pas coupé, puis réessayez.',
      endedBeforeScoring: 'L’entretien a été arrêté avant la fin de la notation.',
      notEnoughCredits: 'Temps gratuit épuisé',
    },

    actionNames: {
      screenshotCapture: 'La capture d’écran',
      captureSuggestion: 'La génération d’une suggestion à la demande',
    },
    actionBlocked: (runningAction: string) =>
      `${runningAction} est en cours. Réessayez un peu plus tard.`,

    stealthSignedOut: 'Vous devez être connecté pour utiliser le mode furtif.',
    stealthDuringMock:
      'Le mode furtif est désactivé pendant un entretien d’entraînement. C’est un entraînement, pas un vrai appel.',
    stealthNotRunning: 'Le mode furtif n’est disponible que pendant un entretien en direct.',
    opacityStealthOnly: 'L’opacité ne peut être modifiée qu’en mode furtif.',

    saveTranscriptTitle: 'Enregistrer la transcription',
    saveMockReportTitle: 'Enregistrer le rapport de l’entretien d’entraînement',
    saveImageTitle: 'Enregistrer l’image',
    markdownFilter: 'Markdown',
    wordFilter: 'Document Word',
    pngFilter: 'Image PNG',

    actionDuringMock: 'Les suggestions à la demande sont indisponibles pendant un entretien d’entraînement.',
    cannotClearImages: 'Impossible d’effacer les images tant que l’assistant n’est pas lancé',
    cannotCaptureScreenshot: 'Impossible de prendre une capture tant que l’assistant n’est pas lancé',
    maxCaptures: (max: number) =>
      `Limite de ${max} captures atteinte. Effacez les images et réessayez.`,
    captureFailed: 'Échec de la capture d’écran. Veuillez réessayer.',
    cannotGenerateSuggestion: 'Impossible de générer une suggestion tant que l’assistant n’est pas lancé',
  },

  [UiLanguage.Chinese]: {
    placeholderTranscript: '转录内容将显示在这里',
    placeholderQuestion: '面试官的问题将显示在这里',
    placeholderLiveAnswer: '建议的回答将在这里实时显示',
    placeholderActionAnswer: '按需建议将显示在这里，例如回答建议、编程题解答、图表说明等。',

    sessionExpired: '会话已过期，请重新登录。',

    authErrors: {
      sendCodeFailed: '验证码发送失败',
      invalidCode: '验证码无效或已过期',
      signupFailed: '注册失败',
      invalidCredentials: '邮箱或密码错误',
      loginFailed: '登录失败',
      logoutFailed: '退出登录失败',
      changePasswordFailed: '修改密码失败',
      sendResetCodeFailed: '重置码发送失败',
      invalidResetCode: '重置码无效或已过期',
      resetFailed: '密码重置失败',
    },

    accountErrors: {
      fetchFailed: '获取账户失败',
      updateFailed: '更新账户失败',
      onboardingFailed: '保存设置失败',
      migrateFailed: '迁移本地设置失败',
      loadConfigFailed: '加载设置失败',
    },

    transportErrors: {
      timedOut: '请求超时',
      networkFailed: '网络请求失败',
    },

    paymentErrors: {
      getPlans: '获取套餐失败',
      getCurrencies: '获取可用币种失败',
      createPayment: '创建支付失败',
      getStatus: '获取支付状态失败',
      getHistory: '获取支付记录失败',
    },

    suggestionErrors: {
      tooManyRequests: '请求过于频繁，请稍后再试。',
      generateFailed: '生成回答失败。',
      cannotReachServer: '无法连接服务器。请检查网络连接后重试。',
      responseTimedOut: '响应超时，请重试。',
      emptyResponse: '模型返回了空回答。',
    },

    mockErrors: {
      liveRunning: '请先停止实时面试，再开始模拟面试。',
      firstQuestionFailed: '生成第一道题失败，请重试。',
      firstQuestionFailedWith: (reason: string) => `无法生成第一道题：${reason}`,
      startFailed: '启动模拟面试失败',
      nothingRecorded: '面试结束时没有录到任何内容。请检查是否选择了正确的麦克风且未静音，然后重试。',
      endedBeforeScoring: '面试在评分完成前就结束了。',
      notEnoughCredits: '免费时长已用完',
    },

    actionNames: {
      screenshotCapture: '截图',
      captureSuggestion: '按需建议生成',
    },
    actionBlocked: (runningAction: string) => `${runningAction}正在进行中，请稍后再试。`,

    stealthSignedOut: '需要登录才能使用隐身模式。',
    stealthDuringMock: '模拟面试期间隐身模式不可用。这是练习，不是真实通话。',
    stealthNotRunning: '隐身模式仅在实时面试期间可用。',
    opacityStealthOnly: '仅在隐身模式下可以切换透明度。',

    saveTranscriptTitle: '保存转录',
    saveMockReportTitle: '保存模拟面试报告',
    saveImageTitle: '保存图片',
    markdownFilter: 'Markdown',
    wordFilter: 'Word 文档',
    pngFilter: 'PNG 图片',

    actionDuringMock: '模拟面试期间无法使用按需建议。',
    cannotClearImages: '助手未运行时无法清除图片',
    cannotCaptureScreenshot: '助手未运行时无法截图',
    maxCaptures: (max: number) => `已达到 ${max} 张截图的上限。请清除图片后重试。`,
    captureFailed: '截图失败，请重试。',
    cannotGenerateSuggestion: '助手未运行时无法生成建议',
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
