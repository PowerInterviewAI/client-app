/**
 * English, and the shape every other locale is checked against.
 *
 * `Translation` below is `typeof en`, so a locale file is an object literal assigned to that
 * type: a key Russian is missing, or one it spells differently, is a build error rather than a
 * string that renders as a key at runtime. That is the whole reason this is a typed object
 * instead of i18next - for two locales with no lazy loading and no namespacing, a runtime
 * lookup buys nothing and costs a silent fallback on the one screen nobody checked.
 *
 * Strings that take a value are functions rather than templates with placeholders, which keeps
 * them type-checked by their callers and lets a locale put the value where its own grammar
 * needs it - including Russian's three plural forms, which no `{{count}}` can express.
 *
 * Grouped by the surface that renders them, and `common` holds only words that genuinely mean
 * the same thing everywhere. A button that happens to read "Close" on two screens is two keys
 * if the two could ever want different words.
 */
export const en = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    continue: 'Continue',
    finish: 'Finish',
    retry: 'Retry',
    view: 'View',
    loading: 'Loading…',
    /**
     * A label with its keyboard shortcut after it, which is the shape most of the control bar's
     * tooltips take. A locale that wanted a different separator changes it here once.
     */
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'App language',
    description:
      'The app itself: buttons, headings and messages. What your interview runs in is a separate setting.',
  },

  onboarding: {
    /** Over the progress bar on a first run, where the wizard is compulsory. */
    firstRunEyebrow: (appName: string) => `Set up ${appName}`,
    /** The same screen re-opened from Configuration, where it is neither first nor compulsory. */
    guideEyebrow: 'Setup guide',
    progress: (current: number, total: number, label: string) =>
      `Step ${current} of ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'App language',
        title: 'Which language should the app be in?',
        description:
          'Pick the language you read most comfortably. Everything from here on, including this step, follows it.',
      },
      profile: {
        label: 'Profile',
        title: 'Tell us who you are',
        description:
          'Every suggestion is written from this, in your own experience and your own words. It is the one thing the app cannot run without.',
      },
      context: {
        label: 'Job context',
        title: 'What are you interviewing for?',
        description:
          'Optional, and worth the paste: with the job description in hand the assistant answers for that role rather than in general.',
      },
      language: {
        label: 'Language',
        title: 'Pick your interview language',
        description: 'This sets both what gets transcribed and what your suggestions come back in.',
      },
      microphone: {
        label: 'Microphone',
        title: 'Choose your microphone',
        description:
          'Pick the microphone you will actually be speaking into, then test it. Wear headphones during interviews - on speakers the app hears the interviewer through your microphone and goes quiet.',
      },
      mode: {
        label: 'Suggestions',
        title: 'How should suggestions read?',
        description: 'Change your mind at any time, including mid-interview.',
      },
      mockHints: {
        label: 'Mock interview',
        title: 'Hints in a mock interview?',
        description:
          'A mock interview is where you practise against the AI interviewer. This decides whether it hands you the answer as well.',
      },
      zoom: {
        label: 'Size',
        title: 'Is this comfortable to read?',
        description:
          'The interview window is small on purpose, so it does not cover the call. Size it now, while you can take your time over it, rather than mid-question.',
      },
      transcript: {
        label: 'Transcript',
        title: 'One last thing',
        description: 'Whether to keep a live transcript on screen under your suggestions.',
      },
    },

    blocked: {
      accountUnreachable:
        'Your account could not be reached, so nothing typed here can be saved yet.',
      needName: 'Add your full name to continue.',
      needProfile: 'Add your profile to continue.',
    },

    loadingAccount: 'Loading your account…',
    accountUnreachable:
      'Could not reach your account. Nothing typed here can be saved until it comes back.',

    skip: 'Skip for now',
    skipTooltip: 'You can run setup again later from Configuration',

    allSet: 'You are all set',
    profileNotSavedOnSkip: 'Setup skipped, but your profile was not saved. Try again from Account.',
    completionNotRecorded: 'Setup skipped, but we could not record that. It may be offered again.',
    saveProfileFailed: 'Failed to save your profile',
    finishFailed: 'Could not save your setup. Check your connection and try again.',
  },

  configuration: {
    title: 'Configuration',
    setupGuide: {
      title: 'Setup guide',
      description: 'Walk through everything on this page, and your profile, one step at a time.',
      action: 'Run setup',
    },
    hotkeys: {
      title: 'Keyboard shortcuts',
      description: 'Everything you can reach without touching the app during an interview.',
    },
  },

  auth: {
    fields: {
      email: 'Email',
      password: 'Password',
      username: 'Username',
      confirmPassword: 'Confirm Password',
      newPassword: 'New password',
      confirmNewPassword: 'Confirm new password',
      verificationCode: 'Verification code',
      resetCode: 'Reset code',
    },

    signIn: {
      title: 'Sign in',
      description: (appName: string) => `Use your account to access ${appName}`,
      submit: 'Sign in',
      submitting: 'Signing in…',
      rememberMe: 'Remember me',
      noAccount: 'Don’t have account? Create a new one.',
      forgotPassword: 'Forgot your password?',
    },

    signup: {
      title: 'Create account',
      description: (appName: string) => `Register a new account for ${appName}`,
      sendCode: 'Send code',
      sending: 'Sending…',
      haveAccount: 'Already have account? Just login',
      /**
       * Conditional on purpose. The backend answers the same whether or not the address already
       * has an account, so a flat "we sent you a code" is wrong half the time - and saying which
       * happened would put the account enumeration back over the top of the fix.
       */
      codeNotice: (email: string) =>
        `If ${email} does not already have an account, we sent a verification code to it. Paste the code below. If it does, we sent a note explaining how to sign in instead.`,
      verify: 'Verify',
      verifying: 'Verifying…',
      changeEmail: 'Change email',
      resendCode: 'Resend code',
      requestResent: 'Request sent again.',
      resendFailed: 'Failed to resend.',
      create: 'Create account',
      creating: 'Creating…',
      sendCodeFailed: 'Failed to send verification code. Please try again.',
      invalidCode: 'Invalid or expired verification code.',
      succeeded: 'Signup successful! Please login.',
      failed: 'Signup failed. Please try again.',
    },

    reset: {
      title: 'Reset password',
      description: (appName: string) => `Set a new password for your ${appName} account`,
      sendResetCode: 'Send reset code',
      sending: 'Sending…',
      backToSignIn: 'Back to sign in',
      codeNotice: (email: string) =>
        `If an account exists for ${email}, we sent a reset code to it. Paste the code below. It can only be used once, and the email says when it expires.`,
      verify: 'Verify',
      verifying: 'Verifying…',
      changeEmail: 'Change email',
      resendCode: 'Resend code',
      codeResent: 'Reset code resent.',
      resendFailed: 'Could not resend the reset code.',
      signsYouOut: 'Setting a new password signs you out on every device.',
      setNewPassword: 'Set new password',
      saving: 'Saving…',
      done: 'Password reset',
      startOver: 'Start over',
      sendFailed: 'Could not send a reset code. Please try again.',
      verifyFailed: 'Could not verify the reset code.',
      succeeded: 'Password reset. Please sign in with your new password.',
      /** Retrying the same code cannot work, so this sends them for a new one. */
      failed: 'Password reset failed. The code may have expired - request a new one.',
    },

    passwordsDoNotMatch: 'Passwords do not match',

    /**
     * Fallbacks for a failure the backend did not describe. Anything it does send is passed
     * through untranslated - the client cannot translate a string it did not write.
     */
    errors: {
      sendCodeFailed: 'Failed to send verification code',
      invalidCode: 'Invalid or expired verification code',
      loginFailed: 'Login failed',
      signupFailed: 'Signup failed',
      logoutFailed: 'Logout failed',
      changePasswordFailed: 'Change password failed',
      sendResetCodeFailed: 'Failed to send password reset code',
      invalidResetCode: 'Invalid or expired reset code',
      resetFailed: 'Password reset failed',
    },
  },

  home: {
    welcome: (firstName: string) => `Welcome back, ${firstName}`,
    welcomeAnonymous: 'Welcome back',
    subtitle: 'Practise against an AI interviewer, or get live help during a real call.',

    mock: {
      title: 'Start mock interview',
      ready: 'The AI asks, you answer out loud, and you get a scored report at the end.',
      unsupported: 'Not available on this server yet. Update the app, or try again later.',
      liveRunning: 'Stop the live assistant first - the two cannot share your microphone.',
      unaffordable: (price: number) =>
        `Not enough credits - the shortest mock costs ${price}. Buy more to practise.`,
    },

    live: {
      title: 'Start live assistant',
      resumeTitle: 'Back to your interview',
      ready: 'Transcribes your real interview and suggests answers as it happens.',
      running: 'Your live assistant is already running.',
      mockRunning: 'Finish the mock interview first - the two cannot share your microphone.',
    },

    accountLabel: 'Account',
    notSignedIn: 'Not signed in',
    creditsLabel: 'Credits',
    creditsUnavailable: 'Unavailable',
    buyCredits: 'Buy Credits',

    nav: {
      account: 'Account',
      configuration: 'Configuration',
      documentation: 'Documentation',
    },

    signOut: 'Sign out',
    signingOut: 'Signing out…',
    signOutBlocked: 'Stop the interview before signing out',
    signOutFailed: 'Failed to sign out',
  },

  account: {
    title: 'Account',
    signedInAs: 'Signed in as',
    password: {
      title: 'Password',
      description: 'Change your account password',
      action: 'Change Password',
    },
    loadFailed: 'Could not load your saved details. Reconnect before editing.',
    save: 'Save Changes',
    saving: 'Saving…',
    saved: 'Account details saved',
    saveFailed: 'Failed to save your account details',
  },

  profileFields: {
    fullName: 'Full name',
    fullNamePlaceholder: 'The name you go by in the interview',
    profile: 'Profile',
    profilePlaceholder:
      'Paste your CV/resume, LinkedIn profile, or a short bio. Suggestions are written from this, so more detail means answers that sound like you.',
    context: 'Context',
    contextPlaceholder:
      'Paste the job description, the role requirements, or anything else about the interview you are preparing for.',
    limitReached: (max: number) =>
      `Character limit reached (${max.toLocaleString()}). Extra text was not added.`,
    charactersLeft: (remaining: number) => `${remaining.toLocaleString()} characters left`,
  },

  microphoneField: {
    label: 'Microphone',
    noDevices: 'No microphone was detected. Connect one and it will appear here.',
    selectPlaceholder: 'Select a microphone',
    lookingPlaceholder: 'Looking for microphones…',
    test: 'Test',
    stopTest: 'Stop test',
    openFailed:
      'Could not open this microphone. Check it is connected and that no other app is using it.',
    notConnected: (deviceName: string) =>
      `“${deviceName}” is not connected any more. Pick another microphone.`,
    saySomething: 'Say something - the bar should move while you speak.',
    runningHint: 'The interview is using this microphone. Testing is available once it stops.',
    testHint:
      'Test it before your interview - a silent microphone looks exactly like a quiet room.',
  },

  micLevelMeter: {
    label: 'Microphone input level',
    hearing: 'Hearing you',
    silent: 'Silent',
  },

  suggestionModeField: {
    label: 'Suggestion style',
    hintOnly: 'Hint-only',
    hintOnlyDescription:
      'A headline and keyword bullets you can read at a glance while you keep talking. Recommended.',
    fullSentences: 'Full sentences',
    fullSentencesDescription:
      'The answer written out the way it would be spoken. More to read, less to improvise.',
    switchHint: (combo: string) => `Switchable mid-interview from the control bar or ${combo}.`,
  },

  zoomField: {
    label: 'Interface size',
    smaller: 'Smaller',
    larger: 'Larger',
    reset: 'Reset',
    description: (combo: string) =>
      `Scales the whole app. The interview window is small on purpose - this is how you make the suggestions readable at a glance. Also on ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Show the transcript panel',
    description: (combo: string) =>
      `Keeps a live transcript docked under your suggestions. Turn it off for more room to read them. Toggle any time with ${combo}.`,
  },

  mockHintsField: {
    label: 'Show hints in mock interviews',
    description:
      'Puts what the live assistant would have answered beside each mock interview question, so you can compare it against your own. Turn it off to answer unaided - either way, you can switch it mid-session from the mock interview bar. This changes nothing about a real interview.',
  },

  languageField: {
    label: 'Interview language',
    /** Shown inside each item for a language Deepgram's Aura TTS cannot speak. */
    textOnly: 'text only',
    reconnectFailed:
      'Suggestions switched language, but transcription is still reconnecting. Stop and start the assistant if it does not come back.',
    description: 'What is transcribed, and what your suggestions come back in.',
    noVoiceNotice:
      'The interviewer will write its questions instead of speaking them. You still answer out loud, and the scoring is the same.',
  },

  changePassword: {
    title: 'Change Password',
    description: 'Enter your current password and choose a new one.',
    current: 'Current Password',
    currentPlaceholder: 'Enter current password',
    next: 'New Password',
    nextPlaceholder: 'Enter new password',
    confirm: 'Confirm New Password',
    confirmPlaceholder: 'Confirm new password',
    submit: 'Change Password',
    submitting: 'Changing…',
    mismatch: 'The new passwords do not match.',
    succeeded: 'Password changed successfully',
    failed: 'Failed to change password',
  },

  hotkeys: {
    dialogTitle: 'Keyboard Shortcuts',
    dialogDescription: 'Everything you can reach without touching the app during an interview.',

    groups: {
      general: 'General',
      window: 'Window Management',
      panels: 'Scroll Panels',
      triggered: 'Triggered Suggestions',
    },

    /**
     * Keyed by the `Hotkey` enum. The combos stay in `lib/hotkeys.ts`, which is where the
     * platform decides between `Ctrl+Shift+` and `⌃⌥` - a key name is notation rather
     * than prose and does not translate.
     */
    keys: {
      StopAll: { title: 'Stop All', description: 'Stop assistant and exit stealth mode' },
      ToggleStealth: {
        title: 'Toggle Stealth',
        description:
          'Hide from screen capture during a live interview. The same keys bring it back.',
      },
      Opacity: { title: 'Toggle Opacity', description: 'Toggle window opacity in stealth mode' },
      ToggleTranscript: {
        title: 'Toggle Transcription',
        description: 'Show or hide the transcription dock - works in stealth mode too',
      },
      ToggleSuggestionMode: {
        title: 'Hint-only / Full-sentence',
        description:
          'Switch suggestions between hint-only - a headline plus keyword bullets you can read at a glance - and full sentences. Works in stealth mode too.',
      },
      PlaceWin: {
        title: 'Place Window',
        description: 'Place window in a specific corner, side, or center',
      },
      MoveWin: { title: 'Move Window', description: 'Move window in the specified direction' },
      ResizeWin: {
        title: 'Resize Window',
        description: 'Resize window in the specified direction',
      },
      ZoomInOutReset: {
        title: 'Zoom In/Out/Reset',
        description: 'Adjust or reset UI zoom level',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Scroll Live Panel',
        description: 'Scroll Down/Up/End in the live suggestions panel',
      },
      ScrollActionSuggestionPanel: {
        title: 'Scroll Triggered Panel',
        description: 'Scroll Down/Up/End in the triggered suggestions panel',
      },
      Capture: {
        title: 'Capture Screen',
        description: 'Take a screenshot for triggered suggestions',
      },
      ClearCaptures: { title: 'Clear Captures', description: 'Clear captured screenshots' },
      TriggerWithoutCaptures: {
        title: 'Trigger without Captures',
        description: 'Generate suggestion without captures',
      },
      TriggerWithCaptures: {
        title: 'Trigger with Captures',
        description:
          'Generate suggestion referencing screen captures. If no captures exist, attempts to take one before generating.',
      },
    },
  },

  inputPassword: {
    show: 'Show password',
    hide: 'Hide password',
  },

  titlebar: {
    openCommandPalette: 'Open command palette',
    searchActions: 'Search actions',
    unavailableDuringInterview: 'Unavailable during an interview',
    menu: 'Menu',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',
  },

  titlebarMenu: {
    home: 'Home',
    account: 'Account',
    configuration: 'Configuration',
    documentation: 'Documentation',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    signOut: 'Sign out',
  },

  commandPalette: {
    title: 'Command Palette',
    description: 'Search for an action, page, or setting.',
    searchPlaceholder: 'Search actions…',
    empty: 'No matching action.',
    groups: {
      goTo: 'Go to',
      session: 'Session',
      app: 'App',
    },
    home: 'Home',
    account: 'Account',
    configuration: 'Configuration',
    buyCredits: 'Buy Credits',
    startMock: 'Start mock interview',
    startLive: 'Start live assistant',
    switchToFullSentence: 'Switch to full-sentence mode',
    switchToHintOnly: 'Switch to hint-only mode',
    hideTranscript: 'Hide Transcript',
    showTranscript: 'Show Transcript',
    documentation: 'Documentation',
    hotkeys: 'Keyboard Shortcuts',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    signOut: 'Sign Out',
  },

  controlPanel: {
    stop: 'Stop',
    stopTooltip: 'Stop the assistant',
    stopRunningHint: 'Ends the session, offers to save it, and returns home',
    stopIdleHint: 'Nothing is running - start an interview from the home screen',
    stopTransientHint: 'Available once the session is running',

    /** Why a start was refused, named after the thing that is missing. */
    checks: {
      configUnavailable:
        'Could not load your saved configuration. Reconnecting - try again in a moment.',
      nameMissing: 'Full name is not set',
      profileMissing: 'Profile data is not set',
      noMicrophone: 'No microphone was detected. Connect one and try again.',
      deviceNotFound: (deviceName: string) => `Audio input device "${deviceName}" is not found`,
    },
    startFailed: 'Failed to start assistant',
  },

  audioGroup: {
    options: 'Audio options',
    optionsSwapFailed: 'Audio options - could not switch microphone, still using the previous one',
    optionsDeviceNotFound: 'Audio options - the selected microphone was not found',
    dialogTitle: 'Audio Options',
    dialogDescription: 'Select physical microphone that you use.',
    microphone: 'Microphone',
    selectPlaceholder: 'Select microphone',
    switching: 'Switching microphone…',
    swapFailed: (deviceName: string) =>
      `Could not switch to ${deviceName}. This interview is still using the previous microphone. Stop and start the assistant to use it.`,
    takesEffectImmediately: 'Takes effect immediately. Transcription keeps running.',
  },

  languageGroup: {
    current: (languageName: string) => `Interview language: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Interview language: ${languageName} - transcription did not switch`,
    tooltip: (nativeName: string) => `Interview Language: ${nativeName}`,
    reconnecting: 'Reconnecting transcription…',
    suggestionsOnly: 'Suggestions only - transcription is still reconnecting',
    speechAndSuggestions: 'Speech recognition and suggestions',
    menuLabel: 'Interview language',
    halfApplied:
      'Suggestions moved, transcription did not. It is still retrying - stop and start the assistant if it does not come back.',
    willReconnect: 'Transcription reconnects; the current sentence may be cut short.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Hint-only',
    fullSentencesBadge: 'Full sentences',
    hintOnlyMode: 'Hint-only mode',
    fullSentenceMode: 'Full-sentence mode',
    hintOnlySummary: 'Headline + keyword bullets',
    fullSentenceSummary: 'Answers written out in full',
    ariaHintOnly: 'Suggestion mode: hint-only. Switch to full sentences',
    ariaFullSentence: 'Suggestion mode: full sentences. Switch to hint-only',
  },

  toolsGroup: {
    hideTranscription: 'Hide Transcription',
    showTranscription: 'Show Transcription',
    enterStealth: 'Enter stealth mode',
    stealthMode: 'Stealth Mode',
    stealthUnavailable:
      'Available once the live interview is running - there is nothing to hide from yet.',
    stealthAvailable: 'Hides the app from screen capture. The same shortcut brings it back.',
    captureScreenshot: 'Capture screenshot',
    captureScreenshotTooltip: 'Capture Screenshot',
    captureFailed: 'Failed to capture screenshot',
    clearCaptures: 'Clear captured screenshots',
    clearCapturesTooltip: 'Clear Captures',
    clearCapturesFailed: 'Failed to clear captures',
    generateSuggestion: 'Generate triggered suggestion',
    generateSuggestionTooltip: 'Generate Suggestion',
    generateSuggestionFailed: 'Failed to generate suggestion',
    clear: 'Clear',
    clearInterview: 'Clear the interview',
    clearFailed: 'Failed to clear',
    exportInterview: 'Export Interview',
    exportTheInterview: 'Export the interview',
    nothingToExport: 'There is nothing to export yet',
    nothingToExportDescription:
      'Run an interview first, then export the transcript and suggestions.',
    exportFailed: 'Failed to export interview',
    exportDocx: 'Word Document (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Transcript',
    transcriptionShown: (combo: string) => `Transcription: Shown (${combo})`,
    transcriptionHidden: (combo: string) => `Transcription: Hidden (${combo})`,
    showHotkeys: 'Show Hotkeys',
    showHotkeysLabel: 'Show keyboard shortcuts',
    showHotkeysTitle: 'Show keyboard shortcuts (?)',
  },

  runningIndicator: {
    idle: 'Idle',
    starting: 'Starting',
    running: 'Running',
    stopping: 'Stopping',
  },

  zoomControl: {
    reset: 'Reset zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
  },

  creditsDisplay: {
    trialPlan: 'Trial Plan',
    paidPlan: 'Paid Plan',
    summary: (credits: number, availableTime: string) =>
      `${credits.toLocaleString()} credits - ${availableTime}`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
      return parts.join(' ') || '0 mins';
    },
    lessThanAMinute: 'Less than 1 min',
    noCreditsLeft: 'No credits left',
  },

  panels: {
    autoScroll: 'Auto-scroll',
    enableAutoScroll: 'Enable auto-scroll',
    scrollToBottom: 'Scroll to bottom',
    scrollToTop: 'Scroll to top',

    transcription: 'Transcription',
    noTranscripts: 'No transcripts yet',
    interviewer: 'Interviewer',

    liveSuggestions: 'Live Suggestions',
    noSuggestions: 'No suggestions yet',
    idleNoGeneration: 'Idle - no generation yet',

    triggeredSuggestions: 'Triggered Suggestions',
    noTriggeredSuggestions: 'No action suggestions yet',
    suggestionCanceled: 'Suggestion canceled',

    mockInterview: 'Mock Interview',
    questionProgress: (current: number, total: number) => `Question ${current} of ${total}`,
    preparingFirstQuestion: 'Preparing your first question…',
    /** Fallback for the candidate's own name in the speaker column before the account loads. */
    you: 'You',
    followUp: 'Follow-up',
    skipped: 'Skipped',
    noAnswer: 'No answer',

    resizeTranscript: 'Resize transcription panel',
    resizeHint: 'Drag to resize, double-click to reset',
  },

  saveHistory: {
    saveAsWord: 'Save as Word',
    saveAsMarkdown: 'Save as Markdown',
    formatHintLive: 'Word to share or print, Markdown to keep as plain text.',
    formatHintMock: 'Word to share or print, Markdown to keep alongside your notes.',
    exportFailed: 'Failed to export interview',

    /**
     * One entry per reason, and the action is named on the button that goes through with it:
     * "Discard" alone is the same word for four different losses.
     */
    live: {
      clear: {
        title: 'Save this interview before clearing?',
        body: 'Clearing drops the transcript and the suggestions from this session, and nothing is written to disk until you export.',
        discard: 'Clear without saving',
      },
      start: {
        title: 'Save this interview before starting a new one?',
        body: 'Starting a session drops the transcript and the suggestions from the last one, and nothing is written to disk until you export.',
        discard: 'Start without saving',
      },
      close: {
        title: 'Save this interview before closing?',
        body: 'Closing drops the transcript and the suggestions from this session, and nothing is written to disk until you export.',
        discard: 'Close without saving',
      },
      update: {
        title: 'Save this interview before installing the update?',
        body: 'Installing restarts the app and drops the transcript and the suggestions from this session, and nothing is written to disk until you export.',
        discard: 'Install without saving',
      },
      signout: {
        title: 'Save this interview before signing out?',
        body: 'Signing out drops the transcript and the suggestions from this session, and nothing is written to disk until you export.',
        discard: 'Sign out without saving',
      },
      stop: {
        title: 'Save this interview?',
        body: 'Your interview has ended. The transcript and the suggestions are dropped from here, and nothing has been written to disk.',
        discard: 'Discard and go home',
      },
      'mock-done': {
        title: 'Save your report before you finish?',
        body: 'Your score, the feedback and every answer you gave exist only in this app until you save them to a file.',
        discard: 'Finish without saving',
      },
      'mock-again': {
        title: 'Save this report before the next round?',
        body: 'Practising again starts a fresh interview and replaces this score, its feedback and the answers behind it.',
        discard: 'Practise again without saving',
      },
    },

    /** What the same reasons say when the thing at risk is a mock report. */
    mock: {
      clear: {
        title: 'Save your mock interview report first?',
        body: 'Clearing drops this report and the answers behind it, and nothing is written to disk until you save.',
        discard: 'Clear without saving',
      },
      start: {
        title: 'Save your mock interview report first?',
        body: 'Starting a session replaces this report and the answers behind it, and nothing is written to disk until you save.',
        discard: 'Start without saving',
      },
      close: {
        title: 'Save your mock interview report before closing?',
        body: 'This report and the answers behind it exist only in this app, and closing drops them.',
        discard: 'Close without saving',
      },
      update: {
        title: 'Save your mock interview report before installing the update?',
        body: 'Installing restarts the app, which drops this report and the answers behind it.',
        discard: 'Install without saving',
      },
      signout: {
        title: 'Save your mock interview report before signing out?',
        body: 'Signing out drops this report and the answers behind it, and nothing has been written to disk.',
        discard: 'Sign out without saving',
      },
      stop: {
        title: 'Save your mock interview report?',
        body: 'The interview has ended. This report and the answers behind it are dropped from here, and nothing has been written to disk.',
        discard: 'Discard and go home',
      },
    },
  },

  headphoneNotice: {
    title: 'Put your headphones on',
    description: "This session needs the interviewer's voice going to your ears only.",
    liveSpeakers: 'On speakers, your microphone hears the interviewer as well as you do.',
    /** The failure is the quiet one, so it is named rather than left as "quality issues". */
    liveConsequence:
      'The app then reads their question as something you said, and stops answering it - with no error to tell you why.',
    mockSpeakers:
      'On speakers, the question you just heard can echo into the start of your answer.',
    mockConsequence:
      'Your mic is muted while the interviewer speaks, but room reverb after it stops can still slip in as stray words.',
    proceed: 'My headphones are on',
  },

  permissionGate: {
    title: 'Permissions Required',
    microphone: 'Microphone',
    micChecking: 'Checking…',
    micGranted: 'Access granted',
    micBlocked: 'Enable in System Settings, then click Check Again',
    micRequired: 'Required to capture your voice',
    grantAccess: 'Grant Access',
    openSettings: 'Open Settings',
    screenRecording: 'Screen Recording',
    screenChecking: 'Checking…',
    screenNeedsRelaunch: 'Granted - restart the app to apply before starting',
    screenGranted: 'Access granted',
    screenNotDetermined: 'Will be requested when recording starts',
    screenBlocked: 'Enable in System Settings, then restart the app to apply',
    restartApp: 'Restart App',
    checking: 'Checking…',
    checkAgain: 'Check Again',
    start: 'Start',
  },

  exportToast: {
    exported: (format: string) => `Interview exported as ${format}`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'Open the exported file',
    openFile: 'Open file',
    showInFolderLabel: 'Show the exported file in its folder',
    showInFolder: 'Show in folder',
    dismiss: 'Dismiss',
  },

  notices: {
    connecting: 'Connecting to server…',
    starting: 'Starting…',
    stopping: 'Stopping…',
    dismiss: 'Dismiss',
  },

  updateNotification: {
    available: (version: string) => `Update Available: v${version}`,
    availableDescription: 'Download will start automatically in the background.',
    downloading: (percent: string) => `Downloading update… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `Update Downloaded: v${version}`,
    downloadedDescriptionMac: 'Click to open the installer, then drag it into Applications.',
    downloadedDescription: 'Click to restart and install the update.',
    openInstaller: 'Open Installer',
    restartNow: 'Restart Now',
  },
};

export type Translation = typeof en;
