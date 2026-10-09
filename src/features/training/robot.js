// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const robotMethods = {
  clearRobotMoodTimers() {
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
    if (this.robotBlinkTimer) {
      clearTimeout(this.robotBlinkTimer)
      this.robotBlinkTimer = null
    }
    this.robotEyesClosed = false
  },

  updateRobotMood(state) {
    if (this.robotHovering && state !== 'loving') {
      return
    }
    this.clearRobotMoodTimers()
    if (state !== 'default' && this.tutorialGuidance.persistentId) {
      this.clearTutorialRobotHint()
    }
    if (this.robotHovering && state !== 'loving') {
      return
    }
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

    switch (state) {
      case 'error':
        this.robotMood = 'error'
        break
      case 'warning':
        this.robotMood = 'warning'
        break
      case 'valid':
        this.robotMood = 'success'
        break
      case 'loving':
        this.robotMood = 'loving'
        break
      default:
        this.robotMood = 'default'
        break
    }
    this.triggerRobotJump()
    this.robotResetTimer = setTimeout(() => {
      this.robotMood = 'default'
      this.robotResetTimer = null
      this.triggerRobotFlicker()
      this.scheduleNeutralBlink()
    }, 3000)
    if (this.robotMood === 'default') {
      this.scheduleNeutralBlink()
    }
  },

  triggerRobotJump() {
    this.robotJumping = false
    this.$nextTick(() => {
      this.robotJumping = true
      this.robotJumpTimer = setTimeout(() => {
        this.robotJumping = false
        this.robotJumpTimer = null
      }, 700)
    })
  },

  scheduleNeutralBlink() {
    if (this.robotMood !== 'default' || this.robotHovering) {
      return
    }
    if (this.robotBlinkTimer) {
      clearTimeout(this.robotBlinkTimer)
      this.robotBlinkTimer = null
    }
    const delay = 3500 + Math.random() * 3000
    this.robotBlinkTimer = setTimeout(() => {
      this.robotBlinkTimer = null
      const blinkCount = Math.random() < 0.5 ? 2 : 1
      this.performBlink(blinkCount)
    }, delay)
  },

  performBlink(count = 1) {
    if (this.robotMood !== 'default' || this.robotHovering) {
      this.robotEyesClosed = false
      return
    }
    this.robotEyesClosed = true
    setTimeout(() => {
      this.robotEyesClosed = false
      setTimeout(() => {
        if (count > 1) {
          this.performBlink(count - 1)
        } else {
          this.scheduleNeutralBlink()
        }
      }, 90)
    }, 160)
  },

  triggerRobotFlicker() {
    if (this.robotFlickerTimer) {
      clearTimeout(this.robotFlickerTimer)
      this.robotFlickerTimer = null
    }
    this.robotFlicker = false
    this.$nextTick(() => {
      this.robotFlicker = true
      this.robotFlickerTimer = setTimeout(() => {
        this.robotFlicker = false
        this.robotFlickerTimer = null
      }, 800)
    })
  },

  clearRobotTooltipTimer() {
    if (this.robotTooltip.timer) {
      clearTimeout(this.robotTooltip.timer)
      this.robotTooltip.timer = null
    }
  },

  getRobotTooltipDuration(
    message = '',
    type = 'default',
    explicitDuration = null,
  ) {
    const plainMessage = this.sanitizeHistoryOutput(message)
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wordCount = plainMessage ? plainMessage.split(/\s+/).length : 0
    const baseDurations = {
      success: 2600,
      warning: 3400,
      error: 3800,
      info: 3600,
      default: 2800,
    }
    const baseDuration = baseDurations[type] || baseDurations.default
    const readingDuration = baseDuration + wordCount * 330
    const computedDuration = Math.min(Math.max(readingDuration, 3200), 14000)

    return explicitDuration
      ? Math.max(explicitDuration, computedDuration)
      : computedDuration
  },

  clearRobotTooltipOnUserAction() {
    if (
      !this.robotTooltip.persistentUntilAction &&
      !this.tutorialGuidance.persistentId
    ) {
      return
    }
    this.clearTutorialRobotHint()
    this.robotTooltip.visible = false
    this.robotTooltip.auto = false
    this.robotTooltip.persistentUntilAction = false
    this.clearRobotTooltipTimer()
  },

  showRobotTooltipMessage(
    message,
    {
      duration = null,
      auto = false,
      type = 'default',
      icon = '',
      persistentUntilAction = false,
    } = {},
  ) {
    this.clearRobotTooltipTimer()
    this.robotTooltip.message = this.highlightCommandNames(message || '')
    this.robotTooltip.visible = true
    this.robotTooltip.auto = auto && !persistentUntilAction
    this.robotTooltip.persistentUntilAction = !!persistentUntilAction
    this.robotTooltip.type = type || 'default'
    this.robotTooltip.icon = icon || ''
    if (this.robotTooltip.auto) {
      const resolvedDuration = this.getRobotTooltipDuration(
        message,
        type,
        duration,
      )
      this.robotTooltip.timer = setTimeout(() => {
        if (this.robotTooltip.auto) {
          this.robotTooltip.visible = false
          this.robotTooltip.auto = false
          this.robotTooltip.persistentUntilAction = false
        }
        this.robotTooltip.timer = null
      }, resolvedDuration)
    }
  },

  announceRobot(
    message,
    {
      duration = null,
      mood = null,
      type = 'default',
      icon = '',
      persistentUntilAction = false,
    } = {},
  ) {
    if (mood) {
      this.updateRobotMood(mood)
    }
    this.showRobotTooltipMessage(message, {
      duration,
      auto: true,
      type,
      icon,
      persistentUntilAction,
    })
    this.tutorialGuidance.persistentId = null
  },

  showTutorialRobotHint(id, message) {
    if (
      !this.showRobotEducationalHints ||
      !message ||
      this.robotHovering ||
      this.robotMood !== 'default'
    ) {
      return
    }
    this.showRobotTooltipMessage(message, {
      auto: false,
      type: 'info',
      icon: 'mdi-information-outline',
      persistentUntilAction: true,
    })
    this.robotTooltip.auto = false
    this.tutorialGuidance.persistentId = id
  },

  clearTutorialRobotHint(id = null) {
    if (!this.tutorialGuidance.persistentId) {
      return
    }
    if (id && this.tutorialGuidance.persistentId !== id) {
      return
    }
    this.tutorialGuidance.persistentId = null
    this.robotTooltip.persistentUntilAction = false
    if (!this.robotTooltip.auto) {
      this.robotTooltip.visible = false
    }
  },

  maybeShowTutorialIntroHint() {
    if (
      !this.tutorial.active ||
      this.tutorial.showIntro ||
      this.tutorial.completed ||
      !this.showCommandHint ||
      !this.showRobotEducationalHints ||
      this.tutorialGuidance.introShown
    ) {
      return
    }
    this.showTutorialRobotHint('intro', this.t('terminal.tutorialIntroHint'))
    this.tutorialGuidance.introShown = true
  },

  maybeShowTutorialHelpHint() {
    if (
      !this.tutorial.active ||
      this.tutorial.showIntro ||
      this.tutorial.completed ||
      this.showCommandHint ||
      !this.showRobotEducationalHints ||
      this.tutorial.currentStep !== 0 ||
      this.tutorialGuidance.helpHintShown
    ) {
      return
    }
    this.showTutorialRobotHint('help', this.t('terminal.tutorialHelpHint'))
    this.tutorialGuidance.helpHintShown = true
  },

  handleRobotHover() {
    this.robotHovering = true
    if (this.robotTooltip.persistentUntilAction) {
      return
    }
    this.clearRobotMoodTimers()
    this.clearTutorialRobotHint()
    this.robotJumping = false
    this.robotFlicker = false
    this.robotMood = 'loving'
    const dialogue = this.getRobotDialogue()
    const icon = this.getRobotDialogueIcon()
    this.showRobotTooltipMessage(dialogue, {
      auto: false,
      type: 'default',
      icon,
    })
    this.startTalkSound()
  },

  handleRobotLeave() {
    this.robotHovering = false
    if (!this.robotTooltip.auto && !this.robotTooltip.persistentUntilAction) {
      this.robotTooltip.visible = false
    }
    if (!this.robotTooltip.persistentUntilAction) {
      this.robotTooltip.auto = false
      this.clearRobotTooltipTimer()
    }
    this.robotMood = 'default'
    this.triggerRobotFlicker()
    this.scheduleNeutralBlink()
    this.stopTalkSound()
  },

  getRobotDialogue() {
    if (!this.robotTooltip.greetingShown) {
      this.robotTooltip.greetingShown = true
      this.robotTooltip.lastMessage = this.t('terminal.robotGreetingShort')
      return this.t('terminal.robotGreeting')
    }
    let message = this.robotTooltip.lastMessage
    const pool = this.robotDialoguePool
    if (!pool.length) {
      return message
    }
    while (message === this.robotTooltip.lastMessage && pool.length > 1) {
      const idx = Math.floor(Math.random() * pool.length)
      message = pool[idx]
    }
    this.robotTooltip.lastMessage = message
    return message
  },

  getRobotDialogueIcon() {
    const pool = this.robotDialogueIconPool || []
    if (!pool.length) {
      return 'mdi-robot'
    }
    const idx = Math.floor(Math.random() * pool.length)
    return pool[idx]
  },

  getRandomErrorEncouragement() {
    const pool = this.robotErrorEncouragements || []
    if (!pool.length) {
      return this.t('terminal.defaultErrorEncouragement')
    }
    const idx = Math.floor(Math.random() * pool.length)
    return pool[idx]
  },

  getMnemonicHint(stepId) {
    const key = `terminal.mnemonicHints.${stepId}`
    const hint = this.t(key)
    return hint === key ? '' : hint
  },
}
