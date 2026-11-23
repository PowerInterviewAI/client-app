/**
 * Spanish (neutral, for Spain and Latin America alike).
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here, and the register is the informal "tú" most Spanish-language software uses.
 */
import type { Translation } from './en';

const n = (count: number, one: string, other: string) => (count === 1 ? one : other);

export const es: Translation = {
  common: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    back: 'Atrás',
    continue: 'Continuar',
    finish: 'Terminar',
    retry: 'Reintentar',
    view: 'Ver',
    loading: 'Cargando…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'Idioma de la aplicación',
    description: 'Botones, menús y mensajes. Independiente del idioma de la entrevista.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `Configura ${appName}`,
    guideEyebrow: 'Guía de configuración',
    progress: (current: number, total: number, label: string) =>
      `Paso ${current} de ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'Idioma de la aplicación',
        title: '¿En qué idioma quieres la aplicación?',
        description:
          'Elige el que leas con más facilidad. El resto de la configuración lo seguirá.',
      },
      profile: {
        label: 'Perfil',
        title: 'Cuéntanos quién eres',
        description:
          'Las sugerencias se escriben a partir de tu experiencia, así que es obligatorio.',
      },
      context: {
        label: 'Contexto del puesto',
        title: '¿Para qué puesto es la entrevista?',
        description: 'Opcional. Pega la descripción del puesto para respuestas adaptadas al rol.',
      },
      language: {
        label: 'Idioma',
        title: 'Elige el idioma de la entrevista',
      },
      microphone: {
        label: 'Micrófono',
        title: 'Elige tu micrófono',
        description:
          'Elige el micrófono por el que vas a hablar y pruébalo. Usa auriculares: con altavoces la aplicación puede dejar de responder.',
      },
      mode: {
        label: 'Sugerencias',
        title: '¿Cómo quieres leer las sugerencias?',
      },
      mockHints: {
        label: 'Entrevista de práctica',
        title: '¿Pistas en una entrevista de práctica?',
      },
      zoom: {
        label: 'Tamaño',
        title: '¿Se lee con comodidad?',
      },
      transcript: {
        label: 'Transcripción',
        title: '¿Mostrar una transcripción en directo?',
      },
    },

    blocked: {
      accountUnreachable:
        'No se pudo acceder a tu cuenta, así que todavía no se puede guardar nada de lo que escribas aquí.',
      needName: 'Añade tu nombre completo para continuar.',
      needProfile: 'Añade tu perfil para continuar.',
    },

    loadingAccount: 'Cargando tu cuenta…',
    accountUnreachable:
      'No se pudo acceder a tu cuenta. Nada de lo que escribas aquí se podrá guardar hasta que vuelva.',

    skip: 'Omitir por ahora',
    skipTooltip: 'Puedes volver a ejecutar la configuración desde Configuración',

    allSet: 'Todo listo',
    profileNotSavedOnSkip:
      'Configuración omitida, pero tu perfil no se guardó. Inténtalo de nuevo desde Cuenta.',
    completionNotRecorded:
      'Configuración omitida, pero no pudimos registrarlo. Es posible que se vuelva a ofrecer.',
    saveProfileFailed: 'No se pudo guardar tu perfil',
    finishFailed: 'No se pudo guardar la configuración. Revisa tu conexión e inténtalo de nuevo.',
  },

  configuration: {
    title: 'Configuración',
    setupGuide: {
      title: 'Guía de configuración',
      description: 'Recorre todo lo de esta página, y tu perfil, paso a paso.',
      action: 'Iniciar configuración',
    },
    hotkeys: {
      title: 'Atajos de teclado',
      description: 'Todo lo que puedes hacer sin tocar la aplicación durante una entrevista.',
    },
  },

  auth: {
    fields: {
      email: 'Correo electrónico',
      password: 'Contraseña',
      username: 'Nombre de usuario',
      confirmPassword: 'Confirmar contraseña',
      newPassword: 'Nueva contraseña',
      confirmNewPassword: 'Confirmar nueva contraseña',
      verificationCode: 'Código de verificación',
      resetCode: 'Código de restablecimiento',
    },

    signIn: {
      title: 'Iniciar sesión',
      description: (appName: string) => `Usa tu cuenta para acceder a ${appName}`,
      submit: 'Iniciar sesión',
      submitting: 'Iniciando sesión…',
      rememberMe: 'Recordarme',
      noAccount: '¿No tienes cuenta? Crea una nueva.',
      forgotPassword: '¿Olvidaste tu contraseña?',
    },

    signup: {
      title: 'Crear cuenta',
      description: (appName: string) => `Registra una cuenta nueva en ${appName}`,
      sendCode: 'Enviar código',
      sending: 'Enviando…',
      haveAccount: '¿Ya tienes cuenta? Inicia sesión',
      codeNotice: (email: string) =>
        `Si ${email} todavía no tiene cuenta, le enviamos un código de verificación. Pégalo abajo. Si ya la tiene, le enviamos una nota que explica cómo iniciar sesión.`,
      verify: 'Verificar',
      verifying: 'Verificando…',
      changeEmail: 'Cambiar correo',
      resendCode: 'Reenviar código',
      requestResent: 'Solicitud enviada de nuevo.',
      resendFailed: 'No se pudo reenviar.',
      create: 'Crear cuenta',
      creating: 'Creando…',
      sendCodeFailed: 'No se pudo enviar el código de verificación. Inténtalo de nuevo.',
      invalidCode: 'Código de verificación no válido o caducado.',
      succeeded: '¡Registro completado! Inicia sesión.',
      failed: 'No se pudo completar el registro. Inténtalo de nuevo.',
    },

    reset: {
      title: 'Restablecer contraseña',
      description: (appName: string) => `Define una nueva contraseña para tu cuenta de ${appName}`,
      sendResetCode: 'Enviar código',
      sending: 'Enviando…',
      backToSignIn: 'Volver a iniciar sesión',
      codeNotice: (email: string) =>
        `Si existe una cuenta para ${email}, le enviamos un código de restablecimiento. Pégalo abajo. Solo se puede usar una vez, y el correo indica cuándo caduca.`,
      verify: 'Verificar',
      verifying: 'Verificando…',
      changeEmail: 'Cambiar correo',
      resendCode: 'Reenviar código',
      codeResent: 'Código reenviado.',
      resendFailed: 'No se pudo reenviar el código.',
      signsYouOut:
        'Al definir una nueva contraseña se cerrará tu sesión en todos los dispositivos.',
      setNewPassword: 'Guardar nueva contraseña',
      saving: 'Guardando…',
      done: 'Contraseña restablecida',
      startOver: 'Empezar de nuevo',
      sendFailed: 'No se pudo enviar el código. Inténtalo de nuevo.',
      verifyFailed: 'No se pudo verificar el código.',
      succeeded: 'Contraseña restablecida. Inicia sesión con la nueva contraseña.',
      failed:
        'No se pudo restablecer la contraseña. El código puede haber caducado: pide uno nuevo.',
    },

    passwordsDoNotMatch: 'Las contraseñas no coinciden',

    errors: {
      sendCodeFailed: 'No se pudo enviar el código de verificación',
      invalidCode: 'Código de verificación no válido o caducado',
      loginFailed: 'No se pudo iniciar sesión',
      signupFailed: 'No se pudo completar el registro',
      logoutFailed: 'No se pudo cerrar sesión',
      changePasswordFailed: 'No se pudo cambiar la contraseña',
      sendResetCodeFailed: 'No se pudo enviar el código de restablecimiento',
      invalidResetCode: 'Código de restablecimiento no válido o caducado',
      resetFailed: 'No se pudo restablecer la contraseña',
    },
  },

  home: {
    welcome: (firstName: string) => `Hola de nuevo, ${firstName}`,
    welcomeAnonymous: 'Hola de nuevo',
    subtitle:
      'Practica con un entrevistador de IA o recibe ayuda en directo durante una llamada real.',

    mock: {
      title: 'Iniciar entrevista de práctica',
      ready:
        'La IA pregunta, tú respondes en voz alta y al final recibes un informe con puntuación.',
      unsupported:
        'Aún no está disponible en este servidor. Actualiza la aplicación o vuelve a intentarlo más tarde.',
      liveRunning:
        'Detén primero el asistente en directo: los dos no pueden compartir el micrófono.',
      unaffordable: 'No te queda suficiente tiempo gratis. Suscríbete para seguir practicando.',
    },

    live: {
      title: 'Iniciar asistente en directo',
      resumeTitle: 'Volver a tu entrevista',
      ready: 'Transcribe tu entrevista real y sugiere respuestas en el momento.',
      running: 'Tu asistente en directo ya está en marcha.',
      mockRunning:
        'Termina primero la entrevista de práctica: las dos no pueden compartir el micrófono.',
      unaffordable:
        'No te queda suficiente tiempo gratis. Suscríbete para seguir con tus entrevistas.',
    },

    accountLabel: 'Cuenta',
    notSignedIn: 'Sin sesión iniciada',
    planLabel: 'Plan',
    planUnavailable: 'No disponible',
    subscribe: 'Suscripción',

    nav: {
      account: 'Cuenta',
      configuration: 'Configuración',
      documentation: 'Documentación',
    },

    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
    signOutBlocked: 'Detén la entrevista antes de cerrar sesión',
    signOutFailed: 'No se pudo cerrar sesión',
  },

  account: {
    title: 'Cuenta',
    signedInAs: 'Sesión iniciada como',
    password: {
      title: 'Contraseña',
      description: 'Cambia la contraseña de tu cuenta',
      action: 'Cambiar contraseña',
    },
    loadFailed: 'No se pudieron cargar tus datos guardados. Vuelve a conectarte antes de editar.',
    save: 'Guardar cambios',
    saving: 'Guardando…',
    saved: 'Datos de la cuenta guardados',
    saveFailed: 'No se pudieron guardar los datos de la cuenta',
  },

  profileFields: {
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'El nombre que usas en la entrevista',
    profile: 'Perfil',
    profilePlaceholder:
      'Pega tu CV, tu perfil de LinkedIn o una breve biografía. Las sugerencias se escriben a partir de esto, así que cuanto más detalle, más se parecerán a ti.',
    context: 'Contexto',
    contextPlaceholder:
      'Pega la descripción del puesto, los requisitos del rol o cualquier otra cosa sobre la entrevista que preparas.',
    limitReached: (max: number) =>
      `Límite de caracteres alcanzado (${max.toLocaleString('es-ES')}). El texto sobrante no se añadió.`,
    charactersLeft: (remaining: number) =>
      `${n(remaining, 'Queda', 'Quedan')} ${remaining.toLocaleString('es-ES')} ${n(remaining, 'carácter', 'caracteres')}`,
  },

  microphoneField: {
    label: 'Micrófono',
    noDevices: 'No se detectó ningún micrófono. Conecta uno y aparecerá aquí.',
    selectPlaceholder: 'Selecciona un micrófono',
    lookingPlaceholder: 'Buscando micrófonos…',
    test: 'Probar',
    stopTest: 'Detener prueba',
    openFailed:
      'No se pudo abrir este micrófono. Comprueba que está conectado y que ninguna otra aplicación lo usa.',
    notConnected: (deviceName: string) =>
      `“${deviceName}” ya no está conectado. Elige otro micrófono.`,
    saySomething: 'Di algo: la barra debería moverse mientras hablas.',
    runningHint: 'La entrevista está usando este micrófono. Podrás probarlo cuando termine.',
    testHint:
      'Pruébalo antes de la entrevista: un micrófono en silencio se ve igual que una habitación tranquila.',
  },

  micLevelMeter: {
    label: 'Nivel de entrada del micrófono',
    hearing: 'Te escucho',
    silent: 'Silencio',
  },

  suggestionModeField: {
    label: 'Estilo de las sugerencias',
    hintOnly: 'Solo pistas',
    hintOnlyDescription: 'Un titular y palabras clave para leer de un vistazo. Recomendado.',
    fullSentences: 'Frases completas',
    fullSentencesDescription: 'La respuesta completa, escrita tal como la dirías.',
    switchHint: (combo: string) =>
      `Se puede cambiar durante la entrevista desde la barra de control o con ${combo}.`,
  },

  zoomField: {
    label: 'Tamaño de la interfaz',
    smaller: 'Más pequeño',
    larger: 'Más grande',
    reset: 'Restablecer',
    description: (combo: string) => `Escala toda la aplicación. También con ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Mostrar el panel de transcripción',
    description: (combo: string) =>
      `Transcripción en directo bajo tus sugerencias. Actívala o desactívala con ${combo}.`,
  },

  hideTaskbarField: {
    label: 'Ocultar el icono de la barra de tareas durante las entrevistas',
    description:
      'Mantiene la ventana por encima de todo (en macOS también se oculta el icono del Dock). No se puede minimizar: si la pierdes, vuelve a abrir la aplicación.',
  },
  allowScreenCaptureField: {
    label: 'Permitir la captura de pantalla',
    description:
      'Permite que al compartir pantalla o grabar se vea la ventana de la aplicación. El modo sigiloso siempre la oculta.',
  },
  mockHintsField: {
    label: 'Mostrar pistas en las entrevistas de práctica',
    description:
      'Muestra la respuesta del asistente junto a cada pregunta, para compararla con la tuya.',
  },

  languageField: {
    label: 'Idioma de la entrevista',
    textOnly: 'solo texto',
    reconnectFailed:
      'Las sugerencias cambiaron de idioma, pero la transcripción sigue reconectándose. Detén e inicia el asistente si no vuelve.',
    description: 'Lo que se transcribe y el idioma en que llegan tus sugerencias.',
    noVoiceNotice:
      'El entrevistador escribirá sus preguntas en lugar de decirlas. Tú sigues respondiendo en voz alta y la puntuación es la misma.',
  },

  changePassword: {
    title: 'Cambiar contraseña',
    description: 'Introduce tu contraseña actual y elige una nueva.',
    current: 'Contraseña actual',
    currentPlaceholder: 'Introduce la contraseña actual',
    next: 'Nueva contraseña',
    nextPlaceholder: 'Introduce la nueva contraseña',
    confirm: 'Confirmar nueva contraseña',
    confirmPlaceholder: 'Confirma la nueva contraseña',
    submit: 'Cambiar contraseña',
    submitting: 'Cambiando…',
    mismatch: 'Las nuevas contraseñas no coinciden.',
    succeeded: 'Contraseña cambiada correctamente',
    failed: 'No se pudo cambiar la contraseña',
  },

  hotkeys: {
    dialogTitle: 'Atajos de teclado',
    dialogDescription: 'Todo lo que puedes hacer sin tocar la aplicación durante una entrevista.',

    groups: {
      general: 'General',
      window: 'Gestión de ventanas',
      panels: 'Desplazar paneles',
      triggered: 'Sugerencias a petición',
    },

    keys: {
      StopAll: {
        title: 'Detener todo',
        description: 'Detiene el asistente y sale del modo sigiloso',
      },
      ToggleStealth: {
        title: 'Modo sigiloso',
        description:
          'Oculta la aplicación de la captura de pantalla durante una entrevista. Las mismas teclas la vuelven a mostrar.',
      },
      Opacity: {
        title: 'Opacidad',
        description: 'Cambia la opacidad de la ventana en modo sigiloso',
      },
      ToggleTranscript: {
        title: 'Mostrar transcripción',
        description: 'Muestra u oculta el panel de transcripción; también en modo sigiloso',
      },
      ToggleSuggestionMode: {
        title: 'Solo pistas / Frases completas',
        description:
          'Alterna las sugerencias entre solo pistas (un titular y palabras clave para leer de un vistazo) y frases completas. También en modo sigiloso.',
      },
      PlaceWin: {
        title: 'Colocar ventana',
        description: 'Coloca la ventana en una esquina, un lado o el centro',
      },
      MoveWin: { title: 'Mover ventana', description: 'Mueve la ventana en la dirección indicada' },
      ResizeWin: {
        title: 'Redimensionar ventana',
        description: 'Cambia el tamaño de la ventana en la dirección indicada',
      },
      ZoomInOutReset: {
        title: 'Ampliar/Reducir/Restablecer',
        description: 'Ajusta o restablece el zoom de la interfaz',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Desplazar panel en directo',
        description: 'Baja, sube o ve al final del panel de sugerencias en directo',
      },
      ScrollActionSuggestionPanel: {
        title: 'Desplazar panel a petición',
        description: 'Baja, sube o ve al final del panel de sugerencias a petición',
      },
      Capture: {
        title: 'Capturar pantalla',
        description: 'Hace una captura para las sugerencias a petición',
      },
      ClearCaptures: { title: 'Borrar capturas', description: 'Borra las capturas de pantalla' },
      TriggerWithoutCaptures: {
        title: 'Pedir sin capturas',
        description: 'Genera una sugerencia sin capturas',
      },
      TriggerWithCaptures: {
        title: 'Pedir con capturas',
        description:
          'Genera una sugerencia a partir de las capturas de pantalla. Si no hay ninguna, intenta hacer una antes.',
      },
    },
  },

  inputPassword: {
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
  },

  titlebar: {
    openCommandPalette: 'Abrir la paleta de comandos',
    searchActions: 'Buscar acciones',
    unavailableDuringInterview: 'No disponible durante una entrevista',
    menu: 'Menú',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    close: 'Cerrar',
  },

  titlebarMenu: {
    home: 'Inicio',
    account: 'Cuenta',
    configuration: 'Configuración',
    documentation: 'Documentación',
    language: 'Idioma de la aplicación',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    theme: 'Tema',
    systemMode: 'Según el sistema',
    signOut: 'Cerrar sesión',
  },

  commandPalette: {
    title: 'Paleta de comandos',
    description: 'Busca una acción, una página o un ajuste.',
    searchPlaceholder: 'Buscar acciones…',
    empty: 'Ninguna acción coincide.',
    groups: {
      goTo: 'Ir a',
      session: 'Sesión',
      app: 'Aplicación',
    },
    home: 'Inicio',
    account: 'Cuenta',
    configuration: 'Configuración',
    subscribe: 'Suscripción',
    startMock: 'Iniciar entrevista de práctica',
    startLive: 'Iniciar asistente en directo',
    switchToFullSentence: 'Cambiar a frases completas',
    switchToHintOnly: 'Cambiar a solo pistas',
    hideTranscript: 'Ocultar transcripción',
    showTranscript: 'Mostrar transcripción',
    documentation: 'Documentación',
    hotkeys: 'Atajos de teclado',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    signOut: 'Cerrar sesión',
  },

  controlPanel: {
    stop: 'Detener',
    stopTooltip: 'Detener el asistente',
    stopRunningHint: 'Termina la sesión, ofrece guardarla y vuelve al inicio',
    stopIdleHint: 'No hay nada en marcha: inicia una entrevista desde la pantalla de inicio',
    stopTransientHint: 'Disponible cuando la sesión esté en marcha',

    checks: {
      configUnavailable:
        'No se pudo cargar tu configuración guardada. Reconectando: inténtalo de nuevo en un momento.',
      nameMissing: 'No has indicado tu nombre completo',
      profileMissing: 'No has indicado los datos del perfil',
      noMicrophone: 'No se detectó ningún micrófono. Conecta uno e inténtalo de nuevo.',
      deviceNotFound: (deviceName: string) =>
        `No se encuentra el dispositivo de entrada de audio "${deviceName}"`,
    },
    startFailed: 'No se pudo iniciar el asistente',
  },

  audioGroup: {
    options: 'Opciones de audio',
    optionsSwapFailed:
      'Opciones de audio: no se pudo cambiar de micrófono, se sigue usando el anterior',
    optionsDeviceNotFound: 'Opciones de audio: no se encontró el micrófono seleccionado',
    dialogTitle: 'Opciones de audio',
    dialogDescription: 'Selecciona el micrófono físico que usas.',
    microphone: 'Micrófono',
    selectPlaceholder: 'Selecciona un micrófono',
    switching: 'Cambiando de micrófono…',
    swapFailed: (deviceName: string) =>
      `No se pudo cambiar a ${deviceName}. Esta entrevista sigue usando el micrófono anterior. Detén e inicia el asistente para usarlo.`,
    takesEffectImmediately: 'Se aplica al instante. La transcripción sigue funcionando.',
  },

  languageGroup: {
    current: (languageName: string) => `Idioma de la entrevista: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Idioma de la entrevista: ${languageName} - la transcripción no cambió`,
    tooltip: (nativeName: string) => `Idioma de la entrevista: ${nativeName}`,
    reconnecting: 'Reconectando la transcripción…',
    suggestionsOnly: 'Solo sugerencias: la transcripción sigue reconectándose',
    speechAndSuggestions: 'Reconocimiento de voz y sugerencias',
    menuLabel: 'Idioma de la entrevista',
    halfApplied:
      'Las sugerencias cambiaron, la transcripción no. Sigue reintentando: detén e inicia el asistente si no vuelve.',
    willReconnect: 'La transcripción se reconecta; la frase en curso puede quedar cortada.',
  },

  languageSearch: {
    placeholder: 'Buscar idiomas…',
    empty: 'Ningún idioma coincide.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Solo pistas',
    fullSentencesBadge: 'Frases completas',
    hintOnlyMode: 'Modo solo pistas',
    fullSentenceMode: 'Modo frases completas',
    hintOnlySummary: 'Titular + palabras clave',
    fullSentenceSummary: 'Respuestas escritas por completo',
    ariaHintOnly: 'Modo de sugerencias: solo pistas. Cambiar a frases completas',
    ariaFullSentence: 'Modo de sugerencias: frases completas. Cambiar a solo pistas',
  },

  toolsGroup: {
    hideTranscription: 'Ocultar transcripción',
    showTranscription: 'Mostrar transcripción',
    enterStealth: 'Entrar en modo sigiloso',
    stealthMode: 'Modo sigiloso',
    stealthUnavailable:
      'Disponible cuando la entrevista en directo esté en marcha: todavía no hay nada que ocultar.',
    stealthAvailable:
      'Oculta la aplicación de la captura de pantalla. El mismo atajo la vuelve a mostrar.',
    captureScreenshot: 'Hacer captura de pantalla',
    captureScreenshotTooltip: 'Capturar pantalla',
    captureFailed: 'No se pudo hacer la captura de pantalla',
    clearCaptures: 'Borrar las capturas de pantalla',
    clearCapturesTooltip: 'Borrar capturas',
    clearCapturesFailed: 'No se pudieron borrar las capturas',
    generateSuggestion: 'Generar sugerencia a petición',
    generateSuggestionTooltip: 'Generar sugerencia',
    generateSuggestionFailed: 'No se pudo generar la sugerencia',
    clear: 'Borrar',
    clearInterview: 'Borrar la entrevista',
    clearFailed: 'No se pudo borrar',
    exportInterview: 'Exportar entrevista',
    exportTheInterview: 'Exportar la entrevista',
    nothingToExport: 'Todavía no hay nada que exportar',
    nothingToExportDescription:
      'Haz primero una entrevista y luego exporta la transcripción y las sugerencias.',
    exportFailed: 'No se pudo exportar la entrevista',
    exportDocx: 'Documento de Word (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Transcripción',
    transcriptionShown: (combo: string) => `Transcripción: visible (${combo})`,
    transcriptionHidden: (combo: string) => `Transcripción: oculta (${combo})`,
    showHotkeys: 'Ver atajos',
    showHotkeysLabel: 'Ver los atajos de teclado',
    showHotkeysTitle: 'Ver los atajos de teclado (?)',
  },

  runningIndicator: {
    idle: 'Inactivo',
    starting: 'Iniciando',
    running: 'Activo',
    stopping: 'Parando',
  },

  zoomControl: {
    reset: 'Restablecer zoom',
    zoomIn: 'Ampliar',
    zoomOut: 'Reducir',
  },

  creditsDisplay: {
    freePlan: 'Gratis',
    planNames: {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual',
      other: 'Suscrito',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('es-ES'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('es-ES')}, ${new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `Ilimitado hasta el ${date}`,
    endsIn: (days: number) => `Termina en ${days} ${n(days, 'día', 'días')}`,
    freeLeft: (availableTime: string) => `${availableTime} gratis`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} ${n(hours, 'hora', 'horas')}`);
      if (minutes) parts.push(`${minutes} min`);
      return parts.join(' ') || '0 min';
    },
    lessThanAMinute: 'Menos de 1 min',
    noFreeTimeLeft: 'Sin tiempo gratis',
  },

  panels: {
    autoScroll: 'Desplazamiento automático',
    enableAutoScroll: 'Activar el desplazamiento automático',
    scrollToBottom: 'Ir al final',
    scrollToTop: 'Ir al principio',

    transcription: 'Transcripción',
    noTranscripts: 'Aún no hay transcripciones',
    interviewer: 'Entrevistador',

    liveSuggestions: 'Sugerencias en directo',
    noSuggestions: 'Aún no hay sugerencias',
    idleNoGeneration: 'Inactivo: todavía no se ha generado nada',

    triggeredSuggestions: 'Sugerencias a petición',
    noTriggeredSuggestions: 'Aún no hay sugerencias a petición',
    suggestionCanceled: 'Sugerencia cancelada',

    mockInterview: 'Entrevista de práctica',
    questionProgress: (current: number, total: number) => `Pregunta ${current} de ${total}`,
    preparingFirstQuestion: 'Preparando tu primera pregunta…',
    you: 'Tú',
    followUp: 'Repregunta',
    skipped: 'Omitida',
    noAnswer: 'Sin respuesta',

    resizeTranscript: 'Redimensionar el panel de transcripción',
    resizeHint: 'Arrastra para redimensionar, doble clic para restablecer',
  },

  saveHistory: {
    saveAsWord: 'Guardar como Word',
    saveAsMarkdown: 'Guardar como Markdown',
    formatHintLive: 'Word para compartir o imprimir, Markdown para conservar como texto plano.',
    formatHintMock: 'Word para compartir o imprimir, Markdown para guardar junto a tus notas.',
    exportFailed: 'No se pudo exportar la entrevista',

    live: {
      clear: {
        title: '¿Guardar esta entrevista antes de borrarla?',
        body: 'Se perderán la transcripción y las sugerencias.',
        discard: 'Borrar sin guardar',
      },
      start: {
        title: '¿Guardar esta entrevista antes de empezar otra?',
        body: 'Se perderán la transcripción y las sugerencias.',
        discard: 'Empezar sin guardar',
      },
      close: {
        title: '¿Guardar esta entrevista antes de cerrar?',
        body: 'Se perderán la transcripción y las sugerencias.',
        discard: 'Cerrar sin guardar',
      },
      update: {
        title: '¿Guardar esta entrevista antes de instalar la actualización?',
        body: 'La aplicación se reinicia y se perderán la transcripción y las sugerencias.',
        discard: 'Instalar sin guardar',
      },
      signout: {
        title: '¿Guardar esta entrevista antes de cerrar sesión?',
        body: 'Se perderán la transcripción y las sugerencias.',
        discard: 'Cerrar sesión sin guardar',
      },
      stop: {
        title: '¿Guardar esta entrevista?',
        body: 'La entrevista ha terminado. Su transcripción y sus sugerencias aún no están guardadas en ningún sitio.',
        discard: 'Descartar e ir al inicio',
      },
      'mock-done': {
        title: '¿Guardar tu informe antes de terminar?',
        body: 'Se perderán tu puntuación, los comentarios y tus respuestas.',
        discard: 'Terminar sin guardar',
      },
      'mock-again': {
        title: '¿Guardar este informe antes de la siguiente ronda?',
        body: 'Esta puntuación, los comentarios y tus respuestas se sustituirán.',
        discard: 'Practicar de nuevo sin guardar',
      },
    },

    mock: {
      clear: {
        title: '¿Guardar primero el informe de la entrevista de práctica?',
        body: 'Se perderán este informe y tus respuestas.',
        discard: 'Borrar sin guardar',
      },
      start: {
        title: '¿Guardar primero el informe de la entrevista de práctica?',
        body: 'Se perderán este informe y tus respuestas.',
        discard: 'Empezar sin guardar',
      },
      close: {
        title: '¿Guardar el informe de la entrevista de práctica antes de cerrar?',
        body: 'Se perderán este informe y tus respuestas.',
        discard: 'Cerrar sin guardar',
      },
      update: {
        title:
          '¿Guardar el informe de la entrevista de práctica antes de instalar la actualización?',
        body: 'La aplicación se reinicia y se perderán este informe y tus respuestas.',
        discard: 'Instalar sin guardar',
      },
      signout: {
        title: '¿Guardar el informe de la entrevista de práctica antes de cerrar sesión?',
        body: 'Se perderán este informe y tus respuestas.',
        discard: 'Cerrar sesión sin guardar',
      },
      stop: {
        title: '¿Guardar el informe de la entrevista de práctica?',
        body: 'La entrevista ha terminado. Este informe aún no está guardado en ningún sitio.',
        discard: 'Descartar e ir al inicio',
      },
    },
  },

  headphoneNotice: {
    title: 'Se necesitan auriculares',
    description:
      'Póntelos antes de empezar. La voz del entrevistador debe llegar solo a tus oídos, nunca a tus altavoces.',
    liveSpeakers: 'Con altavoces, tu micrófono oye al entrevistador igual que tú.',
    liveConsequence:
      'Entonces la aplicación toma su pregunta como algo que dijiste tú y deja de responderla, sin ningún error que te diga por qué.',
    mockSpeakers:
      'Con altavoces, la pregunta que acabas de oír puede colarse como eco al principio de tu respuesta.',
    mockConsequence:
      'Tu micrófono se silencia mientras habla el entrevistador, pero la reverberación de la sala puede colarse después como palabras sueltas.',
    proceed: 'Ya tengo los auriculares puestos',
  },

  permissionGate: {
    title: 'Permisos necesarios',
    microphone: 'Micrófono',
    micChecking: 'Comprobando…',
    micGranted: 'Acceso concedido',
    micBlocked: 'Actívalo en Ajustes del Sistema y pulsa Comprobar de nuevo',
    micRequired: 'Necesario para captar tu voz',
    grantAccess: 'Conceder acceso',
    openSettings: 'Abrir Ajustes',
    screenRecording: 'Grabación de pantalla',
    screenChecking: 'Comprobando…',
    screenNeedsRelaunch: 'Concedido: reinicia la aplicación para aplicarlo antes de empezar',
    screenGranted: 'Acceso concedido',
    screenNotDetermined: 'Se pedirá cuando empiece la grabación',
    screenBlocked: 'Actívalo en Ajustes del Sistema y reinicia la aplicación para aplicarlo',
    restartApp: 'Reiniciar aplicación',
    checking: 'Comprobando…',
    checkAgain: 'Comprobar de nuevo',
    start: 'Empezar',
  },

  exportToast: {
    exported: (format: string) => `Entrevista exportada como ${format}`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'Abrir el archivo exportado',
    openFile: 'Abrir archivo',
    showInFolderLabel: 'Mostrar el archivo exportado en su carpeta',
    showInFolder: 'Mostrar en la carpeta',
    dismiss: 'Descartar',
  },

  notices: {
    connecting: 'Conectando con el servidor…',
    starting: 'Iniciando…',
    stopping: 'Deteniendo…',
    dismiss: 'Descartar',
  },

  updateNotification: {
    available: (version: string) => `Actualización disponible: v${version}`,
    availableDescription: 'La descarga empezará automáticamente en segundo plano.',
    downloading: (percent: string) => `Descargando actualización… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `Actualización descargada: v${version}`,
    downloadedDescriptionMac: 'Haz clic para abrir el instalador y arrástralo a Aplicaciones.',
    downloadedDescription: 'Haz clic para reiniciar e instalar la actualización.',
    openInstaller: 'Abrir instalador',
    restartNow: 'Reiniciar ahora',
  },

  mock: {
    setup: {
      title: 'Entrevista de práctica',
      description:
        'La IA pregunta y tú respondes en voz alta. No se guarda nada salvo que lo exportes.',
      start: 'Iniciar entrevista de práctica',
      starting: 'Iniciando…',
      seniority: 'Nivel',
      seniorityOptions: {
        junior: 'Junior',
        mid: 'Intermedio',
        senior: 'Senior',
        staff: 'Staff+',
      },
      questions: 'Preguntas',
      questionOption: (count: number, minutes: number) =>
        `${count} ${n(count, 'pregunta', 'preguntas')}, unos ${minutes} min`,
      difficulty: 'Dificultad',
      difficultyOptions: {
        easy: {
          label: 'Calentamiento',
          description: 'Preguntas directas, con una sola petición clara cada una.',
        },
        standard: {
          label: 'Estándar',
          description: 'Lo que preguntaría de verdad un entrevistador corriente.',
        },
        hard: {
          label: 'Difícil',
          description: 'Preguntas incisivas sobre compromisos y casos límite.',
        },
      },
      languageDescription:
        'El idioma en que pregunta el entrevistador, en que se transcribe y en que recibes los comentarios.',
      estimate: (minutes: number) => `Normalmente unos ${minutes} min.`,
      unlimited: 'Ilimitado con tu suscripción.',
      covers: (minutes: number) =>
        `Tu tiempo gratis cubre unos ${minutes} ${n(minutes, 'minuto', 'minutos')}.`,
      endsEarly:
        'La sesión termina cuando se acaba tu tiempo gratis, y aun así recibes tu informe.',
    },

    session: {
      heading: 'Sesión de entrevista de práctica',
      starting: 'Iniciando…',
      generating: 'Pensando la siguiente pregunta…',
      evaluating: 'Pensando…',
      scoring: 'Puntuando la entrevista…',
      stopping: 'Terminando la entrevista…',
      speaking: 'Habla el entrevistador. Tu micrófono está apagado mientras suena la pregunta.',
      readThenReady: 'Lee la pregunta. Tu respuesta se graba desde que indiques que estás listo.',
      listening: 'Escuchando…',
      ready: 'Estoy listo',
      doneAnswering: 'He terminado',
      doneAnsweringTooltip: 'Envía tu respuesta y pasa a la siguiente',
      toggleHints: 'Activar o desactivar las sugerencias en directo',
      hintsOn: 'Sugerencias en directo: activadas',
      hintsOff: 'Sugerencias en directo: desactivadas',
      hintsOnHint: 'Muestra lo que respondería el asistente en directo',
      hintsOffHint: 'Practica sin pistas',
      endInterview: 'Terminar entrevista',
      startFailed: 'No se pudo iniciar la entrevista de práctica',
      startingPage: 'Iniciando la entrevista de práctica…',
    },

    report: {
      heading: 'Informe de la entrevista de práctica',
      verdictExcellent: 'Excelente',
      verdictStrong: 'Sólida',
      verdictDeveloping: 'En desarrollo',
      verdictNeedsWork: 'Necesita trabajo',
      scoreFailed: (reason: string) =>
        `No se pudo obtener la puntuación global (${reason}). Tus respuestas siguen abajo y se pueden exportar.`,
      scoreAgain: 'Volver a puntuar',
      scoring: 'Puntuando…',
      overallScore: 'Puntuación global',
      strengths: 'Fortalezas',
      gaps: 'Áreas de mejora',
      nothingNoted: 'Nada concreto que destacar.',
      perQuestion: 'Desglose por pregunta',
      yourAnswer: 'Tu respuesta',
      noAnswerRecorded: '(no se grabó respuesta)',
      score: 'Puntuación',
      strongerAnswer: 'Respuesta más sólida',
      saveAsWord: 'Guardar como Word',
      saveAsMarkdown: 'Guardar como Markdown',
      exportFailed: 'No se pudo exportar el informe',
      practiseAgain: 'Practicar de nuevo',
      done: 'Hecho',
    },
  },

  mainRoute: {
    redirectingToLogin: 'Redirigiendo al inicio de sesión…',
    authenticating: 'Autenticando…',
    transcriptionHidden: 'La transcripción está oculta',
  },

  documentation: {
    intro: (appName: string) =>
      `${appName} es un asistente con IA que mejora tus entrevistas con sugerencias en tiempo real y recomendaciones de código a partir de la pantalla.`,
    docsLead: 'Para la documentación completa, visita ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: '. Pulsa Cmd/Ctrl+K en cualquier parte de la aplicación para buscar una acción.',

    lostWindow: {
      title: '¿Has perdido la ventana?',
      body: (appName: string) =>
        `En modo sigiloso ${appName} sale de la barra de tareas y del Dock de macOS para no verse al compartir pantalla, lo que también significa que una ventana minimizada no tiene botón en el que hacer clic. Abre ${appName} de nuevo: no se inicia una segunda copia, se recupera esta ventana. Fuera del modo sigiloso tienes el botón de la barra de tareas y el icono del Dock de siempre, salvo que hayas activado "Ocultar el icono de la barra de tareas durante las entrevistas".`,
    },

    language: {
      title: 'Entrevistas en otro idioma',
      oneSetting:
        'Un único ajuste cubre toda la sesión: qué modelo de voz transcribe la llamada, en qué idioma se escriben las sugerencias y el idioma del informe exportado. Cámbialo con el botón de idioma de la barra de control, en la página de configuración o en el diálogo de la entrevista de práctica: todos cambian lo mismo.',
      supported: (count: number) => `Hay ${count} idiomas disponibles:`,
      midInterview:
        'Puedes cambiarlo durante la entrevista. Las sugerencias cambian de inmediato, desde la siguiente respuesta. El reconocimiento de voz tarda un poco más: se reconecta, así que la frase que se esté diciendo en ese momento puede quedar cortada en la transcripción.',
      textOnly:
        'En una entrevista de práctica, un idioma marcado como “solo texto” no tiene voz disponible: el entrevistador escribe sus preguntas en lugar de decirlas. Tú sigues respondiendo en voz alta y la puntuación no cambia.',
      appLanguageTitle: 'La aplicación tiene su propio idioma',
      appLanguageBody:
        'El idioma de arriba es el de la entrevista. El idioma en que está escrita la aplicación (sus botones, títulos y mensajes) es un ajuste aparte en la página de configuración, y también es lo primero que pregunta la configuración inicial. Ninguno se deduce del otro: alguien que habla ruso y se entrevista en inglés quiere la transcripción en inglés y la aplicación en ruso.',
    },

    microphone: {
      title: 'Cambiar de micrófono durante la entrevista',
      body: 'El botón del micrófono de la barra de control sigue disponible durante la entrevista. Si tus auriculares se quedan sin batería, se desconectan o no eran el dispositivo correcto, elige otro allí en lugar de detener el asistente: detenerlo borra también la transcripción y las sugerencias.',
      immediate:
        'El cambio se aplica al instante y la transcripción sigue funcionando, así que no se corta nada. Si el dispositivo elegido no se puede abrir (desconectado o en uso por otra aplicación), la entrevista sigue con el anterior y la aplicación te lo indica.',
    },

    suggestionStyle: {
      title: 'Sugerencias con solo pistas o con frases completas',
      body: 'Solo pistas es el modo predeterminado: cada sugerencia llega como un titular de una línea con palabras clave, para captarla de un vistazo y seguir hablando. Frases completas escribe la respuesta tal como se diría: más que leer, menos que improvisar.',
      switching: (combo: string) =>
        `Cambia entre ellos en la barra de control, en la página de configuración o con ${combo}, que también funciona en modo sigiloso. Las sugerencias que ya están en pantalla conservan su estilo; solo cambia la siguiente.`,
    },

    settings: {
      title: 'Dónde están tus ajustes',
      accountLabel: 'Cuenta',
      accountBody:
        ' guarda quién eres: el nombre que usas, el perfil o CV del que salen tus sugerencias, el contexto del puesto al que te presentas y tu contraseña.',
      configurationLabel: 'Configuración',
      configurationBody:
        ' guarda cómo funciona la entrevista: el idioma de la aplicación, tu micrófono (con prueba), el idioma de la entrevista, el estilo de las sugerencias y si el panel de transcripción está acoplado. No hay que guardar nada; cada cambio se aplica al momento.',
      both: 'Ambas están en la pantalla de inicio, en el menú de la barra de título y en la paleta de Cmd/Ctrl+K. Una instalación nueva las recorre todas una vez en el primer inicio.',
    },

    hotkeys: 'Atajos',
  },

  payment: {
    title: 'Suscripción',
    tabs: {
      buy: 'Planes',
      history: 'Historial',
      status: 'Estado',
    },

    buy: {
      currentPlan: 'Tu plan',
      subscribedUntil: (plan: string, date: string) => `${plan}, hasta el ${date}`,
      daysLeft: (days: number) => `${n(days, 'Queda', 'Quedan')} ${days} ${n(days, 'día', 'días')}`,
      freePlan: 'Plan gratuito',
      freeLeft: (duration: string) =>
        `Te quedan ${duration} de entrevistas con el modelo gratuito.`,
      freeUsedUp: 'No te queda tiempo gratis. Suscríbete para seguir con tus entrevistas.',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} ${n(hours, 'hora', 'horas')}`);
        if (minutes) parts.push(`${minutes} ${n(minutes, 'minuto', 'minutos')}`);
        return parts.join(' ') || '0 minutos';
      },
      loadingPlans: 'Cargando planes…',
      mostPopular: 'El más popular',
      planDescriptions: {
        monthly: 'Entrevistas ilimitadas con el modelo SOTA durante un mes',
        quarterly: 'Entrevistas ilimitadas con el modelo SOTA durante tres meses',
        yearly: 'Entrevistas ilimitadas con el modelo SOTA durante un año',
      },
      perMonth: ' / mes',
      billedAs: (price: number, months: number) =>
        `$${price} en un solo pago, por ${months} ${n(months, 'mes', 'meses')}`,
      save: (percent: number) => `Ahorra un ${percent}%`,
      prepaid: 'Un solo pago en cripto. Un pase nunca se renueva solo.',
      refundPrompt: '¿Necesitas un reembolso?',
      refundContact: 'Contacta con soporte',
      extends:
        'Tu suscripción está activa: un pase nuevo añade su tiempo después de la fecha de fin actual.',
      selected: 'Seleccionado',
      buy: 'Elegir',
      detailsTitle: 'Datos del pago',
      detailsLead: 'Completa la compra del plan ',
      detailsFor: ' por ',
      currencyLabel: 'Moneda de pago',
      currencyPlaceholder: 'Selecciona una moneda',
      currencySearchPlaceholder: 'Buscar moneda…',
      noCurrency: 'No se encontró ninguna moneda',
      createPayment: 'Crear pago',
      creatingPayment: 'Creando pago…',
    },

    history: {
      loading: 'Cargando el historial de pagos…',
      loadFailed: 'No se pudo cargar el historial de pagos',
      emptyTitle: 'Sin historial de pagos',
      emptyBody: 'Todavía no has hecho ningún pago. Suscríbete para empezar.',
      subscribe: 'Ver planes',
      refreshing: 'Actualizando…',
      remainder: 'Saldo pendiente',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} ${n(months, 'mes', 'meses')}`
          : days > 0
            ? `${days.toLocaleString('es-ES')} ${n(days, 'día', 'días')}`
            : credits > 0
              ? `${credits.toLocaleString('es-ES')} créditos`
              : '-',
      columns: {
        created: 'Fecha',
        paymentId: 'ID del pago',
        purchase: 'Compra',
        amount: 'Importe',
        status: 'Estado',
        action: 'Acción',
      },
      notAvailable: 'N/D',
      view: 'Ver',
    },

    status: {
      title: 'Comprobar el estado del pago',
      description: 'Introduce un ID de pago para ver su estado actual',
      idPlaceholder: 'Introduce el ID del pago',
      check: 'Comprobar estado',
      checking: 'Comprobando…',
      notFound: 'Pago no encontrado',
      fetchFailed: 'No se pudo obtener el estado del pago',
      order: (orderId: string) => `Pedido n.º ${orderId}`,
      refreshing: 'Actualizando…',
      amountToPay: 'Importe a pagar',
      priceUsd: 'Precio (USD)',
      actuallyPaid: 'Pagado realmente',
      paymentMethods: 'Métodos de pago',
      qrTab: 'Código QR',
      addressTab: 'Dirección',
      downloadQr: 'Descargar código QR',
      qrSaved: 'Código QR guardado',
      scanWithWallet: 'Escanéalo con tu monedero',
      qrIncludes: (amount: string) => `El código QR incluye la dirección y el importe (${amount})`,
      paymentAddress: 'Dirección de pago',
      amountToSend: 'Importe a enviar',
      sendExactly: 'Envía exactamente este importe a la dirección de arriba.',
      successTitle: '¡Pago completado!',
      successBody: 'Tu suscripción se ha aplicado a tu cuenta.',
      expiredTitle: 'Pago caducado',
      failedTitle: 'Pago fallido',
      expiredBody: 'Este pago ha caducado. Crea un pago nuevo.',
      failedBody: 'No se pudo procesar el pago. Inténtalo de nuevo.',
      refundedTitle: 'Pago reembolsado',
      refundedBody: 'Este pago se reembolsó. Contacta con soporte si tienes alguna duda.',
      receivedTitle: 'Pago recibido',
      receivedBody:
        'Tu pago se está confirmando en la red. No hace falta pagar nada más, y tu suscripción se aplicará automáticamente.',
      partialTitle: 'Pago parcial recibido',
      partialBody:
        'Estamos preparando una dirección nueva para el saldo pendiente. Aparecerá aquí y te llegará por correo. No envíes más a la dirección anterior.',
      created: 'Creado:',
      updated: 'Actualizado:',
      addressCopied: 'Dirección de pago copiada al portapapeles',
      amountCopied: 'Importe copiado al portapapeles',
      currencyCopied: 'Moneda copiada al portapapeles',
    },

    statusLabels: {
      waiting: 'En espera',
      confirming: 'Confirmando',
      confirmed: 'Confirmado',
      sending: 'Enviando',
      partiallyPaid: 'Pagado en parte',
      finished: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
      expired: 'Caducado',
    },

    errors: {
      getPlans: 'No se pudieron obtener los planes',
      getCurrencies: 'No se pudieron obtener las monedas',
      createPayment: 'No se pudo crear el pago',
      getStatus: 'No se pudo obtener el estado del pago',
      getHistory: 'No se pudo obtener el historial de pagos',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: 'No se pudo guardar el micrófono seleccionado',
    microphoneSwapFailed: 'Guardado, pero la entrevista sigue usando el micrófono anterior',
    microphoneSwapFailedHint:
      'Comprueba que el dispositivo está conectado y luego detén e inicia el asistente.',
    saveLanguageFailed: 'No se pudo guardar el idioma de la entrevista',
    languageHalfApplied:
      'Las sugerencias cambiaron de idioma; la transcripción sigue reconectándose',
    languageHalfAppliedHint: 'Sigue reintentando. Detén e inicia el asistente si no vuelve.',
    saveSuggestionModeFailed: 'No se pudo guardar el modo de sugerencias',
    saveTranscriptPanelFailed: 'No se pudo guardar el ajuste del panel de transcripción',
    saveMockHintsFailed: 'No se pudo guardar el ajuste de sugerencias en directo',
    saveHideTaskbarFailed:
      'No se pudo guardar el ajuste de la barra de tareas. Inténtalo de nuevo.',
    saveAllowScreenCaptureFailed:
      'No se pudo guardar el ajuste de captura de pantalla. Inténtalo de nuevo.',
    saveUiLanguageFailed: 'No se pudo guardar el idioma de la aplicación',
  },

  assistant: {
    mockRunning: 'Detén la entrevista de práctica antes de iniciar una sesión en directo.',
    stoppedUncleanly: 'El asistente se detuvo, pero no todo se cerró correctamente',
    stoppedUncleanlyHint:
      'Reinicia la aplicación si siguen llegando transcripciones o sugerencias.',
    startFailed: 'No se pudo iniciar el asistente',
    stopFailed: 'No se pudo detener el asistente',
    screenCaptureTimedOut: 'La captura de pantalla tardó demasiado. Inténtalo de nuevo.',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `No se encuentra el dispositivo de entrada de audio "${deviceName}". Elige otro en los ajustes de audio de la pantalla principal.`,
  },

  creditGate: {
    tooLow: 'No tienes suficiente tiempo gratis para empezar',
    outOfCredits: 'Sin tiempo gratis: la sesión ha terminado',
    outOfCreditsHint: 'Suscríbete para tener entrevistas ilimitadas.',
    replaced: 'Entrevista terminada: se inició otra en esta cuenta',
    replacedHint: 'Una cuenta solo puede tener una entrevista a la vez.',
    lowBalance: (minutes: number) =>
      `Te ${n(minutes, 'queda', 'quedan')} unos ${minutes} ${n(minutes, 'minuto', 'minutos')} de tiempo gratis`,
    lowBalanceHint: 'La sesión termina cuando se acaba tu tiempo gratis.',
    tooLowHint:
      'Una sesión necesita al menos un minuto. Suscríbete para tener entrevistas ilimitadas con el modelo SOTA.',
    subscribe: 'Ver planes',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `Tu suscripción termina en ${days} ${n(days, 'día', 'días')}`,
    endingSoonHint:
      'Compra otro pase para seguir con entrevistas ilimitadas. Su tiempo se añade después de la fecha de fin actual.',
    ended: 'Tu suscripción ha terminado',
    endedHint: 'Ahora las entrevistas usan tu tiempo gratis con el modelo gratuito.',
  },

  trialNotice: {
    freeTierLead: 'Plan gratuito: 1 hora de entrevistas con el modelo ',
    freeTier: 'gratuito',
    freeTierTail: '.',
    sotaLead: 'Suscríbete para tener entrevistas ilimitadas con el modelo ',
    sota: 'más avanzado',
    sotaTail: '.',
  },
};
