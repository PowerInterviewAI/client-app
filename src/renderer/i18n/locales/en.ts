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
};

export type Translation = typeof en;
