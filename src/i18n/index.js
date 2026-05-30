import { inject, readonly, ref } from 'vue';

export const availableLocales = [
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'en', label: 'EN', name: 'English' },
];

const STORAGE_KEY = 'linuxFormationLocale';
const DEFAULT_LOCALE = 'fr';

const loadInitialLocale = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return availableLocales.some((locale) => locale.code === stored)
    ? stored
    : DEFAULT_LOCALE;
};

export const currentLocale = ref(loadInitialLocale());

export const messages = {
  fr: {
    app: {
      language: 'Langue',
      footerSoundEffect: 'Effets sonores',
      footerFrom: 'depuis',
    },
    common: {
      action: 'Action',
      admin: 'Admin',
      cancel: 'Annuler',
      close: 'Fermer',
      commands: 'Commandes',
      create: 'Créer',
      errors: 'Erreurs',
      hide: 'Masquer',
      open: 'Ouvrir',
      participant: 'Participant',
      participants: 'Participants',
      refresh: 'Actualiser',
      save: 'Enregistrer',
      session: 'Session',
      show: 'Afficher',
      status: 'Statut',
      view: 'Voir',
      warning: 'Attention !',
    },
    session: {
      currentModeAdmin: 'administration',
      currentModeOffline: 'utilisation libre',
      currentModeParticipant: 'session en cours',
      heroTitle: "Choisir un mode d'utilisation",
      heroSubtitle: 'Entraine-toi librement ou rejoins une session suivie par un formateur.',
      connection: 'Connexion : {url}',
      freeUse: 'Utilisation libre',
      freeUseDescription: 'Tu progresses à ton rythme, sans suivi externe.',
      currentMode: 'Mode actuel : {mode}',
      openPlatform: 'Ouvrir la plateforme',
      joinSession: 'Rejoindre une session',
      sessionCode: 'Code de session',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Mail',
      join: 'Rejoindre',
      codeRequired: 'Le code de session est requis.',
      firstNameRequired: 'Le prénom est requis.',
      lastNameRequired: 'Le nom est requis.',
      emailRequired: 'Le mail est requis.',
      emailInvalid: 'Le format du mail est invalide.',
      joinFailed: 'Impossible de rejoindre la session.',
    },
    admin: {
      eyebrow: 'Espace formateur',
      title: 'Suivi de session',
      subtitle: 'Crée des sessions, retrouve-les facilement et suis la progression des participants.',
      joinSession: 'Rejoindre une session',
      backToPlatform: 'Retour à la plateforme',
      lock: 'Verrouiller',
      passwordDescription: 'Saisis le mot de passe formateur pour créer des sessions et consulter le suivi des participants.',
      trainerPassword: 'Mot de passe formateur',
      accessTracking: 'Accéder au suivi',
      createSession: 'Créer une session',
      sessionName: 'Nom de session',
      sessionNamePlaceholder: 'Cours Linux - groupe A',
      create: 'Créer',
      openExistingSession: 'Ouvrir une session existante',
      adminKey: "Clé d'administration",
      adminKeyPlaceholder: 'Clé de la session',
      availableSessions: 'Sessions disponibles',
      availableSessionsCaption: '{count} session(s) créée(s). Choisis un code pour préparer l\'ouverture d\'une session.',
      session: 'Session',
      creation: 'Création',
      useCode: 'Utiliser ce code',
      noSessions: 'Aucune session créée pour le moment.',
      activeSession: 'Session active',
      completed: 'Complètes',
      averageGap: 'Intervalle moyen : {value}',
      averageGapLabel: 'Intervalle moyen',
      averageParticipantGap: 'Intervalle moyen par participant : {value}',
      averageRate: 'Rythme moyen : {value} / min',
      copyCode: 'Copier le code',
      closeSession: 'Fermer la session',
      hideSession: 'Masquer cette session',
      step: 'Étape',
      lastGap: 'Dernier intervalle',
      path: 'Chemin',
      lastActivity: 'Dernière activité',
      emailMissing: 'Mail non renseigné',
      tutorialCompleted: 'Tutoriel terminé',
      inProgress: 'En cours',
      noParticipants: 'Aucun participant pour le moment.',
      commandRate: 'Rythme des commandes',
      commandCount: '{count} commande(s)',
      noTimeline: 'Aucun historique temporel disponible.',
      commandHistory: 'Historique des commandes',
      commandHistoryCaption: 'Retrouve rapidement un participant et classe les commandes par heure, participant ou statut.',
      searchParticipant: 'Rechercher un participant',
      time: 'Heure',
      command: 'Commande',
      sincePrevious: 'Depuis la précédente',
      sinceParticipantPrevious: 'Depuis la précédente du participant',
      emptyCommand: '(vide)',
      noHistoryMatch: 'Aucune commande ne correspond au filtre actuel.',
      teachingSignals: 'Signaux pédagogiques',
      teachingSignalsCaption: 'Repère rapidement les blocages probables pendant la session.',
      participantsToHelp: 'Participants à aider',
      commonMistakes: 'Erreurs récurrentes',
      stepBottlenecks: 'Étapes bloquantes',
      noTeachingSignals: 'Aucun signal particulier pour le moment.',
      issueCount: '{count} occurrence(s)',
      participantHelpLine: '{errors} erreur(s), {commands} commande(s)',
      participantStuckLine: 'Étape : {step}',
      unknownStep: 'Non renseignée',
      invalidPassword: 'Mot de passe formateur invalide.',
      sessionsLoadFailed: 'Impossible de récupérer les sessions.',
      sessionLoadFailed: 'Impossible de charger la session.',
      sessionCreated: 'Session admin créée.',
      createFailed: 'Impossible de créer la session.',
      existingSessionLoadFailed: 'Impossible de charger cette session.',
      sessionClosed: 'Session fermée.',
      closeFailed: 'Impossible de fermer la session.',
      codeReady: "Code {code} repris. Saisis maintenant la clé d'administration pour ouvrir cette session.",
      codeCopied: 'Code {code} copié.',
      formatStepCompleted: 'Complète',
      formatStepNumber: 'Étape {step}',
      states: {
        active: 'active',
        closed: 'fermée',
        valid: 'valide',
        warning: 'avertissement',
        error: 'erreur',
        info: 'info',
      },
    },
    navigation: {
      bannerParticipant: 'Participant : {name}',
      bannerAdminConnected: 'Admin connecté à {code}',
      modeSession: 'Mode session',
      modeAdmin: 'Mode admin',
      modeOffline: 'Mode hors session',
      sessionWithCode: 'Session {code}',
      adminWithCode: 'Admin {code}',
      leave: 'Quitter',
      robotAlt: 'Assistant robot',
      missionTitle: 'Briefing de mission',
      missionIntro1: "👋 Padawan du Shell, te voilà enfin !<br>L'ordinateur d'entraînement a dormi 17 cycles... mais ta venue l'a réveillé.<br><br>J'ai besoin d'un pilote. D'un vrai.<br>D'un humain qui sait taper plus vite que son ombre.",
      missionObjectiveLabel: 'Objectif',
      missionObjectiveIntro: 'Explorer un vieux système Linux abandonné et réactiver 5 modules sacrés :',
      missionObservation: "Observation : Te situer dans l'arborescence",
      missionExploration: 'Exploration | Déplacement : Explorer les environs',
      missionCleanup: "Nettoyage : Nettoyer l'antique dossier",
      missionRestoration: "Restauration : Monter l'opération",
      missionQuestion: '🤔 Tu veux un copilote baptisé <span class="font-weight-bold">"Tutoriel"</span> ou tu fonces en solo ?',
      skip: 'Passer',
      startTutorial: 'Lancer le tutoriel',
      editorTitle: 'Édition - {path}',
      editorFallbackTitle: 'Éditeur de fichier',
      editorContentLabel: 'Contenu du fichier',
      badgesToggle: '{action} les badges ({earned}/{total})',
      helpTooltip: "Besoin d'aide ? Clique pour lancer help dans le terminal.",
      noCommandMatchTooltip: 'Analyse : aucune commande connue ne correspond à ces caractères.',
      commandLabel: 'Entrez une commande (help, cd, ls, mkdir, touch, chmod...)',
      commandPlaceholder: 'Par exemple : cd documents',
      firstCommandHint: 'Entrez votre première commande en cliquant ici',
      skipTutorial: 'Passer le tutoriel',
      stepCounter: 'Étape {current} / {total}',
      missionDone: "Mission accomplie ! Tu peux continuer à t'entrainer librement.",
      badges: 'Badges',
      achievementUnlocked: 'Succès débloqué',
      pwdTooltip: "Entrez la commande 'pwd' afin de savoir si vous n'êtes pas perdu.",
      chmodCommand: 'commande :',
      chmodTooltip: "permet de configurer l'accès aux fichiers et aux répertoires",
      chmodTarget: 'concernant le {type} :',
      file: 'fichier',
      folder: 'dossier',
      commandHistory: 'Historique des commandes',
      chmodHeader: 'COMMANDE [cd] : CHANGE DIRECTORY',
      learningModeLabel: 'Mode',
      learningModes: [
        { value: 'guided', label: 'Guidé', description: 'Suggestions, indices détaillés et accompagnement du robot.', icon: 'mdi-school-outline' },
        { value: 'practice', label: 'Pratique', description: 'Moins d’assistance, mais les retours restent explicites.', icon: 'mdi-keyboard-outline' },
        { value: 'evaluation', label: 'Évaluation', description: 'Aucune suggestion et retours limités pour se tester.', icon: 'mdi-clipboard-check-outline' },
      ],
      resetTraining: 'Recommencer l’entraînement',
      resetTooltip: 'Réinitialiser l’arborescence, le tutoriel, les badges et l’historique local.',
      terminalOutputLabel: 'Sortie du terminal',
      treeLegendTitle: 'Légende',
      treeLegendFolder: 'Dossier',
      treeLegendFile: 'Fichier',
      treeLegendCurrent: 'Position actuelle',
      treeLegendPath: 'Chemin parcouru',
      treeAriaLabel: 'Visualisation de l’arborescence Linux',
    },
    navigationData: {
      tutorialSteps: [
        {
          id: 'help',
          title: '1. Découvre ton arsenal',
          description: "Tape `help` pour afficher toutes les commandes disponibles dans ce poste d'entraînement.",
          success: 'Tu sais maintenant comment obtenir la liste des commandes.',
          concept: "Quand tu bloques dans un terminal, commence par chercher l'aide disponible avant d'essayer au hasard."
        },
        {
          id: 'pwd',
          title: '2. Repérer ta position',
          description: 'Tape `pwd` pour afficher le chemin comme <strong>root &gt; home &gt; user</strong>.',
          success: 'Tu sais maintenant où tu te trouves.',
          concept: '`pwd` répond à la question “où suis-je ?” dans l’arborescence.'
        },
        {
          id: 'ls',
          title: '3. Observer les environs',
          description: 'Exécute `ls` (optionnellement avec `-l`) pour voir les dossiers disponibles.',
          success: 'Cartographie du secteur réalisée.',
          concept: '`ls` sert à observer avant d’agir : il évite de taper une commande sur le mauvais élément.'
        },
        {
          id: 'cd-documents',
          title: '4. Atteindre le dossier documents',
          description: 'Utilise `cd documents` (ou le chemin absolu) pour rejoindre le dossier <strong>documents</strong>.',
          success: 'Bienvenue dans les documents.',
          concept: '`cd` change le dossier courant ; toutes les commandes suivantes partiront de ce nouvel emplacement.'
        },
        {
          id: 'cd-parent',
          title: "5. Remonter d'un niveau",
          description: "Utilise `cd ..` ou `cd ../` pour revenir au dossier parent et apprendre à reculer d'un cran.",
          success: 'La marche arrière est maîtrisée.',
          concept: '`..` désigne toujours le dossier parent, peu importe le nom du dossier courant.'
        },
        {
          id: 'cd-documents-return',
          title: '6. Retourner dans documents',
          description: 'Reviens maintenant dans <strong>documents</strong> avec `cd documents` pour poursuivre la mission.',
          success: 'De retour dans documents, prêt pour la suite.',
          concept: 'Naviguer efficacement consiste à combiner chemins relatifs et observation régulière.'
        },
        {
          id: 'ls-documents',
          title: '7. Vérifier le contenu de documents',
          description: 'Affiche ce que contient <strong>documents</strong> avec `ls` avant de supprimer quoi que ce soit.',
          success: 'Tu as vérifié le contenu de documents.',
          concept: 'Avant une suppression, liste toujours le contenu pour confirmer la cible.'
        },
        {
          id: 'rm-archives',
          title: '8. Nettoyer les archives',
          description: "Supprime l'ancien dossier `archives` avec `rm -r archives`.",
          success: 'Archives nettoyées avec succès.',
          concept: '`rm -r` supprime un dossier et son contenu ; c’est puissant, donc à utiliser avec une cible claire.'
        },
        {
          id: 'mkdir-mission',
          title: '9. Préparer la mission',
          description: 'Crée un nouveau dossier `mission` (ex: `mkdir mission`) dans <strong>documents</strong>.',
          success: 'Dossier mission créé.',
          concept: '`mkdir` structure ton espace de travail en créant des dossiers.'
        },
        {
          id: 'ls-mission-check',
          title: '10. Confirmer la création',
          description: 'Exécute `ls` dans <strong>documents</strong> pour vérifier que le dossier `mission` est présent.',
          success: 'Mission est bien visible dans documents.',
          concept: 'Après une création, vérifie le résultat : c’est une habitude simple qui évite beaucoup d’erreurs.'
        },
        {
          id: 'cd-mission',
          title: '11. Entrer dans mission',
          description: 'Déplace-toi dans le dossier `mission`.',
          success: 'Mission est maintenant ton dossier courant.',
          concept: 'Le dossier courant définit le contexte des créations et lectures de fichiers.'
        },
        {
          id: 'touch-briefing',
          title: '12. Créer le briefing',
          description: 'Crée un fichier `briefing.txt` (ex: `touch briefing.txt`) dans <strong>mission</strong>.',
          success: 'Briefing.txt est en place, mission accomplie !',
          concept: '`touch` crée un fichier vide ou met à jour sa date si le fichier existe déjà.'
        },
      ],
      commandDescriptions: {
        '': 'Information système',
        help: 'Affiche la liste des commandes disponibles.',
        man: "Consulte la documentation détaillée d'une commande.",
        pwd: 'Affiche le chemin du répertoire courant.',
        echo: 'Renvoie du texte dans le terminal.',
        cd: 'Change de répertoire.',
        ls: "Liste le contenu d'un dossier.",
        ll: 'Alias de ls -l : liste détaillée des fichiers.',
        mkdir: 'Crée un nouveau dossier.',
        touch: 'Crée ou met à jour un fichier.',
        rm: 'Supprime un fichier ou un dossier.',
        chmod: "Modifie les permissions d'un fichier ou dossier.",
        cat: "Affiche le contenu d'un fichier (supporte la redirection).",
        head: "Affiche les premières lignes d'un fichier (option -n).",
        tail: "Affiche les dernières lignes d'un fichier (option -n).",
        nano: 'Ouvre un éditeur pop-up pour modifier un fichier.',
      },
      badges: [
        { id: 'explorer', title: 'Explorateur', description: 'Visite 10 répertoires différents.', icon: 'mdi-compass' },
        { id: 'architecte', title: 'Architecte', description: 'Crée un dossier et un fichier.', icon: 'mdi-home-analytics' },
        { id: 'nettoyeur', title: 'Nettoyeur', description: 'Supprime un dossier avec rm -r.', icon: 'mdi-delete-sweep' },
        { id: 'sage', title: 'Sage du shell', description: 'Consulte 3 pages man.', icon: 'mdi-book-open-variant' },
        { id: 'mentor', title: 'Mentor', description: "Termine le tutoriel d'entraînement.", icon: 'mdi-school-outline' },
      ],
      robotDialogues: [
        "Je t'observe, courage.",
        'Continue à apprendre, tu te débrouilles bien.',
        'Chaque commande compte, même les petites.',
        "Les archives n'ont qu'à bien se tenir.",
        'Un terminal heureux est un terminal utilisé.',
        'La précision est ta meilleure alliée.',
        'Tu vas devenir un maître du shell.',
        'Une étape à la fois, ça avance.',
        "J'adore quand tu utilises pwd 📍.",
        'Les dossiers tremblent devant toi.',
        'On respire, on tape, on réussit.',
        'Tu as déjà parcouru un long chemin.',
        "Je garde un œil bienveillant sur toi 👀.",
        'Les erreurs sont juste des indices déguisés.',
        'Quel style dans tes commandes !',
        'La mission avance, ne lâche rien.',
        'Tu fais ça comme un(e) pro.',
        'Ton futur toi te dira merci.',
        "Les neurones chauffent, j'aime ça 🔥.",
        "Linux n'a qu'à bien se tenir.",
        'Laisse ta curiosité te guider.',
        'Une pause café ? Non, une commande !',
        'Chaque cd te rapproche de la victoire.',
        'Tu fais danser les répertoires 💃.',
        'Garde le cap, le terminal est avec toi.',
        'La patience est ta superpuissance.',
        'Même les octets te regardent avec respect.',
        'Tu tapes vite, mais tu apprends encore plus vite ⚡.',
        'Ton clavier est ton sabre laser.',
        "Un shell bien dompté, c'est la liberté.",
        'On dirait que tu connais déjà la voie.',
        "Les permissions t'obéissent 👑.",
        'Chaque réussite mérite un petit sourire.'
      ],
      robotErrorEncouragements: [
        'Courage, tu vas y arriver !',
        'Respire et réessaie calmement.',
        "Les erreurs font aussi partie de l'apprentissage.",
        'Chaque tentative te rapproche de la solution.',
        'On corrige et on continue.',
        'Un petit ajustement et ça passera.',
        'Ne lâche rien, tu es sur la bonne voie.',
        "Tu peux le faire, j'en suis sûr.",
        'Analyse, corrige, et fonce.',
        'Même les maîtres du shell se trompent parfois.'
      ],
    },
    terminal: {
      xtermWelcome: 'Bienvenue dans le terminal Bash !',
      suggestions: 'Suggestions : {items}',
      tutorialFinished: 'Mission accomplie, continue librement !',
      tutorialFinishedRobot: '🚀 Mission accomplie ! Tu peux poursuivre librement 🚀',
      tutorialStepValidated: 'Étape validée.',
      tutorialCommandNoMatch: "Cette commande ne valide pas encore cette étape. Réessaie en suivant l'indice ci-dessus.",
      tutorialCommandNoMatchShort: 'Cette commande ne valide pas encore cette étape.',
      conceptPrefix: 'À retenir :',
      evaluationTryAgain: "Ce n'est pas encore validé. Observe l'objectif et réessaie.",
      confirmResetTraining: "Réinitialiser l'entraînement ? L'arborescence, le tutoriel, les badges et l'historique local seront remis à zéro.",
      trainingResetDone: "Environnement réinitialisé. Tu peux recommencer depuis le début.",
      syncError: 'Erreur de synchronisation',
      errorDetected: 'Erreur détectée. {message}',
      commandBaseDescription: 'Commande {command}',
      systemInfo: 'Information système',
      errorPrefix: 'Erreur : {output}',
      warningPrefix: 'Attention : {output}',
      errorDetectedShort: 'Erreur détectée.',
      warningRequired: 'Attention requise.',
      terminalSuggestion: 'Suggestion du terminal.',
      noRedirectionTarget: "Redirection invalide : aucun fichier cible n'a été indiqué.",
      redirectionNoCommand: 'Redirection impossible : aucune commande à exécuter.',
      unknownCommand: 'Commande inconnue : {command}',
      invalidRedirectionOneTarget: 'Redirection invalide : une seule cible est autorisée.',
      folderHomeDefault: 'Déplacement vers le dossier personnel (par défaut) : {name}',
      folderCurrent: 'Dossier actuel : {name}',
      parentPermissionDenied: "Permissions non accordées pour accéder au dossier parent '{name}'.",
      folderPermissionDenied: "Permissions non accordées pour accéder au dossier '{name}'.",
      folderNotFound: 'Dossier non trouvé : {name}',
      directoryNotFound: "Erreur : Répertoire '{path}' introuvable.",
      readPermissionDenied: 'Permissions non accordées pour lire ce dossier.',
      emptyFolder: 'Dossier vide',
      folderNameRequired: 'Nom de dossier requis',
      noFolderName: 'Aucun nom de dossier fourni',
      mkdirInvalidPath: "mkdir: chemin invalide '{path}'",
      mkdirFileExistsName: "mkdir: impossible de créer le dossier '{path}' : Un fichier porte déjà ce nom",
      mkdirExists: "mkdir: impossible de créer le dossier '{path}' : Le fichier existe",
      mkdirMissingParent: "mkdir: impossible de créer le dossier '{path}' : Chemin intermédiaire manquant",
      mkdirPermissionDenied: "Permissions non accordées pour créer un dossier dans '{name}'.",
      foldersCreated: 'Dossier(s) créé(s) : {items}',
      noFolderCreated: 'Aucun dossier créé',
      fileNameRequired: 'Nom de fichier requis',
      noFileSpecified: 'Aucun fichier spécifié',
      touchInvalidPath: "touch: chemin invalide '{path}'",
      touchIsDirectory: "touch: '{path}' est un dossier",
      touchModifyPermission: "touch: permissions insuffisantes pour modifier '{path}'",
      touchParentPermission: "touch: permissions insuffisantes dans '{name}'",
      filesCreated: 'Fichier(s) créé(s) : {items}',
      timestampUpdated: 'Horodatage mis à jour : {items}',
      noFileProcessed: 'Aucun fichier traité',
      catNeedFile: 'cat: indique au moins un fichier.',
      fileNotFound: '{command}: {path}: fichier introuvable',
      permissionDenied: '{command}: {path}: permission refusée',
      lineOptionRequiresValue: "{command}: l'option -n requiert une valeur.",
      lineOptionInvalidValue: "{command}: valeur invalide '{value}' pour -n.",
      headNeedFile: 'head: indique au moins un fichier.',
      tailNeedFile: 'tail: indique au moins un fichier.',
      nanoNeedFile: 'nano: indique un fichier à éditer.',
      nanoIsDirectory: "nano: '{path}' est un dossier.",
      nanoInvalidPath: "nano: chemin invalide '{path}'.",
      nanoParentPermission: "nano: permissions insuffisantes dans '{name}'.",
      nanoEditPermission: "nano: permissions insuffisantes pour éditer '{path}'.",
      nanoOpened: "nano: édition ouverte pour '{path}'.",
      nanoNoFileToSave: 'Aucun fichier à sauvegarder.',
      nanoSaved: "nano: '{path}' sauvegardé ({bytes} octets).",
      redirectionWritten: "Redirection : {mode} {count} {label} dans '{path}'.",
      redirectionWrittenMode: 'écrit',
      redirectionAppendMode: 'ajouté',
      characterSingular: 'caractère',
      characterPlural: 'caractères',
      redirectionNoTarget: 'Redirection : aucun fichier cible indiqué.',
      redirectionInvalidPath: "Redirection : chemin invalide '{path}'.",
      redirectionIsDirectory: "Redirection : '{path}' est un dossier.",
      redirectionFilePermission: "Redirection : permissions insuffisantes pour '{path}'.",
      redirectionParentPermission: "Redirection : permissions insuffisantes dans '{name}'.",
      redirectionSizeExceeded: "Redirection : taille maximale de {limit} dépassée pour '{path}'.",
      rmNoName: 'Erreur : Aucun nom spécifié',
      rmNoTarget: 'Erreur : Aucun fichier ou dossier à supprimer',
      rmPermissionDenied: "Permissions non accordées pour modifier le contenu de '{name}'.",
      rmUseRecursive: "Utilisez l'option -r pour supprimer les dossiers : {items}",
      rmPermissionItems: 'Permissions insuffisantes pour supprimer : {items}',
      rmNoMatch: "Erreur : Aucun élément correspondant à '{items}'",
      confirmDelete: "Supprimer '{name}' ?",
      foldersIgnored: 'Dossiers ignorés (ajoutez -r) : {items}',
      accessDenied: 'Accès refusé : {items}',
      ignoredInteractive: 'Ignoré (option -i) : {items}',
      itemsDeleted: 'Élément(s) supprimé(s) : {items}',
      noItemDeleted: 'Aucun élément supprimé',
      chmodUsage: 'Usage : chmod [options] mode fichier',
      chmodNeedFile: 'Erreur : préciser les permissions et au moins un fichier',
      chmodInvalidSymbolic: 'Erreur : Format symbolique invalide',
      chmodUpdated: 'Permissions mises à jour pour : {items}',
      notFound: 'Introuvable : {items}',
      noUpdate: 'Aucune mise à jour effectuée',
      chmodUserCan: '[user] Vous pouvez ',
      chmodGroupCan: '[group] les membres du groupe peuvent',
      chmodOtherCan: '[other] Tous les autres peuvent',
      chmodReadUser: '[r] le lire',
      chmodWriteUser: "[w] l'écrire",
      chmodExecuteUser: "[x] l'exécuter",
      chmodReadGroup: '[r] lire',
      chmodWriteGroup: '[w] écrire',
      chmodExecuteGroup: '[x] exécuter',
      manUsage: 'Usage : man <commande>',
      noManual: "Aucune page de manuel pour '{topic}'.",
      soundOn: 'Son activé 🔊',
      soundOff: 'Son coupé 🔇',
      robotGreetingShort: 'Salut !',
      robotGreeting: '👋 Salut ! Je suis ECHO, ton assistant virtuel. Tu peux couper ou activer mon son 🔊 en cliquant sur ma tête.',
      defaultErrorEncouragement: 'Tu vas y arriver.',
      mnemonicHints: {
        pwd: '[strong]Astuce mémo[/strong] : `pwd` signifie **Path Way Directory**, pour afficher ta position actuelle.',
        ls: '[strong]Astuce mémo[/strong] : `ls` vient de **List**, il affiche le contenu du dossier.',
        'cd-documents': '[strong]Astuce mémo[/strong] : `cd` signifie **Change Directory**, idéal pour entrer dans un dossier.',
        'cd-parent': '[strong]Astuce mémo[/strong] : `cd ..` remonte d’un cran — **Change Directory** vers le parent.',
        'cd-documents-return': '[strong]Astuce mémo[/strong] : `cd documents` te ramène dans le dossier ciblé (**Change Directory**).',
        'ls-documents': '[strong]Astuce mémo[/strong] : `ls` (pour **List**) confirme d’un coup d’œil ce que contient un dossier.',
        'cd-mission': '[strong]Astuce mémo[/strong] : utilise `cd` (**Change Directory**) pour entrer dans mission.',
        'rm-archives': '[strong]Astuce mémo[/strong] : `rm` vient de **Remove**, utile pour supprimer.',
        'mkdir-mission': '[strong]Astuce mémo[/strong] : `mkdir` signifie **Make Directory**, pour créer un dossier.',
        'ls-mission-check': '[strong]Astuce mémo[/strong] : un `ls` après `mkdir` te confirme instantanément que le dossier existe.',
        'touch-briefing': '[strong]Astuce mémo[/strong] : `touch` crée ou met à jour un fichier en une commande.',
      },
      tutorialIntroHint: 'Bienvenue dans le cockpit ! Clique sur le champ de saisie pour prendre les commandes.',
      tutorialHelpHint: 'Tu es maintenant aux commandes. Besoin d’un coup de pouce ? Tape simplement `help`. Puis valide avec Entrée. ↵',
      tutorialErrors: {
        helpNotHelp: 'Avant de foncer, tape `help` pour découvrir toutes les commandes disponibles.',
        pwdNotPwd: 'Cette étape vérifie ta position : tape `pwd` pour afficher le chemin courant.',
        lsNotLs: 'Utilise `ls` (ou `ls -l`) pour afficher le contenu du dossier courant.',
        cdDocumentsNotCd: 'Rejoins le dossier `documents` avec la commande `cd`.',
        cdDocumentsNoParam: 'Précise le dossier à atteindre : `cd documents`.',
        cdDocumentsWrongTarget: "Cette étape attend le dossier 'documents', pas '{target}'.",
        cdDocumentsStillAt: 'Tu es encore sur {path}. Vise /home/user/documents.',
        cdParentNotCd: 'Utilise `cd` pour remonter d’un niveau.',
        cdParentNoParam: 'Ajoute `..` (ou `../`) après `cd` pour viser le dossier parent : `cd ..`.',
        cdParentWrongParam: 'Cette étape vérifie l’utilisation de `cd ..` (ou `cd ../`). Réessaie avec ce raccourci.',
        cdParentExpectedPath: 'Tu devrais voir /home/user comme dossier courant après `cd ..`.',
        cdReturnNotCd: 'Après avoir reculé, reviens dans `documents` avec `cd`.',
        cdReturnNoParam: 'Précise la destination : `cd documents`.',
        cdReturnWrongTarget: "Cette étape attend un retour vers 'documents', pas '{target}'.",
        cdReturnExpectedPath: 'On t’attend dans /home/user/documents avant de reprendre l’opération.',
        lsDocumentsNotLs: "Utilise `ls` pour inspecter le contenu de `documents` avant d'agir.",
        lsDocumentsWrongPath: "Reviens dans /home/user/documents puis lance `ls` pour voir ce qu'il contient.",
        lsDocumentsExpectedList: "Affiche la liste de documents avec `ls` pour confirmer ce qu'il reste avant la suppression.",
        rmArchivesNotRm: 'On attend la suppression du dossier `archives` avec `rm`.',
        rmArchivesNoParam: "Ajoute l'élément à supprimer : `rm -r archives`.",
        rmArchivesWrongTarget: 'La cible à supprimer est `archives`.',
        rmArchivesNoRecursive: "Ajoute l'option `-r` pour supprimer le dossier : `rm -r archives`.",
        rmArchivesStillExists: 'Le dossier `archives` existe encore. Lance `rm -r archives` depuis /home/user/documents.',
        mkdirMissionNotMkdir: 'Crée le dossier `mission` avec `mkdir`.',
        mkdirMissionNoParam: 'Indique le nom du dossier à créer : `mkdir mission`.',
        mkdirMissionWrongTarget: "Le dossier attendu s'appelle 'mission', pas '{target}'.",
        mkdirMissionStillMissing: 'Je ne vois toujours pas le dossier `mission` dans documents. Crée-le ici avant de continuer.',
        lsMissionNotLs: 'Vérifie la présence du dossier `mission` avec `ls`.',
        lsMissionWrongPath: "Reste dans /home/user/documents pour contrôler que `mission` s'y trouve.",
        lsMissionMissing: "Crée d'abord le dossier `mission`, puis relance `ls` pour le voir apparaître.",
        lsMissionExpected: "J'attends le résultat de `ls` montrant `mission` dans documents.",
        cdMissionNotCd: 'Utilise `cd` pour te déplacer dans le dossier `mission`.',
        cdMissionNoParam: 'Ajoute le dossier cible : `cd mission`.',
        cdMissionWrongTarget: "Cette étape attend le dossier 'mission', pas '{target}'.",
        cdMissionWrongPath: 'Le répertoire courant est {path}. Rejoins /home/user/documents/mission.',
        touchBriefingNotTouch: 'Crée le fichier `briefing.txt` avec `touch`.',
        touchBriefingNoParam: 'Indique le nom du fichier : `touch briefing.txt`.',
        touchBriefingWrongTarget: "Le fichier attendu est 'briefing.txt', pas '{target}'.",
        touchBriefingNoMission: "Crée d'abord le dossier `mission` puis exécute `touch briefing.txt` depuis ce dossier.",
        touchBriefingMissing: "Le fichier n'a pas été trouvé dans `mission`. Lance `touch briefing.txt` à cet emplacement.",
      },
      manuals: {
        man: `
MAN(1)                             Commandes Shell                             MAN(1)

NOM
    man - affiche l'aide détaillée disponible dans ce simulateur.

SYNOPSIS
    man <commande>

DESCRIPTION
    Affiche une description, la syntaxe et les options implémentées ici pour la commande cible.

OPTIONS
    (aucune complémentaire)

REMARQUE
    Seules les commandes simulées disposent d'une page de manuel.
`,
        help: `
HELP(1)                            Commandes Shell                            HELP(1)

NOM
    help - liste l'ensemble des commandes supportées.

SYNOPSIS
    help [commande]

DESCRIPTION
    Sans argument, affiche toutes les commandes disponibles. Avec une commande,
    renvoie un bref rappel d'usage. Pour plus de détails, utilisez 'man <commande>'.
`,
        pwd: `
PWD(1)                             Commandes Shell                             PWD(1)

NOM
    pwd - imprime le chemin absolu du répertoire courant.

SYNOPSIS
    pwd

OPTIONS
    (aucune)

REMARQUES
    Le chemin est calculé à partir de la racine simulée 'root'.
`,
        echo: `
ECHO(1)                            Commandes Shell                            ECHO(1)

NOM
    echo - affiche une ligne de texte.

SYNOPSIS
    echo <texte>

DESCRIPTION
    Renvoie exactement les arguments fournis.
`,
        cd: `
CD(1)                              Commandes Shell                              CD(1)

NOM
    cd - change le répertoire courant.

SYNOPSIS
    cd [chemin]

OPTIONS
    .   répertoire courant
    ..  répertoire parent
    /   chemins absolus à partir de root

REMARQUES
    Nécessite l'exécution (x) sur chaque dossier traversé.
`,
        ls: `
LS(1)                              Commandes Shell                              LS(1)

NOM
    ls - liste le contenu d'un dossier.

SYNOPSIS
    ls [-a] [-l] [chemin]

OPTIONS
    -a  inclut les fichiers cachés
    -l  vue détaillée (droits, propriétaire, date)

REMARQUES
    Le chemin peut être relatif ou absolu. Requiert les droits r+x sur la cible.
`,
        mkdir: `
MKDIR(1)                           Commandes Shell                           MKDIR(1)

NOM
    mkdir - crée un ou plusieurs dossiers.

SYNOPSIS
    mkdir [-p] dossier...

OPTIONS
    -p  crée les dossiers parents manquants sans erreur si existants

REMARQUES
    Vérifie les droits w+x sur chaque dossier parent modifié.
`,
        touch: `
TOUCH(1)                           Commandes Shell                           TOUCH(1)

NOM
    touch - crée un fichier vide ou met à jour sa date.

SYNOPSIS
    touch fichier...

OPTIONS
    (implémentation simplifiée : -a/-m acceptés mais effectuent la même mise à jour de date)

REMARQUES
    Crée les fichiers inexistants dans le répertoire cible si les droits w+x sont présents.
`,
        cat: `
CAT(1)                             Commandes Shell                             CAT(1)

NOM
    cat - lit et affiche le contenu de fichiers.

SYNOPSIS
    cat fichier...

DESCRIPTION
    Imprime les fichiers fournis dans l'ordre. La sortie peut être redirigée avec
    '>' ou '>>' pour écrire dans un autre fichier stocké en mémoire.

LIMITES
    Chaque fichier de cette simulation est plafonné à 40 Mo.
`,
        head: `
HEAD(1)                            Commandes Shell                            HEAD(1)

NOM
    head - affiche le début d'un fichier.

SYNOPSIS
    head [-n nombre] fichier...

DESCRIPTION
    Retourne les premières lignes de chaque fichier (10 par défaut).
    Accepte '-n 25' ou '-n25' pour personnaliser le nombre de lignes.
`,
        tail: `
TAIL(1)                            Commandes Shell                            TAIL(1)

NOM
    tail - affiche la fin d'un fichier.

SYNOPSIS
    tail [-n nombre] fichier...

DESCRIPTION
    Retourne les dernières lignes de chaque fichier (10 par défaut).
    Accepte '-n 25' ou '-n25' pour personnaliser le nombre de lignes.
`,
        nano: `
NANO(1)                            Commandes Shell                            NANO(1)

NOM
    nano - édite un fichier texte dans une fenêtre dédiée.

SYNOPSIS
    nano fichier

DESCRIPTION
    Ouvre un éditeur graphique simulé affichant le contenu du fichier et
    permet de modifier puis enregistrer le texte. Les fichiers dépassant
    40 Mo ne sont pas supportés.

REMARQUES
    Le fichier est créé s'il n'existe pas, sous réserve de permissions suffisantes.
`,
        rm: `
RM(1)                              Commandes Shell                              RM(1)

NOM
    rm - supprime fichiers ou dossiers.

SYNOPSIS
    rm [-r] [-f] [-i] motif...

OPTIONS
    -r  supprime récursivement les dossiers
    -f  ignore les erreurs et confirmations
    -i  demande confirmation pour chaque élément (désactivé si -f)

REMARQUES
    Les motifs utilisent '*' pour la correspondance générique. Requiert w+x sur le dossier parent.
`,
        chmod: `
CHMOD(1)                           Commandes Shell                           CHMOD(1)

NOM
    chmod - modifie les permissions d'un fichier ou dossier.

SYNOPSIS
    chmod [-R] mode cible...

MODES
    Numérique : 755, 644...
    Symbolique : u+r, g-w, a=rw, u+rwx,g+rx,o-r...
    Plusieurs segments séparés par des virgules sont pris en charge.

OPTIONS
    -R  applique la modification récursivement aux sous-dossiers/fichiers.

REMARQUES
    Seul le propriétaire peut modifier les permissions dans cette simulation.
`
      },
      helpMessages: {
        '': `
                    Commandes disponibles :
                    - man : Affiche l'aide détaillée d'une commande
                    - help : Affiche ce message d'aide
                    - pwd : Affiche le chemin du répertoire courant
                    - echo : Affiche un message
                    - cd : Change de répertoire
                    - ls : Liste les fichiers et dossiers
                    - ll : Alias de ls -l : liste détaillée des fichiers
                    - mkdir : Crée un nouveau dossier
                    - touch : Crée un nouveau fichier
                    - rm : Supprime un fichier ou un dossier
                    - chmod : Change les permissions d'un fichier ou d'un dossier
                    - cat : Lit et affiche le contenu d'un fichier (peut être redirigé avec > ou >>)
                    - head : Affiche les premières lignes d'un fichier (option -n)
                    - tail : Affiche les dernières lignes d'un fichier (option -n)
                    - nano : Ouvre un éditeur pour modifier un fichier
                `,
        pwd: 'Usage : pwd [-h]\nAffiche le chemin du répertoire courant.',
        echo: 'Usage : echo [-h] [message]\nAffiche un message.',
        cd: 'Usage : cd [-h] [répertoire]\nChange de répertoire.',
        ls: 'Usage : ls [-h] [-a] [-l]\nListe les fichiers et dossiers.',
        mkdir: 'Usage : mkdir [-h] [dossier]\nCrée un nouveau dossier.',
        touch: 'Usage : touch [-h] [fichier]\nCrée un nouveau fichier.',
        rm: 'Usage : rm [-h] [-r] [fichier|dossier]\nSupprime un fichier ou un dossier.',
        chmod: "Usage : chmod [-h] [permissions] [fichier|dossier]\nChange les permissions d'un fichier ou d'un dossier.",
        cat: "Usage : cat [-h] fichier...\nAffiche le contenu d'un ou plusieurs fichiers.",
        head: 'Usage : head [-h] [-n nombre] fichier...\nAffiche les premières lignes (10 par défaut).',
        tail: 'Usage : tail [-h] [-n nombre] fichier...\nAffiche les dernières lignes (10 par défaut).',
        nano: 'Usage : nano [-h] fichier\nOuvre un éditeur graphique pour modifier le fichier.',
        man: "Usage : man [commande]\nAffiche la documentation détaillée d'une commande disponible dans cet environnement."
      },
    },
  },
  en: {
    app: {
      language: 'Language',
      footerSoundEffect: 'Sound effects',
      footerFrom: 'from',
    },
    common: {
      action: 'Action',
      admin: 'Admin',
      cancel: 'Cancel',
      close: 'Close',
      commands: 'Commands',
      create: 'Create',
      errors: 'Errors',
      hide: 'Hide',
      open: 'Open',
      participant: 'Participant',
      participants: 'Participants',
      refresh: 'Refresh',
      save: 'Save',
      session: 'Session',
      show: 'Show',
      status: 'Status',
      view: 'View',
      warning: 'Warning!',
    },
    session: {
      currentModeAdmin: 'administration',
      currentModeOffline: 'free use',
      currentModeParticipant: 'active session',
      heroTitle: 'Choose a usage mode',
      heroSubtitle: 'Practice freely or join a session monitored by a trainer.',
      connection: 'Connection: {url}',
      freeUse: 'Free use',
      freeUseDescription: 'Progress at your own pace, without external tracking.',
      currentMode: 'Current mode: {mode}',
      openPlatform: 'Open the platform',
      joinSession: 'Join a session',
      sessionCode: 'Session code',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      join: 'Join',
      codeRequired: 'The session code is required.',
      firstNameRequired: 'First name is required.',
      lastNameRequired: 'Last name is required.',
      emailRequired: 'Email is required.',
      emailInvalid: 'The email format is invalid.',
      joinFailed: 'Unable to join the session.',
    },
    admin: {
      eyebrow: 'Trainer area',
      title: 'Session tracking',
      subtitle: 'Create sessions, find them quickly, and monitor participant progress.',
      joinSession: 'Join a session',
      backToPlatform: 'Back to platform',
      lock: 'Lock',
      passwordDescription: 'Enter the trainer password to create sessions and view participant tracking.',
      trainerPassword: 'Trainer password',
      accessTracking: 'Access tracking',
      createSession: 'Create a session',
      sessionName: 'Session name',
      sessionNamePlaceholder: 'Linux course - group A',
      create: 'Create',
      openExistingSession: 'Open an existing session',
      adminKey: 'Administration key',
      adminKeyPlaceholder: 'Session key',
      availableSessions: 'Available sessions',
      availableSessionsCaption: '{count} created session(s). Choose a code to prepare opening a session.',
      session: 'Session',
      creation: 'Created',
      useCode: 'Use this code',
      noSessions: 'No sessions have been created yet.',
      activeSession: 'Active session',
      completed: 'Completed',
      averageGap: 'Average gap: {value}',
      averageGapLabel: 'Average gap',
      averageParticipantGap: 'Average gap per participant: {value}',
      averageRate: 'Average rate: {value} / min',
      copyCode: 'Copy code',
      closeSession: 'Close session',
      hideSession: 'Hide this session',
      step: 'Step',
      lastGap: 'Last gap',
      path: 'Path',
      lastActivity: 'Last activity',
      emailMissing: 'Email not provided',
      tutorialCompleted: 'Tutorial completed',
      inProgress: 'In progress',
      noParticipants: 'No participants yet.',
      commandRate: 'Command rate',
      commandCount: '{count} command(s)',
      noTimeline: 'No timeline history available.',
      commandHistory: 'Command history',
      commandHistoryCaption: 'Quickly find a participant and sort commands by time, participant, or status.',
      searchParticipant: 'Search for a participant',
      time: 'Time',
      command: 'Command',
      sincePrevious: 'Since previous',
      sinceParticipantPrevious: "Since participant's previous",
      emptyCommand: '(empty)',
      noHistoryMatch: 'No command matches the current filter.',
      teachingSignals: 'Teaching signals',
      teachingSignalsCaption: 'Quickly identify likely blockers during the session.',
      participantsToHelp: 'Participants to help',
      commonMistakes: 'Recurring mistakes',
      stepBottlenecks: 'Blocking steps',
      noTeachingSignals: 'No specific signal yet.',
      issueCount: '{count} occurrence(s)',
      participantHelpLine: '{errors} error(s), {commands} command(s)',
      participantStuckLine: 'Step: {step}',
      unknownStep: 'Not provided',
      invalidPassword: 'Invalid trainer password.',
      sessionsLoadFailed: 'Unable to retrieve sessions.',
      sessionLoadFailed: 'Unable to load the session.',
      sessionCreated: 'Admin session created.',
      createFailed: 'Unable to create the session.',
      existingSessionLoadFailed: 'Unable to load this session.',
      sessionClosed: 'Session closed.',
      closeFailed: 'Unable to close the session.',
      codeReady: 'Code {code} selected. Now enter the administration key to open this session.',
      codeCopied: 'Code {code} copied.',
      formatStepCompleted: 'Complete',
      formatStepNumber: 'Step {step}',
      states: {
        active: 'active',
        closed: 'closed',
        valid: 'valid',
        warning: 'warning',
        error: 'error',
        info: 'info',
      },
    },
    navigation: {
      bannerParticipant: 'Participant: {name}',
      bannerAdminConnected: 'Admin connected to {code}',
      modeSession: 'Session mode',
      modeAdmin: 'Admin mode',
      modeOffline: 'Offline mode',
      sessionWithCode: 'Session {code}',
      adminWithCode: 'Admin {code}',
      leave: 'Leave',
      robotAlt: 'Robot assistant',
      missionTitle: 'Mission briefing',
      missionIntro1: "👋 Shell Padawan, here you are at last!<br>The training computer slept for 17 cycles... but your arrival woke it up.<br><br>I need a pilot. A real one.<br>A human who can type faster than their shadow.",
      missionObjectiveLabel: 'Objective',
      missionObjectiveIntro: 'Explore an old abandoned Linux system and reactivate 5 sacred modules:',
      missionObservation: 'Observation: Locate yourself in the file tree',
      missionExploration: 'Exploration | Movement: Explore the surroundings',
      missionCleanup: 'Cleanup: Clean the ancient folder',
      missionRestoration: 'Restoration: Set up the operation',
      missionQuestion: '🤔 Do you want a copilot named <span class="font-weight-bold">"Tutorial"</span>, or are you going solo?',
      skip: 'Skip',
      startTutorial: 'Start tutorial',
      editorTitle: 'Editing - {path}',
      editorFallbackTitle: 'File editor',
      editorContentLabel: 'File content',
      badgesToggle: '{action} badges ({earned}/{total})',
      helpTooltip: 'Need help? Click to run help in the terminal.',
      noCommandMatchTooltip: 'Analysis: no known command matches these characters.',
      commandLabel: 'Enter a command (help, cd, ls, mkdir, touch, chmod...)',
      commandPlaceholder: 'For example: cd documents',
      firstCommandHint: 'Enter your first command by clicking here',
      skipTutorial: 'Skip tutorial',
      stepCounter: 'Step {current} / {total}',
      missionDone: 'Mission complete! You can keep training freely.',
      badges: 'Badges',
      achievementUnlocked: 'Achievement unlocked',
      pwdTooltip: "Enter the 'pwd' command to check where you are.",
      chmodCommand: 'command:',
      chmodTooltip: 'lets you configure access to files and directories',
      chmodTarget: 'about the {type}:',
      file: 'file',
      folder: 'folder',
      commandHistory: 'Command history',
      chmodHeader: 'COMMAND [cd]: CHANGE DIRECTORY',
      learningModeLabel: 'Mode',
      learningModes: [
        { value: 'guided', label: 'Guided', description: 'Suggestions, detailed hints, and robot support.', icon: 'mdi-school-outline' },
        { value: 'practice', label: 'Practice', description: 'Less assistance, while keeping explicit feedback.', icon: 'mdi-keyboard-outline' },
        { value: 'evaluation', label: 'Assessment', description: 'No suggestions and limited feedback for self-testing.', icon: 'mdi-clipboard-check-outline' },
      ],
      resetTraining: 'Restart training',
      resetTooltip: 'Reset the file tree, tutorial, badges, and local history.',
      terminalOutputLabel: 'Terminal output',
      treeLegendTitle: 'Legend',
      treeLegendFolder: 'Folder',
      treeLegendFile: 'File',
      treeLegendCurrent: 'Current position',
      treeLegendPath: 'Traveled path',
      treeAriaLabel: 'Linux file tree visualization',
    },
    navigationData: {
      tutorialSteps: [
        {
          id: 'help',
          title: '1. Discover your toolkit',
          description: 'Type `help` to display every command available in this training station.',
          success: 'You now know how to get the command list.',
          concept: 'When you are stuck in a terminal, start by looking for available help instead of guessing.'
        },
        {
          id: 'pwd',
          title: '2. Find your position',
          description: 'Type `pwd` to display the path, such as <strong>root &gt; home &gt; user</strong>.',
          success: 'You now know where you are.',
          concept: '`pwd` answers “where am I?” in the file tree.'
        },
        {
          id: 'ls',
          title: '3. Observe the surroundings',
          description: 'Run `ls` (optionally with `-l`) to see the available folders.',
          success: 'Sector map completed.',
          concept: '`ls` helps you observe before acting, so you avoid running a command on the wrong item.'
        },
        {
          id: 'cd-documents',
          title: '4. Reach the documents folder',
          description: 'Use `cd documents` (or the absolute path) to enter the <strong>documents</strong> folder.',
          success: 'Welcome to documents.',
          concept: '`cd` changes the current folder; following commands start from this new location.'
        },
        {
          id: 'cd-parent',
          title: '5. Move up one level',
          description: 'Use `cd ..` or `cd ../` to return to the parent folder and learn how to step back.',
          success: 'Reverse movement mastered.',
          concept: '`..` always means the parent folder, regardless of the current folder name.'
        },
        {
          id: 'cd-documents-return',
          title: '6. Return to documents',
          description: 'Now go back to <strong>documents</strong> with `cd documents` to continue the mission.',
          success: 'Back in documents, ready for the next step.',
          concept: 'Efficient navigation combines relative paths and regular observation.'
        },
        {
          id: 'ls-documents',
          title: '7. Check documents content',
          description: 'Display what <strong>documents</strong> contains with `ls` before deleting anything.',
          success: 'You checked the content of documents.',
          concept: 'Before deleting, always list the content to confirm the target.'
        },
        {
          id: 'rm-archives',
          title: '8. Clean the archives',
          description: 'Delete the old `archives` folder with `rm -r archives`.',
          success: 'Archives cleaned successfully.',
          concept: '`rm -r` deletes a folder and its content; it is powerful, so use it with a clear target.'
        },
        {
          id: 'mkdir-mission',
          title: '9. Prepare the mission',
          description: 'Create a new `mission` folder (for example `mkdir mission`) inside <strong>documents</strong>.',
          success: 'Mission folder created.',
          concept: '`mkdir` structures your workspace by creating folders.'
        },
        {
          id: 'ls-mission-check',
          title: '10. Confirm creation',
          description: 'Run `ls` in <strong>documents</strong> to check that the `mission` folder is present.',
          success: 'Mission is visible in documents.',
          concept: 'After creating something, verify the result; this simple habit prevents many mistakes.'
        },
        {
          id: 'cd-mission',
          title: '11. Enter mission',
          description: 'Move into the `mission` folder.',
          success: 'Mission is now your current folder.',
          concept: 'The current folder defines the context for file creation and reading.'
        },
        {
          id: 'touch-briefing',
          title: '12. Create the briefing',
          description: 'Create a `briefing.txt` file (for example `touch briefing.txt`) inside <strong>mission</strong>.',
          success: 'Briefing.txt is in place, mission complete!',
          concept: '`touch` creates an empty file or updates its date if the file already exists.'
        },
      ],
      commandDescriptions: {
        '': 'System information',
        help: 'Displays the list of available commands.',
        man: 'Opens detailed documentation for a command.',
        pwd: 'Displays the path of the current directory.',
        echo: 'Outputs text in the terminal.',
        cd: 'Changes directory.',
        ls: 'Lists the content of a folder.',
        ll: 'Alias for ls -l: detailed file listing.',
        mkdir: 'Creates a new folder.',
        touch: 'Creates or updates a file.',
        rm: 'Deletes a file or folder.',
        chmod: 'Changes permissions on a file or folder.',
        cat: 'Displays file content (supports redirection).',
        head: 'Displays the first lines of a file (-n option).',
        tail: 'Displays the last lines of a file (-n option).',
        nano: 'Opens a pop-up editor to modify a file.',
      },
      badges: [
        { id: 'explorer', title: 'Explorer', description: 'Visit 10 different directories.', icon: 'mdi-compass' },
        { id: 'architecte', title: 'Architect', description: 'Create a folder and a file.', icon: 'mdi-home-analytics' },
        { id: 'nettoyeur', title: 'Cleaner', description: 'Delete a folder with rm -r.', icon: 'mdi-delete-sweep' },
        { id: 'sage', title: 'Shell sage', description: 'Read 3 man pages.', icon: 'mdi-book-open-variant' },
        { id: 'mentor', title: 'Mentor', description: 'Finish the training tutorial.', icon: 'mdi-school-outline' },
      ],
      robotDialogues: [
        'I am watching your progress. Keep going.',
        'Keep learning, you are doing well.',
        'Every command counts, even the small ones.',
        'Those archives had better behave.',
        'A happy terminal is a used terminal.',
        'Precision is your best ally.',
        'You are going to become a shell master.',
        'One step at a time, progress is happening.',
        'I love when you use pwd 📍.',
        'Folders tremble before you.',
        'Breathe, type, succeed.',
        'You have already come a long way.',
        'I am keeping a kind eye on you 👀.',
        'Errors are just clues in disguise.',
        'Your command style is impressive.',
        'The mission is moving forward. Keep at it.',
        'You are doing this like a pro.',
        'Your future self will thank you.',
        'The neurons are warming up. I like that 🔥.',
        'Linux had better be ready.',
        'Let your curiosity guide you.',
        'Coffee break? No, command break!',
        'Every cd brings you closer to victory.',
        'You make directories dance 💃.',
        'Stay on course, the terminal is with you.',
        'Patience is your superpower.',
        'Even the bytes are looking at you with respect.',
        'You type fast, but you learn even faster ⚡.',
        'Your keyboard is your lightsaber.',
        'A well-trained shell means freedom.',
        'Looks like you already know the way.',
        'Permissions obey you 👑.',
        'Every success deserves a small smile.'
      ],
      robotErrorEncouragements: [
        'Keep going, you can do it!',
        'Breathe and try again calmly.',
        'Errors are part of learning too.',
        'Each attempt brings you closer to the solution.',
        'Fix it and keep moving.',
        'One small adjustment and it should pass.',
        'Do not give up, you are on the right track.',
        'You can do it, I am sure.',
        'Analyze, correct, and go.',
        'Even shell masters make mistakes sometimes.'
      ],
    },
    terminal: {
      xtermWelcome: 'Welcome to the Bash terminal!',
      suggestions: 'Suggestions: {items}',
      tutorialFinished: 'Mission complete, keep going freely!',
      tutorialFinishedRobot: '🚀 Mission complete! You can continue freely 🚀',
      tutorialStepValidated: 'Step completed.',
      tutorialCommandNoMatch: 'This command does not complete this step yet. Try again using the hint above.',
      tutorialCommandNoMatchShort: 'This command does not complete this step yet.',
      conceptPrefix: 'Remember:',
      evaluationTryAgain: 'Not validated yet. Look at the objective and try again.',
      confirmResetTraining: 'Reset training? The file tree, tutorial, badges, and local history will be reset.',
      trainingResetDone: 'Environment reset. You can start again from the beginning.',
      syncError: 'Synchronization error',
      errorDetected: 'Error detected. {message}',
      commandBaseDescription: 'Command {command}',
      systemInfo: 'System information',
      errorPrefix: 'Error: {output}',
      warningPrefix: 'Warning: {output}',
      errorDetectedShort: 'Error detected.',
      warningRequired: 'Action needed.',
      terminalSuggestion: 'Terminal suggestion.',
      noRedirectionTarget: 'Invalid redirection: no target file was specified.',
      redirectionNoCommand: 'Redirection impossible: no command to execute.',
      unknownCommand: 'Unknown command: {command}',
      invalidRedirectionOneTarget: 'Invalid redirection: only one target is allowed.',
      folderHomeDefault: 'Moved to the home folder (default): {name}',
      folderCurrent: 'Current folder: {name}',
      parentPermissionDenied: "Permission denied when accessing parent folder '{name}'.",
      folderPermissionDenied: "Permission denied when accessing folder '{name}'.",
      folderNotFound: 'Folder not found: {name}',
      directoryNotFound: "Error: Directory '{path}' not found.",
      readPermissionDenied: 'Permission denied when reading this folder.',
      emptyFolder: 'Empty folder',
      folderNameRequired: 'Folder name required',
      noFolderName: 'No folder name provided',
      mkdirInvalidPath: "mkdir: invalid path '{path}'",
      mkdirFileExistsName: "mkdir: cannot create folder '{path}': A file already has this name",
      mkdirExists: "mkdir: cannot create folder '{path}': File exists",
      mkdirMissingParent: "mkdir: cannot create folder '{path}': Missing intermediate path",
      mkdirPermissionDenied: "Permission denied when creating a folder in '{name}'.",
      foldersCreated: 'Folder(s) created: {items}',
      noFolderCreated: 'No folder created',
      fileNameRequired: 'File name required',
      noFileSpecified: 'No file specified',
      touchInvalidPath: "touch: invalid path '{path}'",
      touchIsDirectory: "touch: '{path}' is a directory",
      touchModifyPermission: "touch: insufficient permissions to modify '{path}'",
      touchParentPermission: "touch: insufficient permissions in '{name}'",
      filesCreated: 'File(s) created: {items}',
      timestampUpdated: 'Timestamp updated: {items}',
      noFileProcessed: 'No file processed',
      catNeedFile: 'cat: specify at least one file.',
      fileNotFound: '{command}: {path}: file not found',
      permissionDenied: '{command}: {path}: permission denied',
      lineOptionRequiresValue: '{command}: option -n requires a value.',
      lineOptionInvalidValue: "{command}: invalid value '{value}' for -n.",
      headNeedFile: 'head: specify at least one file.',
      tailNeedFile: 'tail: specify at least one file.',
      nanoNeedFile: 'nano: specify a file to edit.',
      nanoIsDirectory: "nano: '{path}' is a directory.",
      nanoInvalidPath: "nano: invalid path '{path}'.",
      nanoParentPermission: "nano: insufficient permissions in '{name}'.",
      nanoEditPermission: "nano: insufficient permissions to edit '{path}'.",
      nanoOpened: "nano: editor opened for '{path}'.",
      nanoNoFileToSave: 'No file to save.',
      nanoSaved: "nano: '{path}' saved ({bytes} bytes).",
      redirectionWritten: "Redirection: {mode} {count} {label} into '{path}'.",
      redirectionWrittenMode: 'wrote',
      redirectionAppendMode: 'appended',
      characterSingular: 'character',
      characterPlural: 'characters',
      redirectionNoTarget: 'Redirection: no target file specified.',
      redirectionInvalidPath: "Redirection: invalid path '{path}'.",
      redirectionIsDirectory: "Redirection: '{path}' is a directory.",
      redirectionFilePermission: "Redirection: insufficient permissions for '{path}'.",
      redirectionParentPermission: "Redirection: insufficient permissions in '{name}'.",
      redirectionSizeExceeded: "Redirection: maximum size of {limit} exceeded for '{path}'.",
      rmNoName: 'Error: No name specified',
      rmNoTarget: 'Error: No file or folder to delete',
      rmPermissionDenied: "Permission denied when modifying the content of '{name}'.",
      rmUseRecursive: 'Use the -r option to delete folders: {items}',
      rmPermissionItems: 'Insufficient permissions to delete: {items}',
      rmNoMatch: "Error: No item matching '{items}'",
      confirmDelete: "Delete '{name}'?",
      foldersIgnored: 'Folders ignored (add -r): {items}',
      accessDenied: 'Access denied: {items}',
      ignoredInteractive: 'Ignored (-i option): {items}',
      itemsDeleted: 'Deleted item(s): {items}',
      noItemDeleted: 'No item deleted',
      chmodUsage: 'Usage: chmod [options] mode file',
      chmodNeedFile: 'Error: specify permissions and at least one file',
      chmodInvalidSymbolic: 'Error: Invalid symbolic format',
      chmodUpdated: 'Permissions updated for: {items}',
      notFound: 'Not found: {items}',
      noUpdate: 'No update performed',
      chmodUserCan: '[user] You can ',
      chmodGroupCan: '[group] group members can',
      chmodOtherCan: '[other] everyone else can',
      chmodReadUser: '[r] read it',
      chmodWriteUser: '[w] write it',
      chmodExecuteUser: '[x] execute it',
      chmodReadGroup: '[r] read',
      chmodWriteGroup: '[w] write',
      chmodExecuteGroup: '[x] execute',
      manUsage: 'Usage: man <command>',
      noManual: "No manual page for '{topic}'.",
      soundOn: 'Sound on 🔊',
      soundOff: 'Sound off 🔇',
      robotGreetingShort: 'Hi!',
      robotGreeting: '👋 Hi! I am ECHO, your virtual assistant. You can mute or enable my sound 🔊 by clicking my head.',
      defaultErrorEncouragement: 'You can do it.',
      mnemonicHints: {
        pwd: '[strong]Memory tip[/strong]: `pwd` means **Path Way Directory**, used to display your current position.',
        ls: '[strong]Memory tip[/strong]: `ls` comes from **List**, and displays folder content.',
        'cd-documents': '[strong]Memory tip[/strong]: `cd` means **Change Directory**, ideal for entering a folder.',
        'cd-parent': '[strong]Memory tip[/strong]: `cd ..` moves up one level — **Change Directory** to the parent.',
        'cd-documents-return': '[strong]Memory tip[/strong]: `cd documents` brings you back to the target folder (**Change Directory**).',
        'ls-documents': '[strong]Memory tip[/strong]: `ls` (for **List**) quickly confirms what a folder contains.',
        'cd-mission': '[strong]Memory tip[/strong]: use `cd` (**Change Directory**) to enter mission.',
        'rm-archives': '[strong]Memory tip[/strong]: `rm` comes from **Remove**, useful for deleting.',
        'mkdir-mission': '[strong]Memory tip[/strong]: `mkdir` means **Make Directory**, used to create a folder.',
        'ls-mission-check': '[strong]Memory tip[/strong]: an `ls` after `mkdir` instantly confirms that the folder exists.',
        'touch-briefing': '[strong]Memory tip[/strong]: `touch` creates or updates a file in one command.',
      },
      tutorialIntroHint: 'Welcome to the cockpit! Click the input field to take control.',
      tutorialHelpHint: 'You are now at the controls. Need a hand? Just type `help`, then press Enter. ↵',
      tutorialErrors: {
        helpNotHelp: 'Before rushing in, type `help` to discover every available command.',
        pwdNotPwd: 'This step checks your position: type `pwd` to display the current path.',
        lsNotLs: 'Use `ls` (or `ls -l`) to display the current folder content.',
        cdDocumentsNotCd: 'Reach the `documents` folder with the `cd` command.',
        cdDocumentsNoParam: 'Specify the folder to reach: `cd documents`.',
        cdDocumentsWrongTarget: "This step expects the 'documents' folder, not '{target}'.",
        cdDocumentsStillAt: 'You are still at {path}. Aim for /home/user/documents.',
        cdParentNotCd: 'Use `cd` to move up one level.',
        cdParentNoParam: 'Add `..` (or `../`) after `cd` to target the parent folder: `cd ..`.',
        cdParentWrongParam: 'This step checks the use of `cd ..` (or `cd ../`). Try again with that shortcut.',
        cdParentExpectedPath: 'You should see /home/user as the current folder after `cd ..`.',
        cdReturnNotCd: 'After stepping back, return to `documents` with `cd`.',
        cdReturnNoParam: 'Specify the destination: `cd documents`.',
        cdReturnWrongTarget: "This step expects a return to 'documents', not '{target}'.",
        cdReturnExpectedPath: 'You are expected in /home/user/documents before continuing the operation.',
        lsDocumentsNotLs: 'Use `ls` to inspect the content of `documents` before acting.',
        lsDocumentsWrongPath: 'Return to /home/user/documents, then run `ls` to see what it contains.',
        lsDocumentsExpectedList: 'List documents with `ls` to confirm what remains before deletion.',
        rmArchivesNotRm: 'This step expects deletion of the `archives` folder with `rm`.',
        rmArchivesNoParam: 'Add the item to delete: `rm -r archives`.',
        rmArchivesWrongTarget: 'The target to delete is `archives`.',
        rmArchivesNoRecursive: 'Add the `-r` option to delete the folder: `rm -r archives`.',
        rmArchivesStillExists: 'The `archives` folder still exists. Run `rm -r archives` from /home/user/documents.',
        mkdirMissionNotMkdir: 'Create the `mission` folder with `mkdir`.',
        mkdirMissionNoParam: 'Enter the folder name to create: `mkdir mission`.',
        mkdirMissionWrongTarget: "The expected folder is named 'mission', not '{target}'.",
        mkdirMissionStillMissing: 'I still do not see the `mission` folder in documents. Create it here before continuing.',
        lsMissionNotLs: 'Check that the `mission` folder exists with `ls`.',
        lsMissionWrongPath: 'Stay in /home/user/documents to verify that `mission` is there.',
        lsMissionMissing: 'Create the `mission` folder first, then run `ls` again to see it appear.',
        lsMissionExpected: 'I am waiting for the `ls` result showing `mission` in documents.',
        cdMissionNotCd: 'Use `cd` to move into the `mission` folder.',
        cdMissionNoParam: 'Add the target folder: `cd mission`.',
        cdMissionWrongTarget: "This step expects the 'mission' folder, not '{target}'.",
        cdMissionWrongPath: 'The current directory is {path}. Go to /home/user/documents/mission.',
        touchBriefingNotTouch: 'Create the `briefing.txt` file with `touch`.',
        touchBriefingNoParam: 'Enter the file name: `touch briefing.txt`.',
        touchBriefingWrongTarget: "The expected file is 'briefing.txt', not '{target}'.",
        touchBriefingNoMission: 'Create the `mission` folder first, then run `touch briefing.txt` from that folder.',
        touchBriefingMissing: 'The file was not found in `mission`. Run `touch briefing.txt` there.',
      },
      manuals: {
        man: `
MAN(1)                              Shell Commands                              MAN(1)

NAME
    man - shows the detailed help available in this simulator.

SYNOPSIS
    man <command>

DESCRIPTION
    Displays a description, syntax, and the options implemented here for the target command.

OPTIONS
    (none)

NOTE
    Only simulated commands have a manual page.
`,
        help: `
HELP(1)                             Shell Commands                             HELP(1)

NAME
    help - lists all supported commands.

SYNOPSIS
    help [command]

DESCRIPTION
    Without arguments, displays all available commands. With a command,
    returns a short usage reminder. For more detail, use 'man <command>'.
`,
        pwd: `
PWD(1)                              Shell Commands                              PWD(1)

NAME
    pwd - prints the absolute path of the current directory.

SYNOPSIS
    pwd

OPTIONS
    (none)

NOTES
    The path is computed from the simulated 'root'.
`,
        echo: `
ECHO(1)                             Shell Commands                             ECHO(1)

NAME
    echo - displays a line of text.

SYNOPSIS
    echo <text>

DESCRIPTION
    Returns exactly the provided arguments.
`,
        cd: `
CD(1)                               Shell Commands                               CD(1)

NAME
    cd - changes the current directory.

SYNOPSIS
    cd [path]

OPTIONS
    .   current directory
    ..  parent directory
    /   absolute paths from root

NOTES
    Requires execute (x) permission on each traversed folder.
`,
        ls: `
LS(1)                               Shell Commands                               LS(1)

NAME
    ls - lists folder content.

SYNOPSIS
    ls [-a] [-l] [path]

OPTIONS
    -a  includes hidden files
    -l  detailed view (permissions, owner, date)

NOTES
    The path can be relative or absolute. Requires r+x permissions on the target.
`,
        mkdir: `
MKDIR(1)                            Shell Commands                            MKDIR(1)

NAME
    mkdir - creates one or more folders.

SYNOPSIS
    mkdir [-p] folder...

OPTIONS
    -p  creates missing parent folders without error if they already exist

NOTES
    Checks w+x permissions on each modified parent folder.
`,
        touch: `
TOUCH(1)                            Shell Commands                            TOUCH(1)

NAME
    touch - creates an empty file or updates its date.

SYNOPSIS
    touch file...

OPTIONS
    (simplified implementation: -a/-m are accepted but perform the same date update)

NOTES
    Creates missing files in the target directory if w+x permissions are present.
`,
        cat: `
CAT(1)                              Shell Commands                              CAT(1)

NAME
    cat - reads and displays file content.

SYNOPSIS
    cat file...

DESCRIPTION
    Prints the provided files in order. Output can be redirected with
    '>' or '>>' to write into another in-memory file.

LIMITS
    Each file in this simulation is limited to 40 MB.
`,
        head: `
HEAD(1)                             Shell Commands                             HEAD(1)

NAME
    head - displays the beginning of a file.

SYNOPSIS
    head [-n number] file...

DESCRIPTION
    Returns the first lines of each file (10 by default).
    Accepts '-n 25' or '-n25' to customize the line count.
`,
        tail: `
TAIL(1)                             Shell Commands                             TAIL(1)

NAME
    tail - displays the end of a file.

SYNOPSIS
    tail [-n number] file...

DESCRIPTION
    Returns the last lines of each file (10 by default).
    Accepts '-n 25' or '-n25' to customize the line count.
`,
        nano: `
NANO(1)                             Shell Commands                             NANO(1)

NAME
    nano - edits a text file in a dedicated window.

SYNOPSIS
    nano file

DESCRIPTION
    Opens a simulated graphical editor showing file content and
    lets you edit then save the text. Files larger than 40 MB are not supported.

NOTES
    The file is created if it does not exist, subject to sufficient permissions.
`,
        rm: `
RM(1)                               Shell Commands                               RM(1)

NAME
    rm - deletes files or folders.

SYNOPSIS
    rm [-r] [-f] [-i] pattern...

OPTIONS
    -r  recursively deletes folders
    -f  ignores errors and confirmations
    -i  asks for confirmation for each item (disabled by -f)

NOTES
    Patterns use '*' for wildcard matching. Requires w+x on the parent folder.
`,
        chmod: `
CHMOD(1)                            Shell Commands                            CHMOD(1)

NAME
    chmod - changes permissions on a file or folder.

SYNOPSIS
    chmod [-R] mode target...

MODES
    Numeric: 755, 644...
    Symbolic: u+r, g-w, a=rw, u+rwx,g+rx,o-r...
    Multiple comma-separated segments are supported.

OPTIONS
    -R  applies the change recursively to subfolders/files.

NOTES
    Only the owner can change permissions in this simulation.
`
      },
      helpMessages: {
        '': `
                    Available commands:
                    - man: Shows detailed help for a command
                    - help: Shows this help message
                    - pwd: Displays the path of the current directory
                    - echo: Displays a message
                    - cd: Changes directory
                    - ls: Lists files and folders
                    - ll: Alias for ls -l: detailed file listing
                    - mkdir: Creates a new folder
                    - touch: Creates a new file
                    - rm: Deletes a file or folder
                    - chmod: Changes permissions on a file or folder
                    - cat: Reads and displays file content (can be redirected with > or >>)
                    - head: Displays the first lines of a file (-n option)
                    - tail: Displays the last lines of a file (-n option)
                    - nano: Opens an editor to modify a file
                `,
        pwd: 'Usage: pwd [-h]\nDisplays the path of the current directory.',
        echo: 'Usage: echo [-h] [message]\nDisplays a message.',
        cd: 'Usage: cd [-h] [directory]\nChanges directory.',
        ls: 'Usage: ls [-h] [-a] [-l]\nLists files and folders.',
        mkdir: 'Usage: mkdir [-h] [folder]\nCreates a new folder.',
        touch: 'Usage: touch [-h] [file]\nCreates a new file.',
        rm: 'Usage: rm [-h] [-r] [file|folder]\nDeletes a file or folder.',
        chmod: 'Usage: chmod [-h] [permissions] [file|folder]\nChanges permissions on a file or folder.',
        cat: 'Usage: cat [-h] file...\nDisplays the content of one or more files.',
        head: 'Usage: head [-h] [-n number] file...\nDisplays the first lines (10 by default).',
        tail: 'Usage: tail [-h] [-n number] file...\nDisplays the last lines (10 by default).',
        nano: 'Usage: nano [-h] file\nOpens a graphical editor to modify the file.',
        man: 'Usage: man [command]\nDisplays the detailed documentation for a command available in this environment.'
      },
    },
  },
};

