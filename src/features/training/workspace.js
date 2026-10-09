import * as d3 from 'd3'
import { t } from '../../i18n/index.js'
import { tm } from '../../i18n/index.js'
import { LEARNING_MODE_STORAGE_KEY } from './workspaceData.js'
import { DEFAULT_LEARNING_MODE } from './workspaceData.js'
import { LEARNING_MODES } from './workspaceData.js'
import { buildInitialTreeData } from './workspaceData.js'
import { DEFAULT_MISSION_ID } from './workspaceData.js'
import { PERMISSIONS_MISSION_ID } from './workspaceData.js'
import { DEFAULT_MISSION_MODE } from './workspaceData.js'
import { NAVIGATION_START_PATH } from './workspaceData.js'
import { loadLearningMode } from './workspaceData.js'
import { currentLocale } from '../../i18n/index.js'
import { missionsMethods } from './missions.js'
import { permissionsMethods } from './permissions.js'
import { terminalMethods } from './terminal.js'
import { treeMethods } from './tree.js'
import { sessionMethods } from './session.js'
import { badgesMethods } from './badges.js'
import { robotMethods } from './robot.js'
import { audioMethods } from './audio.js'
import { formattingMethods } from './formatting.js'
import { parsingMethods } from './parsing.js'
import { commandsMethods } from './commands.js'
import { navigationMethods } from './navigation.js'
import { filesystemMethods } from './filesystem.js'
import { fileContentsMethods } from './fileContents.js'

