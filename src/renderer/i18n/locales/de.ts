/**
 * German.
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here, and the register is "du", which most German consumer software now uses.
 * German runs long; the two fixed-width slots `ui-language.test.mjs` checks are the ones to
 * watch when editing.
 */
import type { Translation } from './en';

const n = (count: number, one: string, other: string) => (count === 1 ? one : other);

export const de: Translation = {
  common: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    back: 'Zurück',
    continue: 'Weiter',
    finish: 'Fertig',
    retry: 'Erneut versuchen',
    view: 'Ansehen',
    loading: 'Wird geladen…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'App-Sprache',
    description: 'Schaltflächen, Menüs und Meldungen. Unabhängig von der Interviewsprache.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `${appName} einrichten`,
    guideEyebrow: 'Einrichtungsassistent',
    progress: (current: number, total: number, label: string) =>
      `Schritt ${current} von ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'App-Sprache',
        title: 'In welcher Sprache soll die App sein?',
        description: 'Wähle die, die du am leichtesten liest. Der Rest der Einrichtung folgt ihr.',
      },
      profile: {
        label: 'Profil',
        title: 'Erzähl uns, wer du bist',
        description: 'Vorschläge entstehen aus deiner Erfahrung, deshalb ist das Pflicht.',
      },
      context: {
        label: 'Stellenkontext',
        title: 'Wofür ist das Interview?',
        description:
          'Optional. Füge die Stellenbeschreibung ein, damit die Antworten zur Rolle passen.',
      },
      language: {
        label: 'Sprache',
        title: 'Wähle deine Interviewsprache',
      },
      microphone: {
        label: 'Mikrofon',
        title: 'Wähle dein Mikrofon',
        description:
          'Wähle das Mikrofon, in das du sprichst, und teste es. Nutze Kopfhörer - über Lautsprecher kann die App aufhören zu antworten.',
      },
      mode: {
        label: 'Vorschläge',
        title: 'Wie sollen Vorschläge aussehen?',
      },
      mockHints: {
        label: 'Probeinterview',
        title: 'Hinweise im Probeinterview?',
      },
      zoom: {
        label: 'Größe',
        title: 'Lässt sich das gut lesen?',
      },
      transcript: {
        label: 'Transkript',
        title: 'Ein Live-Transkript anzeigen?',
      },
    },

    blocked: {
      accountUnreachable:
        'Dein Konto ist nicht erreichbar, daher kann hier noch nichts gespeichert werden.',
      needName: 'Gib deinen vollständigen Namen ein, um fortzufahren.',
      needProfile: 'Füge dein Profil hinzu, um fortzufahren.',
    },

    loadingAccount: 'Dein Konto wird geladen…',
    accountUnreachable:
      'Dein Konto ist nicht erreichbar. Was du hier eingibst, kann erst gespeichert werden, wenn es wieder da ist.',

    skip: 'Vorerst überspringen',
    skipTooltip: 'Du kannst die Einrichtung später unter Einstellungen erneut starten',

    allSet: 'Alles bereit',
    profileNotSavedOnSkip:
      'Einrichtung übersprungen, aber dein Profil wurde nicht gespeichert. Versuche es unter Konto erneut.',
    completionNotRecorded:
      'Einrichtung übersprungen, aber das konnten wir nicht speichern. Sie wird eventuell erneut angeboten.',
    saveProfileFailed: 'Dein Profil konnte nicht gespeichert werden',
    finishFailed:
      'Deine Einrichtung konnte nicht gespeichert werden. Prüfe deine Verbindung und versuche es erneut.',
  },

  configuration: {
    title: 'Einstellungen',
    sections: {
      general: 'Allgemein',
      interview: 'Vorstellungsgespräch',
      display: 'Anzeige',
      window: 'Fenster & Datenschutz',
      help: 'Hilfe',
    },
    setupGuide: {
      title: 'Einrichtungsassistent',
      description: 'Geh alles auf dieser Seite und dein Profil Schritt für Schritt durch.',
      action: 'Einrichtung starten',
    },
    hotkeys: {
      title: 'Tastenkürzel',
      description: 'Alles, was du im Interview erreichst, ohne die App anzufassen.',
    },
  },

  auth: {
    fields: {
      email: 'E-Mail',
      password: 'Passwort',
      username: 'Benutzername',
      confirmPassword: 'Passwort bestätigen',
      newPassword: 'Neues Passwort',
      confirmNewPassword: 'Neues Passwort bestätigen',
      verificationCode: 'Bestätigungscode',
      resetCode: 'Code zum Zurücksetzen',
    },

    signIn: {
      title: 'Anmelden',
      description: (appName: string) => `Melde dich mit deinem Konto bei ${appName} an`,
      submit: 'Anmelden',
      submitting: 'Anmeldung läuft…',
      rememberMe: 'Angemeldet bleiben',
      noAccount: 'Noch kein Konto? Erstelle eins.',
      forgotPassword: 'Passwort vergessen?',
    },

    signup: {
      title: 'Konto erstellen',
      description: (appName: string) => `Registriere ein neues Konto für ${appName}`,
      sendCode: 'Code senden',
      sending: 'Wird gesendet…',
      haveAccount: 'Schon ein Konto? Einfach anmelden',
      codeNotice: (email: string) =>
        `Falls ${email} noch kein Konto hat, haben wir einen Bestätigungscode dorthin geschickt. Füge ihn unten ein. Falls doch, haben wir stattdessen eine Anleitung zur Anmeldung geschickt.`,
      verify: 'Bestätigen',
      verifying: 'Wird bestätigt…',
      changeEmail: 'E-Mail ändern',
      resendCode: 'Code erneut senden',
      requestResent: 'Anfrage erneut gesendet.',
      resendFailed: 'Erneutes Senden fehlgeschlagen.',
      create: 'Konto erstellen',
      creating: 'Wird erstellt…',
      sendCodeFailed: 'Bestätigungscode konnte nicht gesendet werden. Bitte versuche es erneut.',
      invalidCode: 'Ungültiger oder abgelaufener Bestätigungscode.',
      succeeded: 'Registrierung erfolgreich! Bitte melde dich an.',
      failed: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    },

    reset: {
      title: 'Passwort zurücksetzen',
      description: (appName: string) => `Lege ein neues Passwort für dein ${appName}-Konto fest`,
      sendResetCode: 'Code senden',
      sending: 'Wird gesendet…',
      backToSignIn: 'Zurück zur Anmeldung',
      codeNotice: (email: string) =>
        `Falls es ein Konto für ${email} gibt, haben wir einen Code zum Zurücksetzen dorthin geschickt. Füge ihn unten ein. Er gilt nur einmal, und in der E-Mail steht, wann er abläuft.`,
      verify: 'Bestätigen',
      verifying: 'Wird bestätigt…',
      changeEmail: 'E-Mail ändern',
      resendCode: 'Code erneut senden',
      codeResent: 'Code erneut gesendet.',
      resendFailed: 'Der Code konnte nicht erneut gesendet werden.',
      signsYouOut: 'Ein neues Passwort meldet dich auf allen Geräten ab.',
      setNewPassword: 'Neues Passwort festlegen',
      saving: 'Wird gespeichert…',
      done: 'Passwort zurückgesetzt',
      startOver: 'Von vorn beginnen',
      sendFailed: 'Der Code konnte nicht gesendet werden. Bitte versuche es erneut.',
      verifyFailed: 'Der Code konnte nicht bestätigt werden.',
      succeeded: 'Passwort zurückgesetzt. Bitte melde dich mit dem neuen Passwort an.',
      failed:
        'Zurücksetzen fehlgeschlagen. Der Code ist vielleicht abgelaufen - fordere einen neuen an.',
    },

    passwordsDoNotMatch: 'Die Passwörter stimmen nicht überein',

    errors: {
      sendCodeFailed: 'Bestätigungscode konnte nicht gesendet werden',
      invalidCode: 'Ungültiger oder abgelaufener Bestätigungscode',
      loginFailed: 'Anmeldung fehlgeschlagen',
      signupFailed: 'Registrierung fehlgeschlagen',
      logoutFailed: 'Abmeldung fehlgeschlagen',
      changePasswordFailed: 'Passwort konnte nicht geändert werden',
      sendResetCodeFailed: 'Code zum Zurücksetzen konnte nicht gesendet werden',
      invalidResetCode: 'Ungültiger oder abgelaufener Code zum Zurücksetzen',
      resetFailed: 'Zurücksetzen des Passworts fehlgeschlagen',
    },
  },

  home: {
    welcome: (firstName: string) => `Willkommen zurück, ${firstName}`,
    welcomeAnonymous: 'Willkommen zurück',
    subtitle: 'Übe mit einem KI-Interviewer oder hol dir Live-Hilfe in einem echten Gespräch.',

    mock: {
      title: 'Probeinterview starten',
      ready: 'Die KI fragt, du antwortest laut und bekommst am Ende einen bewerteten Bericht.',
      unsupported:
        'Auf diesem Server noch nicht verfügbar. Aktualisiere die App oder versuche es später.',
      liveRunning:
        'Beende zuerst den Live-Assistenten - beide können sich das Mikrofon nicht teilen.',
      unaffordable: 'Nicht genug Gratiszeit übrig. Abonniere, um weiter zu üben.',
    },

    live: {
      title: 'Live-Assistent starten',
      resumeTitle: 'Zurück zu deinem Interview',
      ready: 'Transkribiert dein echtes Interview und schlägt dabei Antworten vor.',
      running: 'Dein Live-Assistent läuft bereits.',
      mockRunning:
        'Beende zuerst das Probeinterview - beide können sich das Mikrofon nicht teilen.',
      unaffordable: 'Nicht genug Gratiszeit übrig. Abonniere, um weitere Interviews zu führen.',
    },

    planLabel: 'Tarif',
    planUnavailable: 'Nicht verfügbar',
    subscribe: 'Abonnement',

    signOutFailed: 'Abmeldung fehlgeschlagen',
  },

  account: {
    title: 'Konto',
    completeness: {
      title: (done: number, total: number) => `Profil: ${done} von ${total} ausgefüllt`,
      complete: 'Profil vollständig',
      hint: 'Vorschläge basieren auf deinem Profil und der Stelle. Je mehr du angibst, desto mehr klingen sie nach dir.',
    },
    signedInAs: 'Angemeldet als',
    password: {
      title: 'Passwort',
      description: 'Ändere das Passwort deines Kontos',
      action: 'Passwort ändern',
    },
    loadFailed:
      'Deine gespeicherten Daten konnten nicht geladen werden. Verbinde dich neu, bevor du sie bearbeitest.',
    save: 'Änderungen speichern',
    saving: 'Wird gespeichert…',
    saved: 'Kontodaten gespeichert',
    saveFailed: 'Kontodaten konnten nicht gespeichert werden',
  },

  profileFields: {
    fullName: 'Vollständiger Name',
    fullNamePlaceholder: 'Der Name, unter dem du im Interview auftrittst',
    profile: 'Profil',
    profileKinds: 'Lebenslauf, LinkedIn-Profil usw.',
    profilePlaceholder:
      'Füge deinen Lebenslauf, dein LinkedIn-Profil oder eine kurze Vorstellung ein. Die Vorschläge entstehen daraus - je mehr Details, desto mehr klingen die Antworten nach dir.',
    context: 'Kontext',
    contextKinds: 'Stellenbeschreibung, Gesprächsverlauf, Anschreiben usw.',
    contextPlaceholder:
      'Füge die Stellenbeschreibung, die Anforderungen der Rolle oder alles andere zum Interview ein, auf das du dich vorbereitest.',
    limitReached: (max: number) =>
      `Zeichenlimit erreicht (${max.toLocaleString('de-DE')}). Weiterer Text wurde nicht übernommen.`,
    charactersLeft: (remaining: number) => `Noch ${remaining.toLocaleString('de-DE')} Zeichen`,
  },

  microphoneField: {
    label: 'Mikrofon',
    noDevices: 'Kein Mikrofon erkannt. Schließ eines an, dann erscheint es hier.',
    selectPlaceholder: 'Mikrofon auswählen',
    lookingPlaceholder: 'Mikrofone werden gesucht…',
    test: 'Testen',
    stopTest: 'Test beenden',
    openFailed:
      'Dieses Mikrofon konnte nicht geöffnet werden. Prüfe, ob es angeschlossen ist und keine andere App es nutzt.',
    notConnected: (deviceName: string) =>
      `„${deviceName}“ ist nicht mehr angeschlossen. Wähle ein anderes Mikrofon.`,
    saySomething: 'Sag etwas - der Balken sollte sich beim Sprechen bewegen.',
    runningHint: 'Das Interview nutzt dieses Mikrofon. Testen geht, sobald es beendet ist.',
    testHint:
      'Teste es vor dem Interview - ein stummes Mikrofon sieht genauso aus wie ein ruhiger Raum.',
  },

  micLevelMeter: {
    label: 'Eingangspegel des Mikrofons',
    hearing: 'Ich höre dich',
    silent: 'Stille',
  },

  suggestionModeField: {
    label: 'Stil der Vorschläge',
    hintOnly: 'Nur Stichpunkte',
    hintOnlyDescription: 'Eine Überschrift und Stichworte zum schnellen Erfassen. Empfohlen.',
    fullSentences: 'Ganze Sätze',
    fullSentencesDescription:
      'Die vollständige Antwort, so ausformuliert, wie du sie sagen würdest.',
    switchHint: (combo: string) =>
      `Im Interview über die Steuerleiste oder mit ${combo} umschaltbar.`,
  },

  zoomField: {
    label: 'Größe der Oberfläche',
    smaller: 'Kleiner',
    larger: 'Größer',
    reset: 'Zurücksetzen',
    description: (combo: string) => `Skaliert die ganze App. Auch mit ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Transkript-Bereich anzeigen',
    description: (combo: string) =>
      `Live-Transkript unter deinen Vorschlägen. Umschalten mit ${combo}.`,
  },

  hideTaskbarField: {
    label: 'Taskleistensymbol während Live-Interviews ausblenden',
    description:
      'Hält das Fenster im Vordergrund (unter macOS verschwindet auch das Dock-Symbol). Es lässt sich nicht minimieren - starte die App neu, falls es verloren geht.',
  },
  allowScreenCaptureField: {
    label: 'Bildschirmaufnahme erlauben',
    description:
      'Lässt Bildschirmfreigaben und Aufnahmen das App-Fenster sehen. Der Tarnmodus verbirgt es immer.',
  },
  mockHintsField: {
    label: 'Hinweise in Probeinterviews anzeigen',
    description: 'Zeigt die Antwort des Assistenten neben jeder Frage, zum Vergleich mit deiner.',
  },

  languageField: {
    label: 'Interviewsprache',
    textOnly: 'nur Text',
    reconnectFailed:
      'Die Vorschläge haben die Sprache gewechselt, die Transkription verbindet sich aber noch neu. Beende und starte den Assistenten, falls sie nicht zurückkommt.',
    description: 'Was transkribiert wird und in welcher Sprache deine Vorschläge kommen.',
    noVoiceNotice:
      'Der Interviewer schreibt seine Fragen, statt sie zu sprechen. Du antwortest weiterhin laut, und die Bewertung bleibt gleich.',
  },

  changePassword: {
    title: 'Passwort ändern',
    description: 'Gib dein aktuelles Passwort ein und wähle ein neues.',
    current: 'Aktuelles Passwort',
    currentPlaceholder: 'Aktuelles Passwort eingeben',
    next: 'Neues Passwort',
    nextPlaceholder: 'Neues Passwort eingeben',
    confirm: 'Neues Passwort bestätigen',
    confirmPlaceholder: 'Neues Passwort bestätigen',
    submit: 'Passwort ändern',
    submitting: 'Wird geändert…',
    mismatch: 'Die neuen Passwörter stimmen nicht überein.',
    succeeded: 'Passwort erfolgreich geändert',
    failed: 'Passwort konnte nicht geändert werden',
  },

  hotkeys: {
    dialogTitle: 'Tastenkürzel',
    dialogDescription: 'Alles, was du im Interview erreichst, ohne die App anzufassen.',

    groups: {
      general: 'Allgemein',
      window: 'Fensterverwaltung',
      panels: 'Bereiche scrollen',
      triggered: 'Vorschläge auf Abruf',
    },

    keys: {
      StopAll: {
        title: 'Alles stoppen',
        description: 'Stoppt den Assistenten und beendet den Tarnmodus',
      },
      ToggleStealth: {
        title: 'Tarnmodus',
        description:
          'Verbirgt die App während eines Live-Interviews vor der Bildschirmaufnahme. Dieselben Tasten holen sie zurück.',
      },
      Opacity: {
        title: 'Deckkraft',
        description: 'Schaltet die Deckkraft des Fensters im Tarnmodus um',
      },
      ToggleTranscript: {
        title: 'Transkript ein/aus',
        description: 'Blendet den Transkript-Bereich ein oder aus - auch im Tarnmodus',
      },
      ToggleSuggestionMode: {
        title: 'Stichpunkte / Ganze Sätze',
        description:
          'Wechselt die Vorschläge zwischen Stichpunkten (eine Überschrift mit Stichworten zum schnellen Erfassen) und ganzen Sätzen. Auch im Tarnmodus.',
      },
      PlaceWin: {
        title: 'Fenster platzieren',
        description: 'Setzt das Fenster in eine Ecke, an eine Seite oder in die Mitte',
      },
      MoveWin: {
        title: 'Fenster verschieben',
        description: 'Verschiebt das Fenster in die gewählte Richtung',
      },
      ResizeWin: {
        title: 'Fenstergröße ändern',
        description: 'Ändert die Fenstergröße in die gewählte Richtung',
      },
      ZoomInOutReset: {
        title: 'Zoom vergrößern/verkleinern/zurücksetzen',
        description: 'Passt den Zoom der Oberfläche an oder setzt ihn zurück',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Live-Bereich scrollen',
        description: 'Scrollt im Bereich der Live-Vorschläge nach unten, oben oder ans Ende',
      },
      ScrollActionSuggestionPanel: {
        title: 'Abruf-Bereich scrollen',
        description: 'Scrollt im Bereich der Vorschläge auf Abruf nach unten, oben oder ans Ende',
      },
      Capture: {
        title: 'Bildschirm aufnehmen',
        description: 'Macht einen Screenshot für Vorschläge auf Abruf',
      },
      ClearCaptures: {
        title: 'Aufnahmen löschen',
        description: 'Löscht die aufgenommenen Screenshots',
      },
      TriggerWithoutCaptures: {
        title: 'Ohne Aufnahmen abrufen',
        description: 'Erzeugt einen Vorschlag ohne Screenshots',
      },
      TriggerWithCaptures: {
        title: 'Mit Aufnahmen abrufen',
        description:
          'Erzeugt einen Vorschlag anhand der Screenshots. Gibt es keine, wird vorher einer aufgenommen.',
      },
    },
  },

  inputPassword: {
    show: 'Passwort anzeigen',
    hide: 'Passwort verbergen',
  },

  titlebar: {
    openCommandPalette: 'Befehlspalette öffnen',
    searchActions: 'Aktionen suchen',
    unavailableDuringInterview: 'Während eines Interviews nicht verfügbar',
    menu: 'Menü',
    minimize: 'Minimieren',
    maximize: 'Maximieren',
    close: 'Schließen',
  },

  titlebarMenu: {
    home: 'Startseite',
    account: 'Konto',
    configuration: 'Einstellungen',
    documentation: 'Dokumentation',
    language: 'App-Sprache',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    theme: 'Erscheinungsbild',
    systemMode: 'Systemeinstellung',
    signOut: 'Abmelden',
  },

  commandPalette: {
    title: 'Befehlspalette',
    description: 'Suche nach einer Aktion, Seite oder Einstellung.',
    searchPlaceholder: 'Aktionen suchen…',
    empty: 'Keine passende Aktion.',
    groups: {
      goTo: 'Gehe zu',
      session: 'Sitzung',
      app: 'Anwendung',
    },
    home: 'Startseite',
    account: 'Konto',
    configuration: 'Einstellungen',
    subscribe: 'Abonnement',
    startMock: 'Probeinterview starten',
    startLive: 'Live-Assistent starten',
    switchToFullSentence: 'Zu ganzen Sätzen wechseln',
    switchToHintOnly: 'Zu Stichpunkten wechseln',
    hideTranscript: 'Transkript ausblenden',
    showTranscript: 'Transkript einblenden',
    documentation: 'Dokumentation',
    hotkeys: 'Tastenkürzel',
    switchToLight: 'Zum hellen Modus wechseln',
    switchToDark: 'Zum dunklen Modus wechseln',
    signOut: 'Abmelden',
  },

  controlPanel: {
    stop: 'Stopp',
    stopTooltip: 'Assistenten stoppen',
    stopRunningHint: 'Beendet die Sitzung, bietet das Speichern an und kehrt zur Startseite zurück',
    stopIdleHint: 'Nichts läuft - starte ein Interview auf der Startseite',
    stopTransientHint: 'Verfügbar, sobald die Sitzung läuft',

    checks: {
      configUnavailable:
        'Deine gespeicherten Einstellungen konnten nicht geladen werden. Verbindung wird neu aufgebaut - versuche es gleich noch einmal.',
      nameMissing: 'Vollständiger Name fehlt',
      profileMissing: 'Profildaten fehlen',
      noMicrophone: 'Kein Mikrofon erkannt. Schließ eines an und versuche es erneut.',
      deviceNotFound: (deviceName: string) => `Audio-Eingabegerät „${deviceName}“ nicht gefunden`,
    },
    startFailed: 'Assistent konnte nicht gestartet werden',

    /** The live connection and microphone indicator on the control bar. */
    signal: {
      listening: 'Hört zu',
      reconnecting: 'Verbindung wird wiederhergestellt…',
      listeningHint: 'Mikrofon und Transkription sind verbunden',
      reconnectingHint:
        'Transkriptionsverbindung unterbrochen - wird automatisch wiederhergestellt',
    },
  },

  audioGroup: {
    options: 'Audio-Optionen',
    optionsSwapFailed:
      'Audio-Optionen - Mikrofonwechsel fehlgeschlagen, das bisherige wird weiter genutzt',
    optionsDeviceNotFound: 'Audio-Optionen - das gewählte Mikrofon wurde nicht gefunden',
    dialogTitle: 'Audio-Optionen',
    dialogDescription: 'Wähle das physische Mikrofon, das du nutzt.',
    microphone: 'Mikrofon',
    selectPlaceholder: 'Mikrofon auswählen',
    switching: 'Mikrofon wird gewechselt…',
    swapFailed: (deviceName: string) =>
      `Wechsel zu ${deviceName} fehlgeschlagen. Dieses Interview nutzt weiter das bisherige Mikrofon. Beende und starte den Assistenten, um es zu verwenden.`,
    takesEffectImmediately: 'Wirkt sofort. Die Transkription läuft weiter.',
  },

  languageGroup: {
    current: (languageName: string) => `Interviewsprache: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Interviewsprache: ${languageName} - die Transkription hat nicht gewechselt`,
    tooltip: (nativeName: string) => `Interviewsprache: ${nativeName}`,
    reconnecting: 'Transkription verbindet sich neu…',
    suggestionsOnly: 'Nur Vorschläge - die Transkription verbindet sich noch neu',
    speechAndSuggestions: 'Spracherkennung und Vorschläge',
    menuLabel: 'Interviewsprache',
    halfApplied:
      'Die Vorschläge haben gewechselt, die Transkription nicht. Sie versucht es weiter - beende und starte den Assistenten, falls sie nicht zurückkommt.',
    willReconnect:
      'Die Transkription verbindet sich neu; der aktuelle Satz kann abgeschnitten werden.',
  },

  languageSearch: {
    placeholder: 'Sprachen suchen…',
    empty: 'Keine passende Sprache.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Stichpunkte',
    fullSentencesBadge: 'Ganze Sätze',
    hintOnlyMode: 'Stichpunkt-Modus',
    fullSentenceMode: 'Ganze-Sätze-Modus',
    hintOnlySummary: 'Überschrift + Stichworte',
    fullSentenceSummary: 'Vollständig ausformulierte Antworten',
    ariaHintOnly: 'Vorschlagsmodus: Stichpunkte. Zu ganzen Sätzen wechseln',
    ariaFullSentence: 'Vorschlagsmodus: ganze Sätze. Zu Stichpunkten wechseln',
  },

  toolsGroup: {
    hideTranscription: 'Transkription ausblenden',
    showTranscription: 'Transkription einblenden',
    enterStealth: 'Tarnmodus aktivieren',
    stealthMode: 'Tarnmodus',
    stealthUnavailable:
      'Verfügbar, sobald das Live-Interview läuft - noch gibt es nichts zu verbergen.',
    stealthAvailable:
      'Verbirgt die App vor der Bildschirmaufnahme. Dasselbe Kürzel holt sie zurück.',
    captureScreenshot: 'Screenshot aufnehmen',
    captureScreenshotTooltip: 'Screenshot aufnehmen',
    captureFailed: 'Screenshot konnte nicht aufgenommen werden',
    clearCaptures: 'Aufgenommene Screenshots löschen',
    clearCapturesTooltip: 'Aufnahmen löschen',
    clearCapturesFailed: 'Aufnahmen konnten nicht gelöscht werden',
    generateSuggestion: 'Vorschlag auf Abruf erzeugen',
    generateSuggestionTooltip: 'Vorschlag erzeugen',
    generateSuggestionFailed: 'Vorschlag konnte nicht erzeugt werden',
    clear: 'Leeren',
    clearInterview: 'Interview leeren',
    clearFailed: 'Leeren fehlgeschlagen',
    exportInterview: 'Interview exportieren',
    exportTheInterview: 'Das Interview exportieren',
    nothingToExport: 'Noch nichts zu exportieren',
    nothingToExportDescription:
      'Führe zuerst ein Interview und exportiere dann Transkript und Vorschläge.',
    exportFailed: 'Interview konnte nicht exportiert werden',
    exportDocx: 'Word-Dokument (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Transkript',
    transcriptionShown: (combo: string) => `Transkription: sichtbar (${combo})`,
    transcriptionHidden: (combo: string) => `Transkription: ausgeblendet (${combo})`,
    showHotkeys: 'Kürzel anzeigen',
    showHotkeysLabel: 'Tastenkürzel anzeigen',
    showHotkeysTitle: 'Tastenkürzel anzeigen (?)',
  },

  runningIndicator: {
    idle: 'Bereit',
    starting: 'Startet',
    running: 'Läuft',
    stopping: 'Stoppt',
  },

  zoomControl: {
    reset: 'Zoom zurücksetzen',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
  },

  creditsDisplay: {
    freePlan: 'Gratis',
    planNames: {
      monthly: 'Monatlich',
      quarterly: 'Vierteljährlich',
      yearly: 'Jährlich',
      other: 'Abonniert',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('de-DE'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('de-DE')}, ${new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `Unbegrenzt bis ${date}`,
    endsIn: (days: number) => `Endet in ${days} ${n(days, 'Tag', 'Tagen')}`,
    freeLeft: (availableTime: string) => `${availableTime} gratis`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} Std.`);
      if (minutes) parts.push(`${minutes} Min.`);
      return parts.join(' ') || '0 Min.';
    },
    lessThanAMinute: 'Unter 1 Min.',
    noFreeTimeLeft: 'Keine Gratiszeit mehr',
  },

  panels: {
    autoScroll: 'Automatisch scrollen',
    enableAutoScroll: 'Automatisches Scrollen aktivieren',
    scrollToBottom: 'Nach unten scrollen',
    scrollToTop: 'Nach oben scrollen',

    transcription: 'Transkription',
    noTranscripts: 'Noch keine Transkripte',
    interviewer: 'Interviewer:in',

    liveSuggestions: 'Live-Vorschläge',
    noSuggestions: 'Noch keine Vorschläge',
    idleNoGeneration: 'Bereit - noch nichts erzeugt',

    triggeredSuggestions: 'Vorschläge auf Abruf',
    noTriggeredSuggestions: 'Noch keine Vorschläge auf Abruf',
    suggestionCanceled: 'Vorschlag abgebrochen',

    mockInterview: 'Probeinterview',
    questionProgress: (current: number, total: number) => `Frage ${current} von ${total}`,
    preparingFirstQuestion: 'Deine erste Frage wird vorbereitet…',
    you: 'Du',
    followUp: 'Nachfrage',
    skipped: 'Übersprungen',
    noAnswer: 'Keine Antwort',

    resizeTranscript: 'Größe des Transkript-Bereichs ändern',
    resizeHint: 'Ziehen zum Ändern, Doppelklick zum Zurücksetzen',
  },

  saveHistory: {
    saveAsWord: 'Als Word speichern',
    saveAsMarkdown: 'Als Markdown speichern',
    formatHintLive: 'Word zum Teilen oder Drucken, Markdown zum Aufbewahren als reiner Text.',
    formatHintMock: 'Word zum Teilen oder Drucken, Markdown zum Ablegen bei deinen Notizen.',
    exportFailed: 'Interview konnte nicht exportiert werden',

    live: {
      clear: {
        title: 'Interview vor dem Leeren speichern?',
        body: 'Transkript und Vorschläge gehen verloren.',
        discard: 'Leeren ohne Speichern',
      },
      start: {
        title: 'Interview speichern, bevor ein neues beginnt?',
        body: 'Transkript und Vorschläge gehen verloren.',
        discard: 'Starten ohne Speichern',
      },
      close: {
        title: 'Interview vor dem Schließen speichern?',
        body: 'Transkript und Vorschläge gehen verloren.',
        discard: 'Schließen ohne Speichern',
      },
      update: {
        title: 'Interview vor der Installation des Updates speichern?',
        body: 'Die App startet neu, und Transkript und Vorschläge gehen verloren.',
        discard: 'Installieren ohne Speichern',
      },
      signout: {
        title: 'Interview vor dem Abmelden speichern?',
        body: 'Transkript und Vorschläge gehen verloren.',
        discard: 'Abmelden ohne Speichern',
      },
      stop: {
        title: 'Dieses Interview speichern?',
        body: 'Das Interview ist beendet. Transkript und Vorschläge sind noch nirgends gespeichert.',
        discard: 'Verwerfen und zur Startseite',
      },
      'mock-done': {
        title: 'Bericht speichern, bevor du fertig bist?',
        body: 'Deine Bewertung, das Feedback und deine Antworten gehen verloren.',
        discard: 'Fertig ohne Speichern',
      },
      'mock-again': {
        title: 'Diesen Bericht vor der nächsten Runde speichern?',
        body: 'Diese Bewertung, das Feedback und deine Antworten werden ersetzt.',
        discard: 'Nochmal üben ohne Speichern',
      },
    },

    mock: {
      clear: {
        title: 'Zuerst den Bericht des Probeinterviews speichern?',
        body: 'Dieser Bericht und deine Antworten gehen verloren.',
        discard: 'Leeren ohne Speichern',
      },
      start: {
        title: 'Zuerst den Bericht des Probeinterviews speichern?',
        body: 'Dieser Bericht und deine Antworten gehen verloren.',
        discard: 'Starten ohne Speichern',
      },
      close: {
        title: 'Bericht des Probeinterviews vor dem Schließen speichern?',
        body: 'Dieser Bericht und deine Antworten gehen verloren.',
        discard: 'Schließen ohne Speichern',
      },
      update: {
        title: 'Bericht des Probeinterviews vor der Installation des Updates speichern?',
        body: 'Die App startet neu, und dieser Bericht und deine Antworten gehen verloren.',
        discard: 'Installieren ohne Speichern',
      },
      signout: {
        title: 'Bericht des Probeinterviews vor dem Abmelden speichern?',
        body: 'Dieser Bericht und deine Antworten gehen verloren.',
        discard: 'Abmelden ohne Speichern',
      },
      stop: {
        title: 'Bericht des Probeinterviews speichern?',
        body: 'Das Interview ist beendet. Dieser Bericht ist noch nirgends gespeichert.',
        discard: 'Verwerfen und zur Startseite',
      },
    },
  },

  headphoneNotice: {
    title: 'Kopfhörer sind Pflicht',
    description:
      'Setz sie auf, bevor du startest. Die Stimme des Interviewers darf nur in deinen Ohren landen - nie in den Lautsprechern.',
    liveSpeakers: 'Über Lautsprecher hört dein Mikrofon den Interviewer genauso gut wie du.',
    liveConsequence:
      'Dann hält die App seine Frage für etwas, das du gesagt hast, und beantwortet sie nicht mehr - ohne Fehlermeldung, die dir den Grund nennt.',
    mockSpeakers:
      'Über Lautsprecher kann die gerade gehörte Frage als Echo in den Anfang deiner Antwort geraten.',
    mockConsequence:
      'Dein Mikrofon ist stumm, solange der Interviewer spricht, aber der Nachhall im Raum kann danach noch als einzelne Wörter durchrutschen.',
    proceed: 'Meine Kopfhörer sind auf',
  },

  contextReminder: {
    title: 'Kein Interviewkontext hinterlegt',
    description:
      'Vorschläge entstehen dann nur aus deinem Profil, ohne die Stelle zu kennen, für die du dich bewirbst.',
    hint: 'Füge die Stellenbeschreibung, Notizen aus früheren Runden, ein Anschreiben oder andere Infos zu diesem Interview hinzu, damit die Antworten darauf zugeschnitten sind.',
    edit: 'Kontext hinzufügen',
    proceed: 'Trotzdem starten',
    setTitle: 'Ist dein Kontext aktuell?',
    setDescription:
      'Vorschläge richten sich nach dem Kontext in deinem Konto. Beschreibt er noch ein früheres Interview, passen die Antworten zur falschen Stelle.',
    review: 'Kontext prüfen',
    confirm: 'Er ist aktuell',
    notSet: 'Nicht hinterlegt',
  },

  permissionGate: {
    title: 'Berechtigungen erforderlich',
    microphone: 'Mikrofon',
    micChecking: 'Wird geprüft…',
    micGranted: 'Zugriff erlaubt',
    micBlocked: 'In den Systemeinstellungen erlauben, dann auf Erneut prüfen klicken',
    micRequired: 'Nötig, um deine Stimme aufzunehmen',
    grantAccess: 'Zugriff erlauben',
    openSettings: 'Einstellungen öffnen',
    screenRecording: 'Bildschirmaufnahme',
    screenChecking: 'Wird geprüft…',
    screenNeedsRelaunch: 'Erlaubt - starte die App vor dem Beginn neu, damit es greift',
    screenGranted: 'Zugriff erlaubt',
    screenNotDetermined: 'Wird beim Start der Aufnahme angefragt',
    screenBlocked: 'In den Systemeinstellungen erlauben, dann die App neu starten',
    restartApp: 'App neu starten',
    checking: 'Wird geprüft…',
    checkAgain: 'Erneut prüfen',
    start: 'Starten',
  },

  exportToast: {
    exported: (format: string) => `Interview als ${format} exportiert`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'Exportierte Datei öffnen',
    openFile: 'Datei öffnen',
    showInFolderLabel: 'Exportierte Datei im Ordner zeigen',
    showInFolder: 'Im Ordner zeigen',
    dismiss: 'Schließen',
  },

  notices: {
    connecting: 'Verbindung zum Server wird hergestellt…',
    starting: 'Wird gestartet…',
    stopping: 'Wird gestoppt…',
    dismiss: 'Schließen',
  },

  updateNotification: {
    available: (version: string) => `Update verfügbar: v${version}`,
    availableDescription: 'Der Download startet automatisch im Hintergrund.',
    downloading: (percent: string) => `Update wird geladen… ${percent} %`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `Update geladen: v${version}`,
    downloadedDescriptionMac:
      'Klicke, um das Installationsprogramm zu öffnen, und zieh es in Programme.',
    downloadedDescription: 'Klicke, um neu zu starten und das Update zu installieren.',
    openInstaller: 'Installationsprogramm öffnen',
    restartNow: 'Jetzt neu starten',
  },

  mock: {
    setup: {
      title: 'Probeinterview',
      description:
        'Die KI fragt, du antwortest laut. Nichts wird gespeichert, außer du exportierst es.',
      start: 'Probeinterview starten',
      starting: 'Wird gestartet…',
      seniority: 'Erfahrungsstufe',
      seniorityOptions: {
        junior: 'Junior',
        mid: 'Mid-Level',
        senior: 'Senior',
        staff: 'Staff+',
      },
      questions: 'Fragen',
      questionOption: (count: number, minutes: number) =>
        `${count} ${n(count, 'Frage', 'Fragen')}, etwa ${minutes} Min.`,
      difficulty: 'Schwierigkeit',
      difficultyOptions: {
        easy: {
          label: 'Aufwärmen',
          description: 'Klare Fragen mit jeweils einer eindeutigen Aufgabe.',
        },
        standard: {
          label: 'Normal',
          description: 'Was ein gewöhnlicher Interviewer tatsächlich fragen würde.',
        },
        hard: {
          label: 'Schwer',
          description: 'Bohrende Fragen zu Abwägungen und Grenzfällen.',
        },
      },
      languageDescription:
        'In welcher Sprache der Interviewer fragt, was transkribiert wird und in welcher Sprache dein Feedback kommt.',
      estimate: (minutes: number) => `Meist etwa ${minutes} Min.`,
      unlimited: 'Unbegrenzt mit deinem Abonnement.',
      covers: (minutes: number) =>
        `Deine Gratiszeit reicht für etwa ${minutes} ${n(minutes, 'Minute', 'Minuten')}.`,
      endsEarly:
        'Die Sitzung endet, wenn deine Gratiszeit aufgebraucht ist - deinen Bericht bekommst du trotzdem.',
    },

    session: {
      heading: 'Probeinterview-Sitzung',
      starting: 'Wird gestartet…',
      generating: 'Die nächste Frage wird überlegt…',
      evaluating: 'Denkt nach…',
      scoring: 'Das Interview wird bewertet…',
      stopping: 'Das Interview wird beendet…',
      speaking: 'Der Interviewer spricht. Dein Mikrofon ist aus, solange die Frage läuft.',
      readThenReady:
        'Lies die Frage. Deine Antwort wird ab dem Moment aufgenommen, in dem du bereit bist.',
      listening: 'Hört zu…',
      ready: 'Ich bin bereit',
      doneAnswering: 'Antwort fertig',
      doneAnsweringTooltip: 'Antwort abschicken und weiter',
      toggleHints: 'Live-Vorschläge ein- oder ausschalten',
      hintsOn: 'Live-Vorschläge: an',
      hintsOff: 'Live-Vorschläge: aus',
      hintsOnHint: 'Zeigt, was der Live-Assistent antworten würde',
      hintsOffHint: 'Ohne Hinweis üben',
      endInterview: 'Interview beenden',
      startFailed: 'Probeinterview konnte nicht gestartet werden',
      startingPage: 'Probeinterview wird gestartet…',
    },

    report: {
      heading: 'Bericht zum Probeinterview',
      verdictExcellent: 'Ausgezeichnet',
      verdictStrong: 'Stark',
      verdictDeveloping: 'Ausbaufähig',
      verdictNeedsWork: 'Braucht Übung',
      scoreFailed: (reason: string) =>
        `Die Gesamtbewertung konnte nicht erstellt werden (${reason}). Deine Antworten stehen weiterhin unten und lassen sich exportieren.`,
      scoreAgain: 'Erneut bewerten',
      scoring: 'Wird bewertet…',
      overallScore: 'Gesamtbewertung',
      strengths: 'Stärken',
      gaps: 'Lücken',
      nothingNoted: 'Nichts Besonderes vermerkt.',
      perQuestion: 'Aufschlüsselung pro Frage',
      yourAnswer: 'Deine Antwort',
      noAnswerRecorded: '(keine Antwort aufgenommen)',
      score: 'Bewertung',
      strongerAnswer: 'Stärkere Antwort',
      saveAsWord: 'Als Word speichern',
      saveAsMarkdown: 'Als Markdown speichern',
      exportFailed: 'Bericht konnte nicht exportiert werden',
      practiseAgain: 'Nochmal üben',
      done: 'Fertig',
    },
  },

  mainRoute: {
    redirectingToLogin: 'Weiterleitung zur Anmeldung…',
    authenticating: 'Anmeldung wird geprüft…',
    transcriptionHidden: 'Die Transkription ist ausgeblendet',
    awaitingFirstQuestion: {
      title: 'Warte auf die erste Frage…',
      description:
        'Vorschläge erscheinen hier, sobald der Interviewer etwas fragt. Hilfreiche Tastenkürzel während des Gesprächs:',
    },
  },

  documentation: {
    intro: (appName: string) =>
      `${appName} ist ein KI-Assistent, der deine Interviews mit Vorschlägen in Echtzeit und Code-Empfehlungen zum Bildschirminhalt unterstützt.`,
    docsLead: 'Die vollständige Dokumentation findest du unter ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: '. Drücke überall in der App Cmd/Strg+K, um nach einer Aktion zu suchen.',

    lostWindow: {
      title: 'Fenster verloren?',
      body: (appName: string) =>
        `Im Tarnmodus verlässt ${appName} die Taskleiste und das macOS-Dock, damit es beim Teilen des Bildschirms nicht sichtbar ist - ein minimiertes Fenster hat dann also keine Schaltfläche zum Anklicken. Starte ${appName} einfach erneut: Es öffnet keine zweite Kopie, sondern holt dieses Fenster zurück. Außerhalb des Tarnmodus sind die übliche Taskleisten-Schaltfläche und das Dock-Symbol da, außer du hast „Taskleistensymbol während Live-Interviews ausblenden“ eingeschaltet.`,
    },

    language: {
      title: 'Interviews in einer anderen Sprache',
      oneSetting:
        'Eine einzige Einstellung gilt für die ganze Sitzung: welches Sprachmodell das Gespräch transkribiert, in welcher Sprache die Vorschläge geschrieben werden und die Sprache des exportierten Berichts. Stell sie über die Sprach-Schaltfläche in der Steuerleiste, auf der Einstellungsseite oder im Dialog des Probeinterviews ein - alle ändern dasselbe.',
      supported: (count: number) => `${count} Sprachen werden unterstützt:`,
      midInterview:
        'Du kannst sie mitten im Interview ändern. Die Vorschläge folgen sofort, ab der nächsten Antwort. Die Spracherkennung braucht etwas länger: Sie verbindet sich neu, daher kann der gerade gesprochene Satz im Transkript abgeschnitten sein.',
      textOnly:
        'Im Probeinterview hat eine im Dialog mit „nur Text“ markierte Sprache keine Stimme: Der Interviewer schreibt seine Fragen, statt sie zu sprechen. Du antwortest weiterhin laut, und die Bewertung bleibt gleich.',
      appLanguageTitle: 'Die App hat ihre eigene Sprache',
      appLanguageBody:
        'Die Sprache oben ist die des Interviews. Die Sprache, in der die App selbst geschrieben ist - Schaltflächen, Überschriften und Meldungen -, ist eine eigene Einstellung auf der Einstellungsseite und auch die erste Frage der Ersteinrichtung. Keine wird aus der anderen abgeleitet: Wer Russisch spricht und auf Englisch interviewt wird, will ein englisches Transkript und eine russische App.',
    },

    microphone: {
      title: 'Mikrofon im Interview wechseln',
      body: 'Die Mikrofon-Schaltfläche in der Steuerleiste bleibt während des Interviews verfügbar. Wenn dein Headset leer ist, abgezogen wird oder von Anfang an das falsche Gerät war, wähle dort ein anderes, statt den Assistenten zu stoppen - Stoppen löscht auch das Transkript und die Vorschläge.',
      immediate:
        'Der Wechsel wirkt sofort und die Transkription läuft weiter, es wird also nichts abgeschnitten. Lässt sich das gewählte Gerät nicht öffnen - abgezogen oder von einer anderen App belegt -, läuft das Interview mit dem bisherigen weiter, und die App sagt dir Bescheid.',
    },

    suggestionStyle: {
      title: 'Stichpunkte oder ganze Sätze',
      body: 'Stichpunkte sind die Voreinstellung: Jeder Vorschlag kommt als einzeilige Überschrift mit Stichworten, damit du ihn auf einen Blick erfasst und weitersprichst. Ganze Sätze schreiben die Antwort so aus, wie man sie sagen würde - mehr zu lesen, weniger zu improvisieren.',
      switching: (combo: string) =>
        `Wechsle in der Steuerleiste, auf der Einstellungsseite oder mit ${combo}, das auch im Tarnmodus funktioniert. Vorschläge, die schon auf dem Bildschirm sind, behalten ihren Stil; nur der nächste ändert sich.`,
    },

    settings: {
      title: 'Wo deine Einstellungen liegen',
      accountLabel: 'Konto',
      accountBody:
        ' enthält, wer du bist - den Namen, unter dem du auftrittst, das Profil oder den Lebenslauf, aus dem die Vorschläge entstehen, den Stellenkontext deines Interviews und dein Passwort.',
      configurationLabel: 'Einstellungen',
      configurationBody:
        ' enthalten, wie das Interview läuft - die App-Sprache, dein Mikrofon (mit Test), die Interviewsprache, den Stil der Vorschläge und ob der Transkript-Bereich angedockt ist. Speichern ist nicht nötig; jede Änderung wirkt sofort.',
      both: 'Beides erreichst du über die Startseite, das Menü in der Titelleiste und die Cmd/Strg+K-Palette. Eine neue Installation führt beim ersten Start einmal durch alles.',
    },

    hotkeys: 'Tastenkürzel',
  },

  payment: {
    title: 'Abonnement',
    tabs: {
      buy: 'Tarife',
      history: 'Verlauf',
      status: 'Zahlungsstatus',
    },

    buy: {
      features: {
        unlimited: 'Unbegrenzte Live- und Übungsinterviews',
        model: 'Unser leistungsstärkstes KI-Modell',
        noRenewal: 'Vorausbezahlt - keine automatische Verlängerung',
      },
      currentPlan: 'Dein Tarif',
      subscribedUntil: (plan: string, date: string) => `${plan}, bis ${date}`,
      daysLeft: (days: number) => `Noch ${days} ${n(days, 'Tag', 'Tage')}`,
      freePlan: 'Gratis-Tarif',
      freeLeft: (duration: string) => `Noch ${duration} Interviews mit dem Gratis-Modell.`,
      freeUsedUp: 'Keine Gratiszeit mehr. Abonniere, um weitere Interviews zu führen.',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} ${n(hours, 'Stunde', 'Stunden')}`);
        if (minutes) parts.push(`${minutes} ${n(minutes, 'Minute', 'Minuten')}`);
        return parts.join(' ') || '0 Minuten';
      },
      loadingPlans: 'Tarife werden geladen…',
      mostPopular: 'Am beliebtesten',
      planDescriptions: {
        monthly: 'Unbegrenzte Interviews mit dem SOTA-Modell für einen Monat',
        quarterly: 'Unbegrenzte Interviews mit dem SOTA-Modell für drei Monate',
        yearly: 'Unbegrenzte Interviews mit dem SOTA-Modell für ein Jahr',
      },
      perMonth: ' / Monat',
      billedAs: (price: number, months: number) =>
        `$${price} einmalig, für ${months} ${n(months, 'Monat', 'Monate')}`,
      save: (percent: number) => `${percent} % sparen`,
      prepaid: 'Einmalig in Krypto bezahlt. Ein Pass verlängert sich nie von selbst.',
      refundPrompt: 'Erstattung nötig?',
      refundContact: 'Support kontaktieren',
      extends:
        'Dein Abonnement ist aktiv: Ein neuer Pass hängt seine Laufzeit an das aktuelle Enddatum an.',
      selected: 'Ausgewählt',
      buy: 'Wählen',
      detailsTitle: 'Zahlungsdetails',
      detailsLead: 'Schließe den Kauf des Tarifs ',
      detailsFor: ' ab, für ',
      currencyLabel: 'Zahlungswährung',
      currencyPlaceholder: 'Währung auswählen',
      currencySearchPlaceholder: 'Währung suchen…',
      noCurrency: 'Keine Währung gefunden',
      createPayment: 'Zahlung erstellen',
      creatingPayment: 'Zahlung wird erstellt…',
    },

    history: {
      loading: 'Zahlungsverlauf wird geladen…',
      loadFailed: 'Zahlungsverlauf konnte nicht geladen werden',
      emptyTitle: 'Keine Zahlungen',
      emptyBody: 'Du hast noch keine Zahlungen getätigt. Abonniere, um loszulegen.',
      subscribe: 'Tarife ansehen',
      refreshing: 'Wird aktualisiert…',
      remainder: 'Restbetrag',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} ${n(months, 'Monat', 'Monate')}`
          : days > 0
            ? `${days.toLocaleString('de-DE')} ${n(days, 'Tag', 'Tage')}`
            : credits > 0
              ? `${credits.toLocaleString('de-DE')} Credits`
              : '-',
      columns: {
        created: 'Erstellt',
        paymentId: 'Zahlungs-ID',
        purchase: 'Kauf',
        amount: 'Betrag',
        status: 'Zahlungsstatus',
        action: 'Aktion',
      },
      notAvailable: 'k. A.',
      view: 'Ansehen',
    },

    status: {
      title: 'Zahlungsstatus prüfen',
      description: 'Gib eine Zahlungs-ID ein, um ihren aktuellen Status zu sehen',
      idPlaceholder: 'Zahlungs-ID eingeben',
      check: 'Status prüfen',
      checking: 'Wird geprüft…',
      notFound: 'Zahlung nicht gefunden',
      fetchFailed: 'Zahlungsstatus konnte nicht abgerufen werden',
      order: (orderId: string) => `Bestellung #${orderId}`,
      refreshing: 'Wird aktualisiert…',
      amountToPay: 'Zu zahlender Betrag',
      priceUsd: 'Preis (USD)',
      actuallyPaid: 'Tatsächlich bezahlt',
      paymentMethods: 'Zahlungsarten',
      qrTab: 'QR-Code',
      addressTab: 'Adresse',
      downloadQr: 'QR-Code herunterladen',
      qrSaved: 'QR-Code gespeichert',
      scanWithWallet: 'Mit deiner Wallet-App scannen',
      qrIncludes: (amount: string) => `Der QR-Code enthält Adresse und Betrag (${amount})`,
      paymentAddress: 'Zahlungsadresse',
      amountToSend: 'Zu sendender Betrag',
      sendExactly: 'Sende genau diesen Betrag an die Adresse oben.',
      successTitle: 'Zahlung erfolgreich!',
      successBody: 'Dein Abonnement wurde deinem Konto gutgeschrieben.',
      expiredTitle: 'Zahlung abgelaufen',
      failedTitle: 'Zahlung fehlgeschlagen',
      expiredBody: 'Diese Zahlung ist abgelaufen. Bitte erstelle eine neue.',
      failedBody: 'Die Zahlung konnte nicht verarbeitet werden. Bitte versuche es erneut.',
      refundedTitle: 'Zahlung erstattet',
      refundedBody: 'Diese Zahlung wurde erstattet. Wende dich bei Fragen an den Support.',
      receivedTitle: 'Zahlung eingegangen',
      receivedBody:
        'Deine Zahlung wird im Netzwerk bestätigt. Du musst nichts weiter zahlen, und dein Abonnement wird automatisch gutgeschrieben.',
      partialTitle: 'Teilzahlung eingegangen',
      partialBody:
        'Wir bereiten eine neue Adresse für den Restbetrag vor. Sie erscheint hier und kommt per E-Mail. Sende nichts mehr an die bisherige Adresse.',
      created: 'Erstellt:',
      updated: 'Aktualisiert:',
      addressCopied: 'Zahlungsadresse in die Zwischenablage kopiert',
      amountCopied: 'Betrag in die Zwischenablage kopiert',
      currencyCopied: 'Währung in die Zwischenablage kopiert',
    },

    statusLabels: {
      waiting: 'Ausstehend',
      confirming: 'Wird bestätigt',
      confirmed: 'Bestätigt',
      sending: 'Wird gesendet',
      partiallyPaid: 'Teilweise bezahlt',
      finished: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
      refunded: 'Erstattet',
      expired: 'Abgelaufen',
    },

    errors: {
      getPlans: 'Tarife konnten nicht abgerufen werden',
      getCurrencies: 'Währungen konnten nicht abgerufen werden',
      createPayment: 'Zahlung konnte nicht erstellt werden',
      getStatus: 'Zahlungsstatus konnte nicht abgerufen werden',
      getHistory: 'Zahlungsverlauf konnte nicht abgerufen werden',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: 'Das gewählte Mikrofon konnte nicht gespeichert werden',
    microphoneSwapFailed: 'Gespeichert, aber das Interview nutzt weiter das bisherige Mikrofon',
    microphoneSwapFailedHint:
      'Prüfe, ob das Gerät angeschlossen ist, dann beende und starte den Assistenten.',
    saveLanguageFailed: 'Die Interviewsprache konnte nicht gespeichert werden',
    languageHalfApplied:
      'Die Vorschläge haben die Sprache gewechselt; die Transkription verbindet sich noch neu',
    languageHalfAppliedHint:
      'Sie versucht es weiter. Beende und starte den Assistenten, falls sie nicht zurückkommt.',
    saveSuggestionModeFailed: 'Der Vorschlagsmodus konnte nicht gespeichert werden',
    saveTranscriptPanelFailed:
      'Die Einstellung des Transkript-Bereichs konnte nicht gespeichert werden',
    saveMockHintsFailed: 'Die Einstellung der Live-Vorschläge konnte nicht gespeichert werden',
    saveHideTaskbarFailed:
      'Die Taskleisten-Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.',
    saveAllowScreenCaptureFailed:
      'Die Einstellung zur Bildschirmaufnahme konnte nicht gespeichert werden. Bitte versuche es erneut.',
    saveUiLanguageFailed: 'Die App-Sprache konnte nicht gespeichert werden',
  },

  assistant: {
    mockRunning: 'Beende das Probeinterview, bevor du eine Live-Sitzung startest.',
    stoppedUncleanly: 'Der Assistent wurde gestoppt, aber nicht alles wurde sauber beendet',
    stoppedUncleanlyHint:
      'Starte die App neu, falls weiter Transkripte oder Vorschläge eintreffen.',
    startFailed: 'Assistent konnte nicht gestartet werden',
    stopFailed: 'Assistent konnte nicht gestoppt werden',
    screenCaptureTimedOut:
      'Die Bildschirmaufnahme hat zu lange gedauert. Bitte versuche es erneut.',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `Audio-Eingabegerät „${deviceName}“ nicht gefunden. Wähle in den Audio-Einstellungen auf dem Hauptbildschirm ein anderes.`,
  },

  creditGate: {
    tooLow: 'Nicht genug Gratiszeit zum Starten',
    outOfCredits: 'Gratiszeit aufgebraucht - die Sitzung wurde beendet',
    outOfCreditsHint: 'Abonniere für unbegrenzte Interviews.',
    replaced: 'Interview beendet - auf diesem Konto wurde ein neues gestartet',
    replacedHint: 'Ein Konto kann nur ein Interview gleichzeitig führen.',
    lowBalance: (minutes: number) =>
      `Noch etwa ${minutes} ${n(minutes, 'Minute', 'Minuten')} Gratiszeit`,
    lowBalanceHint: 'Die Sitzung endet, wenn deine Gratiszeit aufgebraucht ist.',
    tooLowHint:
      'Eine Sitzung braucht mindestens eine Minute. Abonniere für unbegrenzte Interviews mit dem SOTA-Modell.',
    subscribe: 'Tarife ansehen',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `Dein Abonnement endet in ${days} ${n(days, 'Tag', 'Tagen')}`,
    endingSoonHint:
      'Kauf einen weiteren Pass, damit die Interviews unbegrenzt bleiben. Seine Laufzeit wird an das aktuelle Enddatum angehängt.',
    ended: 'Dein Abonnement ist abgelaufen',
    endedHint: 'Interviews nutzen jetzt deine Gratiszeit mit dem Gratis-Modell.',
  },

  trialNotice: {
    freeTierLead: 'Gratis-Tarif: 1 Stunde Interviews mit dem ',
    freeTier: 'Gratis',
    freeTierTail: '-Modell.',
    sotaLead: 'Abonniere für unbegrenzte Interviews mit dem ',
    sota: 'Spitzen',
    sotaTail: '-Modell.',
  },
};
