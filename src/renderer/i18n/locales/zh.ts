/**
 * Chinese (Simplified, Mainland China).
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here. Chinese has no plural forms, so the count functions only place the number.
 * Full-width punctuation (，。：？) inside sentences, as Chinese typography expects.
 */
import type { Translation } from './en';

export const zh: Translation = {
  common: {
    cancel: '取消',
    close: '关闭',
    back: '返回',
    continue: '继续',
    finish: '完成',
    retry: '重试',
    view: '查看',
    loading: '加载中…',
    withCombo: (label: string, combo: string) => `${label}（${combo}）`,
  },

  uiLanguageField: {
    label: '应用语言',
    description: '按钮、菜单和提示信息的语言。与面试语言相互独立。',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `设置 ${appName}`,
    guideEyebrow: '设置向导',
    progress: (current: number, total: number, label: string) =>
      `第 ${current} 步，共 ${total} 步 · ${label}`,

    steps: {
      uiLanguage: {
        label: '应用语言',
        title: '应用使用哪种语言？',
        description: '选择你读起来最轻松的语言，后续设置都会使用它。',
      },
      profile: {
        label: '个人资料',
        title: '介绍一下你自己',
        description: '建议内容根据你的经历生成，因此此项必填。',
      },
      context: {
        label: '职位背景',
        title: '你面试的是什么职位？',
        description: '可选。粘贴职位描述，回答会更贴合该岗位。',
      },
      language: {
        label: '语言',
        title: '选择面试语言',
      },
      microphone: {
        label: '麦克风',
        title: '选择麦克风',
        description:
          '选择你要使用的麦克风并测试一下。请佩戴耳机 - 使用扬声器时应用可能会停止回答。',
      },
      mode: {
        label: '建议',
        title: '建议以什么形式显示？',
      },
      mockHints: {
        label: '模拟面试',
        title: '模拟面试时显示提示吗？',
      },
      zoom: {
        label: '大小',
        title: '这样看着舒服吗？',
      },
      transcript: {
        label: '转录',
        title: '显示实时转录吗？',
      },
    },

    blocked: {
      accountUnreachable: '无法连接到你的账户，因此这里输入的内容暂时无法保存。',
      needName: '请填写全名以继续。',
      needProfile: '请填写个人资料以继续。',
    },

    loadingAccount: '正在加载你的账户…',
    accountUnreachable: '无法连接到你的账户。在恢复连接之前，这里输入的内容都无法保存。',

    skip: '暂时跳过',
    skipTooltip: '之后可以在设置中重新运行设置向导',

    allSet: '一切就绪',
    profileNotSavedOnSkip: '已跳过设置，但个人资料未能保存。请在账户页面重试。',
    completionNotRecorded: '已跳过设置，但未能记录此操作。之后可能会再次提示。',
    saveProfileFailed: '保存个人资料失败',
    finishFailed: '无法保存你的设置。请检查网络连接后重试。',
  },

  configuration: {
    title: '设置',
    sections: {
      general: '通用',
      interview: '面试',
      display: '显示',
      window: '窗口与隐私',
      help: '帮助',
    },
    setupGuide: {
      title: '设置向导',
      description: '逐步完成本页的所有设置以及你的个人资料。',
      action: '运行设置向导',
    },
    hotkeys: {
      title: '键盘快捷键',
      description: '面试期间无需触碰应用即可使用的全部操作。',
    },
  },

  auth: {
    fields: {
      email: '电子邮箱',
      password: '密码',
      username: '用户名',
      confirmPassword: '确认密码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      verificationCode: '验证码',
      resetCode: '重置码',
    },

    signIn: {
      title: '登录',
      description: (appName: string) => `使用你的账户登录 ${appName}`,
      submit: '登录',
      submitting: '正在登录…',
      rememberMe: '记住我',
      noAccount: '还没有账户？创建一个。',
      forgotPassword: '忘记密码？',
    },

    signup: {
      title: '创建账户',
      description: (appName: string) => `注册新的 ${appName} 账户`,
      sendCode: '发送验证码',
      sending: '发送中…',
      haveAccount: '已有账户？直接登录',
      codeNotice: (email: string) =>
        `如果 ${email} 还没有账户，我们已向该邮箱发送验证码，请粘贴到下方。如果已有账户，我们发送的是说明如何登录的邮件。`,
      verify: '验证',
      verifying: '验证中…',
      changeEmail: '更换邮箱',
      resendCode: '重新发送验证码',
      requestResent: '已重新发送请求。',
      resendFailed: '重新发送失败。',
      create: '创建账户',
      creating: '创建中…',
      sendCodeFailed: '验证码发送失败，请重试。',
      invalidCode: '验证码无效或已过期。',
      succeeded: '注册成功！请登录。',
      failed: '注册失败，请重试。',
    },

    reset: {
      title: '重置密码',
      description: (appName: string) => `为你的 ${appName} 账户设置新密码`,
      sendResetCode: '发送重置码',
      sending: '发送中…',
      backToSignIn: '返回登录',
      codeNotice: (email: string) =>
        `如果 ${email} 存在账户，我们已向该邮箱发送重置码，请粘贴到下方。重置码只能使用一次，邮件中注明了有效期。`,
      verify: '验证',
      verifying: '验证中…',
      changeEmail: '更换邮箱',
      resendCode: '重新发送重置码',
      codeResent: '已重新发送重置码。',
      resendFailed: '无法重新发送重置码。',
      signsYouOut: '设置新密码后，你将在所有设备上退出登录。',
      setNewPassword: '设置新密码',
      saving: '保存中…',
      done: '密码已重置',
      startOver: '重新开始',
      sendFailed: '无法发送重置码，请重试。',
      verifyFailed: '无法验证重置码。',
      succeeded: '密码已重置，请使用新密码登录。',
      failed: '密码重置失败。重置码可能已过期 - 请重新获取。',
    },

    passwordsDoNotMatch: '两次输入的密码不一致',

    errors: {
      sendCodeFailed: '验证码发送失败',
      invalidCode: '验证码无效或已过期',
      loginFailed: '登录失败',
      signupFailed: '注册失败',
      logoutFailed: '退出登录失败',
      changePasswordFailed: '修改密码失败',
      sendResetCodeFailed: '重置码发送失败',
      invalidResetCode: '重置码无效或已过期',
      resetFailed: '密码重置失败',
    },
  },

  home: {
    welcome: (firstName: string) => `欢迎回来，${firstName}`,
    welcomeAnonymous: '欢迎回来',
    subtitle: '与 AI 面试官练习，或在真实面试中获得实时帮助。',

    mock: {
      title: '开始模拟面试',
      ready: 'AI 提问，你口头作答，结束时获得评分报告。',
      unsupported: '该服务器暂不支持此功能。请更新应用或稍后再试。',
      liveRunning: '请先停止实时助手 - 两者无法同时使用麦克风。',
      unaffordable: '剩余免费时长不足。订阅后可继续练习。',
    },

    live: {
      title: '启动实时助手',
      resumeTitle: '返回你的面试',
      ready: '实时转录你的真实面试，并同步给出回答建议。',
      running: '实时助手已在运行。',
      mockRunning: '请先结束模拟面试 - 两者无法同时使用麦克风。',
      unaffordable: '剩余免费时长不足。订阅后可继续面试。',
    },

    planLabel: '套餐',
    planUnavailable: '不可用',
    subscribe: '订阅',

    signOutFailed: '退出登录失败',
  },

  account: {
    title: '账户',
    completeness: {
      title: (done: number, total: number) => `资料完成度 ${done}/${total}`,
      complete: '资料已完善',
      hint: '建议根据你的资料和应聘职位生成。填写得越详细，回答就越像你。',
    },
    signedInAs: '当前登录',
    password: {
      title: '密码',
      description: '修改你的账户密码',
      action: '修改密码',
      codeSent: (email: string) => `我们已向 ${email} 发送了重置码，请粘贴到下方。`,
    },
    loadFailed: '无法加载已保存的资料。请重新连接后再编辑。',
    save: '保存更改',
    saving: '保存中…',
    saved: '账户资料已保存',
    saveFailed: '保存账户资料失败',
  },

  profileFields: {
    fullName: '全名',
    fullNamePlaceholder: '你在面试中使用的名字',
    profile: '个人资料',
    profileKinds: '简历、LinkedIn 等',
    profilePlaceholder:
      '粘贴你的简历、领英资料或简短的个人介绍。建议内容据此生成，细节越多，回答就越像你本人。',
    context: '背景信息',
    contextKinds: '职位描述、沟通记录、求职信等',
    contextPlaceholder: '粘贴职位描述、岗位要求，或与你准备的面试相关的任何信息。',
    limitReached: (max: number) =>
      `已达到字数上限（${max.toLocaleString('zh-CN')}），超出的文字未添加。`,
    charactersLeft: (remaining: number) => `还可输入 ${remaining.toLocaleString('zh-CN')} 字`,
  },

  microphoneField: {
    label: '麦克风',
    noDevices: '未检测到麦克风。连接后会显示在这里。',
    selectPlaceholder: '选择麦克风',
    lookingPlaceholder: '正在查找麦克风…',
    test: '测试',
    stopTest: '停止测试',
    openFailed: '无法打开此麦克风。请检查是否已连接，以及是否有其他应用正在使用。',
    notConnected: (deviceName: string) => `“${deviceName}”已断开连接。请选择其他麦克风。`,
    saySomething: '说点什么 - 说话时音量条应该会跳动。',
    runningHint: '面试正在使用此麦克风。面试结束后才能测试。',
    testHint: '面试前先测试一下 - 没有声音的麦克风看起来和安静的房间一模一样。',
  },

  micLevelMeter: {
    label: '麦克风输入音量',
    hearing: '能听到你',
    silent: '无声音',
  },

  suggestionModeField: {
    label: '建议样式',
    hintOnly: '仅要点',
    hintOnlyDescription: '一行标题加关键词，一眼就能看完。推荐。',
    fullSentences: '完整句子',
    fullSentencesDescription: '完整的回答，按你开口说的方式写出。',
    switchHint: (combo: string) => `面试中可通过控制栏或 ${combo} 切换。`,
  },

  zoomField: {
    label: '界面大小',
    smaller: '缩小',
    larger: '放大',
    reset: '重置',
    description: (combo: string) => `缩放整个应用。也可使用 ${combo}。`,
  },

  transcriptPanelField: {
    label: '显示转录面板',
    description: (combo: string) => `在建议下方显示实时转录。按 ${combo} 切换。`,
  },

  hideTaskbarField: {
    label: '实时面试期间隐藏任务栏图标',
    description:
      '让窗口保持在最前（macOS 上也会隐藏程序坞图标）。窗口无法最小化 - 如果找不到窗口，请重新启动应用。',
  },
  allowScreenCaptureField: {
    label: '允许屏幕捕获',
    description: '允许屏幕共享和录屏看到应用窗口。隐身模式下始终会隐藏。',
  },
  mockHintsField: {
    label: '模拟面试中显示提示',
    description: '在每道题旁显示助手的回答，方便与你的回答对比。',
  },

  languageField: {
    label: '面试语言',
    textOnly: '仅文字',
    reconnectFailed: '建议已切换语言，但转录仍在重新连接。如果一直未恢复，请停止并重新启动助手。',
    description: '转录的语言，以及建议使用的语言。',
    noVoiceNotice: '面试官会以文字形式提问，而不是朗读。你仍需口头作答，评分方式不变。',
  },

  changePassword: {
    title: '修改密码',
    description: '输入当前密码并设置新密码。',
    current: '当前密码',
    currentPlaceholder: '输入当前密码',
    next: '新密码',
    nextPlaceholder: '输入新密码',
    confirm: '确认新密码',
    confirmPlaceholder: '再次输入新密码',
    submit: '修改密码',
    submitting: '修改中…',
    mismatch: '两次输入的新密码不一致。',
    succeeded: '密码修改成功',
  },

  hotkeys: {
    dialogTitle: '键盘快捷键',
    dialogDescription: '面试期间无需触碰应用即可使用的全部操作。',

    groups: {
      general: '通用',
      window: '窗口管理',
      panels: '滚动面板',
      triggered: '按需建议',
    },

    keys: {
      StopAll: { title: '全部停止', description: '停止助手并退出隐身模式' },
      ToggleStealth: {
        title: '切换隐身',
        description: '实时面试期间对屏幕捕获隐藏应用。再按一次相同按键即可恢复。',
      },
      Opacity: { title: '切换透明度', description: '在隐身模式下切换窗口透明度' },
      ToggleTranscript: {
        title: '切换转录',
        description: '显示或隐藏转录面板 - 隐身模式下同样可用',
      },
      ToggleSuggestionMode: {
        title: '仅要点 / 完整句子',
        description:
          '在仅要点（一行标题加关键词，一眼看完）和完整句子之间切换建议样式。隐身模式下同样可用。',
      },
      PlaceWin: {
        title: '放置窗口',
        description: '将窗口放到某个角落、侧边或中央',
      },
      MoveWin: { title: '移动窗口', description: '按指定方向移动窗口' },
      ResizeWin: {
        title: '调整窗口大小',
        description: '按指定方向调整窗口大小',
      },
      ZoomInOutReset: {
        title: '放大/缩小/重置',
        description: '调整或重置界面缩放',
      },
      ScrollLiveSuggestionPanel: {
        title: '滚动实时面板',
        description: '在实时建议面板中向下、向上或滚动到底部',
      },
      ScrollActionSuggestionPanel: {
        title: '滚动按需面板',
        description: '在按需建议面板中向下、向上或滚动到底部',
      },
      Capture: {
        title: '截取屏幕',
        description: '为按需建议截取屏幕截图',
      },
      ClearCaptures: { title: '清除截图', description: '清除已截取的屏幕截图' },
      TriggerWithoutCaptures: {
        title: '不带截图生成',
        description: '不使用截图生成建议',
      },
      TriggerWithCaptures: {
        title: '带截图生成',
        description: '参考屏幕截图生成建议。如果没有截图，会先尝试截取一张。',
      },
    },
  },

  inputPassword: {
    show: '显示密码',
    hide: '隐藏密码',
  },

  titlebar: {
    openCommandPalette: '打开命令面板',
    searchActions: '搜索操作',
    unavailableDuringInterview: '面试期间不可用',
    menu: '菜单',
    minimize: '最小化',
    maximize: '最大化',
    close: '关闭',
  },

  titlebarMenu: {
    home: '首页',
    account: '账户',
    configuration: '设置',
    documentation: '帮助文档',
    language: '应用语言',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    theme: '主题',
    systemMode: '跟随系统',
    signOut: '退出登录',
  },

  commandPalette: {
    title: '命令面板',
    description: '搜索操作、页面或设置。',
    searchPlaceholder: '搜索操作…',
    empty: '没有匹配的操作。',
    groups: {
      goTo: '前往',
      session: '会话',
      app: '应用',
    },
    home: '首页',
    account: '账户',
    configuration: '设置',
    subscribe: '订阅',
    startMock: '开始模拟面试',
    startLive: '启动实时助手',
    switchToFullSentence: '切换为完整句子',
    switchToHintOnly: '切换为仅要点',
    hideTranscript: '隐藏转录',
    showTranscript: '显示转录',
    documentation: '帮助文档',
    hotkeys: '键盘快捷键',
    switchToLight: '切换为浅色模式',
    switchToDark: '切换为深色模式',
    signOut: '退出登录',
  },

  controlPanel: {
    stop: '停止',
    stopTooltip: '停止助手',
    stopRunningHint: '结束会话，询问是否保存，然后返回首页',
    stopIdleHint: '当前没有运行任何内容 - 请从首页开始面试',
    stopTransientHint: '会话运行后可用',

    checks: {
      configUnavailable: '无法加载已保存的设置。正在重新连接 - 请稍后再试。',
      nameMissing: '尚未填写全名',
      profileMissing: '尚未填写个人资料',
      noMicrophone: '未检测到麦克风。请连接后重试。',
      deviceNotFound: (deviceName: string) => `找不到音频输入设备“${deviceName}”`,
    },
    startFailed: '启动助手失败',

    /** The live connection and microphone indicator on the control bar. */
    signal: {
      listening: '正在聆听',
      reconnecting: '正在重新连接…',
      listeningHint: '麦克风和转录已连接',
      reconnectingHint: '转录连接已断开 - 正在自动重新连接',
    },
  },

  audioGroup: {
    options: '音频选项',
    optionsSwapFailed: '音频选项 - 无法切换麦克风，仍在使用之前的麦克风',
    optionsDeviceNotFound: '音频选项 - 找不到所选麦克风',
    dialogTitle: '音频选项',
    dialogDescription: '选择你使用的实体麦克风。',
    microphone: '麦克风',
    selectPlaceholder: '选择麦克风',
    switching: '正在切换麦克风…',
    swapFailed: (deviceName: string) =>
      `无法切换到 ${deviceName}。本次面试仍在使用之前的麦克风。停止并重新启动助手后即可使用它。`,
    takesEffectImmediately: '立即生效，转录不会中断。',
  },

  languageGroup: {
    current: (languageName: string) => `面试语言：${languageName}`,
    currentHalfApplied: (languageName: string) => `面试语言：${languageName} - 转录未切换`,
    tooltip: (nativeName: string) => `面试语言：${nativeName}`,
    reconnecting: '正在重新连接转录…',
    suggestionsOnly: '仅建议已切换 - 转录仍在重新连接',
    speechAndSuggestions: '语音识别和建议',
    menuLabel: '面试语言',
    halfApplied: '建议已切换，转录尚未切换，仍在重试 - 如果一直未恢复，请停止并重新启动助手。',
    willReconnect: '转录会重新连接，当前这句话可能会被截断。',
  },

  languageSearch: {
    placeholder: '搜索语言…',
    empty: '没有匹配的语言。',
  },

  suggestionMode: {
    hintOnlyBadge: '仅要点',
    fullSentencesBadge: '完整句子',
    hintOnlyMode: '仅要点模式',
    fullSentenceMode: '完整句子模式',
    hintOnlySummary: '标题 + 关键词',
    fullSentenceSummary: '完整写出的回答',
    ariaHintOnly: '建议模式：仅要点。切换为完整句子',
    ariaFullSentence: '建议模式：完整句子。切换为仅要点',
  },

  toolsGroup: {
    hideTranscription: '隐藏转录',
    showTranscription: '显示转录',
    enterStealth: '进入隐身模式',
    stealthMode: '隐身模式',
    stealthUnavailable: '实时面试开始后才可用 - 现在还没有需要隐藏的内容。',
    stealthAvailable: '对屏幕捕获隐藏应用。再按相同快捷键即可恢复。',
    captureScreenshot: '截取屏幕截图',
    captureScreenshotTooltip: '截取屏幕',
    captureFailed: '截图失败',
    clearCaptures: '清除已截取的截图',
    clearCapturesTooltip: '清除截图',
    clearCapturesFailed: '清除截图失败',
    generateSuggestion: '生成按需建议',
    generateSuggestionTooltip: '生成建议',
    generateSuggestionFailed: '生成建议失败',
    clear: '清空',
    clearInterview: '清空本次面试',
    clearFailed: '清空失败',
    exportInterview: '导出面试',
    exportTheInterview: '导出本次面试',
    nothingToExport: '暂无可导出的内容',
    nothingToExportDescription: '请先进行一次面试，然后再导出转录和建议。',
    exportFailed: '导出面试失败',
    exportDocx: 'Word 文档 (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: '转录',
    transcriptionShown: (combo: string) => `转录：显示（${combo}）`,
    transcriptionHidden: (combo: string) => `转录：隐藏（${combo}）`,
    showHotkeys: '显示快捷键',
    showHotkeysLabel: '显示键盘快捷键',
    showHotkeysTitle: '显示键盘快捷键（?）',
  },

  runningIndicator: {
    idle: '空闲',
    starting: '启动中',
    running: '运行中',
    stopping: '停止中',
  },

  zoomControl: {
    reset: '重置缩放',
    zoomIn: '放大',
    zoomOut: '缩小',
  },

  creditsDisplay: {
    freePlan: '免费',
    planNames: {
      monthly: '月度',
      quarterly: '季度',
      yearly: '年度',
      other: '已订阅',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('zh-CN'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('zh-CN')} ${new Date(ms).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `不限时长，至 ${date}`,
    endsIn: (days: number) => `${days} 天后到期`,
    freeLeft: (availableTime: string) => `免费 ${availableTime}`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} 小时`);
      if (minutes) parts.push(`${minutes} 分钟`);
      return parts.join(' ') || '0 分钟';
    },
    lessThanAMinute: '不足 1 分钟',
    noFreeTimeLeft: '免费时长已用完',
  },

  panels: {
    autoScroll: '自动滚动',
    enableAutoScroll: '开启自动滚动',
    scrollToBottom: '滚动到底部',
    scrollToTop: '滚动到顶部',

    transcription: '转录',
    noTranscripts: '暂无转录',
    interviewer: '面试官',

    liveSuggestions: '实时建议',
    noSuggestions: '暂无建议',
    idleNoGeneration: '空闲 - 尚未生成内容',

    triggeredSuggestions: '按需建议',
    noTriggeredSuggestions: '暂无按需建议',
    suggestionCanceled: '建议已取消',

    mockInterview: '模拟面试',
    questionProgress: (current: number, total: number) => `第 ${current} 题，共 ${total} 题`,
    preparingFirstQuestion: '正在准备第一道题…',
    you: '你',
    followUp: '追问',
    skipped: '已跳过',
    noAnswer: '未作答',

    resizeTranscript: '调整转录面板大小',
    resizeHint: '拖动调整大小，双击重置',
  },

  saveHistory: {
    saveAsWord: '保存为 Word',
    saveAsMarkdown: '保存为 Markdown',
    formatHintLive: 'Word 适合分享或打印，Markdown 适合以纯文本保存。',
    formatHintMock: 'Word 适合分享或打印，Markdown 适合和你的笔记放在一起。',
    exportFailed: '导出面试失败',

    live: {
      clear: {
        title: '清空前保存本次面试？',
        body: '转录和建议将会丢失。',
        discard: '不保存，直接清空',
      },
      start: {
        title: '开始新面试前保存本次面试？',
        body: '转录和建议将会丢失。',
        discard: '不保存，直接开始',
      },
      close: {
        title: '关闭前保存本次面试？',
        body: '转录和建议将会丢失。',
        discard: '不保存，直接关闭',
      },
      update: {
        title: '安装更新前保存本次面试？',
        body: '应用将重新启动，转录和建议将会丢失。',
        discard: '不保存，直接安装',
      },
      signout: {
        title: '退出登录前保存本次面试？',
        body: '转录和建议将会丢失。',
        discard: '不保存，直接退出',
      },
      stop: {
        title: '保存本次面试？',
        body: '面试已结束。转录和建议尚未保存到任何地方。',
        discard: '放弃并返回首页',
      },
      'mock-done': {
        title: '完成前保存你的报告？',
        body: '你的分数、反馈和回答将会丢失。',
        discard: '不保存，直接完成',
      },
      'mock-again': {
        title: '开始下一轮前保存这份报告？',
        body: '本次的分数、反馈和你的回答将被替换。',
        discard: '不保存，再练一次',
      },
    },

    mock: {
      clear: {
        title: '先保存模拟面试报告？',
        body: '这份报告和你的回答将会丢失。',
        discard: '不保存，直接清空',
      },
      start: {
        title: '先保存模拟面试报告？',
        body: '这份报告和你的回答将会丢失。',
        discard: '不保存，直接开始',
      },
      close: {
        title: '关闭前保存模拟面试报告？',
        body: '这份报告和你的回答将会丢失。',
        discard: '不保存，直接关闭',
      },
      update: {
        title: '安装更新前保存模拟面试报告？',
        body: '应用将重新启动，这份报告和你的回答将会丢失。',
        discard: '不保存，直接安装',
      },
      signout: {
        title: '退出登录前保存模拟面试报告？',
        body: '这份报告和你的回答将会丢失。',
        discard: '不保存，直接退出',
      },
      stop: {
        title: '保存模拟面试报告？',
        body: '面试已结束。这份报告尚未保存到任何地方。',
        discard: '放弃并返回首页',
      },
    },
  },

  headphoneNotice: {
    title: '必须佩戴耳机',
    description: '开始前请戴上耳机。面试官的声音只能传到你的耳朵里 - 绝不能从扬声器放出来。',
    liveSpeakers: '使用扬声器时，麦克风听到面试官的声音和你一样清楚。',
    liveConsequence:
      '应用会把对方的问题当成你说的话，从而不再回答它 - 而且不会有任何报错告诉你原因。',
    mockSpeakers: '使用扬声器时，刚听到的问题可能会以回声的形式混进你回答的开头。',
    mockConsequence: '面试官说话时麦克风是静音的，但之后房间里的混响仍可能被识别成零散的词语。',
    proceed: '我已戴好耳机',
  },

  contextReminder: {
    title: '尚未设置面试背景',
    description: '建议将仅根据你的个人资料生成，而不了解你应聘的职位。',
    hint: '添加职位描述、之前轮次的笔记、求职信或与本次面试相关的其他信息，以获得更有针对性的回答。',
    edit: '添加背景',
    proceed: '仍然开始',
    setTitle: '面试背景是最新的吗？',
    setDescription:
      '建议会根据账户中保存的背景生成。如果它仍是上一场面试的内容，回答将针对错误的职位。',
    review: '检查背景',
    confirm: '已是最新',
    notSet: '未设置',
  },

  permissionGate: {
    title: '需要权限',
    microphone: '麦克风',
    micChecking: '检查中…',
    micGranted: '已授权',
    micBlocked: '请在系统设置中开启，然后点击“重新检查”',
    micRequired: '用于采集你的声音',
    grantAccess: '授予权限',
    openSettings: '打开设置',
    screenRecording: '屏幕录制',
    screenChecking: '检查中…',
    screenNeedsRelaunch: '已授权 - 开始前请重启应用使其生效',
    screenGranted: '已授权',
    screenNotDetermined: '开始录制时会请求授权',
    screenBlocked: '请在系统设置中开启，然后重启应用使其生效',
    restartApp: '重启应用',
    checking: '检查中…',
    checkAgain: '重新检查',
    start: '开始',
  },

  exportToast: {
    exported: (format: string) => `面试已导出为 ${format}`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: '打开导出的文件',
    openFile: '打开文件',
    showInFolderLabel: '在文件夹中显示导出的文件',
    showInFolder: '在文件夹中显示',
    dismiss: '关闭',
  },

  notices: {
    connecting: '正在连接服务器…',
    starting: '启动中…',
    stopping: '停止中…',
    dismiss: '关闭',
  },

  updateNotification: {
    available: (version: string) => `有可用更新：v${version}`,
    availableDescription: '将在后台自动开始下载。',
    downloading: (percent: string) => `正在下载更新… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `更新已下载：v${version}`,
    downloadedDescriptionMac: '点击打开安装程序，然后将其拖到“应用程序”文件夹。',
    downloadedDescription: '点击重启并安装更新。',
    openInstaller: '打开安装程序',
    restartNow: '立即重启',
  },

  mock: {
    setup: {
      title: '模拟面试',
      description: 'AI 提问，你口头作答。除非你导出，否则不会保存任何内容。',
      start: '开始模拟面试',
      starting: '启动中…',
      seniority: '职级',
      seniorityOptions: {
        junior: '初级',
        mid: '中级',
        senior: '高级',
        staff: '资深专家及以上',
      },
      questions: '题目数量',
      questionOption: (count: number, minutes: number) => `${count} 道题，约 ${minutes} 分钟`,
      difficulty: '难度',
      difficultyOptions: {
        easy: {
          label: '热身',
          description: '直接的问题，每题只有一个明确要求。',
        },
        standard: {
          label: '标准',
          description: '普通面试官真正会问的问题。',
        },
        hard: {
          label: '困难',
          description: '深入追问权衡取舍和边界情况。',
        },
      },
      languageDescription: '面试官提问、转录以及反馈所使用的语言。',
      estimate: (minutes: number) => `通常约 ${minutes} 分钟。`,
      unlimited: '订阅后不限时长。',
      covers: (minutes: number) => `你的免费时长约可使用 ${minutes} 分钟。`,
      endsEarly: '免费时长用完时会话即结束，你仍会收到报告。',
    },

    session: {
      heading: '模拟面试会话',
      starting: '启动中…',
      generating: '正在想下一道题…',
      evaluating: '思考中…',
      scoring: '正在为面试评分…',
      stopping: '正在结束面试…',
      speaking: '面试官正在说话。播放问题期间你的麦克风处于关闭状态。',
      readThenReady: '请阅读题目。从你点击准备好的那一刻起开始录制回答。',
      listening: '正在聆听…',
      ready: '我准备好了',
      doneAnswering: '回答完毕',
      doneAnsweringTooltip: '提交回答并进入下一题',
      toggleHints: '切换实时建议',
      hintsOn: '实时建议：开',
      hintsOff: '实时建议：关',
      hintsOnHint: '显示实时助手会怎么回答',
      hintsOffHint: '不看提示练习',
      endInterview: '结束面试',
      startFailed: '启动模拟面试失败',
      startingPage: '正在启动模拟面试…',
    },

    report: {
      heading: '模拟面试报告',
      verdictExcellent: '优秀',
      verdictStrong: '良好',
      verdictDeveloping: '进步中',
      verdictNeedsWork: '有待提高',
      scoreFailed: (reason: string) =>
        `无法生成总分（${reason}）。你的回答仍显示在下方，并且可以导出。`,
      scoreAgain: '重新评分',
      scoring: '评分中…',
      overallScore: '总分',
      strengths: '优势',
      gaps: '不足',
      nothingNoted: '没有特别需要指出的内容。',
      perQuestion: '逐题详情',
      yourAnswer: '你的回答',
      noAnswerRecorded: '（未录到回答）',
      score: '分数',
      strongerAnswer: '更好的回答',
      saveAsWord: '保存为 Word',
      saveAsMarkdown: '保存为 Markdown',
      exportFailed: '导出报告失败',
      practiseAgain: '再练一次',
      done: '完成',
    },
  },

  mainRoute: {
    redirectingToLogin: '正在跳转到登录页…',
    authenticating: '正在验证身份…',
    transcriptionHidden: '转录已隐藏',
    awaitingFirstQuestion: {
      title: '正在等待第一个问题…',
      description: '面试官一提问，建议就会显示在这里。面试中常用的快捷键：',
    },
  },

  documentation: {
    intro: (appName: string) =>
      `${appName} 是一款 AI 助手，通过实时建议和基于屏幕内容的代码推荐，提升你的面试表现。`,
    docsLead: '完整文档请访问 ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: '。在应用任意位置按 Cmd/Ctrl+K 即可搜索操作。',

    lostWindow: {
      title: '找不到窗口了？',
      body: (appName: string) =>
        `在隐身模式下，${appName} 会从任务栏和 macOS 程序坞中消失，这样共享屏幕时就看不到它 - 这也意味着最小化的窗口没有可以点击的按钮。只需再次启动 ${appName}：它不会打开第二个副本，而是会把这个窗口找回来。在隐身模式之外，任务栏按钮和程序坞图标照常显示，除非你开启了“实时面试期间隐藏任务栏图标”。`,
    },

    language: {
      title: '用其他语言面试',
      oneSetting:
        '一个设置管住整场会话：用哪个语音模型转录通话、建议用什么语言撰写，以及导出报告的语言。可以通过控制栏上的语言按钮、设置页面或模拟面试的设置对话框修改 - 它们改的是同一个设置。',
      supported: (count: number) => `支持 ${count} 种语言：`,
      midInterview:
        '面试中也可以修改。建议会立即切换，从下一个回答开始生效。语音识别需要稍长一点时间：它会重新连接，因此那一刻正在说的话在转录中可能被截断。',
      textOnly:
        '在模拟面试中，设置对话框里标为“仅文字”的语言没有可用的语音：面试官会以文字形式提问，而不是朗读。你仍需口头作答，评分方式不变。',
      appLanguageTitle: '应用有自己的语言',
      appLanguageBody:
        '上面的语言是面试语言。应用本身的语言 - 按钮、标题和提示信息 - 是设置页面上的另一个独立设置，也是首次启动设置向导问的第一个问题。两者互不推断：一位说俄语、用英语面试的人，需要的是英文转录和俄文界面。',
    },

    microphone: {
      title: '面试中更换麦克风',
      body: '面试进行时，控制栏上的麦克风按钮依然可用。如果耳机没电、被拔掉，或者一开始就选错了设备，请在那里换一个，而不要停止助手 - 停止会同时清空转录和建议。',
      immediate:
        '更换立即生效，转录不会中断，所以不会有任何内容被截断。如果所选设备无法打开 - 已拔出或被其他应用占用 - 面试会继续使用之前的设备，应用也会提示你。',
    },

    suggestionStyle: {
      title: '仅要点与完整句子',
      body: '默认是仅要点：每条建议以一行标题加关键词呈现，一眼看完就能继续说下去。完整句子会把回答按口语方式完整写出 - 要读的更多，要临场发挥的更少。',
      switching: (combo: string) =>
        `可以在控制栏、设置页面或用 ${combo} 切换，隐身模式下同样可用。已经显示在屏幕上的建议保留生成时的样式，只有下一条会改变。`,
    },

    settings: {
      title: '设置在哪里',
      accountLabel: '账户',
      accountBody:
        '中保存的是你是谁 - 你使用的名字、生成建议所依据的个人资料或简历、你面试的职位背景，以及你的密码。',
      configurationLabel: '设置',
      configurationBody:
        '中保存的是面试如何进行 - 应用语言、麦克风（含测试）、面试语言、建议样式，以及转录面板是否停靠。无需保存，每项修改即时生效。',
      both: '两者都可以从首页、标题栏菜单和 Cmd/Ctrl+K 命令面板进入。新安装的应用会在首次启动时带你完整设置一遍。',
    },

    hotkeys: '快捷键',
  },

  payment: {
    title: '订阅',
    tabs: {
      buy: '套餐',
      history: '记录',
      status: '状态',
    },

    buy: {
      features: {
        unlimited: '无限次实时面试和模拟面试',
        model: '我们最强大的 AI 模型',
        noRenewal: '预付 - 不自动续费',
      },
      currentPlan: '你的套餐',
      subscribedUntil: (plan: string, date: string) => `${plan}，至 ${date}`,
      daysLeft: (days: number) => `剩余 ${days} 天`,
      freePlan: '免费套餐',
      freeLeft: (duration: string) => `免费模型还可面试 ${duration}。`,
      freeUsedUp: '免费时长已用完。订阅后可继续面试。',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} 小时`);
        if (minutes) parts.push(`${minutes} 分钟`);
        return parts.join(' ') || '0 分钟';
      },
      loadingPlans: '正在加载套餐…',
      mostPopular: '最受欢迎',
      planDescriptions: {
        monthly: '一个月内使用最先进模型不限次面试',
        quarterly: '三个月内使用最先进模型不限次面试',
        yearly: '一年内使用最先进模型不限次面试',
      },
      perMonth: ' / 月',
      billedAs: (price: number, months: number) => `一次性支付 $${price}，可用 ${months} 个月`,
      save: (percent: number) => `节省 ${percent}%`,
      prepaid: '使用加密货币一次性支付。通行证永远不会自动续费。',
      refundPrompt: '需要退款？',
      refundContact: '联系客服',
      extends: '你的订阅正在生效：新通行证的时长会在当前到期日之后累加。',
      selected: '已选择',
      buy: '选择',
      detailsTitle: '支付详情',
      detailsLead: '完成购买 ',
      detailsFor: ' 套餐，价格 ',
      currencyLabel: '支付币种',
      currencyPlaceholder: '选择币种',
      currencySearchPlaceholder: '搜索币种…',
      noCurrency: '未找到币种',
      createPayment: '创建支付',
      creatingPayment: '正在创建支付…',
    },

    history: {
      loading: '正在加载支付记录…',
      loadFailed: '加载支付记录失败',
      emptyTitle: '暂无支付记录',
      emptyBody: '你还没有任何支付。订阅即可开始。',
      subscribe: '查看套餐',
      refreshing: '刷新中…',
      remainder: '剩余待付金额',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} 个月`
          : days > 0
            ? `${days.toLocaleString('zh-CN')} 天`
            : credits > 0
              ? `${credits.toLocaleString('zh-CN')} 积分`
              : '-',
      columns: {
        created: '创建时间',
        paymentId: '支付编号',
        purchase: '购买内容',
        amount: '金额',
        status: '状态',
        action: '操作',
      },
      notAvailable: '无',
      view: '查看',
    },

    status: {
      title: '查询支付状态',
      description: '输入支付编号以查看当前状态',
      idPlaceholder: '输入支付编号',
      check: '查询状态',
      checking: '查询中…',
      notFound: '未找到该支付',
      fetchFailed: '获取支付状态失败',
      order: (orderId: string) => `订单 #${orderId}`,
      refreshing: '刷新中…',
      amountToPay: '应付金额',
      priceUsd: '价格（美元）',
      actuallyPaid: '实付金额',
      paymentMethods: '支付方式',
      qrTab: '二维码',
      addressTab: '地址',
      downloadQr: '下载二维码',
      qrSaved: '二维码已保存',
      scanWithWallet: '用你的钱包应用扫码',
      qrIncludes: (amount: string) => `二维码包含地址和金额（${amount}）`,
      paymentAddress: '支付地址',
      amountToSend: '发送金额',
      sendExactly: '请向上方地址发送确切的金额。',
      successTitle: '支付成功！',
      successBody: '你的订阅已应用到账户。',
      expiredTitle: '支付已过期',
      failedTitle: '支付失败',
      expiredBody: '此支付已过期，请重新创建支付。',
      failedBody: '支付无法处理，请重试。',
      refundedTitle: '已退款',
      refundedBody: '此支付已退款。如有疑问请联系客服。',
      receivedTitle: '已收到付款',
      receivedBody: '你的付款正在网络上确认。无需再次支付，订阅将自动生效。',
      partialTitle: '已收到部分付款',
      partialBody:
        '我们正在为剩余金额准备新的地址，它会显示在这里并通过邮件发送给你。请勿再向之前的地址付款。',
      created: '创建时间：',
      updated: '更新时间：',
      addressCopied: '支付地址已复制到剪贴板',
      amountCopied: '金额已复制到剪贴板',
      currencyCopied: '币种已复制到剪贴板',
    },

    statusLabels: {
      waiting: '等待中',
      confirming: '确认中',
      confirmed: '已确认',
      sending: '发送中',
      partiallyPaid: '部分支付',
      finished: '已完成',
      failed: '失败',
      refunded: '已退款',
      expired: '已过期',
    },

    errors: {
      getPlans: '获取套餐失败',
      getCurrencies: '获取币种失败',
      createPayment: '创建支付失败',
      getStatus: '获取支付状态失败',
      getHistory: '获取支付记录失败',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: '保存所选麦克风失败',
    microphoneSwapFailed: '已保存，但面试仍在使用之前的麦克风',
    microphoneSwapFailedHint: '请检查设备是否已连接，然后停止并重新启动助手。',
    saveLanguageFailed: '保存面试语言失败',
    languageHalfApplied: '建议已切换语言，转录仍在重新连接',
    languageHalfAppliedHint: '它会持续重试。如果一直未恢复，请停止并重新启动助手。',
    saveSuggestionModeFailed: '保存建议模式失败',
    saveTranscriptPanelFailed: '保存转录面板设置失败',
    saveMockHintsFailed: '保存实时建议设置失败',
    saveHideTaskbarFailed: '无法保存任务栏设置，请重试。',
    saveAllowScreenCaptureFailed: '无法保存屏幕捕获设置，请重试。',
    saveUiLanguageFailed: '保存应用语言失败',
  },

  assistant: {
    mockRunning: '请先停止模拟面试，再开始实时会话。',
    stoppedUncleanly: '助手已停止，但部分组件未能正常关闭',
    stoppedUncleanlyHint: '如果仍有转录或建议不断出现，请重启应用。',
    startFailed: '启动助手失败',
    stopFailed: '停止助手失败',
    screenCaptureTimedOut: '截图超时，请重试。',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `找不到音频输入设备“${deviceName}”。请在主界面的音频设置中选择其他设备。`,
  },

  creditGate: {
    tooLow: '免费时长不足，无法开始',
    outOfCredits: '免费时长已用完 - 会话已结束',
    outOfCreditsHint: '订阅即可不限次面试。',
    replaced: '面试已结束 - 此账户开始了新的面试',
    replacedHint: '一个账户同一时间只能进行一场面试。',
    lowBalance: (minutes: number) => `免费时长约剩 ${minutes} 分钟`,
    lowBalanceHint: '免费时长用完时会话即结束。',
    tooLowHint: '一次会话至少需要一分钟。订阅即可使用最先进模型不限次面试。',
    subscribe: '查看套餐',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `你的订阅将在 ${days} 天后到期`,
    endingSoonHint: '再购买一张通行证即可继续不限次面试，其时长会在当前到期日之后累加。',
    ended: '你的订阅已到期',
    endedHint: '面试现在会在免费模型上消耗你的免费时长。',
  },

  trialNotice: {
    freeTierLead: '免费套餐：使用',
    freeTier: '免费版',
    freeTierTail: '模型面试 1 小时。',
    sotaLead: '订阅即可使用',
    sota: '最先进',
    sotaTail: '的模型不限次面试。',
  },
};
