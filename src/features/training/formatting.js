// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const formattingMethods = {
  escapeHtml(text = '') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  },

  highlightCommandNames(message = '') {
    if (!message) {
      return ''
    }
    let safeMessage = this.escapeHtml(message)
    safeMessage = safeMessage
      .replace(/\[strong\](.+?)\[\/strong\]/gi, '<strong>$1</strong>')
      .replace(/&lt;strong&gt;(.+?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    safeMessage = safeMessage
      .replace(/`([^`]+)`/g, (_m, content) => {
        const highlighted = `<span class="robot-command">${content}</span>`
        return `<span class="robot-mnemonic">${highlighted}</span>`
      })
      .replace(/&lt;code&gt;(.+?)&lt;\/code&gt;/gi, (_m, content) => {
        const highlighted = `<span class="robot-command">${content}</span>`
        return `<span class="robot-mnemonic">${highlighted}</span>`
      })
      .replace(/\*\*(.+?)\*\*/g, (_m, content) => {
        const highlighted = `<span class="robot-command">${content}</span>`
        return `<span class="robot-mnemonic">${highlighted}</span>`
      })
    const keywords = this.robotCommandKeywords || []
    if (keywords.length) {
      const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi')
      safeMessage = safeMessage.replace(regex, match => {
        return `<span class="robot-command">${match}</span>`
      })
    }
    safeMessage = safeMessage.replace(/\n/g, '<br>')
    return safeMessage
  },

  truncateText(message, maxLength = 300) {
    if (!message) {
      return ''
    }
    if (message.length <= maxLength) {
      return message
    }
    return `${message.slice(0, maxLength)}...`
  },
}
