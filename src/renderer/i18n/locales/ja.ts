/**
 * Japanese.
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here. The register is the polite です/ます form Japanese software uses, with
 * plain noun phrases for buttons and labels. Japanese has no plural forms.
 */
import type { Translation } from './en';

export const ja: Translation = {
  common: {
    cancel: 'キャンセル',
    close: '閉じる',
    back: '戻る',
    continue: '続ける',
    finish: '完了',
    retry: '再試行',
    view: '表示',
    loading: '読み込み中…',
    withCombo: (label: string, combo: string) => `${label}（${combo}）`,
  },

  uiLanguageField: {
    label: 'アプリの言語',
    description: 'ボタン、メニュー、メッセージの言語です。面接の言語とは別に設定します。',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `${appName} のセットアップ`,
    guideEyebrow: 'セットアップガイド',
    progress: (current: number, total: number, label: string) =>
      `ステップ ${current}/${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'アプリの言語',
        title: 'アプリをどの言語で表示しますか？',
        description: 'いちばん読みやすい言語を選んでください。以降のセットアップもその言語で進みます。',
      },
      profile: {
        label: 'プロフィール',
        title: 'あなたについて教えてください',
        description: '提案はあなたの経験をもとに作成されるため、入力が必要です。',
      },
      context: {
        label: '求人情報',
        title: 'どのポジションの面接ですか？',
        description: '任意です。求人票を貼り付けると、そのポジションに合わせた回答になります。',
      },
      language: {
        label: '言語',
        title: '面接の言語を選択',
      },
      microphone: {
        label: 'マイク',
        title: 'マイクを選択',
        description:
          '話すときに使うマイクを選んでテストしてください。ヘッドホンを使用してください - スピーカーだとアプリが回答しなくなることがあります。',
      },
      mode: {
        label: '提案',
        title: '提案をどの形式で表示しますか？',
      },
      mockHints: {
        label: '模擬面接',
        title: '模擬面接でヒントを表示しますか？',
      },
      zoom: {
        label: 'サイズ',
        title: '読みやすい大きさですか？',
      },
      transcript: {
        label: '文字起こし',
        title: 'リアルタイムの文字起こしを表示しますか？',
      },
    },

    blocked: {
      accountUnreachable: 'アカウントに接続できないため、ここに入力した内容はまだ保存できません。',
      needName: '続けるにはフルネームを入力してください。',
      needProfile: '続けるにはプロフィールを入力してください。',
    },

    loadingAccount: 'アカウントを読み込んでいます…',
    accountUnreachable: 'アカウントに接続できません。接続が戻るまで、ここに入力した内容は保存できません。',

    skip: '今はスキップ',
    skipTooltip: 'セットアップは後で設定画面からもう一度実行できます',

    allSet: '準備完了です',
    profileNotSavedOnSkip: 'セットアップをスキップしましたが、プロフィールは保存されていません。アカウント画面から再度お試しください。',
    completionNotRecorded: 'セットアップをスキップしましたが、その記録に失敗しました。もう一度表示されることがあります。',
    saveProfileFailed: 'プロフィールを保存できませんでした',
    finishFailed: 'セットアップを保存できませんでした。接続を確認してもう一度お試しください。',
  },

  configuration: {
    title: '設定',
    setupGuide: {
      title: 'セットアップガイド',
      description: 'このページの設定とプロフィールを、1 ステップずつ確認します。',
      action: 'セットアップを開始',
    },
    hotkeys: {
      title: 'キーボードショートカット',
      description: '面接中にアプリに触れずに使える操作の一覧です。',
    },
  },

  auth: {
    fields: {
      email: 'メールアドレス',
      password: 'パスワード',
      username: 'ユーザー名',
      confirmPassword: 'パスワード（確認）',
      newPassword: '新しいパスワード',
      confirmNewPassword: '新しいパスワード（確認）',
      verificationCode: '確認コード',
      resetCode: 'リセットコード',
    },

    signIn: {
      title: 'ログイン',
      description: (appName: string) => `アカウントで ${appName} にログインします`,
      submit: 'ログイン',
      submitting: 'ログイン中…',
      rememberMe: 'ログイン状態を保持',
      noAccount: 'アカウントをお持ちでない方は新規作成してください。',
      forgotPassword: 'パスワードをお忘れですか？',
    },

    signup: {
      title: 'アカウント作成',
      description: (appName: string) => `${appName} の新しいアカウントを登録します`,
      sendCode: 'コードを送信',
      sending: '送信中…',
      haveAccount: 'すでにアカウントをお持ちの方はログイン',
      codeNotice: (email: string) =>
        `${email} にまだアカウントがない場合は、確認コードを送信しました。下に貼り付けてください。すでにアカウントがある場合は、ログイン方法を説明するメールを送信しました。`,
      verify: '確認',
      verifying: '確認中…',
      changeEmail: 'メールアドレスを変更',
      resendCode: 'コードを再送信',
      requestResent: 'もう一度送信しました。',
      resendFailed: '再送信に失敗しました。',
      create: 'アカウントを作成',
      creating: '作成中…',
      sendCodeFailed: '確認コードを送信できませんでした。もう一度お試しください。',
      invalidCode: '確認コードが無効か、有効期限が切れています。',
      succeeded: '登録が完了しました。ログインしてください。',
      failed: '登録に失敗しました。もう一度お試しください。',
    },

    reset: {
      title: 'パスワードの再設定',
      description: (appName: string) => `${appName} アカウントの新しいパスワードを設定します`,
      sendResetCode: 'リセットコードを送信',
      sending: '送信中…',
      backToSignIn: 'ログインに戻る',
      codeNotice: (email: string) =>
        `${email} のアカウントが存在する場合は、リセットコードを送信しました。下に貼り付けてください。コードは 1 回のみ使用でき、有効期限はメールに記載されています。`,
      verify: '確認',
      verifying: '確認中…',
      changeEmail: 'メールアドレスを変更',
      resendCode: 'コードを再送信',
      codeResent: 'リセットコードを再送信しました。',
      resendFailed: 'リセットコードを再送信できませんでした。',
      signsYouOut: '新しいパスワードを設定すると、すべてのデバイスからログアウトします。',
      setNewPassword: '新しいパスワードを設定',
      saving: '保存中…',
      done: 'パスワードを再設定しました',
      startOver: '最初からやり直す',
      sendFailed: 'リセットコードを送信できませんでした。もう一度お試しください。',
      verifyFailed: 'リセットコードを確認できませんでした。',
      succeeded: 'パスワードを再設定しました。新しいパスワードでログインしてください。',
      failed: 'パスワードの再設定に失敗しました。コードの有効期限が切れている可能性があります - 新しいコードを取得してください。',
    },

    passwordsDoNotMatch: 'パスワードが一致しません',

    errors: {
      sendCodeFailed: '確認コードを送信できませんでした',
      invalidCode: '確認コードが無効か、有効期限が切れています',
      loginFailed: 'ログインに失敗しました',
      signupFailed: '登録に失敗しました',
      logoutFailed: 'ログアウトに失敗しました',
      changePasswordFailed: 'パスワードを変更できませんでした',
      sendResetCodeFailed: 'リセットコードを送信できませんでした',
      invalidResetCode: 'リセットコードが無効か、有効期限が切れています',
      resetFailed: 'パスワードの再設定に失敗しました',
    },
  },

  home: {
    welcome: (firstName: string) => `おかえりなさい、${firstName} さん`,
    welcomeAnonymous: 'おかえりなさい',
    subtitle: 'AI 面接官と練習するか、本番の通話中にリアルタイムでサポートを受けられます。',

    mock: {
      title: '模擬面接を開始',
      ready: 'AI が質問し、あなたが声に出して答えます。最後に採点付きのレポートが届きます。',
      unsupported: 'このサーバーではまだ利用できません。アプリを更新するか、後でもう一度お試しください。',
      liveRunning: '先にライブアシスタントを停止してください - マイクを同時に使うことはできません。',
      unaffordable: '無料時間が足りません。練習を続けるにはサブスクリプションに登録してください。',
    },

    live: {
      title: 'ライブアシスタントを開始',
      resumeTitle: '面接に戻る',
      ready: '本番の面接を文字起こしし、その場で回答を提案します。',
      running: 'ライブアシスタントはすでに実行中です。',
      mockRunning: '先に模擬面接を終了してください - マイクを同時に使うことはできません。',
      unaffordable: '無料時間が足りません。面接を続けるにはサブスクリプションに登録してください。',
    },

    accountLabel: 'アカウント',
    notSignedIn: '未ログイン',
    planLabel: 'プラン',
    planUnavailable: '取得できません',
    subscribe: 'サブスクリプション',

    nav: {
      account: 'アカウント',
      configuration: '設定',
      documentation: 'ヘルプ',
    },

    signOut: 'ログアウト',
    signingOut: 'ログアウト中…',
    signOutBlocked: 'ログアウトする前に面接を停止してください',
    signOutFailed: 'ログアウトに失敗しました',
  },

  account: {
    title: 'アカウント',
    signedInAs: 'ログイン中のアカウント',
    password: {
      title: 'パスワード',
      description: 'アカウントのパスワードを変更します',
      action: 'パスワードを変更',
    },
    loadFailed: '保存済みの情報を読み込めませんでした。編集する前に再接続してください。',
    save: '変更を保存',
    saving: '保存中…',
    saved: 'アカウント情報を保存しました',
    saveFailed: 'アカウント情報を保存できませんでした',
  },

  profileFields: {
    fullName: 'フルネーム',
    fullNamePlaceholder: '面接で名乗る名前',
    profile: 'プロフィール',
    profilePlaceholder:
      '履歴書・職務経歴書、LinkedIn のプロフィール、または簡単な自己紹介を貼り付けてください。提案はこれをもとに作成されるので、詳しいほどあなたらしい回答になります。',
    context: '背景情報',
    contextPlaceholder: '求人票、ポジションの要件など、準備中の面接に関する情報を貼り付けてください。',
    limitReached: (max: number) =>
      `文字数の上限（${max.toLocaleString('ja-JP')} 文字）に達しました。超えた分は追加されていません。`,
    charactersLeft: (remaining: number) => `残り ${remaining.toLocaleString('ja-JP')} 文字`,
  },

  microphoneField: {
    label: 'マイク',
    noDevices: 'マイクが見つかりません。接続するとここに表示されます。',
    selectPlaceholder: 'マイクを選択',
    lookingPlaceholder: 'マイクを探しています…',
    test: 'テスト',
    stopTest: 'テストを停止',
    openFailed: 'このマイクを開けませんでした。接続されているか、他のアプリが使用していないか確認してください。',
    notConnected: (deviceName: string) => `「${deviceName}」は接続されていません。別のマイクを選んでください。`,
    saySomething: '何か話してみてください - 話している間バーが動けば正常です。',
    runningHint: '面接でこのマイクを使用中です。終了後にテストできます。',
    testHint: '面接の前にテストしてください - 音を拾わないマイクは、静かな部屋とまったく同じに見えます。',
  },

  micLevelMeter: {
    label: 'マイクの入力レベル',
    hearing: '音声を検出中',
    silent: '無音',
  },

  suggestionModeField: {
    label: '提案のスタイル',
    hintOnly: 'ヒントのみ',
    hintOnlyDescription: '見出しとキーワードで、ひと目で読めます。おすすめ。',
    fullSentences: '完全な文章',
    fullSentencesDescription: '話すとおりに書かれた、完全な回答です。',
    switchHint: (combo: string) => `面接中もコントロールバーまたは ${combo} で切り替えられます。`,
  },

  zoomField: {
    label: '画面の大きさ',
    smaller: '小さく',
    larger: '大きく',
    reset: 'リセット',
    description: (combo: string) => `アプリ全体を拡大・縮小します。${combo} でも操作できます。`,
  },

  transcriptPanelField: {
    label: '文字起こしパネルを表示',
    description: (combo: string) => `提案の下にリアルタイムの文字起こしを表示します。${combo} で切り替えます。`,
  },

  hideTaskbarField: {
    label: 'ライブ面接中はタスクバーのアイコンを隠す',
    description:
      'ウィンドウを常に最前面に表示します（macOS では Dock のアイコンも隠れます）。最小化はできません - 見失ったらアプリをもう一度起動してください。',
  },
  allowScreenCaptureField: {
    label: '画面キャプチャを許可',
    description: '画面共有や録画でアプリのウィンドウが映るようにします。ステルスモードでは常に隠れます。',
  },
  mockHintsField: {
    label: '模擬面接でヒントを表示',
    description: '各質問の横にアシスタントの回答を表示し、自分の回答と比べられます。',
  },

  languageField: {
    label: '面接の言語',
    textOnly: 'テキストのみ',
    reconnectFailed:
      '提案の言語は切り替わりましたが、文字起こしはまだ再接続中です。戻らない場合はアシスタントを停止して再開してください。',
    description: '文字起こしの言語と、提案が返ってくる言語です。',
    noVoiceNotice: '面接官は質問を読み上げずに文字で表示します。回答は引き続き声に出して行い、採点方法は変わりません。',
  },

  changePassword: {
    title: 'パスワードの変更',
    description: '現在のパスワードを入力し、新しいパスワードを設定してください。',
    current: '現在のパスワード',
    currentPlaceholder: '現在のパスワードを入力',
    next: '新しいパスワード',
    nextPlaceholder: '新しいパスワードを入力',
    confirm: '新しいパスワード（確認）',
    confirmPlaceholder: '新しいパスワードをもう一度入力',
    submit: 'パスワードを変更',
    submitting: '変更中…',
    mismatch: '新しいパスワードが一致しません。',
    succeeded: 'パスワードを変更しました',
    failed: 'パスワードを変更できませんでした',
  },

  hotkeys: {
    dialogTitle: 'キーボードショートカット',
    dialogDescription: '面接中にアプリに触れずに使える操作の一覧です。',

    groups: {
      general: '全般',
      window: 'ウィンドウ管理',
      panels: 'パネルのスクロール',
      triggered: 'オンデマンド提案',
    },

    keys: {
      StopAll: { title: 'すべて停止', description: 'アシスタントを停止し、ステルスモードを終了します' },
      ToggleStealth: {
        title: 'ステルス切り替え',
        description: 'ライブ面接中、画面キャプチャからアプリを隠します。同じキーで元に戻ります。',
      },
      Opacity: { title: '透明度の切り替え', description: 'ステルスモードでウィンドウの透明度を切り替えます' },
      ToggleTranscript: {
        title: '文字起こしの切り替え',
        description: '文字起こしパネルを表示・非表示にします - ステルスモードでも使えます',
      },
      ToggleSuggestionMode: {
        title: 'ヒントのみ / 完全な文章',
        description:
          '提案を、ヒントのみ（ひと目で読める見出しとキーワード）と完全な文章で切り替えます。ステルスモードでも使えます。',
      },
      PlaceWin: {
        title: 'ウィンドウの配置',
        description: 'ウィンドウを角、端、または中央に配置します',
      },
      MoveWin: { title: 'ウィンドウの移動', description: '指定した方向にウィンドウを移動します' },
      ResizeWin: {
        title: 'ウィンドウのサイズ変更',
        description: '指定した方向にウィンドウのサイズを変更します',
      },
      ZoomInOutReset: {
        title: '拡大/縮小/リセット',
        description: '画面の拡大率を調整またはリセットします',
      },
      ScrollLiveSuggestionPanel: {
        title: 'ライブパネルのスクロール',
        description: 'ライブ提案パネルを下・上・末尾へスクロールします',
      },
      ScrollActionSuggestionPanel: {
        title: 'オンデマンドパネルのスクロール',
        description: 'オンデマンド提案パネルを下・上・末尾へスクロールします',
      },
      Capture: {
        title: '画面をキャプチャ',
        description: 'オンデマンド提案用にスクリーンショットを撮ります',
      },
      ClearCaptures: { title: 'キャプチャを消去', description: '撮影したスクリーンショットを消去します' },
      TriggerWithoutCaptures: {
        title: 'キャプチャなしで生成',
        description: 'スクリーンショットを使わずに提案を生成します',
      },
      TriggerWithCaptures: {
        title: 'キャプチャ付きで生成',
        description: 'スクリーンショットを参照して提案を生成します。キャプチャがない場合は、先に 1 枚撮影を試みます。',
      },
    },
  },

  inputPassword: {
    show: 'パスワードを表示',
    hide: 'パスワードを隠す',
  },

  titlebar: {
    openCommandPalette: 'コマンドパレットを開く',
    searchActions: '操作を検索',
    unavailableDuringInterview: '面接中は使用できません',
    menu: 'メニュー',
    minimize: '最小化',
    maximize: '最大化',
    close: '閉じる',
  },

  titlebarMenu: {
    home: 'ホーム',
    account: 'アカウント',
    configuration: '設定',
    documentation: 'ヘルプ',
    language: 'アプリの言語',
    lightMode: 'ライトモード',
    darkMode: 'ダークモード',
    signOut: 'ログアウト',
  },

  commandPalette: {
    title: 'コマンドパレット',
    description: '操作、ページ、設定を検索します。',
    searchPlaceholder: '操作を検索…',
    empty: '一致する操作はありません。',
    groups: {
      goTo: '移動',
      session: 'セッション',
      app: 'アプリ',
    },
    home: 'ホーム',
    account: 'アカウント',
    configuration: '設定',
    subscribe: 'サブスクリプション',
    startMock: '模擬面接を開始',
    startLive: 'ライブアシスタントを開始',
    switchToFullSentence: '完全な文章に切り替え',
    switchToHintOnly: 'ヒントのみに切り替え',
    hideTranscript: '文字起こしを隠す',
    showTranscript: '文字起こしを表示',
    documentation: 'ヘルプ',
    hotkeys: 'キーボードショートカット',
    switchToLight: 'ライトモードに切り替え',
    switchToDark: 'ダークモードに切り替え',
    signOut: 'ログアウト',
  },

  controlPanel: {
    stop: '停止',
    stopTooltip: 'アシスタントを停止',
    stopRunningHint: 'セッションを終了し、保存するか確認してからホームに戻ります',
    stopIdleHint: '実行中のものはありません - ホーム画面から面接を開始してください',
    stopTransientHint: 'セッションの実行中に使用できます',

    checks: {
      configUnavailable: '保存済みの設定を読み込めませんでした。再接続しています - 少し待ってからもう一度お試しください。',
      nameMissing: 'フルネームが設定されていません',
      profileMissing: 'プロフィールが設定されていません',
      noMicrophone: 'マイクが見つかりません。接続してからもう一度お試しください。',
      deviceNotFound: (deviceName: string) => `音声入力デバイス「${deviceName}」が見つかりません`,
    },
    startFailed: 'アシスタントを開始できませんでした',
  },

  audioGroup: {
    options: 'オーディオ設定',
    optionsSwapFailed: 'オーディオ設定 - マイクを切り替えられず、以前のマイクを使用中です',
    optionsDeviceNotFound: 'オーディオ設定 - 選択したマイクが見つかりません',
    dialogTitle: 'オーディオ設定',
    dialogDescription: '使用する物理マイクを選択してください。',
    microphone: 'マイク',
    selectPlaceholder: 'マイクを選択',
    switching: 'マイクを切り替えています…',
    swapFailed: (deviceName: string) =>
      `${deviceName} に切り替えられませんでした。この面接では以前のマイクを使い続けています。使用するにはアシスタントを停止して再開してください。`,
    takesEffectImmediately: 'すぐに反映されます。文字起こしは止まりません。',
  },

  languageGroup: {
    current: (languageName: string) => `面接の言語：${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `面接の言語：${languageName} - 文字起こしは切り替わっていません`,
    tooltip: (nativeName: string) => `面接の言語：${nativeName}`,
    reconnecting: '文字起こしを再接続しています…',
    suggestionsOnly: '提案のみ - 文字起こしはまだ再接続中です',
    speechAndSuggestions: '音声認識と提案',
    menuLabel: '面接の言語',
    halfApplied:
      '提案は切り替わりましたが、文字起こしは切り替わっていません。再試行中です - 戻らない場合はアシスタントを停止して再開してください。',
    willReconnect: '文字起こしが再接続されるため、話している途中の文が途切れることがあります。',
  },

  languageSearch: {
    placeholder: '言語を検索…',
    empty: '一致する言語はありません。',
  },

  suggestionMode: {
    hintOnlyBadge: 'ヒントのみ',
    fullSentencesBadge: '完全な文章',
    hintOnlyMode: 'ヒントのみモード',
    fullSentenceMode: '完全な文章モード',
    hintOnlySummary: '見出し + キーワード',
    fullSentenceSummary: 'すべて書き出した回答',
    ariaHintOnly: '提案モード：ヒントのみ。完全な文章に切り替え',
    ariaFullSentence: '提案モード：完全な文章。ヒントのみに切り替え',
  },

  toolsGroup: {
    hideTranscription: '文字起こしを隠す',
    showTranscription: '文字起こしを表示',
    enterStealth: 'ステルスモードに入る',
    stealthMode: 'ステルスモード',
    stealthUnavailable: 'ライブ面接の実行中に使用できます - 今はまだ隠すものがありません。',
    stealthAvailable: '画面キャプチャからアプリを隠します。同じショートカットで元に戻ります。',
    captureScreenshot: 'スクリーンショットを撮る',
    captureScreenshotTooltip: '画面をキャプチャ',
    captureFailed: 'スクリーンショットを撮れませんでした',
    clearCaptures: '撮影したスクリーンショットを消去',
    clearCapturesTooltip: 'キャプチャを消去',
    clearCapturesFailed: 'キャプチャを消去できませんでした',
    generateSuggestion: 'オンデマンド提案を生成',
    generateSuggestionTooltip: '提案を生成',
    generateSuggestionFailed: '提案を生成できませんでした',
    clear: 'クリア',
    clearInterview: '面接をクリア',
    clearFailed: 'クリアできませんでした',
    exportInterview: '面接をエクスポート',
    exportTheInterview: 'この面接をエクスポート',
    nothingToExport: 'エクスポートできるものはまだありません',
    nothingToExportDescription: '先に面接を行ってから、文字起こしと提案をエクスポートしてください。',
    exportFailed: '面接をエクスポートできませんでした',
    exportDocx: 'Word 文書 (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: '文字起こし',
    transcriptionShown: (combo: string) => `文字起こし：表示（${combo}）`,
    transcriptionHidden: (combo: string) => `文字起こし：非表示（${combo}）`,
    showHotkeys: 'ショートカット',
    showHotkeysLabel: 'キーボードショートカットを表示',
    showHotkeysTitle: 'キーボードショートカットを表示（?）',
  },

  runningIndicator: {
    idle: '待機中',
    starting: '開始中',
    running: '実行中',
    stopping: '停止中',
  },

  zoomControl: {
    reset: '拡大率をリセット',
    zoomIn: '拡大',
    zoomOut: '縮小',
  },

  creditsDisplay: {
    freePlan: '無料',
    planNames: {
      monthly: '月額',
      quarterly: '3 か月',
      yearly: '年額',
      other: '登録済み',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('ja-JP'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('ja-JP')} ${new Date(ms).toLocaleTimeString('ja-JP').slice(0, 5)}`,
    unlimitedUntil: (date: string) => `${date} まで無制限`,
    endsIn: (days: number) => `あと ${days} 日で終了`,
    freeLeft: (availableTime: string) => `無料 ${availableTime}`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} 時間`);
      if (minutes) parts.push(`${minutes} 分`);
      return parts.join(' ') || '0 分';
    },
    lessThanAMinute: '1 分未満',
    noFreeTimeLeft: '無料時間はありません',
  },

  panels: {
    autoScroll: '自動スクロール',
    enableAutoScroll: '自動スクロールを有効にする',
    scrollToBottom: '一番下へスクロール',
    scrollToTop: '一番上へスクロール',

    transcription: '文字起こし',
    noTranscripts: '文字起こしはまだありません',
    interviewer: '面接官',

    liveSuggestions: 'ライブ提案',
    noSuggestions: '提案はまだありません',
    idleNoGeneration: '待機中 - まだ生成されていません',

    triggeredSuggestions: 'オンデマンド提案',
    noTriggeredSuggestions: 'オンデマンド提案はまだありません',
    suggestionCanceled: '提案をキャンセルしました',

    mockInterview: '模擬面接',
    questionProgress: (current: number, total: number) => `質問 ${current}/${total}`,
    preparingFirstQuestion: '最初の質問を準備しています…',
    you: 'あなた',
    followUp: '追加質問',
    skipped: 'スキップ',
    noAnswer: '回答なし',

    resizeTranscript: '文字起こしパネルのサイズを変更',
    resizeHint: 'ドラッグでサイズ変更、ダブルクリックでリセット',
  },

  saveHistory: {
    saveAsWord: 'Word で保存',
    saveAsMarkdown: 'Markdown で保存',
    formatHintLive: '共有や印刷には Word、プレーンテキストで残すなら Markdown。',
    formatHintMock: '共有や印刷には Word、メモと一緒に残すなら Markdown。',
    exportFailed: '面接をエクスポートできませんでした',

    live: {
      clear: {
        title: 'クリアする前にこの面接を保存しますか？',
        body: '文字起こしと提案は失われます。',
        discard: '保存せずにクリア',
      },
      start: {
        title: '新しい面接を始める前にこの面接を保存しますか？',
        body: '文字起こしと提案は失われます。',
        discard: '保存せずに開始',
      },
      close: {
        title: '閉じる前にこの面接を保存しますか？',
        body: '文字起こしと提案は失われます。',
        discard: '保存せずに閉じる',
      },
      update: {
        title: 'アップデートをインストールする前にこの面接を保存しますか？',
        body: 'アプリが再起動し、文字起こしと提案は失われます。',
        discard: '保存せずにインストール',
      },
      signout: {
        title: 'ログアウトする前にこの面接を保存しますか？',
        body: '文字起こしと提案は失われます。',
        discard: '保存せずにログアウト',
      },
      stop: {
        title: 'この面接を保存しますか？',
        body: '面接は終了しました。文字起こしと提案はまだどこにも保存されていません。',
        discard: '破棄してホームへ',
      },
      'mock-done': {
        title: '終了する前にレポートを保存しますか？',
        body: 'スコア、フィードバック、回答は失われます。',
        discard: '保存せずに終了',
      },
      'mock-again': {
        title: '次のラウンドの前にこのレポートを保存しますか？',
        body: '今回のスコア、フィードバック、回答は置き換えられます。',
        discard: '保存せずにもう一度練習',
      },
    },

    mock: {
      clear: {
        title: '先に模擬面接のレポートを保存しますか？',
        body: 'このレポートと回答は失われます。',
        discard: '保存せずにクリア',
      },
      start: {
        title: '先に模擬面接のレポートを保存しますか？',
        body: 'このレポートと回答は失われます。',
        discard: '保存せずに開始',
      },
      close: {
        title: '閉じる前に模擬面接のレポートを保存しますか？',
        body: 'このレポートと回答は失われます。',
        discard: '保存せずに閉じる',
      },
      update: {
        title: 'アップデートをインストールする前に模擬面接のレポートを保存しますか？',
        body: 'アプリが再起動し、このレポートと回答は失われます。',
        discard: '保存せずにインストール',
      },
      signout: {
        title: 'ログアウトする前に模擬面接のレポートを保存しますか？',
        body: 'このレポートと回答は失われます。',
        discard: '保存せずにログアウト',
      },
      stop: {
        title: '模擬面接のレポートを保存しますか？',
        body: '面接は終了しました。このレポートはまだどこにも保存されていません。',
        discard: '破棄してホームへ',
      },
    },
  },

  headphoneNotice: {
    title: 'ヘッドホンが必要です',
    description: '始める前に装着してください。面接官の声はあなたの耳にだけ届くようにし、スピーカーからは絶対に流さないでください。',
    liveSpeakers: 'スピーカーを使うと、マイクがあなたと同じくらいはっきり面接官の声を拾います。',
    liveConsequence: 'するとアプリは相手の質問をあなたの発言と判断し、その質問に答えなくなります - 理由を示すエラーも一切出ません。',
    mockSpeakers: 'スピーカーを使うと、直前に聞いた質問が回答の冒頭にこだまとして入ることがあります。',
    mockConsequence: '面接官が話している間はマイクがミュートされますが、その後の部屋の残響が余計な言葉として入り込むことがあります。',
    proceed: 'ヘッドホンを装着しました',
  },

  permissionGate: {
    title: '権限が必要です',
    microphone: 'マイク',
    micChecking: '確認中…',
    micGranted: '許可されています',
    micBlocked: 'システム設定で許可してから「再確認」をクリックしてください',
    micRequired: '音声の取得に必要です',
    grantAccess: 'アクセスを許可',
    openSettings: '設定を開く',
    screenRecording: '画面収録',
    screenChecking: '確認中…',
    screenNeedsRelaunch: '許可されました - 開始する前にアプリを再起動して反映してください',
    screenGranted: '許可されています',
    screenNotDetermined: '録画開始時に許可を求められます',
    screenBlocked: 'システム設定で許可してから、アプリを再起動して反映してください',
    restartApp: 'アプリを再起動',
    checking: '確認中…',
    checkAgain: '再確認',
    start: '開始',
  },

  exportToast: {
    exported: (format: string) => `面接を ${format} でエクスポートしました`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'エクスポートしたファイルを開く',
    openFile: 'ファイルを開く',
    showInFolderLabel: 'エクスポートしたファイルをフォルダで表示',
    showInFolder: 'フォルダで表示',
    dismiss: '閉じる',
  },

  notices: {
    connecting: 'サーバーに接続しています…',
    starting: '開始しています…',
    stopping: '停止しています…',
    dismiss: '閉じる',
  },

  updateNotification: {
    available: (version: string) => `アップデートがあります：v${version}`,
    availableDescription: 'ダウンロードはバックグラウンドで自動的に始まります。',
    downloading: (percent: string) => `アップデートをダウンロード中… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `アップデートをダウンロードしました：v${version}`,
    downloadedDescriptionMac: 'クリックしてインストーラを開き、「アプリケーション」にドラッグしてください。',
    downloadedDescription: 'クリックすると再起動してアップデートをインストールします。',
    openInstaller: 'インストーラを開く',
    restartNow: '今すぐ再起動',
  },

  mock: {
    setup: {
      title: '模擬面接',
      description: 'AI が質問し、あなたが声に出して答えます。エクスポートしない限り何も保存されません。',
      start: '模擬面接を開始',
      starting: '開始しています…',
      seniority: 'レベル',
      seniorityOptions: {
        junior: 'ジュニア',
        mid: 'ミドル',
        senior: 'シニア',
        staff: 'スタッフ以上',
      },
      questions: '質問数',
      questionOption: (count: number, minutes: number) => `${count} 問、約 ${minutes} 分`,
      difficulty: '難易度',
      difficultyOptions: {
        easy: {
          label: 'ウォームアップ',
          description: '要求がひとつだけの、わかりやすい質問です。',
        },
        standard: {
          label: '標準',
          description: '一般的な面接官が実際にする質問です。',
        },
        hard: {
          label: '難しい',
          description: 'トレードオフや例外的なケースを深く掘り下げる質問です。',
        },
      },
      languageDescription: '面接官が質問する言語、文字起こしの言語、フィードバックの言語です。',
      estimate: (minutes: number) => `通常は約 ${minutes} 分です。`,
      unlimited: 'サブスクリプションで無制限です。',
      covers: (minutes: number) => `無料時間で約 ${minutes} 分利用できます。`,
      endsEarly: '無料時間がなくなるとセッションは終了しますが、レポートは受け取れます。',
    },

    session: {
      heading: '模擬面接セッション',
      starting: '開始しています…',
      generating: '次の質問を考えています…',
      evaluating: '考えています…',
      scoring: '面接を採点しています…',
      stopping: '面接を終了しています…',
      speaking: '面接官が話しています。質問の再生中はマイクがオフです。',
      readThenReady: '質問を読んでください。準備ができた時点から回答を録音します。',
      listening: '聞いています…',
      ready: '準備できました',
      doneAnswering: '回答終了',
      doneAnsweringTooltip: '回答を送信して次へ進みます',
      toggleHints: 'ライブ提案の切り替え',
      hintsOn: 'ライブ提案：オン',
      hintsOff: 'ライブ提案：オフ',
      hintsOnHint: 'ライブアシスタントならどう答えるかを表示します',
      hintsOffHint: 'ヒントなしで練習',
      endInterview: '面接を終了',
      startFailed: '模擬面接を開始できませんでした',
      startingPage: '模擬面接を開始しています…',
    },

    report: {
      heading: '模擬面接レポート',
      verdictExcellent: '非常に良い',
      verdictStrong: '良い',
      verdictDeveloping: '発展途上',
      verdictNeedsWork: '要改善',
      scoreFailed: (reason: string) =>
        `総合スコアを算出できませんでした（${reason}）。回答は下に表示されており、エクスポートも可能です。`,
      scoreAgain: 'もう一度採点',
      scoring: '採点中…',
      overallScore: '総合スコア',
      strengths: '強み',
      gaps: '改善点',
      nothingNoted: '特に指摘はありません。',
      perQuestion: '質問ごとの詳細',
      yourAnswer: 'あなたの回答',
      noAnswerRecorded: '（回答は録音されていません）',
      score: 'スコア',
      strongerAnswer: 'より良い回答',
      saveAsWord: 'Word で保存',
      saveAsMarkdown: 'Markdown で保存',
      exportFailed: 'レポートをエクスポートできませんでした',
      practiseAgain: 'もう一度練習',
      done: '完了',
    },
  },

  mainRoute: {
    redirectingToLogin: 'ログイン画面に移動しています…',
    authenticating: '認証しています…',
    transcriptionHidden: '文字起こしは非表示です',
  },

  documentation: {
    intro: (appName: string) =>
      `${appName} は、リアルタイムの提案と画面内容にもとづくコードの提案で面接をサポートする AI アシスタントです。`,
    docsLead: '詳しいドキュメントは ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: ' をご覧ください。アプリ内のどこでも Cmd/Ctrl+K を押すと操作を検索できます。',

    lostWindow: {
      title: 'ウィンドウを見失いましたか？',
      body: (appName: string) =>
        `ステルスモードでは、画面共有中に見えないよう ${appName} がタスクバーと macOS の Dock から消えます。そのため、最小化したウィンドウにはクリックできるボタンがありません。${appName} をもう一度起動してください：2 つ目が起動するのではなく、このウィンドウが戻ってきます。ステルスモード以外では、「ライブ面接中はタスクバーのアイコンを隠す」をオンにしていない限り、通常どおりタスクバーのボタンと Dock のアイコンが表示されます。`,
    },

    language: {
      title: '別の言語で面接する',
      oneSetting:
        'ひとつの設定でセッション全体が決まります：通話を文字起こしする音声モデル、提案を書く言語、エクスポートするレポートの言語です。コントロールバーの言語ボタン、設定ページ、模擬面接の設定ダイアログのどこからでも変更でき、すべて同じ設定を変更します。',
      supported: (count: number) => `${count} 言語に対応しています：`,
      midInterview:
        '面接中でも変更できます。提案は次の回答からすぐに切り替わります。音声認識は少し時間がかかります：再接続するため、その瞬間に話している文は文字起こしで途切れることがあります。',
      textOnly:
        '模擬面接では、設定ダイアログで「テキストのみ」と表示された言語には音声がありません：面接官は質問を読み上げずに文字で表示します。回答は引き続き声に出して行い、採点は変わりません。',
      appLanguageTitle: 'アプリには独自の言語設定があります',
      appLanguageBody:
        '上の言語は面接の言語です。アプリ自体の言語 - ボタン、見出し、メッセージ - は設定ページにある別の設定で、初回セットアップの最初の質問でもあります。どちらも一方から推測されることはありません：ロシア語を話し英語で面接を受ける人は、英語の文字起こしとロシア語のアプリを必要としています。',
    },

    microphone: {
      title: '面接中にマイクを変更する',
      body: '面接中もコントロールバーのマイクボタンは使用できます。ヘッドセットの電池が切れたり、外れたり、最初から違うデバイスだったりした場合は、アシスタントを停止せずにそこで別のマイクを選んでください - 停止すると文字起こしと提案も消去されます。',
      immediate:
        '変更はすぐに反映され、文字起こしも止まらないので、何も途切れません。選んだデバイスを開けない場合 - 外れている、または他のアプリが使用中 - は、以前のマイクのまま面接が続き、アプリがそのことを知らせます。',
    },

    suggestionStyle: {
      title: 'ヒントのみと完全な文章',
      body: 'デフォルトはヒントのみです：各提案は 1 行の見出しとキーワードで届くので、ひと目で把握して話し続けられます。完全な文章は話すとおりに回答を書き出します - 読む量は増えますが、アドリブは減ります。',
      switching: (combo: string) =>
        `コントロールバー、設定ページ、または ${combo} で切り替えられます。${combo} はステルスモードでも使えます。すでに表示されている提案は生成時のスタイルのままで、次の提案から変わります。`,
    },

    settings: {
      title: '設定の場所',
      accountLabel: 'アカウント',
      accountBody:
        ' にはあなた自身に関する情報があります - 名乗る名前、提案のもとになるプロフィールや履歴書、面接するポジションの背景情報、パスワードです。',
      configurationLabel: '設定',
      configurationBody:
        ' には面接の進め方があります - アプリの言語、マイク（テスト付き）、面接の言語、提案のスタイル、文字起こしパネルのドッキングです。保存は不要で、変更はすぐに反映されます。',
      both: 'どちらもホーム画面、タイトルバーのメニュー、Cmd/Ctrl+K パレットから開けます。新しくインストールした場合は、初回起動時にひととおり案内されます。',
    },

    hotkeys: 'ショートカット',
  },

  payment: {
    title: 'サブスクリプション',
    tabs: {
      buy: 'プラン',
      history: '履歴',
      status: 'ステータス',
    },

    buy: {
      currentPlan: '現在のプラン',
      subscribedUntil: (plan: string, date: string) => `${plan}（${date} まで）`,
      daysLeft: (days: number) => `残り ${days} 日`,
      freePlan: '無料プラン',
      freeLeft: (duration: string) => `無料モデルでの面接は残り ${duration} です。`,
      freeUsedUp: '無料時間を使い切りました。面接を続けるにはサブスクリプションに登録してください。',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} 時間`);
        if (minutes) parts.push(`${minutes} 分`);
        return parts.join(' ') || '0 分';
      },
      loadingPlans: 'プランを読み込んでいます…',
      mostPopular: '一番人気',
      planDescriptions: {
        monthly: '最先端モデルで 1 か月間面接し放題',
        quarterly: '最先端モデルで 3 か月間面接し放題',
        yearly: '最先端モデルで 1 年間面接し放題',
      },
      perMonth: ' / 月',
      billedAs: (price: number, months: number) => `$${price} の一括払いで ${months} か月`,
      save: (percent: number) => `${percent}% お得`,
      prepaid: '暗号資産で一括払い。パスが自動更新されることはありません。',
      refundPrompt: '返金をご希望ですか？',
      refundContact: 'サポートに連絡',
      extends: 'サブスクリプションは有効です：新しいパスの期間は現在の終了日のあとに追加されます。',
      selected: '選択中',
      buy: '選択',
      detailsTitle: 'お支払いの詳細',
      detailsLead: '',
      detailsFor: ' プランの購入を完了します。金額：',
      currencyLabel: '支払い通貨',
      currencyPlaceholder: '通貨を選択',
      currencySearchPlaceholder: '通貨を検索…',
      noCurrency: '通貨が見つかりません',
      createPayment: '支払いを作成',
      creatingPayment: '支払いを作成しています…',
    },

    history: {
      loading: '支払い履歴を読み込んでいます…',
      loadFailed: '支払い履歴を読み込めませんでした',
      emptyTitle: '支払い履歴はありません',
      emptyBody: 'まだ支払いはありません。サブスクリプションに登録して始めましょう。',
      subscribe: 'プランを見る',
      refreshing: '更新しています…',
      remainder: '残額',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} か月`
          : days > 0
            ? `${days.toLocaleString('ja-JP')} 日`
            : credits > 0
              ? `${credits.toLocaleString('ja-JP')} クレジット`
              : '-',
      columns: {
        created: '作成日時',
        paymentId: '支払い ID',
        purchase: '購入内容',
        amount: '金額',
        status: 'ステータス',
        action: '操作',
      },
      notAvailable: 'なし',
      view: '表示',
    },

    status: {
      title: '支払いステータスの確認',
      description: '支払い ID を入力して、現在のステータスを確認します',
      idPlaceholder: '支払い ID を入力',
      check: 'ステータスを確認',
      checking: '確認中…',
      notFound: '支払いが見つかりません',
      fetchFailed: '支払いステータスを取得できませんでした',
      order: (orderId: string) => `注文番号 ${orderId}`,
      refreshing: '更新しています…',
      amountToPay: '支払い金額',
      priceUsd: '価格（米ドル）',
      actuallyPaid: '実際の支払額',
      paymentMethods: '支払い方法',
      qrTab: 'QR コード',
      addressTab: 'アドレス',
      downloadQr: 'QR コードをダウンロード',
      qrSaved: 'QR コードを保存しました',
      scanWithWallet: 'ウォレットアプリで読み取ってください',
      qrIncludes: (amount: string) => `QR コードにはアドレスと金額（${amount}）が含まれます`,
      paymentAddress: '支払いアドレス',
      amountToSend: '送金額',
      sendExactly: '上のアドレスにこの金額をそのまま送金してください。',
      successTitle: 'お支払いが完了しました！',
      successBody: 'サブスクリプションがアカウントに反映されました。',
      expiredTitle: '支払いの期限切れ',
      failedTitle: '支払いの失敗',
      expiredBody: 'この支払いは期限切れです。新しい支払いを作成してください。',
      failedBody: '支払いを処理できませんでした。もう一度お試しください。',
      refundedTitle: '返金済み',
      refundedBody: 'この支払いは返金されました。ご不明な点はサポートまでお問い合わせください。',
      receivedTitle: '入金を確認しました',
      receivedBody: 'ネットワーク上で入金を確認中です。追加の支払いは不要で、サブスクリプションは自動で反映されます。',
      partialTitle: '一部の入金を確認しました',
      partialBody: '残額用の新しいアドレスを準備しています。ここに表示され、メールでもお送りします。以前のアドレスには送金しないでください。',
      created: '作成日時：',
      updated: '更新日時：',
      addressCopied: '支払いアドレスをコピーしました',
      amountCopied: '金額をコピーしました',
      currencyCopied: '通貨をコピーしました',
    },

    statusLabels: {
      waiting: '待機中',
      confirming: '確認中',
      confirmed: '確認済み',
      sending: '送金中',
      partiallyPaid: '一部入金',
      finished: '完了',
      failed: '失敗',
      refunded: '返金済み',
      expired: '期限切れ',
    },

    errors: {
      getPlans: 'プランを取得できませんでした',
      getCurrencies: '通貨を取得できませんでした',
      createPayment: '支払いを作成できませんでした',
      getStatus: '支払いステータスを取得できませんでした',
      getHistory: '支払い履歴を取得できませんでした',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: '選択したマイクを保存できませんでした',
    microphoneSwapFailed: '保存しましたが、面接では以前のマイクを使用中です',
    microphoneSwapFailedHint: 'デバイスが接続されているか確認し、アシスタントを停止して再開してください。',
    saveLanguageFailed: '面接の言語を保存できませんでした',
    languageHalfApplied: '提案の言語は切り替わりました。文字起こしはまだ再接続中です',
    languageHalfAppliedHint: '再試行を続けています。戻らない場合はアシスタントを停止して再開してください。',
    saveSuggestionModeFailed: '提案モードを保存できませんでした',
    saveTranscriptPanelFailed: '文字起こしパネルの設定を保存できませんでした',
    saveMockHintsFailed: 'ライブ提案の設定を保存できませんでした',
    saveHideTaskbarFailed: 'タスクバーの設定を保存できませんでした。もう一度お試しください。',
    saveAllowScreenCaptureFailed: '画面キャプチャの設定を保存できませんでした。もう一度お試しください。',
    saveUiLanguageFailed: 'アプリの言語を保存できませんでした',
  },

  assistant: {
    mockRunning: 'ライブセッションを始める前に模擬面接を停止してください。',
    stoppedUncleanly: 'アシスタントは停止しましたが、一部が正常に終了しませんでした',
    stoppedUncleanlyHint: '文字起こしや提案が届き続ける場合は、アプリを再起動してください。',
    startFailed: 'アシスタントを開始できませんでした',
    stopFailed: 'アシスタントを停止できませんでした',
    screenCaptureTimedOut: '画面キャプチャがタイムアウトしました。もう一度お試しください。',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `音声入力デバイス「${deviceName}」が見つかりません。メイン画面のオーディオ設定で別のデバイスを選んでください。`,
  },

  creditGate: {
    tooLow: '開始するための無料時間が足りません',
    outOfCredits: '無料時間を使い切りました - セッションは終了しました',
    outOfCreditsHint: 'サブスクリプションに登録すると面接し放題です。',
    replaced: '面接は終了しました - このアカウントで新しい面接が開始されました',
    replacedHint: '1 つのアカウントで同時に行える面接は 1 つだけです。',
    lowBalance: (minutes: number) => `無料時間は残り約 ${minutes} 分です`,
    lowBalanceHint: '無料時間がなくなるとセッションは終了します。',
    tooLowHint: 'セッションには 1 分以上必要です。サブスクリプションに登録すると最先端モデルで面接し放題です。',
    subscribe: 'プランを見る',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `サブスクリプションはあと ${days} 日で終了します`,
    endingSoonHint: '面接し放題を続けるには、別のパスを購入してください。期間は現在の終了日のあとに追加されます。',
    ended: 'サブスクリプションが終了しました',
    endedHint: '今後の面接は、無料モデルで無料時間を使用します。',
  },

  trialNotice: {
    freeTierLead: '無料プラン：',
    freeTier: '無料版',
    freeTierTail: 'モデルで 1 時間の面接。',
    sotaLead: 'サブスクリプションに登録すると、',
    sota: '最先端',
    sotaTail: 'モデルで面接し放題。',
  },
};
