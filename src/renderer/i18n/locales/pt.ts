/**
 * Portuguese, written as Brazilian Portuguese - the larger market by far, and the one the
 * marketing site targets.
 *
 * Typed as `Translation`, so a missing or misspelled key is a build error. Dashes are hyphens, as
 * in every locale here, and the register is the "você" Brazilian software uses.
 */
import type { Translation } from './en';

const n = (count: number, one: string, other: string) => (count === 1 ? one : other);

export const pt: Translation = {
  common: {
    cancel: 'Cancelar',
    close: 'Fechar',
    back: 'Voltar',
    continue: 'Continuar',
    finish: 'Concluir',
    retry: 'Tentar de novo',
    view: 'Ver',
    loading: 'Carregando…',
    withCombo: (label: string, combo: string) => `${label} (${combo})`,
  },

  uiLanguageField: {
    label: 'Idioma do app',
    description: 'Botões, menus e mensagens. Separado do idioma da entrevista.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `Configure o ${appName}`,
    guideEyebrow: 'Guia de configuração',
    progress: (current: number, total: number, label: string) =>
      `Etapa ${current} de ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'Idioma do app',
        title: 'Em que idioma você quer o app?',
        description:
          'Escolha o que você lê com mais facilidade. O resto da configuração segue ele.',
      },
      profile: {
        label: 'Perfil',
        title: 'Conte quem você é',
        description:
          'As sugestões são escritas a partir da sua experiência, então isto é obrigatório.',
      },
      context: {
        label: 'Contexto da vaga',
        title: 'Para qual vaga é a entrevista?',
        description: 'Opcional. Cole a descrição da vaga para respostas sob medida para o cargo.',
      },
      language: {
        label: 'Idioma',
        title: 'Escolha o idioma da entrevista',
      },
      microphone: {
        label: 'Microfone',
        title: 'Escolha seu microfone',
        description:
          'Escolha o microfone em que você vai falar e teste-o. Use fones de ouvido: com alto-falantes o app pode parar de responder.',
      },
      mode: {
        label: 'Sugestões',
        title: 'Como as sugestões devem aparecer?',
      },
      mockHints: {
        label: 'Entrevista simulada',
        title: 'Dicas numa entrevista simulada?',
      },
      zoom: {
        label: 'Tamanho',
        title: 'Está confortável de ler?',
      },
      transcript: {
        label: 'Transcrição',
        title: 'Mostrar uma transcrição ao vivo?',
      },
    },

    blocked: {
      accountUnreachable:
        'Não foi possível acessar sua conta, então nada digitado aqui pode ser salvo ainda.',
      needName: 'Adicione seu nome completo para continuar.',
      needProfile: 'Adicione seu perfil para continuar.',
    },

    loadingAccount: 'Carregando sua conta…',
    accountUnreachable:
      'Não foi possível acessar sua conta. Nada digitado aqui pode ser salvo até ela voltar.',

    skip: 'Pular por enquanto',
    skipTooltip: 'Você pode refazer a configuração depois, em Configurações',

    allSet: 'Tudo pronto',
    profileNotSavedOnSkip:
      'Configuração pulada, mas seu perfil não foi salvo. Tente de novo em Conta.',
    completionNotRecorded:
      'Configuração pulada, mas não conseguimos registrar isso. Ela pode ser oferecida de novo.',
    saveProfileFailed: 'Não foi possível salvar seu perfil',
    finishFailed: 'Não foi possível salvar a configuração. Verifique sua conexão e tente de novo.',
  },

  configuration: {
    title: 'Configurações',
    sections: {
      general: 'Geral',
      interview: 'Entrevista',
      display: 'Exibição',
      window: 'Janela e privacidade',
      help: 'Ajuda',
    },
    setupGuide: {
      title: 'Guia de configuração',
      description: 'Passe por tudo desta página, e pelo seu perfil, uma etapa de cada vez.',
      action: 'Iniciar configuração',
    },
    hotkeys: {
      title: 'Atalhos de teclado',
      description: 'Tudo o que você alcança sem tocar no app durante uma entrevista.',
    },
  },

  auth: {
    fields: {
      email: 'E-mail',
      password: 'Senha',
      username: 'Nome de usuário',
      confirmPassword: 'Confirmar senha',
      newPassword: 'Nova senha',
      confirmNewPassword: 'Confirmar nova senha',
      verificationCode: 'Código de verificação',
      resetCode: 'Código de redefinição',
    },

    signIn: {
      title: 'Entrar',
      description: (appName: string) => `Use sua conta para acessar o ${appName}`,
      submit: 'Entrar',
      submitting: 'Entrando…',
      rememberMe: 'Lembrar de mim',
      noAccount: 'Não tem conta? Crie uma nova.',
      forgotPassword: 'Esqueceu sua senha?',
    },

    signup: {
      title: 'Criar conta',
      description: (appName: string) => `Cadastre uma nova conta no ${appName}`,
      sendCode: 'Enviar código',
      sending: 'Enviando…',
      haveAccount: 'Já tem conta? Entre',
      codeNotice: (email: string) =>
        `Se ${email} ainda não tem conta, enviamos um código de verificação para ele. Cole o código abaixo. Se já tem, enviamos uma mensagem explicando como entrar.`,
      verify: 'Verificar',
      verifying: 'Verificando…',
      changeEmail: 'Trocar e-mail',
      resendCode: 'Reenviar código',
      requestResent: 'Solicitação enviada de novo.',
      resendFailed: 'Não foi possível reenviar.',
      create: 'Criar conta',
      creating: 'Criando…',
      sendCodeFailed: 'Não foi possível enviar o código de verificação. Tente de novo.',
      invalidCode: 'Código de verificação inválido ou expirado.',
      succeeded: 'Cadastro concluído! Faça login.',
      failed: 'Não foi possível concluir o cadastro. Tente de novo.',
    },

    reset: {
      title: 'Redefinir senha',
      description: (appName: string) => `Defina uma nova senha para sua conta do ${appName}`,
      sendResetCode: 'Enviar código',
      sending: 'Enviando…',
      backToSignIn: 'Voltar para o login',
      codeNotice: (email: string) =>
        `Se existe uma conta para ${email}, enviamos um código de redefinição para ele. Cole o código abaixo. Ele só pode ser usado uma vez, e o e-mail diz quando expira.`,
      verify: 'Verificar',
      verifying: 'Verificando…',
      changeEmail: 'Trocar e-mail',
      resendCode: 'Reenviar código',
      codeResent: 'Código reenviado.',
      resendFailed: 'Não foi possível reenviar o código.',
      signsYouOut: 'Definir uma nova senha encerra sua sessão em todos os dispositivos.',
      setNewPassword: 'Definir nova senha',
      saving: 'Salvando…',
      done: 'Senha redefinida',
      startOver: 'Recomeçar',
      sendFailed: 'Não foi possível enviar o código. Tente de novo.',
      verifyFailed: 'Não foi possível verificar o código.',
      succeeded: 'Senha redefinida. Entre com a nova senha.',
      failed: 'Não foi possível redefinir a senha. O código pode ter expirado: peça um novo.',
    },

    passwordsDoNotMatch: 'As senhas não coincidem',

    errors: {
      sendCodeFailed: 'Não foi possível enviar o código de verificação',
      invalidCode: 'Código de verificação inválido ou expirado',
      loginFailed: 'Não foi possível entrar',
      signupFailed: 'Não foi possível concluir o cadastro',
      logoutFailed: 'Não foi possível sair',
      changePasswordFailed: 'Não foi possível alterar a senha',
      sendResetCodeFailed: 'Não foi possível enviar o código de redefinição',
      invalidResetCode: 'Código de redefinição inválido ou expirado',
      resetFailed: 'Não foi possível redefinir a senha',
    },
  },

  home: {
    welcome: (firstName: string) => `Que bom te ver de novo, ${firstName}`,
    welcomeAnonymous: 'Que bom te ver de novo',
    subtitle: 'Treine com um entrevistador de IA ou receba ajuda ao vivo durante uma chamada real.',

    mock: {
      title: 'Iniciar entrevista simulada',
      ready: 'A IA pergunta, você responde em voz alta e recebe um relatório com nota no final.',
      unsupported: 'Ainda não está disponível neste servidor. Atualize o app ou tente mais tarde.',
      liveRunning: 'Pare o assistente ao vivo primeiro: os dois não podem dividir o microfone.',
      unaffordable: 'Não sobrou tempo grátis suficiente. Assine para continuar treinando.',
    },

    live: {
      title: 'Iniciar assistente ao vivo',
      resumeTitle: 'Voltar para a sua entrevista',
      ready: 'Transcreve sua entrevista real e sugere respostas enquanto ela acontece.',
      running: 'Seu assistente ao vivo já está em execução.',
      mockRunning: 'Termine a entrevista simulada primeiro: as duas não podem dividir o microfone.',
      unaffordable: 'Não sobrou tempo grátis suficiente. Assine para continuar suas entrevistas.',
    },

    planLabel: 'Plano',
    planUnavailable: 'Indisponível',
    subscribe: 'Assinatura',

    signOutFailed: 'Não foi possível sair',
  },

  account: {
    title: 'Conta',
    signedInAs: 'Conectado como',
    password: {
      title: 'Senha',
      description: 'Altere a senha da sua conta',
      action: 'Alterar senha',
      codeSent: (email: string) => `Enviamos um código para ${email}. Cole-o abaixo.`,
    },
    loadFailed: 'Não foi possível carregar seus dados salvos. Reconecte antes de editar.',
    save: 'Salvar alterações',
    saving: 'Salvando…',
    saved: 'Dados da conta salvos',
    saveFailed: 'Não foi possível salvar os dados da conta',
  },

  profileFields: {
    fullName: 'Nome completo',
    fullNamePlaceholder: 'O nome que você usa na entrevista',
    profile: 'Perfil',
    profileKinds: 'currículo, LinkedIn etc.',
    profilePlaceholder:
      'Cole seu currículo, seu perfil do LinkedIn ou uma breve biografia. As sugestões são escritas a partir disso, então quanto mais detalhes, mais as respostas soam como você.',
    context: 'Contexto',
    contextKinds: 'descrição da vaga, histórico de conversas, carta de apresentação etc.',
    contextPlaceholder:
      'Cole a descrição da vaga, os requisitos do cargo ou qualquer outra coisa sobre a entrevista que você está preparando.',
    limitReached: (max: number) =>
      `Limite de caracteres atingido (${max.toLocaleString('pt-BR')}). O texto excedente não foi adicionado.`,
    charactersLeft: (remaining: number) =>
      `${n(remaining, 'Resta', 'Restam')} ${remaining.toLocaleString('pt-BR')} ${n(remaining, 'caractere', 'caracteres')}`,
  },

  microphoneField: {
    label: 'Microfone',
    noDevices: 'Nenhum microfone detectado. Conecte um e ele aparecerá aqui.',
    selectPlaceholder: 'Selecione um microfone',
    lookingPlaceholder: 'Procurando microfones…',
    test: 'Testar',
    stopTest: 'Parar teste',
    openFailed:
      'Não foi possível abrir este microfone. Verifique se ele está conectado e se nenhum outro app o está usando.',
    notConnected: (deviceName: string) =>
      `“${deviceName}” não está mais conectado. Escolha outro microfone.`,
    saySomething: 'Fale algo: a barra deve se mexer enquanto você fala.',
    runningHint:
      'A entrevista está usando este microfone. O teste fica disponível quando ela parar.',
    testHint: 'Teste antes da entrevista: um microfone mudo parece exatamente uma sala silenciosa.',
  },

  micLevelMeter: {
    label: 'Nível de entrada do microfone',
    hearing: 'Ouvindo você',
    silent: 'Silêncio',
  },

  suggestionModeField: {
    label: 'Estilo das sugestões',
    hintOnly: 'Só dicas',
    hintOnlyDescription: 'Um título e palavras-chave para ler de relance. Recomendado.',
    fullSentences: 'Frases completas',
    fullSentencesDescription: 'A resposta completa, escrita como você a diria.',
    switchHint: (combo: string) =>
      `Pode ser trocado durante a entrevista pela barra de controle ou com ${combo}.`,
  },

  zoomField: {
    label: 'Tamanho da interface',
    smaller: 'Menor',
    larger: 'Maior',
    reset: 'Redefinir',
    description: (combo: string) => `Ajusta a escala do app inteiro. Também com ${combo}.`,
  },

  transcriptPanelField: {
    label: 'Mostrar o painel de transcrição',
    description: (combo: string) =>
      `Transcrição ao vivo abaixo das sugestões. Ative ou desative com ${combo}.`,
  },

  hideTaskbarField: {
    label: 'Ocultar o ícone da barra de tarefas durante entrevistas ao vivo',
    description:
      'Mantém a janela por cima de tudo (no macOS, o ícone do Dock também some). Ela não pode ser minimizada: abra o app de novo se ela sumir.',
  },
  allowScreenCaptureField: {
    label: 'Permitir captura de tela',
    description:
      'Deixa compartilhamentos de tela e gravações verem a janela do app. O modo furtivo sempre a esconde.',
  },
  mockHintsField: {
    label: 'Mostrar dicas nas entrevistas simuladas',
    description:
      'Mostra a resposta do assistente ao lado de cada pergunta, para comparar com a sua.',
  },

  languageField: {
    label: 'Idioma da entrevista',
    textOnly: 'só texto',
    reconnectFailed:
      'As sugestões mudaram de idioma, mas a transcrição ainda está reconectando. Pare e inicie o assistente se ela não voltar.',
    description: 'O que é transcrito e o idioma em que suas sugestões chegam.',
    noVoiceNotice:
      'O entrevistador vai escrever as perguntas em vez de falar. Você continua respondendo em voz alta, e a nota é a mesma.',
  },

  changePassword: {
    title: 'Alterar senha',
    description: 'Digite sua senha atual e escolha uma nova.',
    current: 'Senha atual',
    currentPlaceholder: 'Digite a senha atual',
    next: 'Nova senha',
    nextPlaceholder: 'Digite a nova senha',
    confirm: 'Confirmar nova senha',
    confirmPlaceholder: 'Confirme a nova senha',
    submit: 'Alterar senha',
    submitting: 'Alterando…',
    mismatch: 'As novas senhas não coincidem.',
    succeeded: 'Senha alterada com sucesso',
  },

  hotkeys: {
    dialogTitle: 'Atalhos de teclado',
    dialogDescription: 'Tudo o que você alcança sem tocar no app durante uma entrevista.',

    groups: {
      general: 'Geral',
      window: 'Gerenciar janela',
      panels: 'Rolar painéis',
      triggered: 'Sugestões sob demanda',
    },

    keys: {
      StopAll: { title: 'Parar tudo', description: 'Para o assistente e sai do modo furtivo' },
      ToggleStealth: {
        title: 'Modo furtivo',
        description:
          'Esconde o app da captura de tela durante uma entrevista ao vivo. As mesmas teclas o trazem de volta.',
      },
      Opacity: { title: 'Opacidade', description: 'Alterna a opacidade da janela no modo furtivo' },
      ToggleTranscript: {
        title: 'Mostrar transcrição',
        description: 'Mostra ou esconde o painel de transcrição; funciona também no modo furtivo',
      },
      ToggleSuggestionMode: {
        title: 'Só dicas / Frases completas',
        description:
          'Alterna as sugestões entre só dicas (um título com palavras-chave para ler de relance) e frases completas. Funciona também no modo furtivo.',
      },
      PlaceWin: {
        title: 'Posicionar janela',
        description: 'Coloca a janela num canto, num lado ou no centro',
      },
      MoveWin: { title: 'Mover janela', description: 'Move a janela na direção indicada' },
      ResizeWin: {
        title: 'Redimensionar janela',
        description: 'Redimensiona a janela na direção indicada',
      },
      ZoomInOutReset: {
        title: 'Aumentar/Diminuir/Redefinir zoom',
        description: 'Ajusta ou redefine o zoom da interface',
      },
      ScrollLiveSuggestionPanel: {
        title: 'Rolar painel ao vivo',
        description: 'Rola para baixo, para cima ou até o fim no painel de sugestões ao vivo',
      },
      ScrollActionSuggestionPanel: {
        title: 'Rolar painel sob demanda',
        description: 'Rola para baixo, para cima ou até o fim no painel de sugestões sob demanda',
      },
      Capture: {
        title: 'Capturar tela',
        description: 'Tira uma captura de tela para as sugestões sob demanda',
      },
      ClearCaptures: { title: 'Limpar capturas', description: 'Apaga as capturas de tela' },
      TriggerWithoutCaptures: {
        title: 'Pedir sem capturas',
        description: 'Gera uma sugestão sem capturas',
      },
      TriggerWithCaptures: {
        title: 'Pedir com capturas',
        description:
          'Gera uma sugestão com base nas capturas de tela. Se não houver nenhuma, tenta tirar uma antes.',
      },
    },
  },

  inputPassword: {
    show: 'Mostrar senha',
    hide: 'Ocultar senha',
  },

  titlebar: {
    openCommandPalette: 'Abrir a paleta de comandos',
    searchActions: 'Buscar ações',
    unavailableDuringInterview: 'Indisponível durante uma entrevista',
    menu: 'Menu do app',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    close: 'Fechar',
  },

  titlebarMenu: {
    home: 'Início',
    account: 'Conta',
    configuration: 'Configurações',
    documentation: 'Documentação',
    language: 'Idioma do app',
    lightMode: 'Modo claro',
    darkMode: 'Modo escuro',
    theme: 'Tema',
    systemMode: 'Seguir o sistema',
    signOut: 'Sair',
  },

  commandPalette: {
    title: 'Paleta de comandos',
    description: 'Busque uma ação, uma página ou uma configuração.',
    searchPlaceholder: 'Buscar ações…',
    empty: 'Nenhuma ação encontrada.',
    groups: {
      goTo: 'Ir para',
      session: 'Sessão',
      app: 'Aplicativo',
    },
    home: 'Início',
    account: 'Conta',
    configuration: 'Configurações',
    subscribe: 'Assinatura',
    startMock: 'Iniciar entrevista simulada',
    startLive: 'Iniciar assistente ao vivo',
    switchToFullSentence: 'Mudar para frases completas',
    switchToHintOnly: 'Mudar para só dicas',
    hideTranscript: 'Ocultar transcrição',
    showTranscript: 'Mostrar transcrição',
    documentation: 'Documentação',
    hotkeys: 'Atalhos de teclado',
    switchToLight: 'Mudar para o modo claro',
    switchToDark: 'Mudar para o modo escuro',
    signOut: 'Sair',
  },

  controlPanel: {
    stop: 'Parar',
    stopTooltip: 'Parar o assistente',
    stopRunningHint: 'Encerra a sessão, oferece salvá-la e volta ao início',
    stopIdleHint: 'Nada em execução: inicie uma entrevista na tela inicial',
    stopTransientHint: 'Disponível quando a sessão estiver em execução',

    checks: {
      configUnavailable:
        'Não foi possível carregar sua configuração salva. Reconectando: tente de novo em instantes.',
      nameMissing: 'O nome completo não foi definido',
      profileMissing: 'Os dados do perfil não foram definidos',
      noMicrophone: 'Nenhum microfone detectado. Conecte um e tente de novo.',
      deviceNotFound: (deviceName: string) =>
        `O dispositivo de entrada de áudio "${deviceName}" não foi encontrado`,
    },
    startFailed: 'Não foi possível iniciar o assistente',

    /** The live connection and microphone indicator on the control bar. */
    signal: {
      listening: 'Ouvindo',
      reconnecting: 'Reconectando…',
      listeningHint: 'Microfone e transcrição conectados',
      reconnectingHint: 'Conexão de transcrição perdida - reconectando automaticamente',
    },
  },

  audioGroup: {
    options: 'Opções de áudio',
    optionsSwapFailed:
      'Opções de áudio: não foi possível trocar o microfone, o anterior continua em uso',
    optionsDeviceNotFound: 'Opções de áudio: o microfone selecionado não foi encontrado',
    dialogTitle: 'Opções de áudio',
    dialogDescription: 'Selecione o microfone físico que você usa.',
    microphone: 'Microfone',
    selectPlaceholder: 'Selecione um microfone',
    switching: 'Trocando de microfone…',
    swapFailed: (deviceName: string) =>
      `Não foi possível trocar para ${deviceName}. Esta entrevista continua usando o microfone anterior. Pare e inicie o assistente para usá-lo.`,
    takesEffectImmediately: 'Vale na hora. A transcrição continua funcionando.',
  },

  languageGroup: {
    current: (languageName: string) => `Idioma da entrevista: ${languageName}`,
    currentHalfApplied: (languageName: string) =>
      `Idioma da entrevista: ${languageName} - a transcrição não mudou`,
    tooltip: (nativeName: string) => `Idioma da entrevista: ${nativeName}`,
    reconnecting: 'Reconectando a transcrição…',
    suggestionsOnly: 'Só as sugestões: a transcrição ainda está reconectando',
    speechAndSuggestions: 'Reconhecimento de fala e sugestões',
    menuLabel: 'Idioma da entrevista',
    halfApplied:
      'As sugestões mudaram, a transcrição não. Ela continua tentando: pare e inicie o assistente se não voltar.',
    willReconnect: 'A transcrição reconecta; a frase atual pode ser cortada.',
  },

  languageSearch: {
    placeholder: 'Buscar idiomas…',
    empty: 'Nenhum idioma encontrado.',
  },

  suggestionMode: {
    hintOnlyBadge: 'Só dicas',
    fullSentencesBadge: 'Frases completas',
    hintOnlyMode: 'Modo só dicas',
    fullSentenceMode: 'Modo frases completas',
    hintOnlySummary: 'Título + palavras-chave',
    fullSentenceSummary: 'Respostas escritas por inteiro',
    ariaHintOnly: 'Modo de sugestão: só dicas. Mudar para frases completas',
    ariaFullSentence: 'Modo de sugestão: frases completas. Mudar para só dicas',
  },

  toolsGroup: {
    hideTranscription: 'Ocultar transcrição',
    showTranscription: 'Mostrar transcrição',
    enterStealth: 'Entrar no modo furtivo',
    stealthMode: 'Modo furtivo',
    stealthUnavailable:
      'Disponível quando a entrevista ao vivo estiver em execução: ainda não há nada a esconder.',
    stealthAvailable: 'Esconde o app da captura de tela. O mesmo atalho o traz de volta.',
    captureScreenshot: 'Tirar captura de tela',
    captureScreenshotTooltip: 'Capturar tela',
    captureFailed: 'Não foi possível tirar a captura de tela',
    clearCaptures: 'Apagar as capturas de tela',
    clearCapturesTooltip: 'Limpar capturas',
    clearCapturesFailed: 'Não foi possível apagar as capturas',
    generateSuggestion: 'Gerar sugestão sob demanda',
    generateSuggestionTooltip: 'Gerar sugestão',
    generateSuggestionFailed: 'Não foi possível gerar a sugestão',
    clear: 'Limpar',
    clearInterview: 'Limpar a entrevista',
    clearFailed: 'Não foi possível limpar',
    exportInterview: 'Exportar entrevista',
    exportTheInterview: 'Exportar a entrevista',
    nothingToExport: 'Ainda não há nada para exportar',
    nothingToExportDescription:
      'Faça uma entrevista primeiro e depois exporte a transcrição e as sugestões.',
    exportFailed: 'Não foi possível exportar a entrevista',
    exportDocx: 'Documento do Word (.docx)',
    exportMarkdown: 'Markdown (.md)',
  },

  statusPanel: {
    transcript: 'Transcrição',
    transcriptionShown: (combo: string) => `Transcrição: visível (${combo})`,
    transcriptionHidden: (combo: string) => `Transcrição: oculta (${combo})`,
    showHotkeys: 'Ver atalhos',
    showHotkeysLabel: 'Ver os atalhos de teclado',
    showHotkeysTitle: 'Ver os atalhos de teclado (?)',
  },

  runningIndicator: {
    idle: 'Parado',
    starting: 'Iniciando',
    running: 'Ativo',
    stopping: 'Parando',
  },

  zoomControl: {
    reset: 'Redefinir zoom',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Diminuir zoom',
  },

  creditsDisplay: {
    freePlan: 'Grátis',
    planNames: {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
      other: 'Assinante',
    },
    date: (ms: number) => new Date(ms).toLocaleDateString('pt-BR'),
    dateTime: (ms: number) =>
      `${new Date(ms).toLocaleDateString('pt-BR')}, ${new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`,
    unlimitedUntil: (date: string) => `Ilimitado até ${date}`,
    endsIn: (days: number) => `Termina em ${days} ${n(days, 'dia', 'dias')}`,
    freeLeft: (availableTime: string) => `${availableTime} grátis`,
    duration: (hours: number, minutes: number) => {
      const parts: string[] = [];
      if (hours) parts.push(`${hours} h`);
      if (minutes) parts.push(`${minutes} min`);
      return parts.join(' ') || '0 min';
    },
    lessThanAMinute: 'Menos de 1 min',
    noFreeTimeLeft: 'Sem tempo grátis',
  },

  panels: {
    autoScroll: 'Rolagem automática',
    enableAutoScroll: 'Ativar a rolagem automática',
    scrollToBottom: 'Ir para o fim',
    scrollToTop: 'Ir para o início',

    transcription: 'Transcrição',
    noTranscripts: 'Ainda não há transcrições',
    interviewer: 'Entrevistador',

    liveSuggestions: 'Sugestões ao vivo',
    noSuggestions: 'Ainda não há sugestões',
    idleNoGeneration: 'Parado: nada gerado ainda',

    triggeredSuggestions: 'Sugestões sob demanda',
    noTriggeredSuggestions: 'Ainda não há sugestões sob demanda',
    suggestionCanceled: 'Sugestão cancelada',

    mockInterview: 'Entrevista simulada',
    questionProgress: (current: number, total: number) => `Pergunta ${current} de ${total}`,
    preparingFirstQuestion: 'Preparando sua primeira pergunta…',
    you: 'Você',
    followUp: 'Pergunta de acompanhamento',
    skipped: 'Pulada',
    noAnswer: 'Sem resposta',

    resizeTranscript: 'Redimensionar o painel de transcrição',
    resizeHint: 'Arraste para redimensionar, clique duas vezes para redefinir',
  },

  saveHistory: {
    saveAsWord: 'Salvar como Word',
    saveAsMarkdown: 'Salvar como Markdown',
    formatHintLive: 'Word para compartilhar ou imprimir, Markdown para guardar como texto simples.',
    formatHintMock:
      'Word para compartilhar ou imprimir, Markdown para guardar junto com suas notas.',
    exportFailed: 'Não foi possível exportar a entrevista',

    live: {
      clear: {
        title: 'Salvar esta entrevista antes de limpar?',
        body: 'A transcrição e as sugestões serão perdidas.',
        discard: 'Limpar sem salvar',
      },
      start: {
        title: 'Salvar esta entrevista antes de começar outra?',
        body: 'A transcrição e as sugestões serão perdidas.',
        discard: 'Começar sem salvar',
      },
      close: {
        title: 'Salvar esta entrevista antes de fechar?',
        body: 'A transcrição e as sugestões serão perdidas.',
        discard: 'Fechar sem salvar',
      },
      update: {
        title: 'Salvar esta entrevista antes de instalar a atualização?',
        body: 'O app reinicia, e a transcrição e as sugestões serão perdidas.',
        discard: 'Instalar sem salvar',
      },
      signout: {
        title: 'Salvar esta entrevista antes de sair?',
        body: 'A transcrição e as sugestões serão perdidas.',
        discard: 'Sair sem salvar',
      },
      stop: {
        title: 'Salvar esta entrevista?',
        body: 'A entrevista terminou. A transcrição e as sugestões ainda não foram salvas em lugar nenhum.',
        discard: 'Descartar e ir ao início',
      },
      'mock-done': {
        title: 'Salvar seu relatório antes de concluir?',
        body: 'Sua nota, o feedback e suas respostas serão perdidos.',
        discard: 'Concluir sem salvar',
      },
      'mock-again': {
        title: 'Salvar este relatório antes da próxima rodada?',
        body: 'Esta nota, o feedback e suas respostas serão substituídos.',
        discard: 'Treinar de novo sem salvar',
      },
    },

    mock: {
      clear: {
        title: 'Salvar primeiro o relatório da entrevista simulada?',
        body: 'Este relatório e suas respostas serão perdidos.',
        discard: 'Limpar sem salvar',
      },
      start: {
        title: 'Salvar primeiro o relatório da entrevista simulada?',
        body: 'Este relatório e suas respostas serão perdidos.',
        discard: 'Começar sem salvar',
      },
      close: {
        title: 'Salvar o relatório da entrevista simulada antes de fechar?',
        body: 'Este relatório e suas respostas serão perdidos.',
        discard: 'Fechar sem salvar',
      },
      update: {
        title: 'Salvar o relatório da entrevista simulada antes de instalar a atualização?',
        body: 'O app reinicia, e este relatório e suas respostas serão perdidos.',
        discard: 'Instalar sem salvar',
      },
      signout: {
        title: 'Salvar o relatório da entrevista simulada antes de sair?',
        body: 'Este relatório e suas respostas serão perdidos.',
        discard: 'Sair sem salvar',
      },
      stop: {
        title: 'Salvar o relatório da entrevista simulada?',
        body: 'A entrevista terminou. Este relatório ainda não foi salvo em lugar nenhum.',
        discard: 'Descartar e ir ao início',
      },
    },
  },

  headphoneNotice: {
    title: 'Fones de ouvido são obrigatórios',
    description:
      'Coloque-os antes de começar. A voz do entrevistador deve chegar só aos seus ouvidos, nunca aos alto-falantes.',
    liveSpeakers: 'Com alto-falantes, seu microfone ouve o entrevistador tão bem quanto você.',
    liveConsequence:
      'Aí o app entende a pergunta dele como algo que você disse e para de respondê-la, sem nenhum erro dizendo por quê.',
    mockSpeakers:
      'Com alto-falantes, a pergunta que você acabou de ouvir pode ecoar no começo da sua resposta.',
    mockConsequence:
      'Seu microfone fica mudo enquanto o entrevistador fala, mas o eco da sala depois disso ainda pode entrar como palavras soltas.',
    proceed: 'Estou de fones',
  },

  contextReminder: {
    title: 'Nenhum contexto da entrevista',
    description:
      'As sugestões serão escritas só a partir do seu perfil, sem saber a vaga para a qual você está concorrendo.',
    hint: 'Adicione a descrição da vaga, anotações de etapas anteriores, uma carta de apresentação ou qualquer outra informação sobre esta entrevista para respostas sob medida.',
    edit: 'Adicionar contexto',
    proceed: 'Começar assim mesmo',
    setTitle: 'Seu contexto está atualizado?',
    setDescription:
      'As sugestões seguem o contexto salvo na sua conta. Se ele ainda descreve uma entrevista anterior, as respostas serão escritas para a vaga errada.',
    review: 'Revisar contexto',
    confirm: 'Está atualizado',
    notSet: 'Não definido',
  },

  permissionGate: {
    title: 'Permissões necessárias',
    microphone: 'Microfone',
    micChecking: 'Verificando…',
    micGranted: 'Acesso concedido',
    micBlocked: 'Ative em Ajustes do Sistema e clique em Verificar de novo',
    micRequired: 'Necessário para captar sua voz',
    grantAccess: 'Conceder acesso',
    openSettings: 'Abrir Ajustes',
    screenRecording: 'Gravação de tela',
    screenChecking: 'Verificando…',
    screenNeedsRelaunch: 'Concedido: reinicie o app para aplicar antes de começar',
    screenGranted: 'Acesso concedido',
    screenNotDetermined: 'Será pedido quando a gravação começar',
    screenBlocked: 'Ative em Ajustes do Sistema e reinicie o app para aplicar',
    restartApp: 'Reiniciar app',
    checking: 'Verificando…',
    checkAgain: 'Verificar de novo',
    start: 'Começar',
  },

  exportToast: {
    exported: (format: string) => `Entrevista exportada como ${format}`,
    markdown: 'Markdown',
    word: 'Word',
    openFileLabel: 'Abrir o arquivo exportado',
    openFile: 'Abrir arquivo',
    showInFolderLabel: 'Mostrar o arquivo exportado na pasta',
    showInFolder: 'Mostrar na pasta',
    dismiss: 'Dispensar',
  },

  notices: {
    connecting: 'Conectando ao servidor…',
    starting: 'Iniciando…',
    stopping: 'Parando…',
    dismiss: 'Dispensar',
  },

  updateNotification: {
    available: (version: string) => `Atualização disponível: v${version}`,
    availableDescription: 'O download começa automaticamente em segundo plano.',
    downloading: (percent: string) => `Baixando atualização… ${percent}%`,
    downloadProgress: (transferredMb: string, totalMb: string) =>
      `${transferredMb} MB / ${totalMb} MB`,
    downloaded: (version: string) => `Atualização baixada: v${version}`,
    downloadedDescriptionMac: 'Clique para abrir o instalador e arraste-o para Aplicativos.',
    downloadedDescription: 'Clique para reiniciar e instalar a atualização.',
    openInstaller: 'Abrir instalador',
    restartNow: 'Reiniciar agora',
  },

  mock: {
    setup: {
      title: 'Entrevista simulada',
      description:
        'A IA pergunta, você responde em voz alta. Nada é salvo, a menos que você exporte.',
      start: 'Iniciar entrevista simulada',
      starting: 'Iniciando…',
      seniority: 'Senioridade',
      seniorityOptions: {
        junior: 'Júnior',
        mid: 'Pleno',
        senior: 'Sênior',
        staff: 'Staff+',
      },
      questions: 'Perguntas',
      questionOption: (count: number, minutes: number) =>
        `${count} ${n(count, 'pergunta', 'perguntas')}, cerca de ${minutes} min`,
      difficulty: 'Dificuldade',
      difficultyOptions: {
        easy: {
          label: 'Aquecimento',
          description: 'Perguntas diretas, com um único pedido claro cada.',
        },
        standard: {
          label: 'Padrão',
          description: 'O que um entrevistador comum perguntaria de verdade.',
        },
        hard: {
          label: 'Difícil',
          description: 'Perguntas incisivas sobre trade-offs e casos extremos.',
        },
      },
      languageDescription:
        'O idioma em que o entrevistador pergunta, em que tudo é transcrito e em que seu feedback chega.',
      estimate: (minutes: number) => `Normalmente cerca de ${minutes} min.`,
      unlimited: 'Ilimitado com a sua assinatura.',
      covers: (minutes: number) =>
        `Seu tempo grátis cobre cerca de ${minutes} ${n(minutes, 'minuto', 'minutos')}.`,
      endsEarly: 'A sessão termina quando seu tempo grátis acaba, e você ainda recebe o relatório.',
    },

    session: {
      heading: 'Sessão de entrevista simulada',
      starting: 'Iniciando…',
      generating: 'Pensando na próxima pergunta…',
      evaluating: 'Pensando…',
      scoring: 'Avaliando a entrevista…',
      stopping: 'Encerrando a entrevista…',
      speaking:
        'O entrevistador está falando. Seu microfone fica desligado enquanto a pergunta toca.',
      readThenReady:
        'Leia a pergunta. Sua resposta é gravada a partir de quando você estiver pronto.',
      listening: 'Ouvindo…',
      ready: 'Estou pronto',
      doneAnswering: 'Terminei',
      doneAnsweringTooltip: 'Envie sua resposta e siga em frente',
      toggleHints: 'Ativar ou desativar as sugestões ao vivo',
      hintsOn: 'Sugestões ao vivo: ativadas',
      hintsOff: 'Sugestões ao vivo: desativadas',
      hintsOnHint: 'Mostra o que o assistente ao vivo responderia',
      hintsOffHint: 'Treine sem dicas',
      endInterview: 'Encerrar entrevista',
      startFailed: 'Não foi possível iniciar a entrevista simulada',
      startingPage: 'Iniciando a entrevista simulada…',
    },

    report: {
      heading: 'Relatório da entrevista simulada',
      verdictExcellent: 'Excelente',
      verdictStrong: 'Forte',
      verdictDeveloping: 'Em desenvolvimento',
      verdictNeedsWork: 'Precisa melhorar',
      scoreFailed: (reason: string) =>
        `Não foi possível gerar a nota geral (${reason}). Suas respostas continuam abaixo e ainda podem ser exportadas.`,
      scoreAgain: 'Avaliar de novo',
      scoring: 'Avaliando…',
      overallScore: 'Nota geral',
      strengths: 'Pontos fortes',
      gaps: 'Pontos a melhorar',
      nothingNoted: 'Nada específico a destacar.',
      perQuestion: 'Detalhes por pergunta',
      yourAnswer: 'Sua resposta',
      noAnswerRecorded: '(nenhuma resposta gravada)',
      score: 'Nota',
      strongerAnswer: 'Resposta mais forte',
      saveAsWord: 'Salvar como Word',
      saveAsMarkdown: 'Salvar como Markdown',
      exportFailed: 'Não foi possível exportar o relatório',
      practiseAgain: 'Treinar de novo',
      done: 'Concluído',
    },
  },

  mainRoute: {
    redirectingToLogin: 'Redirecionando para o login…',
    authenticating: 'Autenticando…',
    transcriptionHidden: 'A transcrição está oculta',
    awaitingFirstQuestion: {
      title: 'Aguardando a primeira pergunta…',
      description:
        'As sugestões aparecem aqui assim que o entrevistador perguntar algo. Atalhos úteis durante a entrevista:',
    },
  },

  documentation: {
    intro: (appName: string) =>
      `O ${appName} é um assistente com IA que melhora suas entrevistas com sugestões em tempo real e recomendações de código a partir da tela.`,
    docsLead: 'Para a documentação completa, acesse ',
    docsLinkText: 'powerinterviewai.com/docs',
    docsTrailing: '. Pressione Cmd/Ctrl+K em qualquer lugar do app para buscar uma ação.',

    lostWindow: {
      title: 'Perdeu a janela?',
      body: (appName: string) =>
        `No modo furtivo, o ${appName} sai da barra de tarefas e do Dock do macOS para não aparecer quando você compartilha a tela, o que também significa que uma janela minimizada não tem botão para clicar. Basta abrir o ${appName} de novo: ele não inicia uma segunda cópia, traz esta janela de volta. Fora do modo furtivo, o botão da barra de tarefas e o ícone do Dock continuam lá, a menos que você tenha ativado "Ocultar o ícone da barra de tarefas durante entrevistas ao vivo".`,
    },

    language: {
      title: 'Entrevistas em outro idioma',
      oneSetting:
        'Uma única configuração vale para a sessão toda: qual modelo de fala transcreve a chamada, em que idioma as sugestões são escritas e o idioma do relatório exportado. Altere no botão de idioma da barra de controle, na página de configurações ou na janela da entrevista simulada: todos mudam a mesma coisa.',
      supported: (count: number) => `${count} idiomas disponíveis:`,
      midInterview:
        'Você pode mudar durante a entrevista. As sugestões seguem na hora, a partir da próxima resposta. O reconhecimento de fala demora um pouco mais: ele reconecta, então a frase dita naquele instante pode sair cortada na transcrição.',
      textOnly:
        'Numa entrevista simulada, um idioma marcado como “só texto” não tem voz disponível: o entrevistador escreve as perguntas em vez de falar. Você continua respondendo em voz alta, e a nota não muda.',
      appLanguageTitle: 'O app tem o próprio idioma',
      appLanguageBody:
        'O idioma acima é o da entrevista. O idioma em que o próprio app está escrito (botões, títulos e mensagens) é uma configuração separada na página de configurações, e é também a primeira pergunta da configuração inicial. Um não é deduzido do outro: quem fala russo e faz entrevista em inglês quer a transcrição em inglês e o app em russo.',
    },

    microphone: {
      title: 'Trocar de microfone durante a entrevista',
      body: 'O botão do microfone na barra de controle continua disponível durante a entrevista. Se o fone descarregar, for desconectado ou for o dispositivo errado, escolha outro ali em vez de parar o assistente: parar apaga também a transcrição e as sugestões.',
      immediate:
        'A troca vale na hora e a transcrição continua, então nada é cortado. Se o dispositivo escolhido não puder ser aberto (desconectado ou em uso por outro app), a entrevista continua com o anterior e o app avisa.',
    },

    suggestionStyle: {
      title: 'Sugestões só com dicas ou com frases completas',
      body: 'Só dicas é o padrão: cada sugestão chega como um título de uma linha com palavras-chave, para você captar de relance e continuar falando. Frases completas escreve a resposta como ela seria dita: mais para ler, menos para improvisar.',
      switching: (combo: string) =>
        `Alterne entre os dois na barra de controle, na página de configurações ou com ${combo}, que também funciona no modo furtivo. As sugestões que já estão na tela mantêm o estilo em que foram geradas; só a próxima muda.`,
    },

    settings: {
      title: 'Onde ficam suas configurações',
      accountLabel: 'Conta',
      accountBody:
        ' guarda quem você é: o nome que você usa, o perfil ou currículo de onde saem as sugestões, o contexto da vaga e a sua senha.',
      configurationLabel: 'Configurações',
      configurationBody:
        ' guarda como a entrevista funciona: o idioma do app, seu microfone (com teste), o idioma da entrevista, o estilo das sugestões e se o painel de transcrição fica fixo. Nada precisa ser salvo; cada mudança vale na hora.',
      both: 'As duas estão na tela inicial, no menu da barra de título e na paleta Cmd/Ctrl+K. Uma instalação nova passa por tudo isso uma vez na primeira abertura.',
    },

    hotkeys: 'Atalhos',
  },

  payment: {
    title: 'Assinatura',
    tabs: {
      buy: 'Planos',
      history: 'Histórico',
      status: 'Situação',
    },

    buy: {
      features: {
        unlimited: 'Entrevistas ao vivo e de prática ilimitadas',
        model: 'Nosso modelo de IA mais avançado',
        noRenewal: 'Pré-pago - sem renovação automática',
      },
      currentPlan: 'Seu plano',
      subscribedUntil: (plan: string, date: string) => `${plan}, até ${date}`,
      daysLeft: (days: number) => `${n(days, 'Resta', 'Restam')} ${days} ${n(days, 'dia', 'dias')}`,
      freePlan: 'Plano grátis',
      freeLeft: (duration: string) => `${duration} de entrevistas restantes no modelo grátis.`,
      freeUsedUp: 'Seu tempo grátis acabou. Assine para continuar suas entrevistas.',
      duration: (hours: number, minutes: number) => {
        const parts: string[] = [];
        if (hours) parts.push(`${hours} ${n(hours, 'hora', 'horas')}`);
        if (minutes) parts.push(`${minutes} ${n(minutes, 'minuto', 'minutos')}`);
        return parts.join(' ') || '0 minutos';
      },
      loadingPlans: 'Carregando planos…',
      mostPopular: 'Mais popular',
      planDescriptions: {
        monthly: 'Entrevistas ilimitadas no modelo SOTA por um mês',
        quarterly: 'Entrevistas ilimitadas no modelo SOTA por três meses',
        yearly: 'Entrevistas ilimitadas no modelo SOTA por um ano',
      },
      perMonth: ' / mês',
      billedAs: (price: number, months: number) =>
        `US$ ${price} pagos uma vez, por ${months} ${n(months, 'mês', 'meses')}`,
      save: (percent: number) => `Economize ${percent}%`,
      prepaid: 'Pago uma vez em cripto. Um passe nunca se renova sozinho.',
      refundPrompt: 'Precisa de reembolso?',
      refundContact: 'Fale com o suporte',
      extends:
        'Sua assinatura está ativa: um novo passe soma o tempo dele depois da data de término atual.',
      selected: 'Selecionado',
      buy: 'Escolher',
      detailsTitle: 'Detalhes do pagamento',
      detailsLead: 'Conclua a compra do plano ',
      detailsFor: ' por ',
      currencyLabel: 'Moeda de pagamento',
      currencyPlaceholder: 'Selecione uma moeda',
      currencySearchPlaceholder: 'Buscar moeda…',
      noCurrency: 'Nenhuma moeda encontrada',
      createPayment: 'Criar pagamento',
      creatingPayment: 'Criando pagamento…',
    },

    history: {
      loading: 'Carregando o histórico de pagamentos…',
      loadFailed: 'Não foi possível carregar o histórico de pagamentos',
      emptyTitle: 'Nenhum pagamento',
      emptyBody: 'Você ainda não fez nenhum pagamento. Assine para começar.',
      subscribe: 'Ver planos',
      refreshing: 'Atualizando…',
      remainder: 'Saldo restante',
      grant: (months: number, days: number, credits: number) =>
        months > 0
          ? `${months} ${n(months, 'mês', 'meses')}`
          : days > 0
            ? `${days.toLocaleString('pt-BR')} ${n(days, 'dia', 'dias')}`
            : credits > 0
              ? `${credits.toLocaleString('pt-BR')} créditos`
              : '-',
      columns: {
        created: 'Data',
        paymentId: 'ID do pagamento',
        purchase: 'Compra',
        amount: 'Valor',
        status: 'Situação',
        action: 'Ação',
      },
      notAvailable: 'N/D',
      view: 'Ver',
    },

    status: {
      title: 'Consultar pagamento',
      description: 'Digite um ID de pagamento para ver a situação atual',
      idPlaceholder: 'Digite o ID do pagamento',
      check: 'Consultar',
      checking: 'Consultando…',
      notFound: 'Pagamento não encontrado',
      fetchFailed: 'Não foi possível obter a situação do pagamento',
      order: (orderId: string) => `Pedido nº ${orderId}`,
      refreshing: 'Atualizando…',
      amountToPay: 'Valor a pagar',
      priceUsd: 'Preço (USD)',
      actuallyPaid: 'Valor pago',
      paymentMethods: 'Formas de pagamento',
      qrTab: 'QR code',
      addressTab: 'Endereço',
      downloadQr: 'Baixar QR code',
      qrSaved: 'QR code salvo',
      scanWithWallet: 'Escaneie com o app da sua carteira',
      qrIncludes: (amount: string) => `O QR code inclui o endereço e o valor (${amount})`,
      paymentAddress: 'Endereço de pagamento',
      amountToSend: 'Valor a enviar',
      sendExactly: 'Envie exatamente este valor para o endereço acima.',
      successTitle: 'Pagamento concluído!',
      successBody: 'Sua assinatura foi aplicada à sua conta.',
      expiredTitle: 'Pagamento expirado',
      failedTitle: 'Pagamento recusado',
      expiredBody: 'Este pagamento expirou. Crie um novo pagamento.',
      failedBody: 'Não foi possível processar o pagamento. Tente de novo.',
      refundedTitle: 'Pagamento reembolsado',
      refundedBody: 'Este pagamento foi reembolsado. Fale com o suporte se tiver dúvidas.',
      receivedTitle: 'Pagamento recebido',
      receivedBody:
        'Seu pagamento está sendo confirmado na rede. Não é preciso pagar mais nada, e sua assinatura é aplicada automaticamente.',
      partialTitle: 'Pagamento parcial recebido',
      partialBody:
        'Estamos preparando um novo endereço para o saldo restante. Ele vai aparecer aqui e chegar por e-mail. Não envie mais nada para o endereço anterior.',
      created: 'Criado:',
      updated: 'Atualizado:',
      addressCopied: 'Endereço de pagamento copiado',
      amountCopied: 'Valor copiado',
      currencyCopied: 'Moeda copiada',
    },

    statusLabels: {
      waiting: 'Aguardando',
      confirming: 'Confirmando',
      confirmed: 'Confirmado',
      sending: 'Enviando',
      partiallyPaid: 'Pago em parte',
      finished: 'Concluído',
      failed: 'Recusado',
      refunded: 'Reembolsado',
      expired: 'Expirado',
    },

    errors: {
      getPlans: 'Não foi possível obter os planos',
      getCurrencies: 'Não foi possível obter as moedas',
      createPayment: 'Não foi possível criar o pagamento',
      getStatus: 'Não foi possível obter a situação do pagamento',
      getHistory: 'Não foi possível obter o histórico de pagamentos',
    },
  },

  settingsToasts: {
    saveMicrophoneFailed: 'Não foi possível salvar o microfone selecionado',
    microphoneSwapFailed: 'Salvo, mas a entrevista continua usando o microfone anterior',
    microphoneSwapFailedHint:
      'Verifique se o dispositivo está conectado e depois pare e inicie o assistente.',
    saveLanguageFailed: 'Não foi possível salvar o idioma da entrevista',
    languageHalfApplied: 'As sugestões mudaram de idioma; a transcrição ainda está reconectando',
    languageHalfAppliedHint: 'Ela continua tentando. Pare e inicie o assistente se não voltar.',
    saveSuggestionModeFailed: 'Não foi possível salvar o modo de sugestão',
    saveTranscriptPanelFailed: 'Não foi possível salvar a configuração do painel de transcrição',
    saveMockHintsFailed: 'Não foi possível salvar a configuração de sugestões ao vivo',
    saveHideTaskbarFailed:
      'Não foi possível salvar a configuração da barra de tarefas. Tente de novo.',
    saveAllowScreenCaptureFailed:
      'Não foi possível salvar a configuração de captura de tela. Tente de novo.',
    saveUiLanguageFailed: 'Não foi possível salvar o idioma do app',
  },

  assistant: {
    mockRunning: 'Pare a entrevista simulada antes de iniciar uma sessão ao vivo.',
    stoppedUncleanly: 'O assistente parou, mas nem tudo foi encerrado corretamente',
    stoppedUncleanlyHint: 'Reinicie o app se transcrições ou sugestões continuarem chegando.',
    startFailed: 'Não foi possível iniciar o assistente',
    stopFailed: 'Não foi possível parar o assistente',
    screenCaptureTimedOut: 'A captura de tela demorou demais. Tente de novo.',
  },

  mockStartChecks: {
    deviceNotFound: (deviceName: string) =>
      `O dispositivo de entrada de áudio "${deviceName}" não foi encontrado. Escolha outro nas opções de áudio da tela principal.`,
  },

  creditGate: {
    tooLow: 'Tempo grátis insuficiente para começar',
    outOfCredits: 'Seu tempo grátis acabou: a sessão terminou',
    outOfCreditsHint: 'Assine para ter entrevistas ilimitadas.',
    replaced: 'Entrevista encerrada: outra começou nesta conta',
    replacedHint: 'Uma conta só pode fazer uma entrevista por vez.',
    lowBalance: (minutes: number) =>
      `${n(minutes, 'Resta', 'Restam')} cerca de ${minutes} ${n(minutes, 'minuto', 'minutos')} de tempo grátis`,
    lowBalanceHint: 'A sessão termina quando seu tempo grátis acaba.',
    tooLowHint:
      'Uma sessão precisa de pelo menos um minuto. Assine para ter entrevistas ilimitadas no modelo SOTA.',
    subscribe: 'Ver planos',
  },

  subscriptionExpiry: {
    endingSoon: (days: number) => `Sua assinatura termina em ${days} ${n(days, 'dia', 'dias')}`,
    endingSoonHint:
      'Compre outro passe para manter as entrevistas ilimitadas. O tempo dele é somado depois da data de término atual.',
    ended: 'Sua assinatura terminou',
    endedHint: 'Agora as entrevistas usam seu tempo grátis no modelo grátis.',
  },

  trialNotice: {
    freeTierLead: 'Plano grátis: 1 hora de entrevistas com o modelo ',
    freeTier: 'gratuito',
    freeTierTail: '.',
    sotaLead: 'Assine para ter entrevistas ilimitadas com o modelo ',
    sota: 'mais avançado',
    sotaTail: '.',
  },
};
