/**
 * Korean.
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here. The register is the polite 합니다/하세요 style Korean software uses, with
 * plain noun phrases for buttons and labels. Korean does not inflect nouns for number.
 */
import type { Translation } from './en';

export const ko: Translation = {
  common: {
    cancel: '취소',
    close: '닫기',
    back: '뒤로',
    continue: '계속',
    finish: '완료',
    retry: '다시 시도',
    view: '보기',
    loading: '불러오는 중…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: '앱 언어',
    description: '버튼, 메뉴, 메시지의 언어입니다. 면접 언어와는 따로 설정합니다.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `${appName} 설정`,
    guideEyebrow: '설정 가이드',
    progress: (current: number, total: number, label: string) =>
      `${total}단계 중 ${current}단계 · ${label}`,

    steps: {
      uiLanguage: {
        label: '앱 언어',
        title: '앱을 어떤 언어로 사용하시겠어요?',
        description:
          '가장 편하게 읽을 수 있는 언어를 고르세요. 나머지 설정도 이 언어로 진행됩니다.',
      },
      profile: {
        label: '프로필',
        title: '자기소개를 해 주세요',
        description: '제안은 회원님의 경력을 바탕으로 작성되므로 필수 항목입니다.',
      },
      context: {
        label: '채용 정보',
        title: '어떤 직무의 면접인가요?',
        description:
          '선택 사항입니다. 채용 공고를 붙여 넣으면 해당 직무에 맞춘 답변을 받을 수 있습니다.',
      },
      language: {
        label: '언어',
        title: '면접 언어 선택',
      },
      microphone: {
        label: '마이크',
        title: '마이크 선택',
        description:
          '말할 때 사용할 마이크를 고르고 테스트하세요. 헤드폰을 사용하세요 - 스피커로 들으면 앱이 답변을 멈출 수 있습니다.',
      },
      mode: {
        label: '제안',
        title: '제안을 어떤 형식으로 볼까요?',
      },
      mockHints: {
        label: '모의 면접',
        title: '모의 면접에서 힌트를 볼까요?',
      },
      zoom: {
        label: '크기',
        title: '읽기 편한가요?',
      },
      transcript: {
        label: '전사',
        title: '실시간 전사를 표시할까요?',
      },
    },

    blocked: {
      accountUnreachable: '계정에 연결할 수 없어 여기에 입력한 내용은 아직 저장할 수 없습니다.',
      needName: '계속하려면 이름을 입력하세요.',
      needProfile: '계속하려면 프로필을 입력하세요.',
    },

    loadingAccount: '계정을 불러오는 중…',
    accountUnreachable:
      '계정에 연결할 수 없습니다. 연결이 돌아올 때까지 여기에 입력한 내용은 저장되지 않습니다.',

    skip: '지금은 건너뛰기',
    skipTooltip: '나중에 설정 화면에서 설정을 다시 실행할 수 있습니다',

    allSet: '모든 준비가 끝났습니다',
    profileNotSavedOnSkip:
      '설정을 건너뛰었지만 프로필은 저장되지 않았습니다. 계정 화면에서 다시 시도하세요.',
    completionNotRecorded: '설정을 건너뛰었지만 이를 기록하지 못했습니다. 다시 안내될 수 있습니다.',
    saveProfileFailed: '프로필을 저장하지 못했습니다',
    finishFailed: '설정을 저장하지 못했습니다. 연결을 확인하고 다시 시도하세요.',
  },

  configuration: {
    title: '설정',
    sections: {
      general: '일반',
      interview: '면접',
      display: '표시',
      window: '창 및 개인정보',
      help: '도움말',
    },
    setupGuide: {
      title: '설정 가이드',
      description: '이 페이지의 모든 항목과 프로필을 한 단계씩 살펴봅니다.',
      action: '설정 실행',
    },
    hotkeys: {
      title: '키보드 단축키',
      description: '면접 중 앱을 건드리지 않고 사용할 수 있는 모든 기능입니다.',
    },
  },

  auth: {
    fields: {
      email: '이메일',
      password: '비밀번호',
      username: '사용자 이름',
      confirmPassword: '비밀번호 확인',
      newPassword: '새 비밀번호',
      confirmNewPassword: '새 비밀번호 확인',
      verificationCode: '인증 코드',
      resetCode: '재설정 코드',
    },

    signIn: {
      title: '로그인',
      description: (appName: string) => `계정으로 ${appName}에 로그인하세요`,
      submit: '로그인',
      submitting: '로그인 중…',
      rememberMe: '로그인 상태 유지',
      noAccount: '계정이 없으신가요? 새로 만드세요.',
      forgotPassword: '비밀번호를 잊으셨나요?',
    },

    signup: {
      title: '계정 만들기',
      description: (appName: string) => `${appName} 새 계정을 등록하세요`,
      sendCode: '코드 보내기',
      sending: '보내는 중…',
      haveAccount: '이미 계정이 있으신가요? 로그인하세요',
      codeNotice: (email: string) =>
        `${email}에 아직 계정이 없다면 인증 코드를 보냈습니다. 아래에 붙여 넣으세요. 이미 계정이 있다면 로그인 방법을 안내하는 메일을 보냈습니다.`,
      verify: '인증',
      verifying: '인증 중…',
      changeEmail: '이메일 변경',
      resendCode: '코드 다시 보내기',
      requestResent: '요청을 다시 보냈습니다.',
      resendFailed: '다시 보내지 못했습니다.',
      create: '계정 만들기',
      creating: '만드는 중…',
      sendCodeFailed: '인증 코드를 보내지 못했습니다. 다시 시도하세요.',
      invalidCode: '인증 코드가 올바르지 않거나 만료되었습니다.',
      succeeded: '가입이 완료되었습니다! 로그인하세요.',
      failed: '가입하지 못했습니다. 다시 시도하세요.',
    },

    reset: {
      title: '비밀번호 재설정',
      description: (appName: string) => `${appName} 계정의 새 비밀번호를 설정하세요`,
      sendResetCode: '재설정 코드 보내기',
      sending: '보내는 중…',
      backToSignIn: '로그인으로 돌아가기',
      codeNotice: (email: string) =>
        `${email} 계정이 있다면 재설정 코드를 보냈습니다. 아래에 붙여 넣으세요. 코드는 한 번만 사용할 수 있으며, 만료 시간은 메일에 적혀 있습니다.`,
      verify: '인증',
      verifying: '인증 중…',
      changeEmail: '이메일 변경',
      resendCode: '코드 다시 보내기',
      codeResent: '재설정 코드를 다시 보냈습니다.',
      resendFailed: '재설정 코드를 다시 보내지 못했습니다.',
      signsYouOut: '새 비밀번호를 설정하면 모든 기기에서 로그아웃됩니다.',
      setNewPassword: '새 비밀번호 설정',
      saving: '저장 중…',
      done: '비밀번호 재설정 완료',
      startOver: '처음부터 다시',
      sendFailed: '재설정 코드를 보내지 못했습니다. 다시 시도하세요.',
      verifyFailed: '재설정 코드를 확인하지 못했습니다.',
      succeeded: '비밀번호를 재설정했습니다. 새 비밀번호로 로그인하세요.',
      failed:
        '비밀번호를 재설정하지 못했습니다. 코드가 만료되었을 수 있습니다 - 새 코드를 요청하세요.',
    },

    passwordsDoNotMatch: '비밀번호가 일치하지 않습니다',

    errors: {
      sendCodeFailed: '인증 코드를 보내지 못했습니다',
      invalidCode: '인증 코드가 올바르지 않거나 만료되었습니다',
      loginFailed: '로그인하지 못했습니다',
      signupFailed: '가입하지 못했습니다',
      logoutFailed: '로그아웃하지 못했습니다',
      changePasswordFailed: '비밀번호를 변경하지 못했습니다',
      sendResetCodeFailed: '비밀번호 재설정 코드를 보내지 못했습니다',
      invalidResetCode: '재설정 코드가 올바르지 않거나 만료되었습니다',
      resetFailed: '비밀번호를 재설정하지 못했습니다',
    },
  },

  home: {
    welcome: (firstName: string) => `다시 오신 것을 환영합니다, ${firstName}님`,
    welcomeAnonymous: '다시 오신 것을 환영합니다',
    subtitle: 'AI 면접관과 연습하거나, 실제 통화 중에 실시간으로 도움을 받으세요.',

    mock: {
      title: '모의 면접 시작',
      ready: 'AI가 질문하면 소리 내어 답하고, 마지막에 점수가 담긴 리포트를 받습니다.',
      unsupported:
        '이 서버에서는 아직 사용할 수 없습니다. 앱을 업데이트하거나 나중에 다시 시도하세요.',
      liveRunning: '먼저 실시간 어시스턴트를 중지하세요 - 둘이 마이크를 함께 쓸 수 없습니다.',
      unaffordable: '무료 시간이 부족합니다. 계속 연습하려면 구독하세요.',
    },

    live: {
      title: '실시간 어시스턴트 시작',
      resumeTitle: '면접으로 돌아가기',
      ready: '실제 면접을 전사하고, 진행되는 동안 답변을 제안합니다.',
      running: '실시간 어시스턴트가 이미 실행 중입니다.',
      mockRunning: '먼저 모의 면접을 끝내세요 - 둘이 마이크를 함께 쓸 수 없습니다.',
      unaffordable: '무료 시간이 부족합니다. 계속 면접을 보려면 구독하세요.',
    },

    planLabel: '요금제',
    planUnavailable: '확인할 수 없음',
    subscribe: '구독',

    signOutFailed: '로그아웃하지 못했습니다',
  },

  account: {
    title: '계정',
    completeness: {
      title: (done: number, total: number) => `프로필 ${done}/${total} 완료`,
      complete: '프로필 작성 완료',
      hint: '제안은 프로필과 지원 직무를 바탕으로 작성됩니다. 많이 입력할수록 더 나다운 답변이 됩니다.',
    },
    signedInAs: '로그인 계정',
    password: {
      title: '비밀번호',
      description: '계정 비밀번호를 변경합니다',
      action: '비밀번호 변경',
    },
    loadFailed: '저장된 정보를 불러오지 못했습니다. 수정하기 전에 다시 연결하세요.',
    save: '변경 사항 저장',
    saving: '저장 중…',
    saved: '계정 정보를 저장했습니다',
    saveFailed: '계정 정보를 저장하지 못했습니다',
  },

  profileFields: {
    fullName: '이름',
    fullNamePlaceholder: '면접에서 사용하는 이름',
    profile: '프로필',
    profilePlaceholder:
      '이력서, 링크드인 프로필 또는 짧은 자기소개를 붙여 넣으세요. 제안은 이 내용을 바탕으로 작성되므로 자세할수록 회원님다운 답변이 나옵니다.',
    context: '배경 정보',
    contextPlaceholder: '채용 공고, 직무 요건 등 준비 중인 면접에 관한 내용을 붙여 넣으세요.',
    limitReached: (max: number) =>
      `글자 수 제한(${max.toLocaleString('ko-KR')}자)에 도달했습니다. 초과한 내용은 추가되지 않았습니다.`,
    charactersLeft: (remaining: number) => `${remaining.toLocaleString('ko-KR')}자 남음`,
  },

  microphoneField: {
    label: '마이크',
    noDevices: '마이크가 감지되지 않았습니다. 연결하면 여기에 표시됩니다.',
    selectPlaceholder: '마이크 선택',
    lookingPlaceholder: '마이크를 찾는 중…',
    test: '테스트',
    stopTest: '테스트 중지',
    openFailed:
      '이 마이크를 열 수 없습니다. 연결되어 있는지, 다른 앱이 사용 중이지 않은지 확인하세요.',
    notConnected: (deviceName: string) =>
      `“${deviceName}” 연결이 끊어졌습니다. 다른 마이크를 고르세요.`,
    saySomething: '말해 보세요 - 말하는 동안 막대가 움직여야 합니다.',
    runningHint: '면접에서 이 마이크를 사용 중입니다. 면접이 끝나면 테스트할 수 있습니다.',
    testHint: '면접 전에 테스트하세요 - 소리가 안 들어가는 마이크는 조용한 방과 똑같아 보입니다.',
  },

  micLevelMeter: {
    label: '마이크 입력 레벨',
    hearing: '소리 감지 중',
    silent: '무음',
  },

  suggestionModeField: {
    label: '제안 스타일',
    hintOnly: '힌트만',
    hintOnlyDescription: '제목과 키워드로 한눈에 읽을 수 있습니다. 권장.',
    fullSentences: '완전한 문장',
    fullSentencesDescription: '말하는 그대로 작성된 전체 답변입니다.',
    switchHint: (combo: string) => `면접 중에도 컨트롤 바나 ${combo}로 바꿀 수 있습니다.`,
  },

  zoomField: {
    label: '화면 크기',
    smaller: '작게',
    larger: '크게',
    reset: '초기화',
    description: (combo: string) => `앱 전체의 크기를 조절합니다. ${combo}로도 가능합니다.`,
  },

  transcriptPanelField: {
    label: '전사 패널 표시',
    description: (combo: string) => `제안 아래에 실시간 전사를 표시합니다. ${combo}로 전환합니다.`,
  },

  hideTaskbarField: {
    label: '실시간 면접 중 작업 표시줄 아이콘 숨기기',
    description:
      '창을 항상 맨 위에 둡니다(macOS에서는 Dock 아이콘도 숨겨집니다). 최소화할 수 없습니다 - 창을 잃어버리면 앱을 다시 실행하세요.',
  },
  allowScreenCaptureField: {
    label: '화면 캡처 허용',
    description: '화면 공유와 녹화에서 앱 창이 보이도록 합니다. 스텔스 모드에서는 항상 숨겨집니다.',
  },
  mockHintsField: {
    label: '모의 면접에서 힌트 표시',
    description: '각 질문 옆에 어시스턴트의 답변을 보여 주어 내 답변과 비교할 수 있습니다.',
  },

  languageField: {
    label: '면접 언어',
    textOnly: '텍스트만',
    reconnectFailed:
      '제안의 언어는 바뀌었지만 전사는 아직 다시 연결하는 중입니다. 돌아오지 않으면 어시스턴트를 중지했다가 다시 시작하세요.',
    description: '전사되는 언어와 제안을 받는 언어입니다.',
    noVoiceNotice:
      '면접관이 질문을 읽어 주는 대신 글로 보여 줍니다. 답변은 여전히 소리 내어 하며 채점 방식은 같습니다.',
  },

  changePassword: {
    title: '비밀번호 변경',
    description: '현재 비밀번호를 입력하고 새 비밀번호를 정하세요.',
    current: '현재 비밀번호',
    currentPlaceholder: '현재 비밀번호 입력',
    next: '새 비밀번호',
    nextPlaceholder: '새 비밀번호 입력',
    confirm: '새 비밀번호 확인',
    confirmPlaceholder: '새 비밀번호 다시 입력',
    submit: '비밀번호 변경',
    submitting: '변경 중…',
    mismatch: '새 비밀번호가 일치하지 않습니다.',
    succeeded: '비밀번호를 변경했습니다',
    failed: '비밀번호를 변경하지 못했습니다',
  },

  hotkeys: {
    dialogTitle: '키보드 단축키',
    dialogDescription: '면접 중 앱을 건드리지 않고 사용할 수 있는 모든 기능입니다.',

    groups: {
      general: '일반',
      window: '창 관리',
      panels: '패널 스크롤',
      triggered: '요청형 제안',
    },

    keys: {
      StopAll: {
        title: '모두 중지',
        description: '어시스턴트를 중지하고 스텔스 모드를 종료합니다',
      },
      ToggleStealth: {
        title: '스텔스 전환',
        description:
          '실시간 면접 중 화면 캡처에서 앱을 숨깁니다. 같은 키를 누르면 다시 나타납니다.',
      },
      Opacity: { title: '투명도 전환', description: '스텔스 모드에서 창 투명도를 전환합니다' },
      ToggleTranscript: {
        title: '전사 전환',
        description: '전사 패널을 표시하거나 숨깁니다 - 스텔스 모드에서도 작동합니다',
      },
      ToggleSuggestionMode: {
        title: '힌트만 / 완전한 문장',
        description:
          '제안을 힌트만(한눈에 읽는 제목과 키워드)과 완전한 문장 사이에서 전환합니다. 스텔스 모드에서도 작동합니다.',
      },
      PlaceWin: {
        title: '창 배치',
        description: '창을 모서리, 가장자리 또는 가운데에 배치합니다',
      },
      MoveWin: { title: '창 이동', description: '지정한 방향으로 창을 이동합니다' },
      ResizeWin: {
        title: '창 크기 조절',
        description: '지정한 방향으로 창 크기를 조절합니다',
      },
      ZoomInOutReset: {
        title: '확대/축소/초기화',
        description: '화면 배율을 조절하거나 초기화합니다',
      },
      ScrollLiveSuggestionPanel: {
        title: '실시간 패널 스크롤',
        description: '실시간 제안 패널을 아래, 위 또는 끝으로 스크롤합니다',
      },
      ScrollActionSuggestionPanel: {
        title: '요청형 패널 스크롤',
        description: '요청형 제안 패널을 아래, 위 또는 끝으로 스크롤합니다',
      },
      Capture: {
        title: '화면 캡처',
        description: '요청형 제안에 사용할 스크린샷을 찍습니다',
      },
      ClearCaptures: { title: '캡처 지우기', description: '찍은 스크린샷을 지웁니다' },
      TriggerWithoutCaptures: {
        title: '캡처 없이 생성',
        description: '스크린샷 없이 제안을 생성합니다',
      },
      TriggerWithCaptures: {
        title: '캡처와 함께 생성',
        description: '스크린샷을 참고해 제안을 생성합니다. 캡처가 없으면 먼저 한 장 찍어 봅니다.',
      },
    },
  },

  inputPassword: {
    show: '비밀번호 표시',
    hide: '비밀번호 숨기기',
  },

  titlebar: {
    openCommandPalette: '명령 팔레트 열기',
    searchActions: '작업 검색',
    unavailableDuringInterview: '면접 중에는 사용할 수 없습니다',
    menu: '메뉴',
    minimize: '최소화',
    maximize: '최대화',
    close: '닫기',
  },

  titlebarMenu: {
    home: '홈',
    account: '계정',
    configuration: '설정',
    documentation: '도움말',
    language: '앱 언어',
    lightMode: '라이트 모드',
    darkMode: '다크 모드',
    theme: '테마',
    systemMode: '시스템 설정 따르기',
    signOut: '로그아웃',
  },

  commandPalette: {
    title: '명령 팔레트',
    description: '작업, 페이지 또는 설정을 검색하세요.',
    searchPlaceholder: '작업 검색…',
    empty: '일치하는 작업이 없습니다.',
    groups: {
      goTo: '이동',
      session: '세션',
      app: '앱',
    },
    home: '홈',
    account: '계정',
    configuration: '설정',
    subscribe: '구독',
    startMock: '모의 면접 시작',
    startLive: '실시간 어시스턴트 시작',
    switchToFullSentence: '완전한 문장으로 전환',
    switchToHintOnly: '힌트만으로 전환',
    hideTranscript: '전사 숨기기',
    showTranscript: '전사 표시',
    documentation: '도움말',
    hotkeys: '키보드 단축키',
    switchToLight: '라이트 모드로 전환',
    switchToDark: '다크 모드로 전환',
    signOut: '로그아웃',
  },

  controlPanel: {
    stop: '중지',
    stopTooltip: '어시스턴트 중지',
    stopRunningHint: '세션을 끝내고 저장 여부를 물은 뒤 홈으로 돌아갑니다',
    stopIdleHint: '실행 중인 것이 없습니다 - 홈 화면에서 면접을 시작하세요',
    stopTransientHint: '세션이 실행되면 사용할 수 있습니다',

    checks: {
      configUnavailable:
        '저장된 설정을 불러오지 못했습니다. 다시 연결하는 중입니다 - 잠시 후 다시 시도하세요.',
      nameMissing: '이름이 설정되지 않았습니다',
      profileMissing: '프로필이 설정되지 않았습니다',
      noMicrophone: '마이크가 감지되지 않았습니다. 연결한 뒤 다시 시도하세요.',
      deviceNotFound: (deviceName: string) =>
        `오디오 입력 장치 “${deviceName}”을(를) 찾을 수 없습니다`,
    },
    startFailed: '어시스턴트를 시작하지 못했습니다',

    /** The live connection and microphone indicator on the control bar. */
    signal: {
      listening: '듣는 중',
      reconnecting: '다시 연결 중…',
      listeningHint: '마이크와 전사가 연결되어 있습니다',
      reconnectingHint: '전사 연결이 끊어졌습니다 - 자동으로 다시 연결하는 중',
    },
  },

  audioGroup: {
    options: '오디오 옵션',
    optionsSwapFailed: '오디오 옵션 - 마이크를 바꾸지 못해 이전 마이크를 계속 사용합니다',
    optionsDeviceNotFound: '오디오 옵션 - 선택한 마이크를 찾을 수 없습니다',
    dialogTitle: '오디오 옵션',
    dialogDescription: '사용하는 실제 마이크를 선택하세요.',
    microphone: '마이크',
    selectPlaceholder: '마이크 선택',
    switching: '마이크를 바꾸는 중…',
    swapFailed: (deviceName: string) =>
      `${deviceName}(으)로 바꾸지 못했습니다. 이 면접은 이전 마이크를 계속 사용합니다. 사용하려면 어시스턴트를 중지했다가 다시 시작하세요.`,
    takesEffectImmediately: '바로 적용됩니다. 전사는 계속 진행됩니다.',
  },

  languageGroup: {
    current: (languageName: string) => `면접 언어: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `면접 언어: ${languageName} - 전사는 전환되지 않음`,
    tooltip: (nativeName: string) => `면접 언어: ${nativeName}`,
    reconnecting: '전사를 다시 연결하는 중…',
    suggestionsOnly: '제안만 전환됨 - 전사는 아직 다시 연결하는 중',
    speechAndSuggestions: '음성 인식 및 제안',
    menuLabel: '면접 언어',
    halfApplied:
      '제안은 바뀌었지만 전사는 바뀌지 않았습니다. 계속 재시도하는 중입니다 - 돌아오지 않으면 어시스턴트를 중지했다가 다시 시작하세요.',
    willReconnect: '전사가 다시 연결되므로 말하던 문장이 끊길 수 있습니다.',
  },

  languageSearch: {
    placeholder: '언어 검색…',
    empty: '일치하는 언어가 없습니다.',
  },

  suggestionMode: {
    hintOnlyBadge: '힌트만',
    fullSentencesBadge: '완전한 문장',
    hintOnlyMode: '힌트만 모드',
    fullSentenceMode: '완전한 문장 모드',
    hintOnlySummary: '제목 + 키워드',
    fullSentenceSummary: '전체를 작성한 답변',
    ariaHintOnly: '제안 모드: 힌트만. 완전한 문장으로 전환',
    ariaFullSentence: '제안 모드: 완전한 문장. 힌트만으로 전환',
  },

  toolsGroup: {
    hideTranscription: '전사 숨기기',
    showTranscription: '전사 표시',
    enterStealth: '스텔스 모드 시작',
    stealthMode: '스텔스 모드',
    stealthUnavailable: '실시간 면접이 실행되면 사용할 수 있습니다 - 아직은 숨길 것이 없습니다.',
    stealthAvailable: '화면 캡처에서 앱을 숨깁니다. 같은 단축키를 누르면 다시 나타납니다.',
    captureScreenshot: '스크린샷 찍기',
    captureScreenshotTooltip: '화면 캡처',
    captureFailed: '스크린샷을 찍지 못했습니다',
    clearCaptures: '찍은 스크린샷 지우기',
    clearCapturesTooltip: '캡처 지우기',
    clearCapturesFailed: '캡처를 지우지 못했습니다',
    generateSuggestion: '요청형 제안 생성',
    generateSuggestionTooltip: '제안 생성',
    generateSuggestionFailed: '제안을 생성하지 못했습니다',
    clear: '지우기',
    clearInterview: '면접 지우기',
    clearFailed: '지우지 못했습니다',
    exportInterview: '면접 내보내기',
    exportTheInterview: '이 면접 내보내기',
    nothingToExport: '아직 내보낼 내용이 없습니다',
    nothingToExportDescription: '먼저 면접을 진행한 뒤 전사와 제안을 내보내세요.',
    exportFailed: '면접을 내보내지 못했습니다',
    exportDocx: 'Word 문서 (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: '전사',
    transcriptionShown: (combo: string) => `전사: 표시 (${combo})`,
    transcriptionHidden: (combo: string) => `전사: 숨김 (${combo})`,
    showHotkeys: '단축키 보기',
    showHotkeysLabel: '키보드 단축키 보기',
    showHotkeysTitle: '키보드 단축키 보기 (?)',
  },

  runningIndicator: {
    idle: '대기',
    starting: '시작 중',
    running: '실행 중',
    stopping: '중지 중',
  },

  zoomControl: {
    reset: '배율 초기화',
    zoomIn: '확대',
    zoomOut: '축소',
  },

  creditsDisplay: {
    freePlan: '무료',
    planNames: {
      monthly: '월간',
      quarterly: '3개월',
      yearly: '연간',
      other: '구독 중',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('ko-KR'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('ko-KR')} ${new Date(ms).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `${date}까지 무제한`,
    endsIn: (days: number) => `${days}일 후 종료`,
    freeLeft: (availableTime: string) => `무료 ${availableTime}`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours}시간`);
      if (minutes) parts.push(`${minutes}분`);
      return parts.join(' ') || '0분';
    },
    lessThanAMinute: '1분 미만',
    noFreeTimeLeft: '무료 시간 없음',
  },

  panels: {
    autoScroll: '자동 스크롤',
    enableAutoScroll: '자동 스크롤 켜기',
    scrollToBottom: '맨 아래로 스크롤',
    scrollToTop: '맨 위로 스크롤',

    transcription: '전사',
    noTranscripts: '아직 전사가 없습니다',
    interviewer: '면접관',

    liveSuggestions: '실시간 제안',
    noSuggestions: '아직 제안이 없습니다',
    idleNoGeneration: '대기 중 - 아직 생성된 내용이 없습니다',

    triggeredSuggestions: '요청형 제안',
    noTriggeredSuggestions: '아직 요청형 제안이 없습니다',
    suggestionCanceled: '제안이 취소되었습니다',

    mockInterview: '모의 면접',
    questionProgress: (current: number, total: number) => `질문 ${current}/${total}`,
    preparingFirstQuestion: '첫 질문을 준비하는 중…',
    you: '나',
    followUp: '꼬리 질문',
    skipped: '건너뜀',
    noAnswer: '답변 없음',

    resizeTranscript: '전사 패널 크기 조절',
    resizeHint: '드래그해서 크기를 조절하고, 두 번 클릭하면 초기화됩니다',
  },

  saveHistory: {
    saveAsWord: 'Word로 저장',
    saveAsMarkdown: 'Markdown으로 저장',
    formatHintLive: '공유하거나 인쇄하려면 Word, 일반 텍스트로 보관하려면 Markdown.',
    formatHintMock: '공유하거나 인쇄하려면 Word, 메모와 함께 보관하려면 Markdown.',
    exportFailed: '면접을 내보내지 못했습니다',

    live: {
      clear: {
        title: '지우기 전에 이 면접을 저장할까요?',
        body: '전사와 제안이 사라집니다.',
        discard: '저장하지 않고 지우기',
      },
      start: {
        title: '새 면접을 시작하기 전에 이 면접을 저장할까요?',
        body: '전사와 제안이 사라집니다.',
        discard: '저장하지 않고 시작',
      },
      close: {
        title: '닫기 전에 이 면접을 저장할까요?',
        body: '전사와 제안이 사라집니다.',
        discard: '저장하지 않고 닫기',
      },
      update: {
        title: '업데이트를 설치하기 전에 이 면접을 저장할까요?',
        body: '앱이 다시 시작되며 전사와 제안이 사라집니다.',
        discard: '저장하지 않고 설치',
      },
      signout: {
        title: '로그아웃하기 전에 이 면접을 저장할까요?',
        body: '전사와 제안이 사라집니다.',
        discard: '저장하지 않고 로그아웃',
      },
      stop: {
        title: '이 면접을 저장할까요?',
        body: '면접이 끝났습니다. 전사와 제안은 아직 어디에도 저장되지 않았습니다.',
        discard: '버리고 홈으로',
      },
      'mock-done': {
        title: '끝내기 전에 리포트를 저장할까요?',
        body: '점수, 피드백, 답변이 사라집니다.',
        discard: '저장하지 않고 끝내기',
      },
      'mock-again': {
        title: '다음 라운드 전에 이 리포트를 저장할까요?',
        body: '이번 점수, 피드백, 답변이 바뀝니다.',
        discard: '저장하지 않고 다시 연습',
      },
    },

    mock: {
      clear: {
        title: '모의 면접 리포트를 먼저 저장할까요?',
        body: '이 리포트와 답변이 사라집니다.',
        discard: '저장하지 않고 지우기',
      },
      start: {
        title: '모의 면접 리포트를 먼저 저장할까요?',
        body: '이 리포트와 답변이 사라집니다.',
        discard: '저장하지 않고 시작',
      },
      close: {
        title: '닫기 전에 모의 면접 리포트를 저장할까요?',
        body: '이 리포트와 답변이 사라집니다.',
        discard: '저장하지 않고 닫기',
      },
      update: {
        title: '업데이트를 설치하기 전에 모의 면접 리포트를 저장할까요?',
        body: '앱이 다시 시작되며 이 리포트와 답변이 사라집니다.',
        discard: '저장하지 않고 설치',
      },
      signout: {
        title: '로그아웃하기 전에 모의 면접 리포트를 저장할까요?',
        body: '이 리포트와 답변이 사라집니다.',
        discard: '저장하지 않고 로그아웃',
      },
      stop: {
        title: '모의 면접 리포트를 저장할까요?',
        body: '면접이 끝났습니다. 이 리포트는 아직 어디에도 저장되지 않았습니다.',
        discard: '버리고 홈으로',
      },
    },
  },

  headphoneNotice: {
    title: '헤드폰이 필요합니다',
    description:
      '시작하기 전에 착용하세요. 면접관의 목소리는 귀로만 들어야 하며, 절대 스피커로 나오면 안 됩니다.',
    liveSpeakers: '스피커를 쓰면 마이크도 면접관의 목소리를 회원님만큼 또렷하게 듣습니다.',
    liveConsequence:
      '그러면 앱이 상대의 질문을 회원님이 한 말로 받아들여 답하지 않게 됩니다 - 이유를 알려 주는 오류도 전혀 없이요.',
    mockSpeakers: '스피커를 쓰면 방금 들은 질문이 메아리처럼 답변 앞부분에 섞일 수 있습니다.',
    mockConsequence:
      '면접관이 말하는 동안은 마이크가 음소거되지만, 그 뒤 방 안의 울림이 엉뚱한 단어로 섞여 들어갈 수 있습니다.',
    proceed: '헤드폰을 착용했습니다',
  },

  permissionGate: {
    title: '권한이 필요합니다',
  contextReminder: {
    title: '면접 컨텍스트가 설정되지 않았습니다',
    description: '지원하는 직무를 모른 채 프로필만으로 제안이 작성됩니다.',
    hint: '채용 공고, 이전 면접 메모, 자기소개서 등 이번 면접에 관한 정보를 추가하면 더 잘 맞는 답변을 받을 수 있습니다.',
    edit: '컨텍스트 추가',
    proceed: '그냥 시작',
    setTitle: '컨텍스트가 최신인가요?',
    setDescription:
      '제안은 계정에 저장된 컨텍스트에 맞춰 작성됩니다. 이전 면접 내용이 그대로라면 다른 직무에 맞는 답변이 나옵니다.',
    review: '컨텍스트 확인',
    confirm: '최신입니다',
  },

    microphone: '마이크',
    micChecking: '확인 중…',
    micGranted: '허용됨',
    micBlocked: '시스템 설정에서 허용한 뒤 다시 확인을 클릭하세요',
    micRequired: '음성을 녹음하는 데 필요합니다',
    grantAccess: '접근 허용',
    openSettings: '설정 열기',
    screenRecording: '화면 기록',
    screenChecking: '확인 중…',
    screenNeedsRelaunch: '허용됨 - 시작하기 전에 앱을 다시 시작해 적용하세요',
    screenGranted: '허용됨',
    screenNotDetermined: '녹화를 시작할 때 요청됩니다',
    screenBlocked: '시스템 설정에서 허용한 뒤 앱을 다시 시작해 적용하세요',
    restartApp: '앱 다시 시작',
    checking: '확인 중…',
    checkAgain: '다시 확인',
    start: '시작',
  },

  exportToast: {
    exported: (format: string) => `면접을 ${format} 형식으로 내보냈습니다`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: '내보낸 파일 열기',
    openFile: '파일 열기',
    showInFolderLabel: '내보낸 파일을 폴더에서 보기',
    showInFolder: '폴더에서 보기',
    dismiss: '닫기',
  },

  notices: {
    connecting: '서버에 연결하는 중…',
    starting: '시작하는 중…',
    stopping: '중지하는 중…',
    dismiss: '닫기',
  },

  updateNotification: {
    available: (version: string) => `업데이트 가능: v${version}`,
    availableDescription: '백그라운드에서 자동으로 다운로드가 시작됩니다.',
    downloading: (percent: string) => `업데이트 다운로드 중… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `업데이트 다운로드 완료: v${version}`,
    downloadedDescriptionMac: '클릭해서 설치 프로그램을 연 뒤 응용 프로그램 폴더로 드래그하세요.',
    downloadedDescription: '클릭하면 다시 시작하고 업데이트를 설치합니다.',
    openInstaller: '설치 프로그램 열기',
    restartNow: '지금 다시 시작',
  },

  mock: {
    setup: {
      title: '모의 면접',
      description:
        'AI가 질문하고 회원님은 소리 내어 답합니다. 내보내지 않으면 아무것도 저장되지 않습니다.',
      start: '모의 면접 시작',
      starting: '시작하는 중…',
      seniority: '경력 수준',
      seniorityOptions: {
        junior: '주니어',
        mid: '미들',
        senior: '시니어',
        staff: '스태프 이상',
      },
      questions: '질문 수',
      questionOption: (count: number, minutes: number) => `질문 ${count}개, 약 ${minutes}분`,
      difficulty: '난이도',
      difficultyOptions: {
        easy: {
          label: '워밍업',
          description: '요구 사항이 하나뿐인 쉬운 질문입니다.',
        },
        standard: {
          label: '표준',
          description: '일반적인 면접관이 실제로 할 만한 질문입니다.',
        },
        hard: {
          label: '어려움',
          description: '트레이드오프와 예외 상황을 깊게 파고드는 질문입니다.',
        },
      },
      languageDescription: '면접관이 질문하는 언어, 전사되는 언어, 피드백을 받는 언어입니다.',
      estimate: (minutes: number) => `보통 약 ${minutes}분 걸립니다.`,
      unlimited: '구독하면 무제한입니다.',
      covers: (minutes: number) => `무료 시간으로 약 ${minutes}분을 사용할 수 있습니다.`,
      endsEarly: '무료 시간이 다 되면 세션이 끝나지만, 리포트는 그대로 받을 수 있습니다.',
    },

    session: {
      heading: '모의 면접 세션',
      starting: '시작하는 중…',
      generating: '다음 질문을 생각하는 중…',
      evaluating: '생각하는 중…',
      scoring: '면접을 채점하는 중…',
      stopping: '면접을 끝내는 중…',
      speaking: '면접관이 말하는 중입니다. 질문이 재생되는 동안 마이크가 꺼집니다.',
      readThenReady: '질문을 읽으세요. 준비가 되었다고 누른 시점부터 답변이 녹음됩니다.',
      listening: '듣는 중…',
      ready: '준비됐어요',
      doneAnswering: '답변 완료',
      doneAnsweringTooltip: '답변을 제출하고 다음으로 넘어갑니다',
      toggleHints: '실시간 제안 전환',
      hintsOn: '실시간 제안: 켜짐',
      hintsOff: '실시간 제안: 꺼짐',
      hintsOnHint: '실시간 어시스턴트라면 어떻게 답할지 보여 줍니다',
      hintsOffHint: '힌트 없이 연습',
      endInterview: '면접 끝내기',
      startFailed: '모의 면접을 시작하지 못했습니다',
      startingPage: '모의 면접을 시작하는 중…',
    },

    report: {
      heading: '모의 면접 리포트',
      verdictExcellent: '매우 우수',
      verdictStrong: '우수',
      verdictDeveloping: '발전 중',
      verdictNeedsWork: '보완 필요',
      scoreFailed: (reason: string) =>
        `종합 점수를 산출하지 못했습니다(${reason}). 답변은 아래에 그대로 있으며 내보낼 수도 있습니다.`,
      scoreAgain: '다시 채점',
      scoring: '채점 중…',
      overallScore: '종합 점수',
      strengths: '강점',
      gaps: '보완점',
      nothingNoted: '특별히 지적할 사항이 없습니다.',
      perQuestion: '질문별 세부 내용',
      yourAnswer: '내 답변',
      noAnswerRecorded: '(녹음된 답변 없음)',
      score: '점수',
      strongerAnswer: '더 나은 답변',
      saveAsWord: 'Word로 저장',
      saveAsMarkdown: 'Markdown으로 저장',
      exportFailed: '리포트를 내보내지 못했습니다',
      practiseAgain: '다시 연습',
      done: '완료',
    },
  },

  mainRoute: {
    redirectingToLogin: '로그인 화면으로 이동하는 중…',
    authenticating: '인증하는 중…',
    transcriptionHidden: '전사가 숨겨져 있습니다',
    awaitingFirstQuestion: {
      title: '첫 질문을 기다리는 중…',
      description: '면접관이 질문하면 바로 여기에 제안이 표시됩니다. 면접 중 유용한 단축키:',
    },
  },

  documentation: {
    intro: (appName: string) =>
      `${appName}은(는) 실시간 제안과 화면 내용을 바탕으로 한 코드 추천으로 면접을 돕는 AI 어시스턴트입니다.`,
    docsLead: '전체 문서는 ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: '에서 볼 수 있습니다. 앱 어디서든 Cmd/Ctrl+K를 누르면 작업을 검색할 수 있습니다.',

    lostWindow: {
      title: '창을 잃어버렸나요?',
      body: (appName: string) =>
        `스텔스 모드에서는 화면 공유 중에 보이지 않도록 ${appName}이(가) 작업 표시줄과 macOS Dock에서 사라집니다. 그래서 최소화된 창에는 클릭할 버튼이 없습니다. ${appName}을(를) 다시 실행하기만 하면 됩니다. 두 번째 창이 열리는 것이 아니라 이 창이 돌아옵니다. 스텔스 모드가 아닐 때는 “실시간 면접 중 작업 표시줄 아이콘 숨기기”를 켜지 않은 한 평소처럼 작업 표시줄 버튼과 Dock 아이콘이 있습니다.`,
    },

    language: {
      title: '다른 언어로 면접 보기',
      oneSetting:
        '하나의 설정이 세션 전체에 적용됩니다. 통화를 전사하는 음성 모델, 제안이 작성되는 언어, 내보내는 리포트의 언어가 모두 이 설정을 따릅니다. 컨트롤 바의 언어 버튼, 설정 페이지, 모의 면접 설정 창 어디에서 바꿔도 같은 설정이 바뀝니다.',
      supported: (count: number) => `지원 언어 ${count}개:`,
      midInterview:
        '면접 중에도 바꿀 수 있습니다. 제안은 다음 답변부터 바로 바뀝니다. 음성 인식은 다시 연결되느라 조금 더 걸리므로, 그 순간 말하던 문장은 전사에서 끊길 수 있습니다.',
      textOnly:
        '모의 면접에서 설정 창에 “텍스트만”으로 표시된 언어는 음성이 없습니다. 면접관이 질문을 읽어 주는 대신 글로 보여 줍니다. 답변은 여전히 소리 내어 하며 채점은 달라지지 않습니다.',
      appLanguageTitle: '앱에는 별도의 언어가 있습니다',
      appLanguageBody:
        '위의 언어는 면접 언어입니다. 앱 자체의 언어 - 버튼, 제목, 메시지 - 는 설정 페이지의 별도 설정이며, 첫 실행 설정에서 가장 먼저 묻는 항목이기도 합니다. 어느 쪽도 다른 쪽에서 추측하지 않습니다. 러시아어를 쓰면서 영어로 면접을 보는 사람은 영어 전사와 러시아어 앱을 원하기 때문입니다.',
    },

    microphone: {
      title: '면접 중 마이크 바꾸기',
      body: '면접이 진행되는 동안에도 컨트롤 바의 마이크 버튼을 쓸 수 있습니다. 헤드셋 배터리가 떨어졌거나, 연결이 빠졌거나, 처음부터 잘못된 장치였다면 어시스턴트를 중지하지 말고 거기서 다른 장치를 고르세요 - 중지하면 전사와 제안도 함께 지워집니다.',
      immediate:
        '변경은 바로 적용되고 전사도 계속되므로 끊기는 부분이 없습니다. 고른 장치를 열 수 없으면 - 연결이 빠졌거나 다른 앱이 사용 중이면 - 이전 장치로 면접이 계속되며 앱이 알려 줍니다.',
    },

    suggestionStyle: {
      title: '힌트만 vs 완전한 문장',
      body: '기본값은 힌트만입니다. 각 제안이 한 줄 제목과 키워드로 도착해 한눈에 파악하고 계속 말할 수 있습니다. 완전한 문장은 말하는 그대로 답변을 작성합니다 - 읽을 것은 많아지고 즉흥으로 말할 것은 줄어듭니다.',
      switching: (combo: string) =>
        `컨트롤 바, 설정 페이지 또는 ${combo}로 전환할 수 있으며, ${combo}는 스텔스 모드에서도 작동합니다. 이미 화면에 있는 제안은 생성될 때의 스타일을 유지하고, 다음 제안부터 바뀝니다.`,
    },

    settings: {
      title: '설정이 있는 곳',
      accountLabel: '계정',
      accountBody:
        '에는 회원님에 관한 정보가 있습니다 - 사용하는 이름, 제안의 바탕이 되는 프로필이나 이력서, 면접 보는 직무의 배경 정보, 비밀번호.',
      configurationLabel: '설정',
      configurationBody:
        '에는 면접 진행 방식이 있습니다 - 앱 언어, 마이크(테스트 포함), 면접 언어, 제안 스타일, 전사 패널 고정 여부. 따로 저장할 필요 없이 바꾸는 즉시 적용됩니다.',
      both: '두 화면 모두 홈 화면, 제목 표시줄 메뉴, Cmd/Ctrl+K 팔레트에서 열 수 있습니다. 새로 설치하면 처음 실행할 때 한 번 전체를 안내합니다.',
    },

    hotkeys: '단축키',
  },

  payment: {
    title: '구독',
    tabs: {
      buy: '요금제',
      history: '내역',
      status: '상태',
    },

    buy: {
      features: {
        unlimited: '라이브 및 모의 면접 무제한',
        model: '가장 뛰어난 AI 모델',
        noRenewal: '선불 - 자동 갱신 없음',
      },
      currentPlan: '내 요금제',
      subscribedUntil: (plan: string, date: string) => `${plan}, ${date}까지`,
      daysLeft: (days: number) => `${days}일 남음`,
      freePlan: '무료 요금제',
      freeLeft: (duration: string) => `무료 모델로 ${duration} 동안 면접을 볼 수 있습니다.`,
      freeUsedUp: '무료 시간을 모두 썼습니다. 계속 면접을 보려면 구독하세요.',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours}시간`);
        if (minutes) parts.push(`${minutes}분`);
        return parts.join(' ') || '0분';
      },
      loadingPlans: '요금제를 불러오는 중…',
      mostPopular: '가장 인기',
      planDescriptions: {
        monthly: '최신 모델로 1개월간 무제한 면접',
        quarterly: '최신 모델로 3개월간 무제한 면접',
        yearly: '최신 모델로 1년간 무제한 면접',
      },
      perMonth: ' / 월',
      billedAs: (price: number, months: number) => `$${price} 일시불, ${months}개월 이용`,
      save: (percent: number) => `${percent}% 할인`,
      prepaid: '암호화폐로 한 번 결제합니다. 이용권은 절대 자동으로 갱신되지 않습니다.',
      refundPrompt: '환불이 필요하신가요?',
      refundContact: '지원팀에 문의',
      extends: '구독이 활성 상태입니다. 새 이용권의 기간은 현재 종료일 이후에 추가됩니다.',
      selected: '선택됨',
      buy: '선택',
      detailsTitle: '결제 정보',
      detailsLead: '',
      detailsFor: ' 요금제 구매를 완료하세요. 금액: ',
      currencyLabel: '결제 통화',
      currencyPlaceholder: '통화 선택',
      currencySearchPlaceholder: '통화 검색…',
      noCurrency: '통화를 찾을 수 없습니다',
      createPayment: '결제 생성',
      creatingPayment: '결제를 생성하는 중…',
    },

    history: {
      loading: '결제 내역을 불러오는 중…',
      loadFailed: '결제 내역을 불러오지 못했습니다',
      emptyTitle: '결제 내역 없음',
      emptyBody: '아직 결제한 내역이 없습니다. 구독해서 시작하세요.',
      subscribe: '요금제 보기',
      refreshing: '새로 고치는 중…',
      remainder: '남은 금액',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months}개월`
          : days > 0
            ? `${days.toLocaleString('ko-KR')}일`
            : credits > 0
              ? `${credits.toLocaleString('ko-KR')} 크레딧`
              : '-',
      columns: {
        created: '생성일',
        paymentId: '결제 ID',
        purchase: '구매 항목',
        amount: '금액',
        status: '상태',
        action: '작업',
      },
      notAvailable: '없음',
      view: '보기',
    },

    status: {
      title: '결제 상태 확인',
      description: '결제 ID를 입력해 현재 상태를 확인하세요',
      idPlaceholder: '결제 ID 입력',
      check: '상태 확인',
      checking: '확인 중…',
      notFound: '결제를 찾을 수 없습니다',
      fetchFailed: '결제 상태를 가져오지 못했습니다',
      order: (orderId: string) => `주문 번호 ${orderId}`,
      refreshing: '새로 고치는 중…',
      amountToPay: '결제 금액',
      priceUsd: '가격(미국 달러)',
      actuallyPaid: '실제 결제 금액',
      paymentMethods: '결제 방법',
      qrTab: 'QR 코드',
      addressTab: '주소',
      downloadQr: 'QR 코드 다운로드',
      qrSaved: 'QR 코드를 저장했습니다',
      scanWithWallet: '지갑 앱으로 스캔하세요',
      qrIncludes: (amount: string) => `QR 코드에는 주소와 금액(${amount})이 포함되어 있습니다`,
      paymentAddress: '결제 주소',
      amountToSend: '보낼 금액',
      sendExactly: '위 주소로 정확히 이 금액을 보내세요.',
      successTitle: '결제가 완료되었습니다!',
      successBody: '구독이 계정에 적용되었습니다.',
      expiredTitle: '결제 만료',
      failedTitle: '결제 실패',
      expiredBody: '이 결제는 만료되었습니다. 새 결제를 생성하세요.',
      failedBody: '결제를 처리하지 못했습니다. 다시 시도하세요.',
      refundedTitle: '환불 완료',
      refundedBody: '이 결제는 환불되었습니다. 궁금한 점은 지원팀에 문의하세요.',
      receivedTitle: '입금 확인',
      receivedBody:
        '네트워크에서 입금을 확인하는 중입니다. 추가 결제는 필요 없으며 구독은 자동으로 적용됩니다.',
      partialTitle: '일부 입금 확인',
      partialBody:
        '남은 금액을 위한 새 주소를 준비하고 있습니다. 여기에 표시되고 이메일로도 보내 드립니다. 이전 주소로는 더 보내지 마세요.',
      created: '생성:',
      updated: '업데이트:',
      addressCopied: '결제 주소를 클립보드에 복사했습니다',
      amountCopied: '금액을 클립보드에 복사했습니다',
      currencyCopied: '통화를 클립보드에 복사했습니다',
    },

    statusLabels: {
      waiting: '대기 중',
      confirming: '확인 중',
      confirmed: '확인됨',
      sending: '전송 중',
      partiallyPaid: '일부 결제됨',
      finished: '완료',
      failed: '실패',
      refunded: '환불됨',
      expired: '만료됨',
    },

    errors: {
      getPlans: '요금제를 가져오지 못했습니다',
      getCurrencies: '통화를 가져오지 못했습니다',
      createPayment: '결제를 생성하지 못했습니다',
      getStatus: '결제 상태를 가져오지 못했습니다',
      getHistory: '결제 내역을 가져오지 못했습니다',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: '선택한 마이크를 저장하지 못했습니다',
    microphoneSwapFailed: '저장했지만 면접은 이전 마이크를 계속 사용 중입니다',
    microphoneSwapFailedHint:
      '장치가 연결되어 있는지 확인한 뒤 어시스턴트를 중지했다가 다시 시작하세요.',
    saveLanguageFailed: '면접 언어를 저장하지 못했습니다',
    languageHalfApplied: '제안의 언어는 바뀌었고, 전사는 아직 다시 연결하는 중입니다',
    languageHalfAppliedHint:
      '계속 재시도합니다. 돌아오지 않으면 어시스턴트를 중지했다가 다시 시작하세요.',
    saveSuggestionModeFailed: '제안 모드를 저장하지 못했습니다',
    saveTranscriptPanelFailed: '전사 패널 설정을 저장하지 못했습니다',
    saveMockHintsFailed: '실시간 제안 설정을 저장하지 못했습니다',
    saveHideTaskbarFailed: '작업 표시줄 설정을 저장하지 못했습니다. 다시 시도하세요.',
    saveAllowScreenCaptureFailed: '화면 캡처 설정을 저장하지 못했습니다. 다시 시도하세요.',
    saveUiLanguageFailed: '앱 언어를 저장하지 못했습니다',
  },

  assistant: {
    mockRunning: '실시간 세션을 시작하기 전에 모의 면접을 중지하세요.',
    stoppedUncleanly: '어시스턴트가 중지되었지만 일부가 정상적으로 종료되지 않았습니다',
    stoppedUncleanlyHint: '전사나 제안이 계속 들어오면 앱을 다시 시작하세요.',
    startFailed: '어시스턴트를 시작하지 못했습니다',
    stopFailed: '어시스턴트를 중지하지 못했습니다',
    screenCaptureTimedOut: '화면 캡처 시간이 초과되었습니다. 다시 시도하세요.',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `오디오 입력 장치 “${deviceName}”을(를) 찾을 수 없습니다. 메인 화면의 오디오 설정에서 다른 장치를 고르세요.`,
  },

  creditGate: {
    tooLow: '시작할 무료 시간이 부족합니다',
    outOfCredits: '무료 시간을 모두 썼습니다 - 세션이 끝났습니다',
    outOfCreditsHint: '구독하면 무제한으로 면접을 볼 수 있습니다.',
    replaced: '면접이 끝났습니다 - 이 계정에서 새 면접이 시작되었습니다',
    replacedHint: '한 계정에서는 한 번에 하나의 면접만 진행할 수 있습니다.',
    lowBalance: (minutes: number) => `무료 시간이 약 ${minutes}분 남았습니다`,
    lowBalanceHint: '무료 시간이 다 되면 세션이 끝납니다.',
    tooLowHint:
      '세션에는 최소 1분이 필요합니다. 구독하면 최신 모델로 무제한 면접을 볼 수 있습니다.',
    subscribe: '요금제 보기',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `구독이 ${days}일 후에 끝납니다`,
    endingSoonHint:
      '무제한 면접을 이어 가려면 이용권을 하나 더 구매하세요. 기간은 현재 종료일 이후에 추가됩니다.',
    ended: '구독이 끝났습니다',
    endedHint: '이제 면접은 무료 모델에서 무료 시간을 사용합니다.',
  },

  trialNotice: {
    freeTierLead: '무료 요금제: ',
    freeTier: '무료',
    freeTierTail: ' 모델로 1시간 면접.',
    sotaLead: '구독하면 ',
    sota: '최신',
    sotaTail: ' 모델로 무제한 면접.',
  },
};
