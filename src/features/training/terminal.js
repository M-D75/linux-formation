import $ from 'jquery'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const terminalMethods = {
  focusCommandInput() {
    if (this.$refs.commandInput?.focus) {
      this.$refs.commandInput.focus()
    }
  },

  dismissCommandHint() {
    if (this.showCommandHint) {
      this.showCommandHint = false
    }
  },

  handleInputKeyup(event) {
    if (event?.key !== 'Enter') {
      this.clearRobotTooltipOnUserAction()
    }
    this.dismissCommandHint()
    this.navigateTerminal(event)
  },

  selectCommandSuggestion(cmd) {
    this.clearRobotTooltipOnUserAction()
    this.command = `${cmd} `
    this.dismissCommandHint()
    this.$nextTick(() => this.focusCommandInput())
  },

  selectPermissionGuideCommand(cmd) {
    if (!cmd) {
      return
    }
    this.clearRobotTooltipOnUserAction()
    this.command = cmd
    this.dismissCommandHint()
    this.$nextTick(() => this.focusCommandInput())
  },

  injectHelpCommand() {
    this.clearRobotTooltipOnUserAction()
    this.command = 'help '
    this.dismissCommandHint()
    this.$nextTick(() => this.focusCommandInput())
  },

  navigateTerminal(event) {
    switch (event.key) {
      case 'ArrowUp':
        if (this.cursorHistory < this.commandHistory.length) {
          this.cursorHistory += 1
          this.command = this.commandHistory.slice().reverse()[
            this.cursorHistory - 1
          ].command
        }

        break
      case 'ArrowDown':
        if (this.cursorHistory - 1 >= 0) {
          this.cursorHistory -= 1

          if (this.cursorHistory == 0) {
            this.command = ''
            break
          }

          this.command = this.commandHistory.slice().reverse()[
            this.cursorHistory - 1
          ].command
        }

        break
      case 'Tab':
        event.preventDefault()

        if (event.type === 'keydown') {
          this.autoCompleteCommand()
        }

        break
      default:
        break
    }
  },

  getCommonPrefix(values = []) {
    const normalized = values.filter(
      value => typeof value === 'string' && value.length > 0,
    )
    if (!normalized.length) {
      return ''
    }

    let prefix = normalized[0]
    for (const value of normalized.slice(1)) {
      let index = 0
      while (
        index < prefix.length &&
        index < value.length &&
        prefix[index] === value[index]
      ) {
        index += 1
      }
      prefix = prefix.slice(0, index)
      if (!prefix) {
        break
      }
    }
    return prefix
  },

  autoCompleteCommand() {
    if (this.learningMode === 'evaluation') {
      return
    }
    const args = this.command.trim().split(' ')
    const cmd = args[0]

    if (args.length === 1) {
      // Autocomplétion de la commande
      const commands = this.availableCommands

      const matches = commands.filter(c => c.startsWith(cmd))

      if (matches.length === 1) {
        this.command = matches[0] + ' '
      } else if (matches.length > 1) {
        const commonPrefix = this.getCommonPrefix(matches)
        if (commonPrefix.length > cmd.length) {
          this.command = commonPrefix
          return
        }
        this.output = this.t('terminal.suggestions', {
          items: matches.join(', '),
        })

        const tooltip = this.buildCommandTooltip('', 'info', this.output)
        this.commandHistory.push({
          command: '',
          state: 'info',
          output: this.output,
          tooltip,
        })

        setTimeout(() => {
          $('.output-cmd').scrollTop($('.output-cmd')[0].scrollHeight + 500)
        }, 50)
      }
    } else {
      // Autocomplétion des paramètres
      const lastParam = args[args.length - 1]
      if (!lastParam || lastParam.startsWith('-')) {
        return
      }

      const context = this.getAutocompleteContext(lastParam)
      if (!context) {
        return
      }

      let baseNodeResult = null
      if (!context.dirPath) {
        baseNodeResult = { node: this.currentNode }
      } else if (context.dirPath === '/') {
        baseNodeResult = { node: this.root }
      } else {
        baseNodeResult = this.getNodeFromPath(context.dirPath, {
          includeFiles: false,
        })
      }

      const baseNode = baseNodeResult?.node
      if (!baseNode) {
        return
      }

      const availableChildren = baseNode.children || baseNode._children || []
      const matches = availableChildren.filter(child =>
        child.data.name.startsWith(context.partial),
      )

      if (matches.length === 1) {
        const matchNode = matches[0]
        let completion = `${context.basePrefix}${matchNode.data.name}`
        if (matchNode.data.type === 'd') {
          completion += '/'
        } else {
          completion += ' '
        }

        const newArgs = args.slice(0, -1).concat(completion)
        this.command = newArgs.join(' ')
      } else if (matches.length > 1) {
        const suggestions = matches.map(match => match.data.name)
        const commonPrefix = this.getCommonPrefix(suggestions)
        if (commonPrefix.length > context.partial.length) {
          const completion = `${context.basePrefix}${commonPrefix}`
          const newArgs = args.slice(0, -1).concat(completion)
          this.command = newArgs.join(' ')
          return
        }
        this.output = this.t('terminal.suggestions', {
          items: suggestions.join(', '),
        })

        const tooltip = this.buildCommandTooltip('', 'info', this.output)
        this.commandHistory.push({
          command: '',
          state: 'info',
          output: this.output,
          tooltip,
        })

        setTimeout(() => {
          $('.output-cmd').scrollTop($('.output-cmd')[0].scrollHeight + 500)
        }, 50)
      }
    }
  },

  sanitizeHistoryOutput(value) {
    if (!value) {
      return ''
    }
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  },

  buildCommandTooltip(commandText = '', state = '', output = '') {
    const cmdName = (commandText || '').trim().split(' ')[0] || ''
    const baseDesc =
      this.commandDescriptions[cmdName] ||
      (cmdName
        ? this.t('terminal.commandBaseDescription', { command: cmdName })
        : this.t('terminal.systemInfo'))
    const cleanedOutput = this.sanitizeHistoryOutput(output)
    let stateNote = ''
    switch (state) {
      case 'error':
        stateNote = cleanedOutput
          ? this.t('terminal.errorPrefix', { output: cleanedOutput })
          : this.t('terminal.errorDetectedShort')
        break
      case 'warning':
        stateNote = cleanedOutput
          ? this.t('terminal.warningPrefix', { output: cleanedOutput })
          : this.t('terminal.warningRequired')
        break
      case 'info':
        stateNote = cleanedOutput || this.t('terminal.terminalSuggestion')
        break
      default:
        stateNote = cleanedOutput
    }
    return [baseDesc, stateNote].filter(Boolean).join(' • ')
  },

  getHistoryTooltip(entry) {
    if (!entry) {
      return ''
    }
    const text =
      entry.tooltip ||
      this.buildCommandTooltip(entry.command, entry.state, entry.output)
    return text.length <= 180 ? text : ''
  },

  showTerminalScrollbar() {
    this.terminalScrolling = true
    clearTimeout(this.terminalScrollTimer)
    this.terminalScrollTimer = setTimeout(() => {
      this.terminalScrolling = false
    }, 900)
  },

  trackTerminalScrollbar(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    this.terminalScrollbarNear = bounds.right - event.clientX <= 24
  },

  saveCommandHistory() {
    const payload = {
      history: this.commandHistory,
      timestamp: Date.now(),
    }
    this.$store.commit('setCommandHistory', payload)
  },

  loadCommandHistory() {
    const oneHour = 60 * 60 * 1000
    const storedTimestamp = this.$store.state.commandHistoryTimestamp
    const storedHistory = this.$store.state.commandHistory || []
    if (storedTimestamp && Date.now() - storedTimestamp <= oneHour) {
      this.commandHistory = [...storedHistory]
    } else {
      this.commandHistory = []
      this.$store.commit('setCommandHistory', { history: [], timestamp: null })
    }
    if (this.commandHistory.length > 0) {
      this.showCommandHint = false
    }
  },

  executeCommand() {
    this.clearRobotTooltipOnUserAction()
    this.cursorHistory = 0
    const issuedCommand = this.command
    const trimmedInput = (issuedCommand || '').trim()
    const { mainPart, redirectionPart } = this.extractRedirection(trimmedInput)
    const args = this.tokenizeArguments(mainPart)
    const redirectionParse = this.parseRedirectionPart(redirectionPart)

    if (redirectionParse?.error) {
      this.output = redirectionParse.error
      this.pushCommandToHistory(issuedCommand, 'error', this.output)
      this.command = ''
      return
    }

    let redirection = redirectionParse || null

    if (redirection && !redirection.target) {
      this.output = this.t('terminal.noRedirectionTarget')
      this.pushCommandToHistory(issuedCommand, 'error', this.output)
      this.command = ''
      return
    }

    const cmd = args[0] || ''
    const param = args.slice(1)

    let state = 'valid'
    let redirectionPayload = null
    let redirectionSideOutput = ''

    this.cDirect.from = null
    this.chmodInfos.data.user = []
    this.createOutputAnimate()

    if (redirection && !cmd) {
      this.output = this.t('terminal.redirectionNoCommand')
      this.pushCommandToHistory(issuedCommand, 'error', this.output)
      this.command = ''
      return
    }

    if (param.includes('-h')) {
      this.output = this.getHelp(cmd)
      this.pushCommandToHistory(issuedCommand, state, this.output)
      this.command = ''
      return
    }

    switch (cmd) {
      case 'help':
        this.output = this.getHelp()
        break
      case 'man':
        state = this.manCommand(param[0])
        if (state === 'valid') {
          this.stats.manUses += 1
          this.checkBadges()
        }
        break
      case 'chmod':
        state = this.handleChmod(param)
        break
      case 'whoami':
        state = this.whoamiCommand()
        break
      case 'groups':
        state = this.groupsCommand()
        break
      case 'id':
        state = this.idCommand()
        break
      case 'pwd':
        this.pathWayDirectory()
        break
      case 'echo':
        redirectionPayload = this.echo(param)
        break
      case 'cat': {
        const catResult = this.catCommand(param)
        state = catResult.state
        redirectionPayload = catResult.stdout
        redirectionSideOutput = catResult.stderr || ''
        break
      }
      case 'head': {
        const headResult = this.headCommand(param)
        state = headResult.state
        redirectionPayload = headResult.stdout
        redirectionSideOutput = headResult.stderr || ''
        break
      }
      case 'tail': {
        const tailResult = this.tailCommand(param)
        state = tailResult.state
        redirectionPayload = tailResult.stdout
        redirectionSideOutput = tailResult.stderr || ''
        break
      }
      case 'nano':
        state = this.handleNanoCommand(param)
        redirectionPayload = ''
        break
      case 'cd':
        state = this.changeDirectory(param)
        break
      case 'ls':
        this.listDirectory(param)
        break
      case 'll':
        this.listDirectory(['-l', ...param])
        break
      case 'mkdir':
        state = this.makeDirectory(param)
        break
      case 'touch':
        this.createFile(param)
        break
      case 'cp':
        state = this.copyItem(param)
        break
      case 'rm':
        this.removeItem(param)
        break
      case '':
        this.output = ''
        state = 'warning'
        break
      default:
        this.output = this.t('terminal.unknownCommand', { command: cmd })
        state = 'error'
    }

    const beforeRedirectionOutput = this.output
    if (redirection && state !== 'error') {
      const payload =
        typeof redirectionPayload === 'string'
          ? redirectionPayload
          : typeof this.output === 'string'
            ? this.output
            : ''
      const redirectionState = this.applyOutputRedirection(redirection, payload)
      if (redirectionState === 'error') {
        state = 'error'
      } else if (state !== 'valid') {
        const retained = redirectionSideOutput || beforeRedirectionOutput
        this.output = retained ? `${retained}\n${this.output}` : this.output
      } else {
        state = redirectionState
      }
    }

    this.handleTutorialProgress(cmd, param, state, issuedCommand)
    this.handlePermissionMissionProgress(cmd, param, state, issuedCommand)

    this.pushCommandToHistory(issuedCommand, state, this.output)
    this.command = ''
  },

  pushCommandToHistory(commandText, state, output) {
    const moodToApply = this.robotMoodOverride || state
    this.robotMoodOverride = null
    this.updateRobotMood(moodToApply)
    if (state === 'error') {
      this.playSoundEffect('error')
      const errorMessage = this.t('terminal.errorDetected', {
        message: this.getRandomErrorEncouragement(),
      })
      this.announceRobot(errorMessage, {
        duration: 3400,
        mood: 'error',
        type: 'error',
        icon: 'mdi-alert-octagon',
      })
    } else if (state === 'warning') {
      this.playSoundEffect('warning')
    }
    const tooltip = this.buildCommandTooltip(commandText, state, output)
    const historyOutput =
      state !== 'error'
        ? output
        : `<span style="color: #fe4444">${output}<span/>`
    this.commandHistory.push({
      command: commandText,
      state,
      output: historyOutput,
      tooltip,
    })
    this.saveCommandHistory()
    this.queueTelemetryEvent(
      'command_executed',
      {
        command: commandText,
        state,
        currentStep: this.tutorial.currentStep,
        currentStepId: this.currentTutorialStep?.id || null,
        tutorialCompleted: this.tutorial.completed,
        path: this.getSessionPath(),
      },
      { immediate: true },
    )
    setTimeout(() => {
      $('.output-cmd').scrollTop($('.output-cmd')[0].scrollHeight + 500)
    }, 50)
  },
}
