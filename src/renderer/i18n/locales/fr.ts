/**
 * French.
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here, and the register is "vous", which French software uses by default.
 * Apostrophes are the typographic ’, which is correct French typography and keeps every string
 * single-quoted - and therefore visible to the untranslated-copy check.
 */
import type { Translation } from './en';

const n = (count: number, one: string, other: string) => (count <= 1 ? one : other);

export const fr: Translation = {
  common: {
    cancel: 'Annuler',
    close: 'Fermer',
    back: 'Retour',
    continue: 'Continuer',
    finish: 'Terminer',
    retry: 'Réessayer',
    view: 'Voir',
    loading: 'Chargement…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'Langue de l’application',
    description: 'Boutons, menus et messages. Indépendante de la langue de l’entretien.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `Configurer ${appName}`,
    guideEyebrow: 'Guide de configuration',
    progress: (current: number, total: number, label: string) =>
      `Étape ${current} sur ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'Langue de l’application',
        title: 'Dans quelle langue voulez-vous l’application ?',
        description:
          'Choisissez celle que vous lisez le plus facilement. La suite de la configuration la suivra.',
      },
      profile: {
        label: 'Profil',
        title: 'Présentez-vous',
        description:
          'Les suggestions s’appuient sur votre expérience, ce champ est donc obligatoire.',
      },
      context: {
        label: 'Contexte du poste',
        title: 'Pour quel poste passez-vous l’entretien ?',
        description: 'Facultatif. Collez l’offre d’emploi pour des réponses adaptées au poste.',
      },
      language: {
        label: 'Langue',
        title: 'Choisissez la langue de l’entretien',
      },
      microphone: {
        label: 'Micro',
        title: 'Choisissez votre micro',
        description:
          'Choisissez le micro dans lequel vous allez parler et testez-le. Utilisez un casque : avec des haut-parleurs, l’application peut cesser de répondre.',
      },
      mode: {
        label: 'Suggestions',
        title: 'Sous quelle forme lire les suggestions ?',
      },
      mockHints: {
        label: 'Entretien d’entraînement',
        title: 'Des indices pendant un entretien d’entraînement ?',
      },
      zoom: {
        label: 'Taille',
        title: 'Est-ce confortable à lire ?',
      },
      transcript: {
        label: 'Transcription',
        title: 'Afficher une transcription en direct ?',
      },
    },

    blocked: {
      accountUnreachable:
        'Votre compte est inaccessible : rien de ce que vous saisissez ici ne peut encore être enregistré.',
      needName: 'Ajoutez votre nom complet pour continuer.',
      needProfile: 'Ajoutez votre profil pour continuer.',
    },

    loadingAccount: 'Chargement de votre compte…',
    accountUnreachable:
      'Votre compte est inaccessible. Rien de ce que vous saisissez ici ne pourra être enregistré avant son retour.',

    skip: 'Passer pour l’instant',
    skipTooltip: 'Vous pourrez relancer la configuration plus tard depuis les Réglages',

    allSet: 'Tout est prêt',
    profileNotSavedOnSkip:
      'Configuration ignorée, mais votre profil n’a pas été enregistré. Réessayez depuis Compte.',
    completionNotRecorded:
      'Configuration ignorée, mais nous n’avons pas pu l’enregistrer. Elle pourra vous être proposée à nouveau.',
    saveProfileFailed: 'Impossible d’enregistrer votre profil',
    finishFailed:
      'Impossible d’enregistrer votre configuration. Vérifiez votre connexion et réessayez.',
  },

  configuration: {
    title: 'Réglages',
    setupGuide: {
      title: 'Guide de configuration',
      description:
        'Parcourez tout ce qui se trouve sur cette page, ainsi que votre profil, étape par étape.',
      action: 'Lancer la configuration',
    },
    hotkeys: {
      title: 'Raccourcis clavier',
      description: 'Tout ce que vous pouvez faire sans toucher l’application pendant un entretien.',
    },
  },

  auth: {
    fields: {
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      username: 'Nom d’utilisateur',
      confirmPassword: 'Confirmer le mot de passe',
      newPassword: 'Nouveau mot de passe',
      confirmNewPassword: 'Confirmer le nouveau mot de passe',
      verificationCode: 'Code de vérification',
      resetCode: 'Code de réinitialisation',
    },

    signIn: {
      title: 'Connexion',
      description: (appName: string) => `Utilisez votre compte pour accéder à ${appName}`,
      submit: 'Se connecter',
      submitting: 'Connexion…',
      rememberMe: 'Se souvenir de moi',
      noAccount: 'Pas de compte ? Créez-en un.',
      forgotPassword: 'Mot de passe oublié ?',
    },

    signup: {
      title: 'Créer un compte',
      description: (appName: string) => `Créez un nouveau compte ${appName}`,
      sendCode: 'Envoyer le code',
      sending: 'Envoi…',
      haveAccount: 'Déjà un compte ? Connectez-vous',
      codeNotice: (email: string) =>
        `Si ${email} n’a pas encore de compte, nous y avons envoyé un code de vérification. Collez-le ci-dessous. S’il en a déjà un, nous y avons envoyé un message expliquant comment vous connecter.`,
      verify: 'Vérifier',
      verifying: 'Vérification…',
      changeEmail: 'Changer d’adresse',
      resendCode: 'Renvoyer le code',
      requestResent: 'Demande renvoyée.',
      resendFailed: 'Échec du renvoi.',
      create: 'Créer le compte',
      creating: 'Création…',
      sendCodeFailed: 'Impossible d’envoyer le code de vérification. Veuillez réessayer.',
      invalidCode: 'Code de vérification invalide ou expiré.',
      succeeded: 'Inscription réussie ! Connectez-vous.',
      failed: 'Échec de l’inscription. Veuillez réessayer.',
    },

    reset: {
      title: 'Réinitialiser le mot de passe',
      description: (appName: string) =>
        `Définissez un nouveau mot de passe pour votre compte ${appName}`,
      sendResetCode: 'Envoyer le code',
      sending: 'Envoi…',
      backToSignIn: 'Retour à la connexion',
      codeNotice: (email: string) =>
        `Si un compte existe pour ${email}, nous y avons envoyé un code de réinitialisation. Collez-le ci-dessous. Il n’est utilisable qu’une fois, et l’e-mail indique quand il expire.`,
      verify: 'Vérifier',
      verifying: 'Vérification…',
      changeEmail: 'Changer d’adresse',
      resendCode: 'Renvoyer le code',
      codeResent: 'Code renvoyé.',
      resendFailed: 'Impossible de renvoyer le code.',
      signsYouOut: 'Définir un nouveau mot de passe vous déconnecte sur tous vos appareils.',
      setNewPassword: 'Définir le nouveau mot de passe',
      saving: 'Enregistrement…',
      done: 'Mot de passe réinitialisé',
      startOver: 'Recommencer',
      sendFailed: 'Impossible d’envoyer le code. Veuillez réessayer.',
      verifyFailed: 'Impossible de vérifier le code.',
      succeeded: 'Mot de passe réinitialisé. Connectez-vous avec le nouveau mot de passe.',
      failed: 'Échec de la réinitialisation. Le code a peut-être expiré : demandez-en un nouveau.',
    },

    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',

    errors: {
      sendCodeFailed: 'Impossible d’envoyer le code de vérification',
      invalidCode: 'Code de vérification invalide ou expiré',
      loginFailed: 'Échec de la connexion',
      signupFailed: 'Échec de l’inscription',
      logoutFailed: 'Échec de la déconnexion',
      changePasswordFailed: 'Impossible de modifier le mot de passe',
      sendResetCodeFailed: 'Impossible d’envoyer le code de réinitialisation',
      invalidResetCode: 'Code de réinitialisation invalide ou expiré',
      resetFailed: 'Échec de la réinitialisation du mot de passe',
    },
  },

  home: {
    welcome: (firstName: string) => `Bon retour, ${firstName}`,
    welcomeAnonymous: 'Bon retour',
    subtitle:
      'Entraînez-vous face à un recruteur IA, ou recevez de l’aide en direct pendant un vrai appel.',

    mock: {
      title: 'Démarrer un entretien d’entraînement',
      ready:
        'L’IA pose les questions, vous répondez à voix haute, et vous recevez un rapport noté à la fin.',
      unsupported:
        'Pas encore disponible sur ce serveur. Mettez l’application à jour ou réessayez plus tard.',
      liveRunning:
        'Arrêtez d’abord l’assistant en direct : les deux ne peuvent pas partager votre micro.',
      unaffordable:
        'Il ne vous reste pas assez de temps gratuit. Abonnez-vous pour continuer à vous entraîner.',
    },

    live: {
      title: 'Démarrer l’assistant en direct',
      resumeTitle: 'Revenir à votre entretien',
      ready: 'Transcrit votre véritable entretien et suggère des réponses en temps réel.',
      running: 'Votre assistant en direct est déjà lancé.',
      mockRunning:
        'Terminez d’abord l’entretien d’entraînement : les deux ne peuvent pas partager votre micro.',
      unaffordable:
        'Il ne vous reste pas assez de temps gratuit. Abonnez-vous pour continuer vos entretiens.',
    },

    accountLabel: 'Compte',
    notSignedIn: 'Non connecté',
    planLabel: 'Formule',
    planUnavailable: 'Indisponible',
    subscribe: 'Abonnement',

    nav: {
      account: 'Compte',
      configuration: 'Réglages',
      documentation: 'Aide',
    },

    signOut: 'Se déconnecter',
    signingOut: 'Déconnexion…',
    signOutBlocked: 'Arrêtez l’entretien avant de vous déconnecter',
    signOutFailed: 'Échec de la déconnexion',
  },

  account: {
    title: 'Compte',
    signedInAs: 'Connecté en tant que',
    password: {
      title: 'Mot de passe',
      description: 'Modifiez le mot de passe de votre compte',
      action: 'Modifier le mot de passe',
    },
    loadFailed:
      'Impossible de charger vos informations enregistrées. Reconnectez-vous avant de modifier.',
    save: 'Enregistrer les modifications',
    saving: 'Enregistrement…',
    saved: 'Informations du compte enregistrées',
    saveFailed: 'Impossible d’enregistrer les informations du compte',
  },

  profileFields: {
    fullName: 'Nom complet',
    fullNamePlaceholder: 'Le nom que vous utilisez pendant l’entretien',
    profile: 'Profil',
    profilePlaceholder:
      'Collez votre CV, votre profil LinkedIn ou une courte biographie. Les suggestions s’en inspirent : plus il y a de détails, plus les réponses vous ressemblent.',
    context: 'Contexte',
    contextPlaceholder:
      'Collez l’offre d’emploi, les exigences du poste ou toute autre information sur l’entretien que vous préparez.',
    limitReached: (max: number) =>
      `Limite de caractères atteinte (${max.toLocaleString('fr-FR')}). Le texte en trop n’a pas été ajouté.`,
    charactersLeft: (remaining: number) =>
      `${remaining.toLocaleString('fr-FR')} ${n(remaining, 'caractère restant', 'caractères restants')}`,
  },

  microphoneField: {
    label: 'Micro',
    noDevices: 'Aucun micro détecté. Branchez-en un et il apparaîtra ici.',
    selectPlaceholder: 'Choisir un micro',
    lookingPlaceholder: 'Recherche de micros…',
    test: 'Tester',
    stopTest: 'Arrêter le test',
    openFailed:
      'Impossible d’ouvrir ce micro. Vérifiez qu’il est branché et qu’aucune autre application ne l’utilise.',
    notConnected: (deviceName: string) =>
      `« ${deviceName} » n’est plus connecté. Choisissez un autre micro.`,
    saySomething: 'Dites quelque chose : la barre doit bouger pendant que vous parlez.',
    runningHint: 'L’entretien utilise ce micro. Le test sera possible une fois qu’il sera terminé.',
    testHint:
      'Testez-le avant l’entretien : un micro muet ressemble exactement à une pièce silencieuse.',
  },

  micLevelMeter: {
    label: 'Niveau d’entrée du micro',
    hearing: 'Je vous entends',
    silent: 'Silence',
  },

  suggestionModeField: {
    label: 'Style des suggestions',
    hintOnly: 'Indices seulement',
    hintOnlyDescription: 'Un titre et des mots-clés à lire d’un coup d’œil. Recommandé.',
    fullSentences: 'Phrases complètes',
    fullSentencesDescription: 'La réponse complète, rédigée comme vous la diriez.',
    switchHint: (combo: string) =>
      `Modifiable en cours d’entretien depuis la barre de contrôle ou avec ${combo}.`,
  },

  zoomField: {
    label: 'Taille de l’interface',
    smaller: 'Plus petit',
    larger: 'Plus grand',
    reset: 'Réinitialiser',
    description: (combo: string) => `Met à l’échelle toute l’application. Aussi avec ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Afficher le panneau de transcription',
    description: (combo: string) =>
      `Transcription en direct sous vos suggestions. Basculer avec ${combo}.`,
  },

  hideTaskbarField: {
    label: 'Masquer l’icône de la barre des tâches pendant les entretiens',
    description:
      'Garde la fenêtre au premier plan (sur macOS, l’icône du Dock est aussi masquée). Elle ne peut pas être réduite : relancez l’application si vous la perdez.',
  },
  allowScreenCaptureField: {
    label: 'Autoriser la capture d’écran',
    description:
      'Laisse les partages d’écran et les enregistrements voir la fenêtre de l’application. Le mode furtif la masque toujours.',
  },
  mockHintsField: {
    label: 'Afficher des indices pendant les entretiens d’entraînement',
    description:
      'Affiche la réponse de l’assistant à côté de chaque question, pour la comparer à la vôtre.',
  },

  languageField: {
    label: 'Langue de l’entretien',
    textOnly: 'texte seul',
    reconnectFailed:
      'Les suggestions ont changé de langue, mais la transcription se reconnecte encore. Arrêtez puis relancez l’assistant si elle ne revient pas.',
    description: 'Ce qui est transcrit, et la langue de vos suggestions.',
    noVoiceNotice:
      'Le recruteur écrira ses questions au lieu de les prononcer. Vous répondez toujours à voix haute, et la notation reste la même.',
  },

  changePassword: {
    title: 'Modifier le mot de passe',
    description: 'Saisissez votre mot de passe actuel et choisissez-en un nouveau.',
    current: 'Mot de passe actuel',
    currentPlaceholder: 'Saisissez le mot de passe actuel',
    next: 'Nouveau mot de passe',
    nextPlaceholder: 'Saisissez le nouveau mot de passe',
    confirm: 'Confirmer le nouveau mot de passe',
    confirmPlaceholder: 'Confirmez le nouveau mot de passe',
    submit: 'Modifier le mot de passe',
    submitting: 'Modification…',
    mismatch: 'Les nouveaux mots de passe ne correspondent pas.',
    succeeded: 'Mot de passe modifié',
    failed: 'Impossible de modifier le mot de passe',
  },

  hotkeys: {
    dialogTitle: 'Raccourcis clavier',
    dialogDescription:
      'Tout ce que vous pouvez faire sans toucher l’application pendant un entretien.',

    groups: {
      general: 'Général',
      window: 'Gestion de la fenêtre',
      panels: 'Défilement des panneaux',
      triggered: 'Suggestions à la demande',
    },

    keys: {
      StopAll: {
        title: 'Tout arrêter',
        description: 'Arrête l’assistant et quitte le mode furtif',
      },
      ToggleStealth: {
        title: 'Mode furtif',
        description:
          'Masque l’application des captures d’écran pendant un entretien en direct. Les mêmes touches la font revenir.',
      },
      Opacity: { title: 'Opacité', description: 'Bascule l’opacité de la fenêtre en mode furtif' },
      ToggleTranscript: {
        title: 'Afficher la transcription',
        description: 'Affiche ou masque le panneau de transcription, y compris en mode furtif',
      },
      ToggleSuggestionMode: {
        title: 'Indices / Phrases complètes',
        description:
          'Bascule les suggestions entre indices seulement (un titre et des mots-clés à lire d’un coup d’œil) et phrases complètes. Fonctionne aussi en mode furtif.',
      },
      PlaceWin: {
        title: 'Placer la fenêtre',
        description: 'Place la fenêtre dans un coin, sur un bord ou au centre',
      },
      MoveWin: {
        title: 'Déplacer la fenêtre',
        description: 'Déplace la fenêtre dans la direction indiquée',
      },
      ResizeWin: {
        title: 'Redimensionner la fenêtre',
        description: 'Redimensionne la fenêtre dans la direction indiquée',
      },
      ZoomInOutReset: {
        title: 'Zoom avant/arrière/réinitialiser',
        description: 'Ajuste ou réinitialise le zoom de l’interface',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Faire défiler le panneau en direct',
        description: 'Descend, monte ou va à la fin du panneau des suggestions en direct',
      },
      ScrollActionSuggestionPanel: {
        title: 'Faire défiler le panneau à la demande',
        description: 'Descend, monte ou va à la fin du panneau des suggestions à la demande',
      },
      Capture: {
        title: 'Capturer l’écran',
        description: 'Prend une capture d’écran pour les suggestions à la demande',
      },
      ClearCaptures: { title: 'Effacer les captures', description: 'Efface les captures d’écran' },
      TriggerWithoutCaptures: {
        title: 'Demander sans captures',
        description: 'Génère une suggestion sans captures',
      },
      TriggerWithCaptures: {
        title: 'Demander avec captures',
        description:
          'Génère une suggestion à partir des captures d’écran. S’il n’y en a aucune, tente d’en prendre une avant.',
      },
    },
  },

  inputPassword: {
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
  },

  titlebar: {
    openCommandPalette: 'Ouvrir la palette de commandes',
    searchActions: 'Rechercher des actions',
    unavailableDuringInterview: 'Indisponible pendant un entretien',
    menu: 'Menu principal',
    minimize: 'Réduire',
    maximize: 'Agrandir',
    close: 'Fermer',
  },

  titlebarMenu: {
    home: 'Accueil',
    account: 'Compte',
    configuration: 'Réglages',
    documentation: 'Aide',
    language: 'Langue de l’application',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    signOut: 'Se déconnecter',
  },

  commandPalette: {
    title: 'Palette de commandes',
    description: 'Recherchez une action, une page ou un réglage.',
    searchPlaceholder: 'Rechercher des actions…',
    empty: 'Aucune action correspondante.',
    groups: {
      goTo: 'Aller à',
      session: 'Séance',
      app: 'Application',
    },
    home: 'Accueil',
    account: 'Compte',
    configuration: 'Réglages',
    subscribe: 'Abonnement',
    startMock: 'Démarrer un entretien d’entraînement',
    startLive: 'Démarrer l’assistant en direct',
    switchToFullSentence: 'Passer aux phrases complètes',
    switchToHintOnly: 'Passer aux indices seulement',
    hideTranscript: 'Masquer la transcription',
    showTranscript: 'Afficher la transcription',
    documentation: 'Aide',
    hotkeys: 'Raccourcis clavier',
    switchToLight: 'Passer en mode clair',
    switchToDark: 'Passer en mode sombre',
    signOut: 'Se déconnecter',
  },

  controlPanel: {
    stop: 'Arrêter',
    stopTooltip: 'Arrêter l’assistant',
    stopRunningHint: 'Termine la séance, propose de l’enregistrer et revient à l’accueil',
    stopIdleHint: 'Rien n’est en cours : lancez un entretien depuis l’accueil',
    stopTransientHint: 'Disponible une fois la séance lancée',

    checks: {
      configUnavailable:
        'Impossible de charger vos réglages enregistrés. Reconnexion : réessayez dans un instant.',
      nameMissing: 'Le nom complet n’est pas renseigné',
      profileMissing: 'Les données du profil ne sont pas renseignées',
      noMicrophone: 'Aucun micro détecté. Branchez-en un et réessayez.',
      deviceNotFound: (deviceName: string) =>
        `Périphérique d’entrée audio « ${deviceName} » introuvable`,
    },
    startFailed: 'Impossible de démarrer l’assistant',
  },

  audioGroup: {
    options: 'Options audio',
    optionsSwapFailed: 'Options audio : impossible de changer de micro, le précédent reste utilisé',
    optionsDeviceNotFound: 'Options audio : le micro choisi est introuvable',
    dialogTitle: 'Options audio',
    dialogDescription: 'Choisissez le micro physique que vous utilisez.',
    microphone: 'Micro',
    selectPlaceholder: 'Choisir un micro',
    switching: 'Changement de micro…',
    swapFailed: (deviceName: string) =>
      `Impossible de passer à ${deviceName}. Cet entretien utilise toujours le micro précédent. Arrêtez puis relancez l’assistant pour l’utiliser.`,
    takesEffectImmediately: 'S’applique immédiatement. La transcription continue.',
  },

  languageGroup: {
    current: (languageName: string) => `Langue de l’entretien : ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Langue de l’entretien : ${languageName} - la transcription n’a pas changé`,
    tooltip: (nativeName: string) => `Langue de l’entretien : ${nativeName}`,
    reconnecting: 'Reconnexion de la transcription…',
    suggestionsOnly: 'Suggestions seulement : la transcription se reconnecte encore',
    speechAndSuggestions: 'Reconnaissance vocale et suggestions',
    menuLabel: 'Langue de l’entretien',
    halfApplied:
      'Les suggestions ont changé, pas la transcription. Elle réessaie : arrêtez puis relancez l’assistant si elle ne revient pas.',
    willReconnect: 'La transcription se reconnecte ; la phrase en cours peut être coupée.',
  },

  languageSearch: {
    placeholder: 'Rechercher une langue…',
    empty: 'Aucune langue correspondante.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Indices',
    fullSentencesBadge: 'Phrases complètes',
    hintOnlyMode: 'Mode indices seulement',
    fullSentenceMode: 'Mode phrases complètes',
    hintOnlySummary: 'Titre + mots-clés',
    fullSentenceSummary: 'Réponses entièrement rédigées',
    ariaHintOnly: 'Mode de suggestion : indices seulement. Passer aux phrases complètes',
    ariaFullSentence: 'Mode de suggestion : phrases complètes. Passer aux indices seulement',
  },

  toolsGroup: {
    hideTranscription: 'Masquer la transcription',
    showTranscription: 'Afficher la transcription',
    enterStealth: 'Passer en mode furtif',
    stealthMode: 'Mode furtif',
    stealthUnavailable:
      'Disponible une fois l’entretien en direct lancé : il n’y a encore rien à masquer.',
    stealthAvailable:
      'Masque l’application des captures d’écran. Le même raccourci la fait revenir.',
    captureScreenshot: 'Prendre une capture d’écran',
    captureScreenshotTooltip: 'Capture d’écran',
    captureFailed: 'Impossible de prendre la capture d’écran',
    clearCaptures: 'Effacer les captures d’écran',
    clearCapturesTooltip: 'Effacer les captures',
    clearCapturesFailed: 'Impossible d’effacer les captures',
    generateSuggestion: 'Générer une suggestion à la demande',
    generateSuggestionTooltip: 'Générer une suggestion',
    generateSuggestionFailed: 'Impossible de générer la suggestion',
    clear: 'Effacer',
    clearInterview: 'Effacer l’entretien',
    clearFailed: 'Impossible d’effacer',
    exportInterview: 'Exporter l’entretien',
    exportTheInterview: 'Exporter cet entretien',
    nothingToExport: 'Rien à exporter pour l’instant',
    nothingToExportDescription:
      'Faites d’abord un entretien, puis exportez la transcription et les suggestions.',
    exportFailed: 'Impossible d’exporter l’entretien',
    exportDocx: 'Document Word (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Transcription',
    transcriptionShown: (combo: string) => `Transcription : affichée (${combo})`,
    transcriptionHidden: (combo: string) => `Transcription : masquée (${combo})`,
    showHotkeys: 'Raccourcis',
    showHotkeysLabel: 'Afficher les raccourcis clavier',
    showHotkeysTitle: 'Afficher les raccourcis clavier (?)',
  },

  runningIndicator: {
    idle: 'Inactif',
    starting: 'Démarrage',
    running: 'En cours',
    stopping: 'Arrêt',
  },

  zoomControl: {
    reset: 'Réinitialiser le zoom',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
  },

  creditsDisplay: {
    freePlan: 'Gratuit',
    planNames: {
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      yearly: 'Annuel',
      other: 'Abonné',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('fr-FR'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('fr-FR')}, ${new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `Illimité jusqu’au ${date}`,
    endsIn: (days: number) => `Se termine dans ${days} ${n(days, 'jour', 'jours')}`,
    freeLeft: (availableTime: string) => `${availableTime} gratuites`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} h`);
      if (minutes) parts.push(`${minutes} min`);
      return parts.join(' ') || '0 min';
    },
    lessThanAMinute: 'Moins d’1 min',
    noFreeTimeLeft: 'Plus de temps gratuit',
  },

  panels: {
    autoScroll: 'Défilement auto',
    enableAutoScroll: 'Activer le défilement automatique',
    scrollToBottom: 'Aller en bas',
    scrollToTop: 'Aller en haut',

    transcription: 'Transcription',
    noTranscripts: 'Aucune transcription pour l’instant',
    interviewer: 'Recruteur',

    liveSuggestions: 'Suggestions en direct',
    noSuggestions: 'Aucune suggestion pour l’instant',
    idleNoGeneration: 'Inactif : rien de généré pour l’instant',

    triggeredSuggestions: 'Suggestions à la demande',
    noTriggeredSuggestions: 'Aucune suggestion à la demande pour l’instant',
    suggestionCanceled: 'Suggestion annulée',

    mockInterview: 'Entretien d’entraînement',
    questionProgress: (current: number, total: number) => `Question ${current} sur ${total}`,
    preparingFirstQuestion: 'Préparation de votre première question…',
    you: 'Vous',
    followUp: 'Relance',
    skipped: 'Passée',
    noAnswer: 'Sans réponse',

    resizeTranscript: 'Redimensionner le panneau de transcription',
    resizeHint: 'Faites glisser pour redimensionner, double-cliquez pour réinitialiser',
  },

  saveHistory: {
    saveAsWord: 'Enregistrer en Word',
    saveAsMarkdown: 'Enregistrer en Markdown',
    formatHintLive: 'Word pour partager ou imprimer, Markdown pour garder en texte brut.',
    formatHintMock: 'Word pour partager ou imprimer, Markdown pour garder avec vos notes.',
    exportFailed: 'Impossible d’exporter l’entretien',

    live: {
      clear: {
        title: 'Enregistrer cet entretien avant de l’effacer ?',
        body: 'La transcription et les suggestions seront perdues.',
        discard: 'Effacer sans enregistrer',
      },
      start: {
        title: 'Enregistrer cet entretien avant d’en commencer un autre ?',
        body: 'La transcription et les suggestions seront perdues.',
        discard: 'Commencer sans enregistrer',
      },
      close: {
        title: 'Enregistrer cet entretien avant de fermer ?',
        body: 'La transcription et les suggestions seront perdues.',
        discard: 'Fermer sans enregistrer',
      },
      update: {
        title: 'Enregistrer cet entretien avant d’installer la mise à jour ?',
        body: 'L’application redémarre, et la transcription et les suggestions seront perdues.',
        discard: 'Installer sans enregistrer',
      },
      signout: {
        title: 'Enregistrer cet entretien avant de vous déconnecter ?',
        body: 'La transcription et les suggestions seront perdues.',
        discard: 'Se déconnecter sans enregistrer',
      },
      stop: {
        title: 'Enregistrer cet entretien ?',
        body: 'L’entretien est terminé. Sa transcription et ses suggestions ne sont encore enregistrées nulle part.',
        discard: 'Abandonner et revenir à l’accueil',
      },
      'mock-done': {
        title: 'Enregistrer votre rapport avant de terminer ?',
        body: 'Votre note, les commentaires et vos réponses seront perdus.',
        discard: 'Terminer sans enregistrer',
      },
      'mock-again': {
        title: 'Enregistrer ce rapport avant la prochaine série ?',
        body: 'Cette note, les commentaires et vos réponses seront remplacés.',
        discard: 'Recommencer sans enregistrer',
      },
    },

    mock: {
      clear: {
        title: 'Enregistrer d’abord le rapport de l’entretien d’entraînement ?',
        body: 'Ce rapport et vos réponses seront perdus.',
        discard: 'Effacer sans enregistrer',
      },
      start: {
        title: 'Enregistrer d’abord le rapport de l’entretien d’entraînement ?',
        body: 'Ce rapport et vos réponses seront perdus.',
        discard: 'Commencer sans enregistrer',
      },
      close: {
        title: 'Enregistrer le rapport de l’entretien d’entraînement avant de fermer ?',
        body: 'Ce rapport et vos réponses seront perdus.',
        discard: 'Fermer sans enregistrer',
      },
      update: {
        title:
          'Enregistrer le rapport de l’entretien d’entraînement avant d’installer la mise à jour ?',
        body: 'L’application redémarre, et ce rapport et vos réponses seront perdus.',
        discard: 'Installer sans enregistrer',
      },
      signout: {
        title: 'Enregistrer le rapport de l’entretien d’entraînement avant de vous déconnecter ?',
        body: 'Ce rapport et vos réponses seront perdus.',
        discard: 'Se déconnecter sans enregistrer',
      },
      stop: {
        title: 'Enregistrer le rapport de l’entretien d’entraînement ?',
        body: 'L’entretien est terminé. Ce rapport n’est encore enregistré nulle part.',
        discard: 'Abandonner et revenir à l’accueil',
      },
    },
  },

  headphoneNotice: {
    title: 'Un casque est indispensable',
    description:
      'Mettez-le avant de commencer. La voix du recruteur ne doit arriver qu’à vos oreilles, jamais à vos haut-parleurs.',
    liveSpeakers: 'Avec des haut-parleurs, votre micro entend le recruteur aussi bien que vous.',
    liveConsequence:
      'L’application prend alors sa question pour quelque chose que vous avez dit, et cesse d’y répondre - sans aucune erreur pour vous dire pourquoi.',
    mockSpeakers:
      'Avec des haut-parleurs, la question que vous venez d’entendre peut résonner au début de votre réponse.',
    mockConsequence:
      'Votre micro est coupé pendant que le recruteur parle, mais la réverbération de la pièce peut encore se glisser ensuite sous forme de mots parasites.',
    proceed: 'J’ai mis mon casque',
  },

  permissionGate: {
    title: 'Autorisations requises',
    microphone: 'Micro',
    micChecking: 'Vérification…',
    micGranted: 'Accès autorisé',
    micBlocked: 'Activez-le dans Réglages Système, puis cliquez sur Vérifier à nouveau',
    micRequired: 'Nécessaire pour capter votre voix',
    grantAccess: 'Autoriser l’accès',
    openSettings: 'Ouvrir les Réglages',
    screenRecording: 'Enregistrement de l’écran',
    screenChecking: 'Vérification…',
    screenNeedsRelaunch: 'Autorisé : redémarrez l’application avant de commencer pour l’appliquer',
    screenGranted: 'Accès autorisé',
    screenNotDetermined: 'Sera demandé au début de l’enregistrement',
    screenBlocked:
      'Activez-le dans Réglages Système, puis redémarrez l’application pour l’appliquer',
    restartApp: 'Redémarrer l’application',
    checking: 'Vérification…',
    checkAgain: 'Vérifier à nouveau',
    start: 'Commencer',
  },

  exportToast: {
    exported: (format: string) => `Entretien exporté au format ${format}`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'Ouvrir le fichier exporté',
    openFile: 'Ouvrir le fichier',
    showInFolderLabel: 'Afficher le fichier exporté dans son dossier',
    showInFolder: 'Afficher dans le dossier',
    dismiss: 'Ignorer',
  },

  notices: {
    connecting: 'Connexion au serveur…',
    starting: 'Démarrage…',
    stopping: 'Arrêt…',
    dismiss: 'Ignorer',
  },

  updateNotification: {
    available: (version: string) => `Mise à jour disponible : v${version}`,
    availableDescription: 'Le téléchargement démarrera automatiquement en arrière-plan.',
    downloading: (percent: string) => `Téléchargement de la mise à jour… ${percent} %`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} Mo / ${totalMb} Mo`,
    downloaded: (version: string) => `Mise à jour téléchargée : v${version}`,
    downloadedDescriptionMac:
      'Cliquez pour ouvrir le programme d’installation, puis glissez-le dans Applications.',
    downloadedDescription: 'Cliquez pour redémarrer et installer la mise à jour.',
    openInstaller: 'Ouvrir le programme d’installation',
    restartNow: 'Redémarrer maintenant',
  },

  mock: {
    setup: {
      title: 'Entretien d’entraînement',
      description:
        'L’IA pose les questions, vous répondez à voix haute. Rien n’est enregistré sauf si vous l’exportez.',
      start: 'Démarrer l’entretien d’entraînement',
      starting: 'Démarrage…',
      seniority: 'Niveau',
      seniorityOptions: {
        junior: 'Junior',
        mid: 'Confirmé',
        senior: 'Senior',
        staff: 'Staff+',
      },
      questions: 'Questions posées',
      questionOption: (count: number, minutes: number) =>
        `${count} ${n(count, 'question', 'questions')}, environ ${minutes} min`,
      difficulty: 'Difficulté',
      difficultyOptions: {
        easy: {
          label: 'Échauffement',
          description: 'Questions simples, avec une seule demande claire chacune.',
        },
        standard: {
          label: 'Standard',
          description: 'Ce qu’un recruteur ordinaire demanderait vraiment.',
        },
        hard: {
          label: 'Difficile',
          description: 'Questions poussées sur les compromis et les cas limites.',
        },
      },
      languageDescription:
        'La langue des questions du recruteur, de la transcription et de vos commentaires.',
      estimate: (minutes: number) => `Environ ${minutes} min en général.`,
      unlimited: 'Illimité avec votre abonnement.',
      covers: (minutes: number) =>
        `Votre temps gratuit couvre environ ${minutes} ${n(minutes, 'minute', 'minutes')}.`,
      endsEarly:
        'La séance s’arrête quand votre temps gratuit est épuisé, et vous recevez quand même votre rapport.',
    },

    session: {
      heading: 'Séance d’entretien d’entraînement',
      starting: 'Démarrage…',
      generating: 'Préparation de la question suivante…',
      evaluating: 'Réflexion…',
      scoring: 'Notation de l’entretien…',
      stopping: 'Fin de l’entretien…',
      speaking: 'Le recruteur parle. Votre micro est coupé pendant la question.',
      readThenReady:
        'Lisez la question. Votre réponse est enregistrée à partir du moment où vous êtes prêt.',
      listening: 'À l’écoute…',
      ready: 'Je suis prêt',
      doneAnswering: 'J’ai terminé',
      doneAnsweringTooltip: 'Envoyer votre réponse et passer à la suite',
      toggleHints: 'Activer ou désactiver les suggestions en direct',
      hintsOn: 'Suggestions en direct : activées',
      hintsOff: 'Suggestions en direct : désactivées',
      hintsOnHint: 'Affiche ce que répondrait l’assistant en direct',
      hintsOffHint: 'S’entraîner sans indice',
      endInterview: 'Terminer l’entretien',
      startFailed: 'Impossible de démarrer l’entretien d’entraînement',
      startingPage: 'Démarrage de l’entretien d’entraînement…',
    },

    report: {
      heading: 'Rapport de l’entretien d’entraînement',
      verdictExcellent: 'Excellent',
      verdictStrong: 'Solide',
      verdictDeveloping: 'En progrès',
      verdictNeedsWork: 'À travailler',
      scoreFailed: (reason: string) =>
        `La note globale n’a pas pu être calculée (${reason}). Vos réponses restent affichées ci-dessous et peuvent toujours être exportées.`,
      scoreAgain: 'Noter à nouveau',
      scoring: 'Notation…',
      overallScore: 'Note globale',
      strengths: 'Points forts',
      gaps: 'Points à améliorer',
      nothingNoted: 'Rien de particulier à signaler.',
      perQuestion: 'Détail par question',
      yourAnswer: 'Votre réponse',
      noAnswerRecorded: '(aucune réponse enregistrée)',
      score: 'Note',
      strongerAnswer: 'Réponse plus solide',
      saveAsWord: 'Enregistrer en Word',
      saveAsMarkdown: 'Enregistrer en Markdown',
      exportFailed: 'Impossible d’exporter le rapport',
      practiseAgain: 'Recommencer',
      done: 'Terminé',
    },
  },

  mainRoute: {
    redirectingToLogin: 'Redirection vers la connexion…',
    authenticating: 'Authentification…',
    transcriptionHidden: 'La transcription est masquée',
  },

  documentation: {
    intro: (appName: string) =>
      `${appName} est un assistant IA qui améliore vos entretiens grâce à des suggestions en temps réel et à des recommandations de code à partir de l’écran.`,
    docsLead: 'Pour la documentation complète, rendez-vous sur ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing:
      '. Appuyez sur Cmd/Ctrl+K n’importe où dans l’application pour rechercher une action.',

    lostWindow: {
      title: 'Fenêtre perdue ?',
      body: (appName: string) =>
        `En mode furtif, ${appName} quitte la barre des tâches et le Dock de macOS pour rester invisible lorsque vous partagez votre écran, ce qui signifie aussi qu’une fenêtre réduite n’a aucun bouton sur lequel cliquer. Relancez simplement ${appName} : il ne démarre pas une deuxième copie, il fait revenir cette fenêtre. Hors du mode furtif, le bouton de la barre des tâches et l’icône du Dock sont là comme d’habitude, sauf si vous avez activé « Masquer l’icône de la barre des tâches pendant les entretiens ».`,
    },

    language: {
      title: 'Passer un entretien dans une autre langue',
      oneSetting:
        'Un seul réglage couvre toute la séance : le modèle vocal qui transcrit l’appel, la langue des suggestions et celle du rapport exporté. Réglez-le avec le bouton de langue de la barre de contrôle, sur la page Réglages ou dans la fenêtre de l’entretien d’entraînement : tous modifient la même chose.',
      supported: (count: number) => `${count} langues sont prises en charge :`,
      midInterview:
        'Vous pouvez la changer en cours d’entretien. Les suggestions suivent immédiatement, dès la réponse suivante. La reconnaissance vocale met un peu plus de temps : elle se reconnecte, donc la phrase prononcée à cet instant peut être coupée dans la transcription.',
      textOnly:
        'Dans un entretien d’entraînement, une langue marquée « texte seul » n’a pas de voix disponible : le recruteur écrit ses questions au lieu de les prononcer. Vous répondez toujours à voix haute et la notation ne change pas.',
      appLanguageTitle: 'L’application a sa propre langue',
      appLanguageBody:
        'La langue ci-dessus est celle de l’entretien. La langue dans laquelle l’application elle-même est écrite - ses boutons, titres et messages - est un réglage distinct sur la page Réglages, et c’est aussi la première question de la configuration initiale. Aucune n’est déduite de l’autre : une personne russophone qui passe un entretien en anglais veut une transcription en anglais et une application en russe.',
    },

    microphone: {
      title: 'Changer de micro en cours d’entretien',
      body: 'Le bouton du micro dans la barre de contrôle reste disponible pendant l’entretien. Si votre casque n’a plus de batterie, est débranché ou n’était pas le bon appareil, choisissez-en un autre ici plutôt que d’arrêter l’assistant : l’arrêter efface aussi la transcription et les suggestions.',
      immediate:
        'Le changement s’applique immédiatement et la transcription continue, donc rien n’est coupé. Si l’appareil choisi ne peut pas être ouvert - débranché ou utilisé par une autre application -, l’entretien continue avec le précédent et l’application vous le signale.',
    },

    suggestionStyle: {
      title: 'Indices seulement ou phrases complètes',
      body: 'Indices seulement est le mode par défaut : chaque suggestion arrive sous forme d’un titre d’une ligne et de mots-clés, pour la saisir d’un coup d’œil et continuer à parler. Phrases complètes rédige la réponse comme on la dirait : plus à lire, moins à improviser.',
      switching: (combo: string) =>
        `Passez de l’un à l’autre dans la barre de contrôle, sur la page Réglages ou avec ${combo}, qui fonctionne aussi en mode furtif. Les suggestions déjà à l’écran gardent leur style ; seule la suivante change.`,
    },

    settings: {
      title: 'Où se trouvent vos réglages',
      accountLabel: 'Compte',
      accountBody:
        ' contient qui vous êtes : le nom que vous utilisez, le profil ou CV dont s’inspirent vos suggestions, le contexte du poste visé et votre mot de passe.',
      configurationLabel: 'Réglages',
      configurationBody:
        ' contient le déroulement de l’entretien : la langue de l’application, votre micro (avec un test), la langue de l’entretien, le style des suggestions et l’ancrage du panneau de transcription. Rien n’est à enregistrer ; chaque modification s’applique aussitôt.',
      both: 'Les deux sont accessibles depuis l’accueil, le menu de la barre de titre et la palette Cmd/Ctrl+K. Une nouvelle installation les parcourt toutes une fois au premier lancement.',
    },

    hotkeys: 'Raccourcis',
  },

  payment: {
    title: 'Abonnement',
    tabs: {
      buy: 'Formules',
      history: 'Historique',
      status: 'Statut',
    },

    buy: {
      currentPlan: 'Votre formule',
      subscribedUntil: (plan: string, date: string) => `${plan}, jusqu’au ${date}`,
      daysLeft: (days: number) => `${days} ${n(days, 'jour restant', 'jours restants')}`,
      freePlan: 'Formule gratuite',
      freeLeft: (duration: string) =>
        `Il vous reste ${duration} d’entretiens avec le modèle gratuit.`,
      freeUsedUp: 'Plus de temps gratuit. Abonnez-vous pour continuer vos entretiens.',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} ${n(hours, 'heure', 'heures')}`);
        if (minutes) parts.push(`${minutes} ${n(minutes, 'minute', 'minutes')}`);
        return parts.join(' ') || '0 minute';
      },
      loadingPlans: 'Chargement des formules…',
      mostPopular: 'La plus populaire',
      planDescriptions: {
        monthly: 'Entretiens illimités avec le modèle SOTA pendant un mois',
        quarterly: 'Entretiens illimités avec le modèle SOTA pendant trois mois',
        yearly: 'Entretiens illimités avec le modèle SOTA pendant un an',
      },
      perMonth: ' / mois',
      billedAs: (price: number, months: number) => `${price} $ payés une fois, pour ${months} mois`,
      save: (percent: number) => `Économisez ${percent} %`,
      prepaid: 'Payé une fois en crypto. Un pass ne se renouvelle jamais tout seul.',
      refundPrompt: 'Besoin d’un remboursement ?',
      refundContact: 'Contacter le support',
      extends:
        'Votre abonnement est actif : un nouveau pass ajoute sa durée après la date de fin actuelle.',
      selected: 'Sélectionnée',
      buy: 'Choisir',
      detailsTitle: 'Détails du paiement',
      detailsLead: 'Finalisez l’achat de la formule ',
      detailsFor: ' pour ',
      currencyLabel: 'Devise de paiement',
      currencyPlaceholder: 'Choisir une devise',
      currencySearchPlaceholder: 'Rechercher une devise…',
      noCurrency: 'Aucune devise trouvée',
      createPayment: 'Créer le paiement',
      creatingPayment: 'Création du paiement…',
    },

    history: {
      loading: 'Chargement de l’historique des paiements…',
      loadFailed: 'Impossible de charger l’historique des paiements',
      emptyTitle: 'Aucun paiement',
      emptyBody: 'Vous n’avez encore effectué aucun paiement. Abonnez-vous pour commencer.',
      subscribe: 'Voir les formules',
      refreshing: 'Actualisation…',
      remainder: 'Solde restant',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} mois`
          : days > 0
            ? `${days.toLocaleString('fr-FR')} ${n(days, 'jour', 'jours')}`
            : credits > 0
              ? `${credits.toLocaleString('fr-FR')} crédits`
              : '-',
      columns: {
        created: 'Date',
        paymentId: 'ID du paiement',
        purchase: 'Achat',
        amount: 'Montant',
        status: 'Statut',
        action: 'Action',
      },
      notAvailable: 'N/D',
      view: 'Voir',
    },

    status: {
      title: 'Vérifier un paiement',
      description: 'Saisissez un ID de paiement pour voir son statut actuel',
      idPlaceholder: 'Saisissez l’ID du paiement',
      check: 'Vérifier le statut',
      checking: 'Vérification…',
      notFound: 'Paiement introuvable',
      fetchFailed: 'Impossible d’obtenir le statut du paiement',
      order: (orderId: string) => `Commande n° ${orderId}`,
      refreshing: 'Actualisation…',
      amountToPay: 'Montant à payer',
      priceUsd: 'Prix (USD)',
      actuallyPaid: 'Montant réellement payé',
      paymentMethods: 'Moyens de paiement',
      qrTab: 'QR code',
      addressTab: 'Adresse',
      downloadQr: 'Télécharger le QR code',
      qrSaved: 'QR code enregistré',
      scanWithWallet: 'Scannez-le avec votre portefeuille',
      qrIncludes: (amount: string) => `Le QR code contient l’adresse et le montant (${amount})`,
      paymentAddress: 'Adresse de paiement',
      amountToSend: 'Montant à envoyer',
      sendExactly: 'Envoyez exactement ce montant à l’adresse ci-dessus.',
      successTitle: 'Paiement réussi !',
      successBody: 'Votre abonnement a été appliqué à votre compte.',
      expiredTitle: 'Paiement expiré',
      failedTitle: 'Paiement échoué',
      expiredBody: 'Ce paiement a expiré. Veuillez en créer un nouveau.',
      failedBody: 'Le paiement n’a pas pu être traité. Veuillez réessayer.',
      refundedTitle: 'Paiement remboursé',
      refundedBody: 'Ce paiement a été remboursé. Contactez le support pour toute question.',
      receivedTitle: 'Paiement reçu',
      receivedBody:
        'Votre paiement est en cours de confirmation sur le réseau. Aucun autre paiement n’est nécessaire, et votre abonnement sera appliqué automatiquement.',
      partialTitle: 'Paiement partiel reçu',
      partialBody:
        'Nous préparons une nouvelle adresse pour le solde restant. Elle apparaîtra ici et vous sera envoyée par e-mail. N’envoyez rien de plus à l’ancienne adresse.',
      created: 'Créé :',
      updated: 'Mis à jour :',
      addressCopied: 'Adresse de paiement copiée',
      amountCopied: 'Montant copié',
      currencyCopied: 'Devise copiée',
    },

    statusLabels: {
      waiting: 'En attente',
      confirming: 'Confirmation',
      confirmed: 'Confirmé',
      sending: 'Envoi',
      partiallyPaid: 'Payé en partie',
      finished: 'Terminé',
      failed: 'Échoué',
      refunded: 'Remboursé',
      expired: 'Expiré',
    },

    errors: {
      getPlans: 'Impossible d’obtenir les formules',
      getCurrencies: 'Impossible d’obtenir les devises',
      createPayment: 'Impossible de créer le paiement',
      getStatus: 'Impossible d’obtenir le statut du paiement',
      getHistory: 'Impossible d’obtenir l’historique des paiements',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: 'Impossible d’enregistrer le micro choisi',
    microphoneSwapFailed: 'Enregistré, mais l’entretien utilise toujours le micro précédent',
    microphoneSwapFailedHint:
      'Vérifiez que l’appareil est branché, puis arrêtez et relancez l’assistant.',
    saveLanguageFailed: 'Impossible d’enregistrer la langue de l’entretien',
    languageHalfApplied:
      'Les suggestions ont changé de langue ; la transcription se reconnecte encore',
    languageHalfAppliedHint:
      'Elle continue d’essayer. Arrêtez puis relancez l’assistant si elle ne revient pas.',
    saveSuggestionModeFailed: 'Impossible d’enregistrer le mode de suggestion',
    saveTranscriptPanelFailed: 'Impossible d’enregistrer le réglage du panneau de transcription',
    saveMockHintsFailed: 'Impossible d’enregistrer le réglage des suggestions en direct',
    saveHideTaskbarFailed:
      'Impossible d’enregistrer le réglage de la barre des tâches. Veuillez réessayer.',
    saveAllowScreenCaptureFailed:
      'Impossible d’enregistrer le réglage de capture d’écran. Veuillez réessayer.',
    saveUiLanguageFailed: 'Impossible d’enregistrer la langue de l’application',
  },

  assistant: {
    mockRunning: 'Arrêtez l’entretien d’entraînement avant de lancer une séance en direct.',
    stoppedUncleanly: 'L’assistant s’est arrêté, mais tout ne s’est pas fermé proprement',
    stoppedUncleanlyHint:
      'Redémarrez l’application si des transcriptions ou des suggestions continuent d’arriver.',
    startFailed: 'Impossible de démarrer l’assistant',
    stopFailed: 'Impossible d’arrêter l’assistant',
    screenCaptureTimedOut: 'La capture d’écran a pris trop de temps. Veuillez réessayer.',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `Périphérique d’entrée audio « ${deviceName} » introuvable. Choisissez-en un autre dans les réglages audio de l’écran principal.`,
  },

  creditGate: {
    tooLow: 'Pas assez de temps gratuit pour commencer',
    outOfCredits: 'Temps gratuit épuisé : la séance est terminée',
    outOfCreditsHint: 'Abonnez-vous pour des entretiens illimités.',
    replaced: 'Entretien terminé : un autre a démarré sur ce compte',
    replacedHint: 'Un compte ne peut mener qu’un entretien à la fois.',
    lowBalance: (minutes: number) =>
      `Il reste environ ${minutes} ${n(minutes, 'minute', 'minutes')} de temps gratuit`,
    lowBalanceHint: 'La séance s’arrête quand votre temps gratuit est épuisé.',
    tooLowHint:
      'Une séance nécessite au moins une minute. Abonnez-vous pour des entretiens illimités avec le modèle SOTA.',
    subscribe: 'Voir les formules',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) =>
      `Votre abonnement se termine dans ${days} ${n(days, 'jour', 'jours')}`,
    endingSoonHint:
      'Achetez un autre pass pour garder des entretiens illimités. Sa durée s’ajoute après la date de fin actuelle.',
    ended: 'Votre abonnement est terminé',
    endedHint: 'Les entretiens utilisent désormais votre temps gratuit avec le modèle gratuit.',
  },

  trialNotice: {
    freeTierLead: 'Formule gratuite : 1 heure d’entretiens avec le modèle ',
    freeTier: 'gratuit',
    freeTierTail: '.',
    sotaLead: 'Abonnez-vous pour des entretiens illimités avec le modèle ',
    sota: 'le plus avancé',
    sotaTail: '.',
  },
};
