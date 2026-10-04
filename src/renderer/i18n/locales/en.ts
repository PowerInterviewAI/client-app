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
};

export type Translation = typeof en;