const getByPath = (source, key) => {
  if (!key) {
    return source;
  }
  return key.split('.').reduce((value, part) => value?.[part], source);
};

const interpolate = (template, params = {}) => {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) => (
    params[token] === undefined || params[token] === null
      ? `{${token}}`
      : String(params[token])
  ));
};

const cloneValue = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.parse(JSON.stringify(value));
  }
  return value;
};

export const setLocale = (locale) => {
  const nextLocale = availableLocales.some((entry) => entry.code === locale)
    ? locale
    : DEFAULT_LOCALE;

  currentLocale.value = nextLocale;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLocale;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }
};

export const t = (key, params = {}) => {
  const message = getByPath(messages[currentLocale.value], key)
    ?? getByPath(messages[DEFAULT_LOCALE], key)
    ?? key;

  return interpolate(message, params);
};

export const tm = (key) => {
  const message = getByPath(messages[currentLocale.value], key)
    ?? getByPath(messages[DEFAULT_LOCALE], key)
    ?? null;

  return cloneValue(message);
};

export const createI18nPlugin = () => ({
  install(app) {
    setLocale(currentLocale.value);
    const i18n = {
      availableLocales,
      locale: readonly(currentLocale),
      setLocale,
      t,
      tm,
    };

    app.provide('i18n', i18n);
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$tm = tm;
    app.config.globalProperties.$setLocale = setLocale;
  },
});

export const useI18n = () => inject('i18n', {
  availableLocales,
  locale: readonly(currentLocale),
  setLocale,
  t,
  tm,
});