export default {
  name: 'FolderTree',
  computed: {
    missionOptions() {
      return tm('navigationData.missions') || []
    },
    missionModeOptions() {
      return tm('navigationData.missionModes') || []
    },
    activeMission() {
      return (
        this.missionOptions.find(
          mission => mission.id === this.activeMissionId,
        ) ||
        this.missionOptions[0] ||
        null
      )
    },
    activeMissionMode() {
      return (
        this.missionModeOptions.find(mode => mode.value === this.missionMode) ||
        this.missionModeOptions[0] ||
        null
      )
    },
    isPermissionsMission() {
      return this.activeMissionId === PERMISSIONS_MISSION_ID
    },
    currentTutorialStep() {
      return this.tutorial.steps[this.tutorial.currentStep] || null
    },
    currentPermissionMissionStep() {
      return (
        this.permissionsMission.steps[this.permissionsMission.currentStep] ||
        null
      )
    },
    permissionTargets() {
      const labels = tm('navigationData.permissionMission.targets') || {}
      return this.permissionTargetPaths.map(path => {
        const node = this.root
          ? this.getNodeFromPath(path, { includeFiles: true })?.node
          : null
        const meta = node?.data || {}
        return {
          path,
          label: labels[path] || path,
          name: meta.name || path.split('/').pop(),
          rights: meta.rights || '----------',
          type: meta.type || '',
        }
      })
    },
    selectedPermissionNode() {
      if (!this.root || !this.selectedPermissionPath) {
        return null
      }
      return (
        this.getNodeFromPath(this.selectedPermissionPath, {
          includeFiles: true,
        })?.node || null
      )
    },
    selectedPermissionMeta() {
      return this.selectedPermissionNode?.data || null
    },
    permissionInspectorRows() {
      const meta = this.selectedPermissionMeta
      if (!meta?.rights) {
        return []
      }
      const rights = meta.rights
      const rows = [
        {
          key: 'owner',
          label: this.t('navigation.permissionOwnerScope', {
            owner: meta.user || '-',
          }),
          triplet: rights.slice(1, 4),
          active: meta.user === this.currentUser,
        },
        {
          key: 'group',
          label: this.t('navigation.permissionGroupScope', {
            group: meta.group || '-',
          }),
          triplet: rights.slice(4, 7),
          active: this.currentGroups.includes(meta.group),
        },
        {
          key: 'others',
          label: this.t('navigation.permissionOthersScope'),
          triplet: rights.slice(7, 10),
          active:
            meta.user !== this.currentUser &&
            !this.currentGroups.includes(meta.group),
        },
      ]

      return rows.map(row => ({
        ...row,
        digit: this.getPermissionDigit(row.triplet),
        read: row.triplet.includes('r'),
        write: row.triplet.includes('w'),
        execute: row.triplet.includes('x'),
      }))
    },
    selectedPermissionSummary() {
      const meta = this.selectedPermissionMeta
      if (!meta) {
        return this.t('navigation.permissionNoTarget')
      }
      const block = this.getPermissionBlock(meta)
      const abilities = []
      if (block.includes('r')) {
        abilities.push(this.t('navigation.permissionReadShort'))
      }
      if (block.includes('w')) {
        abilities.push(this.t('navigation.permissionWriteShort'))
      }
      if (block.includes('x')) {
        abilities.push(
          meta.type === 'd'
            ? this.t('navigation.permissionTraverseShort')
            : this.t('navigation.permissionExecuteShort'),
        )
      }
      return abilities.length
        ? this.t('navigation.permissionCurrentUserCan', {
            user: this.currentUser,
            actions: abilities.join(', '),
          })
        : this.t('navigation.permissionCurrentUserCannot', {
            user: this.currentUser,
          })
    },
    permissionChallengeChecks() {
      if (!this.root) {
        return []
      }
      const checks = this.getPermissionChallengeChecks()
      return checks.map(check => ({
        ...check,
        passed: check.passed(),
      }))
    },
    earnedBadgesCount() {
      return this.badges.filter(badge => badge.earned).length
    },
    robotImage() {
      if (this.robotMood === 'default' && this.robotEyesClosed) {
        return this.robotSprites.defaultClosed || this.robotSprites.default
      }
      return this.robotSprites[this.robotMood] || this.robotSprites.default
    },
    robotSoundEnabled: {
      get() {
        const value = this.$store.state.robotSoundEnabled
        return typeof value === 'boolean' ? value : true
      },
      set(enabled) {
        this.$store.commit('setRobotSoundEnabled', !!enabled)
      },
    },
    learningModeOptions() {
      return tm('navigation.learningModes') || []
    },
    currentLearningModeLabel() {
      const mode = this.learningModeOptions.find(
        entry => entry.value === this.learningMode,
      )
      return mode?.label || this.learningMode
    },
    showCommandAssist() {
      return this.learningMode === 'guided'
    },
    showDetailedTutorialFeedback() {
      return this.learningMode !== 'evaluation'
    },
    showRobotEducationalHints() {
      return this.learningMode === 'guided'
    },
    commandSuggestions() {
      if (!this.showCommandAssist) {
        return []
      }
      const term =
        (this.command || '').trim().split(' ')[0]?.toLowerCase() || ''
      if (!term) {
        return []
      }
      return this.availableCommands
        .filter(cmd => cmd.startsWith(term))
        .slice(0, 5)
    },
    availableCommands() {
      return Object.keys(this.commandDescriptions).filter(
        cmd => typeof cmd === 'string' && cmd.length > 0,
      )
    },
    hasNoCommandMatch() {
      if (!this.showCommandAssist) {
        return false
      }
      const raw = (this.command || '').trim().toLowerCase()
      const term = raw.split(' ')[0] || ''
      if (!term) {
        return false
      }
      return !this.availableCommands.some(cmd => cmd.startsWith(term))
    },
    sessionContext() {
      return this.$store.state.sessionContext || {}
    },
    sessionMode() {
      return this.sessionContext.mode || 'offline'
    },
    sessionCode() {
      return this.sessionContext.sessionCode || ''
    },
    sessionParticipantName() {
      return this.sessionContext.participantName || ''
    },
    sessionModeLabel() {
      if (this.sessionMode === 'participant') {
        return this.sessionCode
          ? this.t('navigation.sessionWithCode', { code: this.sessionCode })
          : this.t('navigation.modeSession')
      }
      if (this.sessionMode === 'admin') {
        return this.sessionCode
          ? this.t('navigation.adminWithCode', { code: this.sessionCode })
          : this.t('navigation.modeAdmin')
      }
      return this.t('navigation.modeOffline')
    },
    currentLocale() {
      return currentLocale.value
    },
    isParticipantSession() {
      return (
        this.sessionMode === 'participant' &&
        !!this.sessionContext.participantToken &&
        !!this.sessionCode
      )
    },
    hasActiveSessionContext() {
      return this.sessionMode !== 'offline'
    },
  },
  watch: {
    activeMissionId() {
      this.applyMissionSelection()
    },
    missionMode(mode) {
      const availableModes = this.missionModeOptions.map(entry => entry.value)
      if (!availableModes.includes(mode)) {
        this.missionMode = DEFAULT_MISSION_MODE
        return
      }
      if (this.isPermissionsMission) {
        this.setupPermissionsMission()
      }
    },
    command(val) {
      this.schedulePathPreview()
      if (val && this.showCommandHint) {
        this.showCommandHint = false
      }
      if (val) {
        this.clearRobotTooltipOnUserAction()
      }
    },
    showCommandHint(val) {
      if (
        !this.tutorial.active ||
        this.tutorial.showIntro ||
        this.tutorial.completed
      ) {
        return
      }
      if (val) {
        this.maybeShowTutorialIntroHint()
      } else {
        this.clearTutorialRobotHint('intro')
        this.maybeShowTutorialHelpHint()
      }
    },
    isParticipantSession(active) {
      if (active) {
        this.startParticipantTelemetry()
      } else {
        this.stopParticipantTelemetry()
      }
    },
    currentLocale() {
      this.refreshLocalizedContent()
    },
    learningMode(mode) {
      if (!LEARNING_MODES.includes(mode)) {
        this.learningMode = DEFAULT_LEARNING_MODE
        return
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEARNING_MODE_STORAGE_KEY, mode)
      }
      if (mode !== 'guided') {
        this.showCommandHint = false
        this.clearTutorialRobotHint()
      }
      this.clearRobotTooltipOnUserAction()
    },
  },
  data() {
    const localTree = buildInitialTreeData()

    return {
      root: null,
      pwd: '',
      command: '',
      output: '',
      currentNode: null, // Le dossier courant
      folderTreeData: localTree, // Copie locale de folderTree
      commandHistory: [], // Historique des commandes
      cursorHistory: 0,
      maxFileSizeBytes: 40 * 1024 * 1024,
      cDirect: {
        from: null,
        to: null,
      },
      ls: {
        showHidden: false,
        dirName: '',
      },
      chmodInfos: {
        fileName: '',
        rights: '----------',
        data: {
          user: [],
          group: [],
          other: [],
        },
      },
      activeMissionId: DEFAULT_MISSION_ID,
      missionMode: DEFAULT_MISSION_MODE,
      missionStartPath: NAVIGATION_START_PATH,
      selectedPermissionPath: '/home/alice/projet-alpha/rapport.txt',
      permissionTargetPaths: [
        '/home/alice/projet-alpha/rapport.txt',
        '/home/alice/projet-alpha/scripts/analyse.sh',
        '/home/alice/projet-alpha/secret',
      ],
      currentUser: 'user',
      currentGroups: ['user'],
      learningMode: loadLearningMode(),
      tutorial: {
        showIntro: true,
        active: true,
        completed: false,
        showSuccess: false,
        currentStep: 0,
        feedback: '',
        feedbackType: '',
        steps: tm('navigationData.tutorialSteps') || [],
      },
      permissionsMission: {
        active: false,
        completed: false,
        showSuccess: false,
        currentStep: 0,
        feedback: '',
        feedbackType: '',
        steps: tm('navigationData.permissionMission.steps') || [],
      },
      showCommandHint: true,
      signals: [],
      signalCounter: 0,
      signalTimers: [],
      commandDescriptions: tm('navigationData.commandDescriptions') || {},
      showBadgePanel: false,
      badges: (tm('navigationData.badges') || []).map(badge => ({
        ...badge,
        earned: false,
      })),
      stats: {
        visitedPaths: [],
        createdDirectory: false,
        createdFile: false,
        removedDirectory: false,
        manUses: 0,
        tutorialCompleted: false,
        permissionsCompleted: false,
      },
      nanoEditor: {
        show: false,
        filePath: '',
        content: '',
        originalContent: '',
        error: '',
      },
      robotMood: 'default',
      robotResetTimer: null,
      robotJumpTimer: null,
      robotSprites: {
        default: '/img/neutral-eyes-open.svg',
        defaultClosed: '/img/neutral-eyes-closed.svg',
        success: '/img/smile-robot.svg',
        warning: '/img/unhappy-robot.svg',
        error: '/img/error-robot.svg',
        loving: '/img/full-love-robot.svg',
      },
      robotJumping: false,
      robotFlicker: false,
      robotFlickerTimer: null,
      robotHovering: false,
      robotEyesClosed: false,
      robotBlinkTimer: null,
      badgeSnackbar: {
        show: false,
        message: '',
        icon: '',
        description: '',
        timeoutId: null,
      },
      audioSources: {
        talk: [],
        warning: [],
        error: [],
        success: [],
        beep: [],
      },
      audioTimers: {
        talk: null,
        warning: null,
        error: null,
        success: null,
        beep: null,
      },
      robotMoodOverride: null,
      robotTooltip: {
        visible: false,
        message: '',
        greetingShown: false,
        lastMessage: '',
        auto: false,
        persistentUntilAction: false,
        timer: null,
        type: 'default',
        icon: '',
      },
      robotDialoguePool: tm('navigationData.robotDialogues') || [],
      robotCommandKeywords: [
        'help',
        'pwd',
        'ls',
        'cd',
        'mkdir',
        'touch',
        'cp',
        'rm',
        'chmod',
        'cat',
        'head',
        'tail',
        'nano',
        'echo',
        'whoami',
        'id',
        'groups',
      ],
      robotDialogueIconPool: [
        'mdi-robot-excited',
        'mdi-emoticon-happy-outline',
        'mdi-star-face',
        'mdi-flash',
        'mdi-rocket',
        'mdi-owl',
        'mdi-lightbulb-on-outline',
        'mdi-firework',
        'mdi-school-outline',
        'mdi-hand-okay',
      ],
      robotErrorEncouragements:
        tm('navigationData.robotErrorEncouragements') || [],
      treeSvg: null,
      pathPreviewTimer: null,
      treeLayoutVersion: 0,
      robotSoundToast: {
        visible: false,
        message: '',
        timer: null,
      },
      activeAudios: [],
      talkLoopAudio: null,
      tutorialGuidance: {
        introShown: false,
        helpHintShown: false,
        persistentId: null,
      },
      terminalScrolling: false,
      terminalScrollbarNear: false,
      terminalScrollTimer: null,
      telemetryQueue: [],
      telemetryFlushPromise: null,
      telemetryHeartbeatTimer: null,
      telemetryLastError: '',
    }
  },
  mounted() {
    if (!this.showCommandAssist) {
      this.showCommandHint = false
    }
    this.createTree()
    this.createOutputAnimate()
    this.loadCommandHistory()
    this.loadBadgeState()
    this.loadAudioEffects()
    this.scheduleNeutralBlink()
    this.startParticipantTelemetry()
  },
  beforeUnmount() {
    clearTimeout(this.terminalScrollTimer)
    clearTimeout(this.pathPreviewTimer)
    this.clearTreePathOverlays()
    ++this.treeLayoutVersion
    this.treeSvg?.selectAll('*').interrupt().interrupt('tree-layout')
    d3.select(this.$refs.output_animate).selectAll('*').interrupt()
    this.stopParticipantTelemetry()
    this.signalTimers.forEach(timer => clearTimeout(timer))
    this.signalTimers = []
    if (this.robotResetTimer) {
      clearTimeout(this.robotResetTimer)
      this.robotResetTimer = null
    }
    if (this.robotJumpTimer) {
      clearTimeout(this.robotJumpTimer)
      this.robotJumpTimer = null
    }
    if (this.robotFlickerTimer) {
      clearTimeout(this.robotFlickerTimer)
      this.robotFlickerTimer = null
    }
    this.clearRobotTooltipTimer()
    if (this.robotSoundToast.timer) {
      clearTimeout(this.robotSoundToast.timer)
      this.robotSoundToast.timer = null
    }
    this.stopAllActiveAudios()
    Object.keys(this.audioTimers).forEach(key => {
      if (this.audioTimers[key]) {
        clearTimeout(this.audioTimers[key])
        this.audioTimers[key] = null
      }
    })
    if (this.badgeSnackbar.timeoutId) {
      clearTimeout(this.badgeSnackbar.timeoutId)
      this.badgeSnackbar.timeoutId = null
    }
  },
  methods: {
    ...missionsMethods,
    ...permissionsMethods,
    ...terminalMethods,
    ...treeMethods,
    ...sessionMethods,
    ...badgesMethods,
    ...robotMethods,
    ...audioMethods,
    ...formattingMethods,
    ...parsingMethods,
    ...commandsMethods,
    ...navigationMethods,
    ...filesystemMethods,
    ...fileContentsMethods,
    t(key, params = {}) {
      return t(key, params)
    },
  },
}
