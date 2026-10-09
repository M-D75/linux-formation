import { tm } from '../../i18n/index.js'
import { buildInitialTreeData } from './workspaceData.js'
import { buildPermissionsTreeData } from './workspaceData.js'
import { DEFAULT_MISSION_ID } from './workspaceData.js'
import { NAVIGATION_START_PATH } from './workspaceData.js'
import { PERMISSIONS_START_PATH } from './workspaceData.js'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const missionsMethods = {
  buildTutorialSuccessFeedback(step) {
    const success = step?.success || this.t('terminal.tutorialStepValidated')
    if (!this.showDetailedTutorialFeedback || !step?.concept) {
      return success
    }
    return `${success}\n${this.t('terminal.conceptPrefix')} ${step.concept}`
  },

  formatLearningText(message = '') {
    return (message || '').replace(/`([^`]+)`/g, '<code>$1</code>')
  },

  getPermissionDigit(triplet = '---') {
    const values = { r: 4, w: 2, x: 1 }
    return ['r', 'w', 'x'].reduce(
      (total, perm) => total + (triplet.includes(perm) ? values[perm] : 0),
      0,
    )
  },

  getNodeMetaByPath(path) {
    if (!this.root || !path) {
      return null
    }
    return (
      this.getNodeFromPath(path, { includeFiles: true })?.node?.data || null
    )
  },

  getRightsTriplet(path, scope) {
    const meta = this.getNodeMetaByPath(path)
    if (!meta?.rights) {
      return '---'
    }
    if (scope === 'owner') {
      return meta.rights.slice(1, 4)
    }
    if (scope === 'group') {
      return meta.rights.slice(4, 7)
    }
    return meta.rights.slice(7, 10)
  },

  hasPermissionBits(path, scope, bits) {
    const triplet = this.getRightsTriplet(path, scope)
    return bits.split('').every(bit => triplet.includes(bit))
  },

  hasExactPermissionTriplet(path, scope, expected) {
    return this.getRightsTriplet(path, scope) === expected
  },

  getPermissionChallengeChecks() {
    return [
      {
        id: 'report-group-write',
        label: this.t('navigation.permissionCheckReportGroupWrite'),
        passed: () =>
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/rapport.txt',
            'owner',
            'rw-',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/rapport.txt',
            'group',
            'rw-',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/rapport.txt',
            'others',
            '---',
          ),
      },
      {
        id: 'script-executable',
        label: this.t('navigation.permissionCheckScriptExecutable'),
        passed: () =>
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/scripts/analyse.sh',
            'owner',
            'rwx',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/scripts/analyse.sh',
            'group',
            'r-x',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/scripts/analyse.sh',
            'others',
            '---',
          ),
      },
      {
        id: 'secret-group-access',
        label: this.t('navigation.permissionCheckSecretGroupAccess'),
        passed: () =>
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/secret',
            'owner',
            'rwx',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/secret',
            'group',
            'r-x',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/secret',
            'others',
            '---',
          ),
      },
    ]
  },

  getPermissionChallengeFeedback() {
    const checks = this.getPermissionChallengeChecks().map(check => ({
      ...check,
      passed: check.passed(),
    }))
    const missing = checks.filter(check => !check.passed)
    if (!missing.length) {
      return {
        complete: true,
        message: this.t('navigation.permissionChallengeComplete'),
      }
    }
    return {
      complete: false,
      message: this.t('navigation.permissionChallengePending', {
        items: missing.map(check => check.label).join('\n- '),
      }),
    }
  },

  finishPermissionsMission(command = '') {
    this.permissionsMission.completed = true
    this.permissionsMission.active = false
    this.permissionsMission.showSuccess = true
    this.permissionsMission.currentStep = this.permissionsMission.steps.length
    this.permissionsMission.feedback = this.t(
      'navigation.permissionMissionDone',
    )
    this.permissionsMission.feedbackType = 'success'
    this.output = this.t('navigation.permissionMissionDone')
    this.stats.permissionsCompleted = true
    this.checkBadges()
    this.queueTelemetryEvent(
      'permissions_mission_completed',
      {
        mode: this.missionMode,
        command,
        path: this.getSessionPath(),
      },
      { immediate: true },
    )
    this.announceRobot(this.t('navigation.permissionMissionDone'), {
      duration: 4200,
      mood: 'success',
      type: 'success',
      icon: 'mdi-shield-check',
    })
    this.playSoundEffect('success')
  },

  handlePermissionMissionProgress(
    cmd,
    params,
    commandState = '',
    issuedCommand = '',
  ) {
    if (
      !this.isPermissionsMission ||
      !this.permissionsMission.active ||
      this.permissionsMission.completed
    ) {
      return
    }

    const normalizedCmd = (cmd || '').toLowerCase()
    if (!normalizedCmd) {
      return
    }

    if (this.missionMode === 'challenge') {
      const result = this.getPermissionChallengeFeedback()
      this.permissionsMission.feedback = result.message
      this.permissionsMission.feedbackType = result.complete
        ? 'success'
        : 'hint'
      if (result.complete) {
        this.finishPermissionsMission(issuedCommand)
      } else if (commandState === 'valid') {
        this.playSoundEffect('warning')
      }
      return
    }

    const step = this.currentPermissionMissionStep
    if (!step) {
      return
    }

    const paramsList = Array.isArray(params)
      ? params.filter(param => typeof param === 'string' && param.trim() !== '')
      : []
    let success = false

    switch (step.id) {
      case 'identity-whoami':
        success = normalizedCmd === 'whoami'
        break
      case 'identity-id':
        success = normalizedCmd === 'id' || normalizedCmd === 'groups'
        break
      case 'inspect-rights':
        success =
          normalizedCmd === 'll' ||
          (normalizedCmd === 'ls' &&
            paramsList.some(
              param => param.startsWith('-') && param.includes('l'),
            ))
        break
      case 'open-report-group':
        success = this.hasPermissionBits(
          '/home/alice/projet-alpha/rapport.txt',
          'group',
          'rw',
        )
        break
      case 'make-script-executable':
        success = this.hasPermissionBits(
          '/home/alice/projet-alpha/scripts/analyse.sh',
          'owner',
          'x',
        )
        break
      case 'open-secret-directory':
        success =
          this.hasPermissionBits(
            '/home/alice/projet-alpha/secret',
            'group',
            'rx',
          ) &&
          this.hasExactPermissionTriplet(
            '/home/alice/projet-alpha/secret',
            'others',
            '---',
          )
        break
      default:
        success = false
    }

    if (success) {
      const message = step.concept
        ? `${step.success}\n${this.t('terminal.conceptPrefix')} ${step.concept}`
        : step.success
      this.permissionsMission.feedback = message
      this.permissionsMission.feedbackType = 'success'
      this.permissionsMission.currentStep += 1
      this.announceRobot(message, {
        mood: 'success',
        type: 'success',
        icon: 'mdi-check-circle',
        persistentUntilAction: this.showDetailedTutorialFeedback,
      })
      this.queueTelemetryEvent(
        'permissions_step_completed',
        {
          stepId: step.id,
          stepIndex: this.permissionsMission.currentStep - 1,
          totalSteps: this.permissionsMission.steps.length,
          command: normalizedCmd,
          path: this.getSessionPath(),
        },
        { immediate: true },
      )
      this.playSoundEffect('success')
      if (
        this.permissionsMission.currentStep >=
        this.permissionsMission.steps.length
      ) {
        this.finishPermissionsMission(issuedCommand)
      }
    } else {
      const errors = tm('navigationData.permissionMission.errors') || {}
      this.permissionsMission.feedback =
        errors[step.id] || this.t('terminal.tutorialCommandNoMatch')
      this.permissionsMission.feedbackType = 'hint'
      if (commandState === 'valid') {
        this.playSoundEffect('warning')
      }
    }
  },

  refreshLocalizedContent() {
    const earnedMap = {}
    this.badges.forEach(badge => {
      earnedMap[badge.id] = badge.earned
    })

    this.tutorial.steps = tm('navigationData.tutorialSteps') || []
    this.permissionsMission.steps =
      tm('navigationData.permissionMission.steps') || []
    this.commandDescriptions = tm('navigationData.commandDescriptions') || {}
    this.badges = (tm('navigationData.badges') || []).map(badge => ({
      ...badge,
      earned: !!earnedMap[badge.id],
    }))
    this.robotDialoguePool = tm('navigationData.robotDialogues') || []
    this.robotErrorEncouragements =
      tm('navigationData.robotErrorEncouragements') || []
    this.tutorial.feedback = ''
    this.robotTooltip.visible = false
    this.robotTooltip.auto = false
    this.robotTooltip.persistentUntilAction = false
    this.robotTooltip.lastMessage = ''
    this.robotTooltip.greetingShown = false
  },

  applyMissionSelection() {
    const availableMissionIds = this.missionOptions.map(mission => mission.id)
    if (!availableMissionIds.includes(this.activeMissionId)) {
      this.activeMissionId = DEFAULT_MISSION_ID
      return
    }

    this.clearRobotTooltipOnUserAction()
    if (this.isPermissionsMission) {
      this.setupPermissionsMission()
    } else {
      this.setupNavigationMission()
    }
  },

  resetWorkspaceState({
    treeData,
    currentUser,
    currentGroups,
    startPath,
    outputMessage = '',
    resetBadges = false,
  }) {
    this.signalTimers.forEach(timer => clearTimeout(timer))
    this.signalTimers = []
    this.signals = []
    this.folderTreeData = treeData
    this.root = null
    this.currentNode = null
    this.pwd = ''
    this.command = ''
    this.output = outputMessage
    this.commandHistory = []
    this.cursorHistory = 0
    this.cDirect = { from: null, to: null }
    this.chmodInfos = {
      fileName: '',
      rights: '----------',
      data: {
        user: [],
        group: [],
        other: [],
      },
    }
    this.currentUser = currentUser
    this.currentGroups = [...currentGroups]
    this.missionStartPath = startPath
    this.showCommandHint = this.showCommandAssist
    this.tutorialGuidance.introShown = false
    this.tutorialGuidance.helpHintShown = false
    this.tutorialGuidance.persistentId = null
    this.telemetryQueue = []

    if (resetBadges) {
      this.stats = {
        visitedPaths: [],
        createdDirectory: false,
        createdFile: false,
        removedDirectory: false,
        manUses: 0,
        tutorialCompleted: false,
        permissionsCompleted: false,
      }
      this.badges = this.badges.map(badge => ({ ...badge, earned: false }))
      this.persistBadges()
    }

    this.$store.commit('setCommandHistory', { history: [], timestamp: null })
    this.$nextTick(() => {
      this.createTree()
      this.createOutputAnimate()
      this.focusCommandInput()
    })
  },

  setupNavigationMission(options = {}) {
    this.permissionsMission.active = false
    this.permissionsMission.completed = false
    this.permissionsMission.showSuccess = false
    this.permissionsMission.currentStep = 0
    this.permissionsMission.feedback = ''
    this.permissionsMission.feedbackType = ''
    this.tutorial.steps = tm('navigationData.tutorialSteps') || []
    this.tutorial.showIntro = true
    this.tutorial.active = true
    this.tutorial.completed = false
    this.tutorial.showSuccess = false
    this.tutorial.currentStep = 0
    this.tutorial.feedback = ''
    this.tutorial.feedbackType = ''
    this.resetWorkspaceState({
      treeData: buildInitialTreeData(),
      currentUser: 'user',
      currentGroups: ['user'],
      startPath: NAVIGATION_START_PATH,
      outputMessage: options.outputMessage || '',
      resetBadges: !!options.resetBadges,
    })
  },

  setupPermissionsMission(options = {}) {
    this.tutorial.showIntro = false
    this.tutorial.active = false
    this.tutorial.completed = false
    this.tutorial.showSuccess = false
    this.tutorial.feedback = ''
    this.tutorial.feedbackType = ''
    this.permissionsMission.steps =
      tm('navigationData.permissionMission.steps') || []
    this.permissionsMission.active = true
    this.permissionsMission.completed = false
    this.permissionsMission.showSuccess = false
    this.permissionsMission.currentStep = 0
    this.permissionsMission.feedback = ''
    this.permissionsMission.feedbackType = ''
    this.selectedPermissionPath = '/home/alice/projet-alpha/rapport.txt'
    this.resetWorkspaceState({
      treeData: buildPermissionsTreeData(),
      currentUser: 'alice',
      currentGroups: ['alice', 'dev'],
      startPath: PERMISSIONS_START_PATH,
      outputMessage:
        options.outputMessage || this.t('navigation.permissionMissionReady'),
      resetBadges: !!options.resetBadges,
    })
  },

  confirmResetTraining() {
    this.clearRobotTooltipOnUserAction()
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(this.t('terminal.confirmResetTraining'))
    if (!confirmed) {
      return
    }
    this.resetTrainingState()
  },

  resetTrainingState() {
    const options = {
      outputMessage: this.t('terminal.trainingResetDone'),
      resetBadges: true,
    }
    if (this.isPermissionsMission) {
      this.setupPermissionsMission(options)
    } else {
      this.setupNavigationMission(options)
    }
  },

  beginTutorial() {
    this.clearRobotTooltipOnUserAction()
    this.tutorial.showIntro = false
    this.tutorial.active = true
    this.tutorial.completed = false
    this.tutorial.showSuccess = false
    this.tutorial.currentStep = 0
    this.tutorial.feedback = ''
    this.tutorial.feedbackType = ''
    this.tutorialGuidance.introShown = false
    this.tutorialGuidance.helpHintShown = false
    this.tutorialGuidance.persistentId = null
    this.showCommandHint = this.showCommandAssist
    if (this.showCommandHint) {
      this.$nextTick(() => this.maybeShowTutorialIntroHint())
    }
  },

  skipTutorial() {
    this.clearRobotTooltipOnUserAction()
    this.tutorial.showIntro = false
    this.tutorial.active = false
    this.tutorial.showSuccess = false
    this.tutorial.feedback = ''
    this.tutorial.feedbackType = ''
  },

  finishTutorial(completion = {}) {
    this.tutorial.completed = true
    this.tutorial.active = false
    this.tutorial.feedback = this.t('terminal.tutorialFinished')
    this.tutorial.feedbackType = 'success'
    this.tutorial.showSuccess = false
    this.stats.tutorialCompleted = true
    this.checkBadges()
    this.queueTelemetryEvent(
      'tutorial_completed',
      {
        totalSteps: this.tutorial.steps.length,
        currentStep: this.tutorial.currentStep,
        completedStepId:
          completion.completedStepId ||
          this.tutorial.steps[this.tutorial.currentStep - 1]?.id ||
          null,
        completedByCommand: completion.command || '',
        completedCommandName: completion.commandName || '',
        completedCommandIndex: Number.isInteger(completion.commandIndex)
          ? completion.commandIndex
          : this.commandHistory.filter(item => item.command).length,
        path: completion.path || this.getSessionPath(),
      },
      { immediate: true },
    )
    this.announceRobot(this.t('terminal.tutorialFinishedRobot'), {
      duration: 4500,
      mood: 'success',
    })
  },

  handleTutorialProgress(cmd, params, commandState = '', issuedCommand = '') {
    if (
      !this.tutorial.active ||
      this.tutorial.showIntro ||
      this.tutorial.completed
    ) {
      return
    }

    const step = this.tutorial.steps[this.tutorial.currentStep]
    if (!step) {
      return
    }

    const normalizedCmd = (cmd || '').toLowerCase()
    const paramsList = Array.isArray(params)
      ? params.filter(param => typeof param === 'string' && param.trim() !== '')
      : typeof params === 'string' && params.trim() !== ''
        ? [params]
        : []
    const currentNodePath = this.currentNode
      ? this.getPath(this.currentNode)
      : ''
    const currentPath = currentNodePath
      ? currentNodePath.replace('root', '') || '/'
      : '/'

    const archivesNode = this.root
      ? this.getNodeFromPath('/home/user/documents/archives')
      : null
    const missionNode = this.root
      ? this.getNodeFromPath('/home/user/documents/mission')
      : null
    const briefingNode = this.root
      ? this.getNodeFromPath('/home/user/documents/mission/briefing.txt')
      : null
    const briefingCopyNode = this.root
      ? this.getNodeFromPath('/home/user/documents/mission/briefing.copy.txt')
      : null
    const backupsNode = this.root
      ? this.getNodeFromPath('/home/user/documents/mission/backups')
      : null
    const backupBriefingNode = this.root
      ? this.getNodeFromPath(
          '/home/user/documents/mission/backups/briefing.copy.txt',
        )
      : null
    const commandIndex =
      this.commandHistory.filter(item => item.command).length + 1
    let success = false

    switch (step.id) {
      case 'help':
        success = normalizedCmd === 'help'
        break
      case 'pwd':
        success = normalizedCmd === 'pwd'
        break
      case 'ls':
        success = normalizedCmd === 'ls'
        break
      case 'cd-documents':
        success =
          normalizedCmd === 'cd' && currentPath.endsWith('/home/user/documents')
        break
      case 'cd-parent': {
        const targetParam = paramsList[0]
          ? paramsList[0].replace(/\/+$/, '')
          : ''
        success =
          normalizedCmd === 'cd' &&
          ['..', '../'].some(
            pattern => pattern.replace(/\/+$/, '') === targetParam,
          ) &&
          currentPath.endsWith('/home/user')
        break
      }
      case 'cd-documents-return':
        success =
          normalizedCmd === 'cd' && currentPath.endsWith('/home/user/documents')
        break
      case 'ls-documents':
        success =
          normalizedCmd === 'ls' && currentPath.endsWith('/home/user/documents')
        break
      case 'rm-archives':
        success = !archivesNode
        break
      case 'mkdir-mission':
        success = !!missionNode
        break
      case 'ls-mission-check':
        success =
          normalizedCmd === 'ls' &&
          currentPath.endsWith('/home/user/documents') &&
          !!missionNode
        break
      case 'cd-mission':
        success =
          normalizedCmd === 'cd' &&
          currentPath.endsWith('/home/user/documents/mission')
        break
      case 'touch-briefing':
        success = !!briefingNode
        break
      case 'cp-briefing-copy':
        success = normalizedCmd === 'cp' && !!briefingCopyNode
        break
      case 'mkdir-backups':
        success = normalizedCmd === 'mkdir' && !!backupsNode
        break
      case 'cp-backup-file':
        success = normalizedCmd === 'cp' && !!backupBriefingNode
        break
      case 'cd-backups':
        success =
          normalizedCmd === 'cd' &&
          currentPath.endsWith('/home/user/documents/mission/backups')
        break
      case 'ls-backups':
        success =
          normalizedCmd === 'ls' &&
          currentPath.endsWith('/home/user/documents/mission/backups') &&
          !!backupBriefingNode
        break
      case 'cd-mission-final':
        success =
          normalizedCmd === 'cd' &&
          currentPath.endsWith('/home/user/documents/mission')
        break
      case 'rm-working-copy':
        success =
          normalizedCmd === 'rm' && !briefingCopyNode && !!backupBriefingNode
        break
      case 'pwd-final':
        success =
          normalizedCmd === 'pwd' &&
          currentPath.endsWith('/home/user/documents/mission')
        break
      default:
        success = false
    }

    if (success) {
      this.tutorial.feedback = this.buildTutorialSuccessFeedback(step)
      this.tutorial.feedbackType = 'success'
      let robotMessage = this.showDetailedTutorialFeedback
        ? this.tutorial.feedback
        : step.success || ''
      const mnemonic = this.getMnemonicHint(step.id)
      if (mnemonic && this.showRobotEducationalHints) {
        const hintText = `💡 ${mnemonic}`
        robotMessage = robotMessage ? `${robotMessage}\n${hintText}` : hintText
      }
      if (robotMessage) {
        this.announceRobot(robotMessage, {
          mood: 'success',
          type: 'success',
          icon: 'mdi-check-circle',
          persistentUntilAction:
            this.showDetailedTutorialFeedback && !!step.concept,
        })
      }
      this.queueTelemetryEvent(
        'tutorial_step_completed',
        {
          stepId: step.id,
          stepIndex: this.tutorial.currentStep,
          totalSteps: this.tutorial.steps.length,
          command: normalizedCmd,
          path: currentPath,
        },
        { immediate: true },
      )
      this.tutorial.currentStep += 1
      if (this.tutorial.currentStep > 0) {
        this.clearTutorialRobotHint('help')
      }
      this.playSoundEffect('success')
      if (this.tutorial.currentStep >= this.tutorial.steps.length) {
        this.finishTutorial({
          command: issuedCommand,
          commandName: normalizedCmd,
          commandIndex,
          completedStepId: step.id,
          path: currentPath,
        })
      }
    } else {
      if (!normalizedCmd) {
        this.tutorial.feedback = ''
        this.tutorial.feedbackType = ''
        return
      }
      const errorMessage = this.getTutorialErrorMessage(step, {
        normalizedCmd,
        paramsList,
        currentPath,
        archivesExists: !!archivesNode,
        missionExists: !!missionNode,
        briefingExists: !!briefingNode,
        briefingCopyExists: !!briefingCopyNode,
        backupsExists: !!backupsNode,
        backupBriefingExists: !!backupBriefingNode,
      })
      this.tutorial.feedback = this.showDetailedTutorialFeedback
        ? errorMessage || this.t('terminal.tutorialCommandNoMatch')
        : this.t('terminal.evaluationTryAgain')
      this.tutorial.feedbackType = 'hint'
      const soundType = commandState === 'valid' ? 'warning' : 'error'
      this.playSoundEffect(soundType)
      if (commandState === 'valid' && this.showRobotEducationalHints) {
        this.robotMoodOverride = 'warning'
        const warningText =
          errorMessage || this.t('terminal.tutorialCommandNoMatchShort')
        this.announceRobot(warningText, {
          mood: 'warning',
          type: 'warning',
          icon: 'mdi-alert-circle-outline',
          persistentUntilAction: this.showDetailedTutorialFeedback,
        })
      }
    }
  },

  getTutorialErrorMessage(step, context) {
    const {
      normalizedCmd,
      paramsList,
      currentPath,
      archivesExists,
      missionExists,
      briefingExists,
      briefingCopyExists,
      backupsExists,
      backupBriefingExists,
    } = context
    const lowerParams = paramsList.map(param => param.toLowerCase())
    const mentions = term =>
      lowerParams.some(param => !param.startsWith('-') && param.includes(term))
    const hasFlag = flag =>
      lowerParams.some(param => param.startsWith('-') && param.includes(flag))
    const firstParam = paramsList[0] || ''

    switch (step.id) {
      case 'help':
        if (normalizedCmd !== 'help') {
          return this.t('terminal.tutorialErrors.helpNotHelp')
        }
        break
      case 'pwd':
        if (normalizedCmd !== 'pwd') {
          return this.t('terminal.tutorialErrors.pwdNotPwd')
        }
        break
      case 'ls':
        if (normalizedCmd !== 'ls') {
          return this.t('terminal.tutorialErrors.lsNotLs')
        }
        break
      case 'cd-documents':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdDocumentsNotCd')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.cdDocumentsNoParam')
        }
        if (!mentions('documents')) {
          return this.t('terminal.tutorialErrors.cdDocumentsWrongTarget', {
            target: firstParam,
          })
        }
        return this.t('terminal.tutorialErrors.cdDocumentsStillAt', {
          path: currentPath || '/',
        })
      case 'cd-parent':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdParentNotCd')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.cdParentNoParam')
        }
        if (firstParam.replace(/\/+$/, '') !== '..') {
          return this.t('terminal.tutorialErrors.cdParentWrongParam')
        }
        return this.t('terminal.tutorialErrors.cdParentExpectedPath')
      case 'cd-documents-return':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdReturnNotCd')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.cdReturnNoParam')
        }
        if (!mentions('documents')) {
          return this.t('terminal.tutorialErrors.cdReturnWrongTarget', {
            target: firstParam,
          })
        }
        return this.t('terminal.tutorialErrors.cdReturnExpectedPath')
      case 'ls-documents':
        if (normalizedCmd !== 'ls') {
          return this.t('terminal.tutorialErrors.lsDocumentsNotLs')
        }
        if (!currentPath.endsWith('/home/user/documents')) {
          return this.t('terminal.tutorialErrors.lsDocumentsWrongPath')
        }
        return this.t('terminal.tutorialErrors.lsDocumentsExpectedList')
      case 'rm-archives':
        if (normalizedCmd !== 'rm') {
          return this.t('terminal.tutorialErrors.rmArchivesNotRm')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.rmArchivesNoParam')
        }
        if (!mentions('archives')) {
          return this.t('terminal.tutorialErrors.rmArchivesWrongTarget')
        }
        if (!hasFlag('r')) {
          return this.t('terminal.tutorialErrors.rmArchivesNoRecursive')
        }
        if (archivesExists) {
          return this.t('terminal.tutorialErrors.rmArchivesStillExists')
        }
        break
      case 'mkdir-mission':
        if (normalizedCmd !== 'mkdir') {
          return this.t('terminal.tutorialErrors.mkdirMissionNotMkdir')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.mkdirMissionNoParam')
        }
        if (!mentions('mission')) {
          return this.t('terminal.tutorialErrors.mkdirMissionWrongTarget', {
            target: firstParam,
          })
        }
        return this.t('terminal.tutorialErrors.mkdirMissionStillMissing')
      case 'ls-mission-check':
        if (normalizedCmd !== 'ls') {
          return this.t('terminal.tutorialErrors.lsMissionNotLs')
        }
        if (!currentPath.endsWith('/home/user/documents')) {
          return this.t('terminal.tutorialErrors.lsMissionWrongPath')
        }
        if (!missionExists) {
          return this.t('terminal.tutorialErrors.lsMissionMissing')
        }
        return this.t('terminal.tutorialErrors.lsMissionExpected')
      case 'cd-mission':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdMissionNotCd')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.cdMissionNoParam')
        }
        if (!mentions('mission')) {
          return this.t('terminal.tutorialErrors.cdMissionWrongTarget', {
            target: firstParam,
          })
        }
        return this.t('terminal.tutorialErrors.cdMissionWrongPath', {
          path: currentPath || '/',
        })
      case 'touch-briefing':
        if (normalizedCmd !== 'touch') {
          return this.t('terminal.tutorialErrors.touchBriefingNotTouch')
        }
        if (!paramsList.length) {
          return this.t('terminal.tutorialErrors.touchBriefingNoParam')
        }
        if (!mentions('briefing')) {
          return this.t('terminal.tutorialErrors.touchBriefingWrongTarget', {
            target: firstParam,
          })
        }
        if (!missionExists) {
          return this.t('terminal.tutorialErrors.touchBriefingNoMission')
        }
        if (!briefingExists) {
          return this.t('terminal.tutorialErrors.touchBriefingMissing')
        }
        break
      case 'cp-briefing-copy':
        if (normalizedCmd !== 'cp') {
          return this.t('terminal.tutorialErrors.cpBriefingNotCp')
        }
        if (!mentions('briefing')) {
          return this.t('terminal.tutorialErrors.cpBriefingNeedsSource')
        }
        if (!briefingCopyExists) {
          return this.t('terminal.tutorialErrors.cpBriefingMissing')
        }
        break
      case 'mkdir-backups':
        if (normalizedCmd !== 'mkdir') {
          return this.t('terminal.tutorialErrors.mkdirBackupsNotMkdir')
        }
        if (!mentions('backups')) {
          return this.t('terminal.tutorialErrors.mkdirBackupsTarget')
        }
        if (!backupsExists) {
          return this.t('terminal.tutorialErrors.mkdirBackupsMissing')
        }
        break
      case 'cp-backup-file':
        if (normalizedCmd !== 'cp') {
          return this.t('terminal.tutorialErrors.cpBackupNotCp')
        }
        if (!backupsExists) {
          return this.t('terminal.tutorialErrors.cpBackupNeedsFolder')
        }
        if (!backupBriefingExists) {
          return this.t('terminal.tutorialErrors.cpBackupMissing')
        }
        break
      case 'cd-backups':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdBackupsNotCd')
        }
        if (!mentions('backups')) {
          return this.t('terminal.tutorialErrors.cdBackupsTarget')
        }
        return this.t('terminal.tutorialErrors.cdBackupsWrongPath', {
          path: currentPath || '/',
        })
      case 'ls-backups':
        if (normalizedCmd !== 'ls') {
          return this.t('terminal.tutorialErrors.lsBackupsNotLs')
        }
        if (!currentPath.endsWith('/home/user/documents/mission/backups')) {
          return this.t('terminal.tutorialErrors.lsBackupsWrongPath')
        }
        return this.t('terminal.tutorialErrors.lsBackupsExpected')
      case 'cd-mission-final':
        if (normalizedCmd !== 'cd') {
          return this.t('terminal.tutorialErrors.cdMissionFinalNotCd')
        }
        return this.t('terminal.tutorialErrors.cdMissionFinalWrongPath', {
          path: currentPath || '/',
        })
      case 'rm-working-copy':
        if (normalizedCmd !== 'rm') {
          return this.t('terminal.tutorialErrors.rmWorkingCopyNotRm')
        }
        if (!mentions('briefing.copy')) {
          return this.t('terminal.tutorialErrors.rmWorkingCopyTarget')
        }
        if (briefingCopyExists) {
          return this.t('terminal.tutorialErrors.rmWorkingCopyStillExists')
        }
        break
      case 'pwd-final':
        if (normalizedCmd !== 'pwd') {
          return this.t('terminal.tutorialErrors.pwdFinalNotPwd')
        }
        return this.t('terminal.tutorialErrors.pwdFinalWrongPath', {
          path: currentPath || '/',
        })
      default:
        break
    }

    return ''
  },
}
