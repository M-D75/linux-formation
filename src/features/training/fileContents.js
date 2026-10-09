// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const fileContentsMethods = {
  catCommand(params = []) {
    const args = Array.isArray(params)
      ? params.filter(arg => typeof arg === 'string' && arg.trim() !== '')
      : params
        ? [params]
        : []
    if (!args.length) {
      this.output = this.t('terminal.catNeedFile')
      return { state: 'warning', stdout: '' }
    }

    const outputs = []
    const errors = []
    let successCount = 0

    for (const filePath of args) {
      const targetPath = filePath
      const nodeInfo = this.getNodeFromPath(targetPath, { includeFiles: true })
      const fileNode = nodeInfo?.node

      if (!fileNode || fileNode.data.type !== 'f') {
        errors.push(
          this.t('terminal.fileNotFound', { command: 'cat', path: targetPath }),
        )
        continue
      }

      if (!this.hasPermission(fileNode, 'r')) {
        errors.push(
          this.t('terminal.permissionDenied', {
            command: 'cat',
            path: targetPath,
          }),
        )
        continue
      }

      successCount += 1
      const fileContent =
        typeof fileNode.data.content === 'string' ? fileNode.data.content : ''
      outputs.push(fileContent)
    }

    const stdout = outputs.join(outputs.length > 1 ? '\n' : '') || ''
    const errorText = errors.join(' | ')
    if (errorText && stdout) {
      this.output = `${stdout}\n${errorText}`
    } else {
      this.output = stdout || errorText
    }

    const resultState = errors.length
      ? successCount > 0
        ? 'warning'
        : 'error'
      : 'valid'

    return { state: resultState, stdout, stderr: errorText }
  },

  parseLineCountOption(params = [], commandName = 'head', defaultCount = 10) {
    const args = Array.isArray(params)
      ? params.filter(arg => typeof arg === 'string' && arg.trim() !== '')
      : typeof params === 'string' && params.trim() !== ''
        ? [params]
        : []
    const result = {
      count: defaultCount,
      files: [],
      error: '',
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg === '-n') {
        const next = args[i + 1]
        if (next === undefined) {
          result.error = this.t('terminal.lineOptionRequiresValue', {
            command: commandName,
          })
          break
        }
        const parsed = parseInt(next, 10)
        if (!Number.isFinite(parsed) || parsed < 0) {
          result.error = this.t('terminal.lineOptionInvalidValue', {
            command: commandName,
            value: next,
          })
          break
        }
        result.count = parsed
        i += 1
        continue
      }
      if (arg.startsWith('-n') && arg.length > 2) {
        const value = arg.slice(2)
        const parsed = parseInt(value, 10)
        if (!Number.isFinite(parsed) || parsed < 0) {
          result.error = this.t('terminal.lineOptionInvalidValue', {
            command: commandName,
            value,
          })
          break
        }
        result.count = parsed
        continue
      }
      result.files.push(arg)
    }

    return result
  },

  headCommand(params = []) {
    const parsed = this.parseLineCountOption(params, 'head')
    if (parsed.error) {
      this.output = parsed.error
      return { state: 'error', stdout: '', stderr: parsed.error }
    }
    if (!parsed.files.length) {
      const msg = this.t('terminal.headNeedFile')
      this.output = msg
      return { state: 'warning', stdout: '', stderr: msg }
    }
    return this.processFileLineOutput({
      files: parsed.files,
      count: parsed.count,
      commandName: 'head',
      mode: 'head',
    })
  },

  tailCommand(params = []) {
    const parsed = this.parseLineCountOption(params, 'tail')
    if (parsed.error) {
      this.output = parsed.error
      return { state: 'error', stdout: '', stderr: parsed.error }
    }
    if (!parsed.files.length) {
      const msg = this.t('terminal.tailNeedFile')
      this.output = msg
      return { state: 'warning', stdout: '', stderr: msg }
    }
    return this.processFileLineOutput({
      files: parsed.files,
      count: parsed.count,
      commandName: 'tail',
      mode: 'tail',
    })
  },

  handleNanoCommand(params = []) {
    const args = Array.isArray(params)
      ? params.filter(arg => typeof arg === 'string' && arg.trim() !== '')
      : params
        ? [params]
        : []
    if (!args.length) {
      this.output = this.t('terminal.nanoNeedFile')
      return 'warning'
    }
    const targetPath = args[0]
    const fileLookup = this.getNodeFromPath(targetPath, { includeFiles: true })
    let fileNode = fileLookup?.node

    if (fileNode && fileNode.data.type === 'd') {
      this.output = this.t('terminal.nanoIsDirectory', { path: targetPath })
      return 'error'
    }

    if (!fileNode) {
      const parentInfo = this.getNodeFromPath(targetPath, {
        stopBeforeLast: true,
        includeFiles: true,
      })
      if (!parentInfo || !parentInfo.node || !parentInfo.targetName) {
        this.output = this.t('terminal.nanoInvalidPath', { path: targetPath })
        return 'error'
      }
      if (!this.hasPermission(parentInfo.node, ['w', 'x'])) {
        this.output = this.t('terminal.nanoParentPermission', {
          name: parentInfo.node.data.name,
        })
        return 'error'
      }
      fileNode = this.createFileNode(parentInfo.node, parentInfo.targetName)
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
      this.stats.createdFile = true
      this.checkBadges()
    } else if (!this.hasPermission(fileNode, ['r', 'w'])) {
      this.output = this.t('terminal.nanoEditPermission', { path: targetPath })
      return 'error'
    }

    const fileContent =
      typeof fileNode.data.content === 'string' ? fileNode.data.content : ''
    this.openNanoEditor(targetPath, fileContent)
    this.output = this.t('terminal.nanoOpened', { path: targetPath })
    return 'valid'
  },

  openNanoEditor(filePath, content = '') {
    this.nanoEditor.filePath = filePath
    this.nanoEditor.content = content
    this.nanoEditor.originalContent = content
    this.nanoEditor.error = ''
    this.nanoEditor.show = true
  },

  closeNanoEditor() {
    this.nanoEditor.show = false
    this.nanoEditor.error = ''
    this.nanoEditor.filePath = ''
    this.nanoEditor.content = ''
    this.nanoEditor.originalContent = ''
    this.$nextTick(() => this.focusCommandInput())
  },

  saveNanoEditor() {
    if (!this.nanoEditor.filePath) {
      this.nanoEditor.error = this.t('terminal.nanoNoFileToSave')
      return
    }
    const targetPath = this.nanoEditor.filePath
    const buffer = this.nanoEditor.content
    const writeResult = this.writeFileContent(targetPath, buffer, {
      append: false,
    })
    if (!writeResult.ok) {
      this.nanoEditor.error = writeResult.message
      return
    }
    if (writeResult.created) {
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
      this.stats.createdFile = true
      this.checkBadges()
    }
    this.nanoEditor.error = ''
    this.closeNanoEditor()
    this.output = this.t('terminal.nanoSaved', {
      path: targetPath,
      bytes: this.getByteLength(buffer),
    })
  },

  processFileLineOutput({
    files = [],
    count = 10,
    commandName = 'head',
    mode = 'head',
  }) {
    const outputs = []
    const errors = []
    let successCount = 0
    const useHeaders = files.length > 1
    const safeCount = Number.isFinite(count) && count >= 0 ? count : 10

    files.forEach(filePath => {
      const nodeInfo = this.getNodeFromPath(filePath, { includeFiles: true })
      const fileNode = nodeInfo?.node
      if (!fileNode || fileNode.data.type !== 'f') {
        errors.push(
          this.t('terminal.fileNotFound', {
            command: commandName,
            path: filePath,
          }),
        )
        return
      }
      if (!this.hasPermission(fileNode, 'r')) {
        errors.push(
          this.t('terminal.permissionDenied', {
            command: commandName,
            path: filePath,
          }),
        )
        return
      }

      successCount += 1
      const rawContent =
        typeof fileNode.data.content === 'string' ? fileNode.data.content : ''
      const normalized = rawContent.replace(/\r\n/g, '\n')
      let lines = normalized.split('\n')
      if (lines.length === 1 && lines[0] === '') {
        lines = []
      }

      let selected = []
      if (mode === 'head') {
        selected = lines.slice(0, safeCount)
      } else {
        // tail
        selected = safeCount === 0 ? [] : lines.slice(-safeCount)
      }

      const block = selected.join('\n')
      if (useHeaders) {
        outputs.push(`==> ${filePath} <==`)
      }
      outputs.push(block)
    })

    const stdout = outputs.join(outputs.length > 0 ? '\n' : '')
    const errorText = errors.join(' | ')
    if (errorText && stdout) {
      this.output = `${stdout}\n${errorText}`
    } else {
      this.output = stdout || errorText
    }

    const resultState = errors.length
      ? successCount > 0
        ? 'warning'
        : 'error'
      : 'valid'

    return { state: resultState, stdout, stderr: errorText }
  },

  applyOutputRedirection(redirection, payload) {
    const normalizedPayload = typeof payload === 'string' ? payload : ''
    const writeResult = this.writeFileContent(
      redirection.target,
      normalizedPayload,
      {
        append: redirection.append,
      },
    )

    if (!writeResult.ok) {
      this.output = writeResult.message
      return 'error'
    }

    if (writeResult.created) {
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
      this.stats.createdFile = true
      this.checkBadges()
    }

    const targetLabel = writeResult.path || redirection.target
    const charCount = normalizedPayload.length
    const label =
      charCount > 1
        ? this.t('terminal.characterPlural')
        : this.t('terminal.characterSingular')
    const mode = redirection.append
      ? this.t('terminal.redirectionAppendMode')
      : this.t('terminal.redirectionWrittenMode')
    this.output = this.t('terminal.redirectionWritten', {
      mode,
      count: charCount,
      label,
      path: targetLabel,
    })
    return 'valid'
  },

  writeFileContent(targetPath, rawContent, options = {}) {
    const normalizedPath = (targetPath || '').trim()
    if (!normalizedPath) {
      return { ok: false, message: this.t('terminal.redirectionNoTarget') }
    }

    const context = this.getNodeFromPath(normalizedPath, {
      stopBeforeLast: true,
      includeFiles: true,
    })
    if (!context || !context.node || !context.targetName) {
      return {
        ok: false,
        message: this.t('terminal.redirectionInvalidPath', {
          path: normalizedPath,
        }),
      }
    }

    const content =
      typeof rawContent === 'string'
        ? rawContent
        : (rawContent ?? '').toString()
    const parentNode = context.node
    const fileName = context.targetName
    let fileNode = this.getChildNode(parentNode, fileName)
    const appendMode = !!options.append
    const existingContent =
      fileNode && typeof fileNode.data.content === 'string'
        ? fileNode.data.content
        : ''
    const newContent = appendMode ? existingContent + content : content

    if (fileNode && fileNode.data.type === 'd') {
      return {
        ok: false,
        message: this.t('terminal.redirectionIsDirectory', {
          path: normalizedPath,
        }),
      }
    }

    if (fileNode && !this.hasPermission(fileNode, 'w')) {
      return {
        ok: false,
        message: this.t('terminal.redirectionFilePermission', {
          path: normalizedPath,
        }),
      }
    }

    if (!fileNode && !this.hasPermission(parentNode, ['w', 'x'])) {
      return {
        ok: false,
        message: this.t('terminal.redirectionParentPermission', {
          name: parentNode.data.name,
        }),
      }
    }

    const nextSize = this.getByteLength(newContent)
    const limitLabel = `${Math.round(this.maxFileSizeBytes / (1024 * 1024))} Mo`
    if (nextSize > this.maxFileSizeBytes) {
      return {
        ok: false,
        message: this.t('terminal.redirectionSizeExceeded', {
          limit: limitLabel,
          path: normalizedPath,
        }),
      }
    }

    let created = false
    if (!fileNode) {
      fileNode = this.createFileNode(parentNode, fileName)
      created = true
    }

    fileNode.data.content = newContent
    fileNode.data.date = this.getFormattedDate()

    return { ok: true, created, node: fileNode, path: normalizedPath }
  },

  getByteLength(value) {
    if (!value) {
      return 0
    }
    return new TextEncoder().encode(value).length
  },

  interpretEscapeSequences(value = '') {
    let result = ''
    for (let i = 0; i < value.length; i++) {
      const char = value[i]
      if (char === '\\' && i + 1 < value.length) {
        const next = value[i + 1]
        i += 1
        switch (next) {
          case 'n':
            result += '\n'
            break
          case 't':
            result += '\t'
            break
          case 'r':
            result += '\r'
            break
          case '0':
            result += '\0'
            break
          case '\\':
            result += '\\'
            break
          case '"':
            result += '"'
            break
          default:
            result += next
            break
        }
      } else {
        result += char
      }
    }
    return result
  },
}
