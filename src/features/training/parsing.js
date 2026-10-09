// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const parsingMethods = {
  extractRedirection(input = '') {
    let inDouble = false
    let inSingle = false
    let escape = false
    for (let i = 0; i < input.length; i++) {
      const char = input[i]
      if (escape) {
        escape = false
        continue
      }
      if (char === '\\') {
        escape = true
        continue
      }
      if (char === '"' && !inSingle) {
        inDouble = !inDouble
        continue
      }
      if (char === "'" && !inDouble) {
        inSingle = !inSingle
        continue
      }
      if (char === '>' && !inDouble && !inSingle) {
        return {
          mainPart: input.slice(0, i).trimEnd(),
          redirectionPart: input.slice(i).trimStart(),
        }
      }
    }
    return { mainPart: input, redirectionPart: '' }
  },

  tokenizeArguments(input = '') {
    const tokens = []
    let buffer = ''
    let inDouble = false
    let inSingle = false
    for (let i = 0; i < input.length; i++) {
      const char = input[i]
      if (char === '\\') {
        const next = input[i + 1]
        if (next === undefined) {
          buffer += '\\'
          continue
        }
        if (!inSingle && next === '"') {
          buffer += '"'
          i += 1
          continue
        }
        if (!inDouble && next === "'") {
          buffer += "'"
          i += 1
          continue
        }
        buffer += '\\'
        continue
      }
      if (char === '"' && !inSingle) {
        inDouble = !inDouble
        continue
      }
      if (char === "'" && !inDouble) {
        inSingle = !inSingle
        continue
      }
      if (!inDouble && !inSingle && /\s/.test(char)) {
        if (buffer.length) {
          tokens.push(buffer)
          buffer = ''
        }
        continue
      }
      buffer += char
    }
    if (buffer.length) {
      tokens.push(buffer)
    }
    return tokens
  },

  parseRedirectionPart(part = '') {
    if (!part) {
      return null
    }
    const trimmed = part.trim()
    if (!trimmed.startsWith('>')) {
      return null
    }
    let append = false
    let remainder = trimmed
    if (remainder.startsWith('>>')) {
      append = true
      remainder = remainder.slice(2)
    } else {
      remainder = remainder.slice(1)
    }
    remainder = remainder.trim()
    if (!remainder) {
      return { error: this.t('terminal.noRedirectionTarget') }
    }
    const targets = this.tokenizeArguments(remainder)
    if (!targets.length) {
      return { error: this.t('terminal.noRedirectionTarget') }
    }
    if (targets.length > 1) {
      return { error: this.t('terminal.invalidRedirectionOneTarget') }
    }
    return { append, target: targets[0] }
  },
}
