import { tm } from '../../i18n/index.js'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const commandsMethods = {
  whoamiCommand() {
    this.output = this.currentUser
    return 'valid'
  },

  groupsCommand() {
    this.output = this.currentGroups.join(' ')
    return 'valid'
  },

  idCommand() {
    const primaryGroup = this.currentGroups[0] || this.currentUser
    const groups = this.currentGroups
      .map((group, index) => `${1001 + index}(${group})`)
      .join(',')
    this.output = `uid=1001(${this.currentUser}) gid=1001(${primaryGroup}) groups=${groups}`
    return 'valid'
  },

  getHelp(cmd = '') {
    const helpMessages = tm('terminal.helpMessages') || {}
    return (
      helpMessages[cmd] || this.t('terminal.unknownCommand', { command: cmd })
    )
  },

  manCommand(topic = '') {
    if (!topic) {
      this.output = this.t('terminal.manUsage')
      return 'warning'
    }

    const manual = this.getManual(topic)
    if (!manual) {
      this.output = this.t('terminal.noManual', { topic })
      return 'warning'
    }

    this.output = manual
    return 'valid'
  },

  getManual(topic) {
    const manuals = tm('terminal.manuals') || {}
    return manuals[topic]
  },

  echo(params = []) {
    const segments = Array.isArray(params) ? params : params ? [params] : []
    if (!segments.length) {
      this.output = ''
      return ''
    }
    const args = [...segments]
    let interpret = false

    while (args.length && args[0] === '-e') {
      interpret = true
      args.shift()
    }

    const message = args.join(' ')
    const finalMessage = interpret
      ? this.interpretEscapeSequences(message)
      : message
    this.output = finalMessage
    const truncatedMessage = this.truncateText(finalMessage, 300)
    if (truncatedMessage) {
      this.showRobotTooltipMessage(truncatedMessage, {
        duration: 2800,
        auto: true,
        type: 'default',
        icon: 'mdi-message-text-outline',
      })
      this.playSoundEffect('beep')
    }
    return finalMessage
  },
}
