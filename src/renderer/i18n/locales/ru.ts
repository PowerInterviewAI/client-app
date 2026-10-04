/**
 * Russian.
 *
 * Typed as `Translation`, so this file cannot drift from `en.ts`: a key that is missing is a
 * build error, and so is one that is spelled differently.
 *
 * Two things about the copy itself. Dashes are hyphens rather than the «—» Russian typography
 * would normally use, because this repository's writing rules forbid generating em-dashes and
 * the English source uses hyphens in the same positions. And the register matches the English:
 * direct, second-person formal, and no more words than the English string uses - Russian runs
 * roughly 15% longer than English for the same sentence, and these strings sit in a window whose
 * minimum width is 840px.
 */
import type { Translation } from './en';

/**
 * Russian has three plural forms and which one a number takes is not a property of the number
 * alone, so it cannot be expressed as a `{{count}}` placeholder: 1 балл, 2 балла, 5 баллов, and
 * 11 балл**ов** again despite ending in 1.
 *
 * Exported for the locale's own use only. Callers pass a number and get a finished string.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export const ru: Translation = {
  common: {
    cancel: 'Отмена',
    close: 'Закрыть',
    back: 'Назад',
    continue: 'Далее',
    finish: 'Готово',
    retry: 'Повторить',
    view: 'Открыть',
    loading: 'Загрузка…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'Язык приложения',
    description:
      'Сам интерфейс: кнопки, заголовки и сообщения. Язык собеседования настраивается отдельно.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `Настройка ${appName}`,
    guideEyebrow: 'Руководство по настройке',
    progress: (current: number, total: number, label: string) =>
      `Шаг ${current} из ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'Язык приложения',
        title: 'На каком языке показывать приложение?',
        description:
          'Выберите язык, на котором вам удобнее читать. Всё дальше, включая этот шаг, будет на нём.',
      },
      profile: {
        label: 'Профиль',
        title: 'Расскажите о себе',
        description:
          'Все подсказки пишутся на основе этого - вашим опытом и вашими словами. Без этого приложение работать не сможет.',
      },
      context: {
        label: 'О вакансии',
        title: 'На какую позицию вы проходите собеседование?',
        description:
          'Необязательно, но стоит вставить: с описанием вакансии ассистент отвечает именно для этой роли, а не в общем.',
      },
      language: {
        label: 'Язык',
        title: 'Выберите язык собеседования',
        description: 'Он задаёт и то, что распознаётся, и то, на каком языке приходят подсказки.',
      },
      microphone: {
        label: 'Микрофон',
        title: 'Выберите микрофон',
        description:
          'Выберите микрофон, в который вы действительно будете говорить, и проверьте его. На собеседовании используйте наушники - через динамики приложение слышит интервьюера вашим микрофоном и замолкает.',
      },
      mode: {
        label: 'Подсказки',
        title: 'Какими должны быть подсказки?',
        description: 'Это можно изменить в любой момент, в том числе во время собеседования.',
      },
      mockHints: {
        label: 'Пробное собеседование',
        title: 'Показывать подсказки в пробном собеседовании?',
        description:
          'Пробное собеседование - это тренировка против ИИ-интервьюера. Здесь вы решаете, будет ли он подсказывать ответы.',
      },
      zoom: {
        label: 'Размер',
        title: 'Так читать удобно?',
        description:
          'Окно собеседования небольшое специально, чтобы не закрывать звонок. Настройте размер сейчас, пока есть время, а не посреди вопроса.',
      },
      transcript: {
        label: 'Расшифровка',
        title: 'И последнее',
        description: 'Показывать ли расшифровку разговора под подсказками.',
      },
    },

    blocked: {
      accountUnreachable:
        'Не удалось связаться с вашей учётной записью, поэтому введённое здесь пока нельзя сохранить.',
      needName: 'Укажите полное имя, чтобы продолжить.',
      needProfile: 'Добавьте профиль, чтобы продолжить.',
    },

    loadingAccount: 'Загружаем вашу учётную запись…',
    accountUnreachable:
      'Не удалось связаться с учётной записью. Введённое здесь нельзя сохранить, пока связь не восстановится.',

    skip: 'Пропустить',
    skipTooltip: 'Настройку можно пройти позже в разделе «Настройки»',

    allSet: 'Всё готово',
    profileNotSavedOnSkip:
      'Настройка пропущена, но профиль не сохранён. Попробуйте ещё раз в разделе «Учётная запись».',
    completionNotRecorded:
      'Настройка пропущена, но сохранить это не удалось. Возможно, она предложится снова.',
    saveProfileFailed: 'Не удалось сохранить профиль',
    finishFailed: 'Не удалось сохранить настройки. Проверьте подключение и попробуйте снова.',
  },

  configuration: {
    title: 'Настройки',
    setupGuide: {
      title: 'Руководство по настройке',
      description: 'Пройдите всё на этой странице, а также профиль, шаг за шагом.',
      action: 'Пройти настройку',
    },
    hotkeys: {
      title: 'Горячие клавиши',
      description: 'Всё, до чего можно дотянуться, не трогая приложение во время собеседования.',
    },
  },

  auth: {
    fields: {
      email: 'Эл. почта',
      password: 'Пароль',
      username: 'Имя пользователя',
      confirmPassword: 'Подтвердите пароль',
      newPassword: 'Новый пароль',
      confirmNewPassword: 'Подтвердите новый пароль',
      verificationCode: 'Код подтверждения',
      resetCode: 'Код сброса',
    },

    signIn: {
      title: 'Вход',
      description: (appName: string) => `Войдите, чтобы пользоваться ${appName}`,
      submit: 'Войти',
      submitting: 'Входим…',
      rememberMe: 'Запомнить меня',
      noAccount: 'Нет учётной записи? Создайте новую.',
      forgotPassword: 'Забыли пароль?',
    },

    signup: {
      title: 'Создание учётной записи',
      description: (appName: string) => `Зарегистрируйте новую учётную запись ${appName}`,
      sendCode: 'Отправить код',
      sending: 'Отправляем…',
      haveAccount: 'Уже есть учётная запись? Войдите',
      codeNotice: (email: string) =>
        `Если у адреса ${email} ещё нет учётной записи, мы отправили на него код подтверждения - вставьте код ниже. Если учётная запись уже есть, мы отправили письмо о том, как войти.`,
      verify: 'Подтвердить',
      verifying: 'Проверяем…',
      changeEmail: 'Изменить адрес',
      resendCode: 'Отправить код снова',
      requestResent: 'Запрос отправлен снова.',
      resendFailed: 'Не удалось отправить снова.',
      create: 'Создать учётную запись',
      creating: 'Создаём…',
      sendCodeFailed: 'Не удалось отправить код подтверждения. Попробуйте ещё раз.',
      invalidCode: 'Код подтверждения неверен или истёк.',
      succeeded: 'Учётная запись создана. Теперь войдите.',
      failed: 'Не удалось создать учётную запись. Попробуйте ещё раз.',
    },

    reset: {
      title: 'Сброс пароля',
      description: (appName: string) => `Задайте новый пароль для учётной записи ${appName}`,
      sendResetCode: 'Отправить код сброса',
      sending: 'Отправляем…',
      backToSignIn: 'Вернуться к входу',
      codeNotice: (email: string) =>
        `Если для адреса ${email} есть учётная запись, мы отправили на него код сброса - вставьте код ниже. Код действует один раз, а срок его действия указан в письме.`,
      verify: 'Подтвердить',
      verifying: 'Проверяем…',
      changeEmail: 'Изменить адрес',
      resendCode: 'Отправить код снова',
      codeResent: 'Код сброса отправлен снова.',
      resendFailed: 'Не удалось отправить код сброса снова.',
      signsYouOut: 'После смены пароля вы выйдете из приложения на всех устройствах.',
      setNewPassword: 'Задать новый пароль',
      saving: 'Сохраняем…',
      done: 'Пароль изменён',
      startOver: 'Начать заново',
      sendFailed: 'Не удалось отправить код сброса. Попробуйте ещё раз.',
      verifyFailed: 'Не удалось проверить код сброса.',
      succeeded: 'Пароль изменён. Войдите с новым паролем.',
      failed: 'Не удалось изменить пароль. Возможно, код истёк - запросите новый.',
    },

    passwordsDoNotMatch: 'Пароли не совпадают',

    errors: {
      sendCodeFailed: 'Не удалось отправить код подтверждения',
      invalidCode: 'Код подтверждения неверен или истёк',
      loginFailed: 'Не удалось войти',
      signupFailed: 'Не удалось создать учётную запись',
      logoutFailed: 'Не удалось выйти',
      changePasswordFailed: 'Не удалось изменить пароль',
      sendResetCodeFailed: 'Не удалось отправить код сброса пароля',
      invalidResetCode: 'Код сброса неверен или истёк',
      resetFailed: 'Не удалось изменить пароль',
    },
  },

  home: {
    welcome: (firstName: string) => `С возвращением, ${firstName}`,
    welcomeAnonymous: 'С возвращением',
    subtitle:
      'Потренируйтесь с ИИ-интервьюером или получите подсказки прямо во время настоящего звонка.',

    mock: {
      title: 'Пробное собеседование',
      ready: 'ИИ задаёт вопросы, вы отвечаете вслух, а в конце получаете отчёт с оценкой.',
      unsupported: 'Пока недоступно на этом сервере. Обновите приложение или попробуйте позже.',
      liveRunning: 'Сначала остановите живого ассистента - микрофон нельзя делить между ними.',
      unaffordable: (price: number) =>
        `Недостаточно кредитов - самое короткое пробное собеседование стоит ${price}. Пополните баланс, чтобы тренироваться.`,
    },

    live: {
      title: 'Запустить ассистента',
      resumeTitle: 'Вернуться к собеседованию',
      ready: 'Распознаёт настоящее собеседование и предлагает ответы по ходу разговора.',
      running: 'Ассистент уже работает.',
      mockRunning: 'Сначала завершите пробное собеседование - микрофон нельзя делить между ними.',
    },

    accountLabel: 'Учётная запись',
    notSignedIn: 'Вход не выполнен',
    creditsLabel: 'Кредиты',
    creditsUnavailable: 'Нет данных',
    buyCredits: 'Купить кредиты',

    nav: {
      account: 'Учётная запись',
      configuration: 'Настройки',
      documentation: 'Документация',
    },

    signOut: 'Выйти',
    signingOut: 'Выходим…',
    signOutBlocked: 'Остановите собеседование, прежде чем выйти',
    signOutFailed: 'Не удалось выйти',
  },

  account: {
    title: 'Учётная запись',
    signedInAs: 'Вы вошли как',
    password: {
      title: 'Пароль',
      description: 'Смена пароля учётной записи',
      action: 'Изменить пароль',
    },
    loadFailed:
      'Не удалось загрузить сохранённые данные. Восстановите соединение, прежде чем вносить изменения.',
    save: 'Сохранить',
    saving: 'Сохраняем…',
    saved: 'Данные учётной записи сохранены',
    saveFailed: 'Не удалось сохранить данные учётной записи',
  },

  profileFields: {
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Имя, которым вы называетесь на собеседовании',
    profile: 'Профиль',
    profilePlaceholder:
      'Вставьте резюме, профиль LinkedIn или короткую биографию. Подсказки пишутся на основе этого, поэтому чем больше деталей, тем больше ответы похожи на ваши.',
    context: 'Контекст',
    contextPlaceholder:
      'Вставьте описание вакансии, требования к роли или что-то ещё о собеседовании, к которому вы готовитесь.',
    limitReached: (max: number) =>
      `Достигнут предел символов (${max.toLocaleString('ru-RU')}). Лишний текст не добавлен.`,
    // Three plural forms, which is the whole reason these strings are functions and not
    // templates with a `{{count}}` in them: 1 символ, 2 символа, 5 символов, 11 символов.
    charactersLeft: (remaining: number) =>
      `Осталось ${remaining.toLocaleString('ru-RU')} ${plural(remaining, 'символ', 'символа', 'символов')}`,
  },

  microphoneField: {
    label: 'Микрофон',
    noDevices: 'Микрофон не найден. Подключите его, и он появится здесь.',
    selectPlaceholder: 'Выберите микрофон',
    lookingPlaceholder: 'Ищем микрофоны…',
    test: 'Проверить',
    stopTest: 'Остановить',
    openFailed:
      'Не удалось открыть этот микрофон. Проверьте, что он подключён и не занят другим приложением.',
    notConnected: (deviceName: string) =>
      `«${deviceName}» больше не подключён. Выберите другой микрофон.`,
    saySomething: 'Скажите что-нибудь - полоска должна двигаться, пока вы говорите.',
    runningHint: 'Этот микрофон занят собеседованием. Проверить его можно после остановки.',
    testHint:
      'Проверьте микрофон до собеседования - молчащий микрофон выглядит точно так же, как тихая комната.',
  },

  micLevelMeter: {
    label: 'Уровень сигнала микрофона',
    hearing: 'Слышно вас',
    silent: 'Тишина',
  },

  suggestionModeField: {
    label: 'Вид подсказок',
    hintOnly: 'Только подсказки',
    hintOnlyDescription:
      'Заголовок и ключевые слова, которые читаются одним взглядом, пока вы продолжаете говорить. Рекомендуется.',
    fullSentences: 'Полные фразы',
    fullSentencesDescription:
      'Ответ, записанный так, как его можно произнести. Читать больше, придумывать меньше.',
    switchHint: (combo: string) =>
      `Переключается во время собеседования с панели управления или по ${combo}.`,
  },

  zoomField: {
    label: 'Размер интерфейса',
    smaller: 'Меньше',
    larger: 'Больше',
    reset: 'Сбросить',
    description: (combo: string) =>
      `Масштабирует всё приложение. Окно собеседования небольшое специально - так подсказки становятся читаемыми одним взглядом. Также доступно по ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Показывать панель расшифровки',
    description: (combo: string) =>
      `Держит расшифровку разговора под подсказками. Выключите, чтобы освободить место для чтения подсказок. Переключается в любой момент по ${combo}.`,
  },

  mockHintsField: {
    label: 'Показывать подсказки в пробных собеседованиях',
    description:
      'Показывает рядом с каждым вопросом пробного собеседования то, что ответил бы живой ассистент, чтобы вы могли сравнить со своим ответом. Выключите, чтобы отвечать самостоятельно - в любом случае это переключается во время сессии с панели пробного собеседования. На настоящее собеседование это никак не влияет.',
  },

  languageField: {
    label: 'Язык собеседования',
    textOnly: 'только текст',
    reconnectFailed:
      'Подсказки переключились на новый язык, но распознавание всё ещё переподключается. Если оно не вернётся, остановите и запустите ассистента заново.',
    description: 'Что распознаётся и на каком языке приходят подсказки.',
    noVoiceNotice:
      'Интервьюер будет писать вопросы, а не произносить их. Отвечать всё равно нужно вслух, и оценка не меняется.',
  },

  changePassword: {
    title: 'Изменить пароль',
    description: 'Введите текущий пароль и выберите новый.',
    current: 'Текущий пароль',
    currentPlaceholder: 'Введите текущий пароль',
    next: 'Новый пароль',
    nextPlaceholder: 'Введите новый пароль',
    confirm: 'Подтвердите новый пароль',
    confirmPlaceholder: 'Повторите новый пароль',
    submit: 'Изменить пароль',
    submitting: 'Меняем…',
    mismatch: 'Новые пароли не совпадают.',
    succeeded: 'Пароль изменён',
    failed: 'Не удалось изменить пароль',
  },

  hotkeys: {
    dialogTitle: 'Горячие клавиши',
    dialogDescription:
      'Всё, до чего можно дотянуться, не трогая приложение во время собеседования.',

    groups: {
      general: 'Основное',
      window: 'Управление окном',
      panels: 'Прокрутка панелей',
      triggered: 'Подсказки по запросу',
    },

    keys: {
      StopAll: {
        title: 'Остановить всё',
        description: 'Остановить ассистента и выйти из скрытого режима',
      },
      ToggleStealth: {
        title: 'Скрытый режим',
        description:
          'Скрыть окно от записи экрана во время живого собеседования. Те же клавиши возвращают его.',
      },
      Opacity: {
        title: 'Прозрачность',
        description: 'Переключить прозрачность окна в скрытом режиме',
      },
      ToggleTranscript: {
        title: 'Расшифровка',
        description: 'Показать или скрыть панель расшифровки - работает и в скрытом режиме',
      },
      ToggleSuggestionMode: {
        title: 'Кратко / полными фразами',
        description:
          'Переключить подсказки между краткими - заголовок и ключевые слова, которые читаются одним взглядом - и полными фразами. Работает и в скрытом режиме.',
      },
      PlaceWin: {
        title: 'Разместить окно',
        description: 'Поставить окно в угол, к краю или по центру',
      },
      MoveWin: {
        title: 'Переместить окно',
        description: 'Переместить окно в выбранную сторону',
      },
      ResizeWin: {
        title: 'Изменить размер окна',
        description: 'Изменить размер окна в выбранную сторону',
      },
      ZoomInOutReset: {
        title: 'Масштаб: больше, меньше, сброс',
        description: 'Изменить или сбросить масштаб интерфейса',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Прокрутка живой панели',
        description: 'Прокрутка вниз, вверх и в конец в панели живых подсказок',
      },
      ScrollActionSuggestionPanel: {
        title: 'Прокрутка панели по запросу',
        description: 'Прокрутка вниз, вверх и в конец в панели подсказок по запросу',
      },
      Capture: {
        title: 'Снимок экрана',
        description: 'Сделать снимок экрана для подсказок по запросу',
      },
      ClearCaptures: { title: 'Очистить снимки', description: 'Удалить сделанные снимки экрана' },
      TriggerWithoutCaptures: {
        title: 'Подсказка без снимков',
        description: 'Создать подсказку без снимков экрана',
      },
      TriggerWithCaptures: {
        title: 'Подсказка со снимками',
        description:
          'Создать подсказку с учётом снимков экрана. Если снимков нет, сначала будет сделан один.',
      },
    },
  },

  inputPassword: {
    show: 'Показать пароль',
    hide: 'Скрыть пароль',
  },

  titlebar: {
    openCommandPalette: 'Открыть палитру команд',
    searchActions: 'Поиск действий',
    unavailableDuringInterview: 'Недоступно во время собеседования',
    menu: 'Меню',
    minimize: 'Свернуть',
    maximize: 'Развернуть',
    close: 'Закрыть',
  },

  titlebarMenu: {
    home: 'Главная',
    account: 'Учётная запись',
    configuration: 'Настройки',
    documentation: 'Документация',
    lightMode: 'Светлая тема',
    darkMode: 'Тёмная тема',
    signOut: 'Выйти',
  },

  commandPalette: {
    title: 'Палитра команд',
    description: 'Найдите действие, страницу или настройку.',
    searchPlaceholder: 'Поиск действий…',
    empty: 'Ничего не найдено.',
    groups: {
      goTo: 'Перейти',
      session: 'Сессия',
      app: 'Приложение',
    },
    home: 'Главная',
    account: 'Учётная запись',
    configuration: 'Настройки',
    buyCredits: 'Купить кредиты',
    startMock: 'Начать пробное собеседование',
    startLive: 'Запустить ассистента',
    switchToFullSentence: 'Переключиться на полные фразы',
    switchToHintOnly: 'Переключиться на краткие подсказки',
    hideTranscript: 'Скрыть расшифровку',
    showTranscript: 'Показать расшифровку',
    documentation: 'Документация',
    hotkeys: 'Горячие клавиши',
    switchToLight: 'Светлая тема',
    switchToDark: 'Тёмная тема',
    signOut: 'Выйти',
  },

  controlPanel: {
    stop: 'Стоп',
    stopTooltip: 'Остановить ассистента',
    stopRunningHint: 'Завершает сессию, предлагает её сохранить и возвращает на главную',
    stopIdleHint: 'Ничего не запущено - начните собеседование с главного экрана',
    stopTransientHint: 'Будет доступно, когда сессия запустится',

    checks: {
      configUnavailable:
        'Не удалось загрузить сохранённые настройки. Переподключаемся - попробуйте через мгновение.',
      nameMissing: 'Полное имя не указано',
      profileMissing: 'Профиль не заполнен',
      noMicrophone: 'Микрофон не найден. Подключите его и попробуйте снова.',
      deviceNotFound: (deviceName: string) => `Микрофон «${deviceName}» не найден`,
    },
    startFailed: 'Не удалось запустить ассистента',
  },

  audioGroup: {
    options: 'Настройки звука',
    optionsSwapFailed: 'Настройки звука - не удалось сменить микрофон, используется предыдущий',
    optionsDeviceNotFound: 'Настройки звука - выбранный микрофон не найден',
    dialogTitle: 'Настройки звука',
    dialogDescription: 'Выберите микрофон, которым вы пользуетесь.',
    microphone: 'Микрофон',
    selectPlaceholder: 'Выберите микрофон',
    switching: 'Меняем микрофон…',
    swapFailed: (deviceName: string) =>
      `Не удалось переключиться на ${deviceName}. Это собеседование продолжается на предыдущем микрофоне. Чтобы использовать новый, остановите и запустите ассистента.`,
    takesEffectImmediately: 'Применяется сразу. Распознавание продолжает работать.',
  },

  languageGroup: {
    current: (languageName: string) => `Язык собеседования: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Язык собеседования: ${languageName} - распознавание не переключилось`,
    tooltip: (nativeName: string) => `Язык собеседования: ${nativeName}`,
    reconnecting: 'Переподключаем распознавание…',
    suggestionsOnly: 'Только подсказки - распознавание ещё переподключается',
    speechAndSuggestions: 'Распознавание речи и подсказки',
    menuLabel: 'Язык собеседования',
    halfApplied:
      'Подсказки переключились, распознавание нет. Попытки продолжаются - если оно не вернётся, остановите и запустите ассистента.',
    willReconnect: 'Распознавание переподключится; текущая фраза может оборваться.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Кратко',
    fullSentencesBadge: 'Полные фразы',
    hintOnlyMode: 'Краткие подсказки',
    fullSentenceMode: 'Полные фразы',
    hintOnlySummary: 'Заголовок и ключевые слова',
    fullSentenceSummary: 'Ответы, записанные целиком',
    ariaHintOnly: 'Вид подсказок: кратко. Переключить на полные фразы',
    ariaFullSentence: 'Вид подсказок: полные фразы. Переключить на краткие',
  },

  toolsGroup: {
    hideTranscription: 'Скрыть расшифровку',
    showTranscription: 'Показать расшифровку',
    enterStealth: 'Включить скрытый режим',
    stealthMode: 'Скрытый режим',
    stealthUnavailable: 'Будет доступно во время живого собеседования - пока скрывать нечего.',
    stealthAvailable: 'Скрывает приложение от записи экрана. Те же клавиши возвращают его обратно.',
    captureScreenshot: 'Сделать снимок экрана',
    captureScreenshotTooltip: 'Снимок экрана',
    captureFailed: 'Не удалось сделать снимок экрана',
    clearCaptures: 'Удалить сделанные снимки экрана',
    clearCapturesTooltip: 'Очистить снимки',
    clearCapturesFailed: 'Не удалось очистить снимки',
    generateSuggestion: 'Создать подсказку по запросу',
    generateSuggestionTooltip: 'Создать подсказку',
    generateSuggestionFailed: 'Не удалось создать подсказку',
    clear: 'Очистить',
    clearInterview: 'Очистить собеседование',
    clearFailed: 'Не удалось очистить',
    exportInterview: 'Экспорт собеседования',
    exportTheInterview: 'Экспортировать собеседование',
    nothingToExport: 'Экспортировать пока нечего',
    nothingToExportDescription:
      'Сначала проведите собеседование, затем экспортируйте расшифровку и подсказки.',
    exportFailed: 'Не удалось экспортировать собеседование',
    exportDocx: 'Документ Word (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Расшифровка',
    transcriptionShown: (combo: string) => `Расшифровка: показана (${combo})`,
    transcriptionHidden: (combo: string) => `Расшифровка: скрыта (${combo})`,
    showHotkeys: 'Горячие клавиши',
    showHotkeysLabel: 'Показать горячие клавиши',
    showHotkeysTitle: 'Показать горячие клавиши (?)',
  },

  runningIndicator: {
    idle: 'Простой',
    starting: 'Запуск',
    running: 'Работает',
    stopping: 'Остановка',
  },

  zoomControl: {
    reset: 'Сбросить масштаб',
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',
  },

  creditsDisplay: {
    trialPlan: 'Пробный тариф',
    paidPlan: 'Платный тариф',
    summary: (credits: number, availableTime: string) =>
      `${credits.toLocaleString('ru-RU')} ${plural(credits, 'кредит', 'кредита', 'кредитов')} - ${availableTime}`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} ${plural(hours, 'час', 'часа', 'часов')}`);
      if (minutes) parts.push(`${minutes} ${plural(minutes, 'минута', 'минуты', 'минут')}`);
      return parts.join(' ') || '0 минут';
    },
    lessThanAMinute: 'Меньше минуты',
    noCreditsLeft: 'Кредиты закончились',
  },
};
