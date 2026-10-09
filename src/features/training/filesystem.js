// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const filesystemMethods = {
  listDirectory(params) {
    //ls
    const args = Array.isArray(params) ? params : params ? [params] : []
    // Vérifie les options `-a` et `-l` dans les paramètres
    const showHidden = args.some(p => /-[^ ]*a[^ ]*/.test(p))
    const detailedView = args.some(p => /-[^ ]*l[^ ]*/.test(p))

    // Met à jour les options de la commande `ls` pour la partie graphique
    this.ls.showHidden = showHidden

    // Récupère le chemin sans options
    const nonOptionParams = args.filter(p => !/-[^ ]*/.test(p))
    const dirPath = nonOptionParams[0] || ''

    // Résout le chemin (si le chemin est vide, on utilise le dossier courant)
    const targetNode = dirPath ? this.resolvePath(dirPath) : this.currentNode

    if (!targetNode) {
      this.output = this.t('terminal.directoryNotFound', { path: dirPath })
      return
    }

    // Détecte si on liste un dossier parent (dans ce cas on ne touche pas au Tree)
    const isParentListing =
      !!dirPath &&
      targetNode !== this.currentNode &&
      this.isPathToCurrentNode(targetNode)

    // Vérifie les permissions de lecture
    if (!this.hasPermission(targetNode, ['r', 'x'])) {
      this.output = this.t('terminal.readPermissionDenied')
      return
    }

    let beforChild = targetNode.children
    // Prépare les enfants à afficher
    let nodeChildren
    if (isParentListing) {
      nodeChildren = targetNode.children || targetNode._children || []
    } else {
      targetNode.children = targetNode._children || targetNode.children || []
      nodeChildren = targetNode.children
    }

    // // Filtre les fichiers cachés si `-a` n'est pas spécifié
    const children = showHidden
      ? nodeChildren
      : nodeChildren.filter(child => !child.data.hidden)

    if (!isParentListing) {
      targetNode.children = children
    }

    // Génère la sortie
    if (children.length === 0) {
      this.output = this.t('terminal.emptyFolder')
      targetNode.children = beforChild
      return
    } else if (detailedView) {
      // Vue détaillée avec `-l`
      this.output = children
        .map(child =>
          `${child.data.rights} ${child.data.user} ${child.data.group} ${child.data.date} ${child.data.name}`.replaceAll(
            ' ',
            '&nbsp;',
          ),
        )
        .join('\n')
    } else {
      // Vue simple
      this.output = children.map(child => child.data.name).join('\n')
    }

    // console.log("-----", this.currentNode, targetNode, children);

    // Met à jour l'arbre uniquement si l'on parcourt le répertoire courant ou un sous-dossier
    if (!isParentListing && children.length > 0) {
      this.refreshTreeView(this.currentNode)
    }
  },

  makeDirectory(params) {
    //mkdir
    if (!params) {
      this.output = this.t('terminal.folderNameRequired')
      return
    }

    const args = Array.isArray(params) ? params : [params]
    const options = args.filter(arg => arg.startsWith('-'))
    const dirNames = args.filter(arg => !arg.startsWith('-'))

    if (!dirNames.length) {
      this.output = this.t('terminal.noFolderName')
      return 'error'
    }

    const allowParents = options.some(opt => opt.includes('p'))
    const createdDirs = []
    const errors = []

    for (const rawPath of dirNames) {
      if (!rawPath || rawPath === '.' || rawPath === '/') {
        errors.push(
          this.t('terminal.mkdirInvalidPath', { path: rawPath || '' }),
        )
        continue
      }

      const segments = rawPath.split('/')
      let current = rawPath.startsWith('/') ? this.root : this.currentNode
      let failed = false

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        if (!segment || segment === '.') {
          continue
        }

        if (segment === '..') {
          if (current.parent) {
            current = current.parent
          }
          continue
        }

        const isLast = i === segments.length - 1
        const existing = this.getChildNode(current, segment)

        if (existing) {
          if (existing.data.type !== 'd') {
            errors.push(
              this.t('terminal.mkdirFileExistsName', { path: rawPath }),
            )
            failed = true
            break
          }

          if (isLast && !allowParents) {
            errors.push(this.t('terminal.mkdirExists', { path: rawPath }))
            failed = true
            break
          }

          current = existing
          continue
        }

        if (!isLast && !allowParents) {
          errors.push(this.t('terminal.mkdirMissingParent', { path: rawPath }))
          failed = true
          break
        }

        if (!this.hasPermission(current, ['w', 'x'])) {
          this.output = this.t('terminal.mkdirPermissionDenied', {
            name: current.data.name,
          })
          return 'warning'
        }

        current = this.createDirectoryNode(current, segment)
      }

      if (!failed) {
        createdDirs.push(rawPath)
      }
    }

    if (createdDirs.length) {
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
      this.output = this.t('terminal.foldersCreated', {
        items: createdDirs.join(', '),
      })
      if (errors.length) {
        this.output += ` | ${errors.join(' | ')}`
      }
      this.stats.createdDirectory = true
      this.checkBadges()
      return 'valid'
    }

    this.output = errors.join(' | ') || this.t('terminal.noFolderCreated')
    return errors.length ? 'warning' : 'valid'
  },

  createFile(params) {
    //touch
    if (!params) {
      this.output = this.t('terminal.fileNameRequired')
      return
    }

    const args = Array.isArray(params) ? params : [params]

    const files = args.filter(arg => !arg.startsWith('-'))

    if (!files.length) {
      this.output = this.t('terminal.noFileSpecified')
      return
    }

    const created = []
    const updated = []
    const errors = []

    for (const filePath of files) {
      const targetInfo = this.getNodeFromPath(filePath, {
        stopBeforeLast: true,
        includeFiles: true,
      })
      if (!targetInfo || !targetInfo.targetName) {
        errors.push(this.t('terminal.touchInvalidPath', { path: filePath }))
        continue
      }

      const parentNode = targetInfo.node
      const fileName = targetInfo.targetName
      const existing = this.getChildNode(parentNode, fileName)

      if (existing) {
        if (existing.data.type === 'd') {
          errors.push(this.t('terminal.touchIsDirectory', { path: filePath }))
          continue
        }

        if (!this.hasPermission(existing, 'w')) {
          errors.push(
            this.t('terminal.touchModifyPermission', { path: filePath }),
          )
          continue
        }

        existing.data.date = this.getFormattedDate()
        updated.push(filePath)
        continue
      }

      if (!this.hasPermission(parentNode, ['w', 'x'])) {
        errors.push(
          this.t('terminal.touchParentPermission', {
            name: parentNode.data.name,
          }),
        )
        continue
      }

      this.createFileNode(parentNode, fileName)
      created.push(filePath)
    }

    if (created.length || updated.length) {
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
      const messages = []
      if (created.length) {
        messages.push(
          this.t('terminal.filesCreated', { items: created.join(', ') }),
        )
      }
      if (updated.length) {
        messages.push(
          this.t('terminal.timestampUpdated', { items: updated.join(', ') }),
        )
      }
      if (errors.length) {
        messages.push(errors.join(' | '))
      }
      this.output = messages.join(' | ')
      if (created.length) {
        this.stats.createdFile = true
        this.checkBadges()
      }
      return
    }

    this.output = errors.join(' | ') || this.t('terminal.noFileProcessed')
  },

  copyItem(params = []) {
    const args = Array.isArray(params) ? params : params ? [params] : []
    const options = args.filter(arg => arg.startsWith('-'))
    const paths = args.filter(arg => !arg.startsWith('-'))
    const recursive = options.some(
      option => option.includes('r') || option.includes('R'),
    )

    if (paths.length < 2) {
      this.output = this.t('terminal.cpNeedSourceTarget')
      return 'warning'
    }
    if (paths.length > 2) {
      this.output = this.t('terminal.cpOnlyOneSource')
      return 'warning'
    }

    const [sourcePath, rawTargetPath] = paths
    const sourceInfo = this.getNodeFromPath(sourcePath, { includeFiles: true })
    const sourceNode = sourceInfo?.node

    if (!sourceNode) {
      this.output = this.t('terminal.cpSourceNotFound', { path: sourcePath })
      return 'warning'
    }
    if (sourceNode.data.type === 'd' && !recursive) {
      this.output = this.t('terminal.cpRecursiveRequired', { path: sourcePath })
      return 'warning'
    }
    if (!this.canReadCopySource(sourceNode)) {
      this.output = this.t('terminal.cpSourcePermission', { path: sourcePath })
      return 'warning'
    }

    const target = this.resolveCopyTarget(sourceNode, rawTargetPath)
    if (!target.ok) {
      this.output = target.message
      return 'warning'
    }

    if (!this.hasPermission(target.parent, ['w', 'x'])) {
      this.output = this.t('terminal.cpParentPermission', {
        name: target.parent.data.name,
      })
      return 'warning'
    }

    const existingChild = this.getChildNode(target.parent, target.name)
    if (existingChild && sourceNode.data.type === 'd') {
      this.output = this.t('terminal.cpDestinationExists', {
        path: rawTargetPath,
      })
      return 'warning'
    }
    if (existingChild && existingChild.data.type === 'd') {
      this.output = this.t('terminal.cpDestinationIsDirectory', {
        path: rawTargetPath,
      })
      return 'warning'
    }
    if (existingChild && !this.hasPermission(existingChild, 'w')) {
      this.output = this.t('terminal.cpDestinationPermission', {
        path: rawTargetPath,
      })
      return 'warning'
    }

    if (existingChild) {
      existingChild.data.content = sourceNode.data.content || ''
      existingChild.data.date = this.getFormattedDate()
    } else {
      this.cloneNodeForCopy(sourceNode, target.parent, target.name)
    }

    this.preserveCurrentPath()
    this.createTree({ preserveSelection: true })
    this.emitTreeSignal()
    this.output = this.t('terminal.cpCopied', {
      source: sourcePath,
      target: rawTargetPath,
    })
    if (sourceNode.data.type === 'd') {
      this.stats.createdDirectory = true
    } else {
      this.stats.createdFile = true
    }
    this.checkBadges()
    return 'valid'
  },

  canReadCopySource(node) {
    if (!node) {
      return false
    }
    if (node.data.type === 'f') {
      return this.hasPermission(node, 'r')
    }
    if (!this.hasPermission(node, ['r', 'x'])) {
      return false
    }
    const children = node.children || node._children || []
    return children.every(child => this.canReadCopySource(child))
  },

  resolveCopyTarget(sourceNode, rawTargetPath) {
    const targetPath = (rawTargetPath || '').trim()
    if (!targetPath) {
      return { ok: false, message: this.t('terminal.cpNeedSourceTarget') }
    }

    const wantsDirectory = targetPath.endsWith('/')
    const normalizedTargetPath =
      wantsDirectory && targetPath.length > 1
        ? targetPath.replace(/\/+$/, '')
        : targetPath
    const existingTarget = this.getNodeFromPath(normalizedTargetPath, {
      includeFiles: true,
    })?.node

    if (
      wantsDirectory &&
      (!existingTarget || existingTarget.data.type !== 'd')
    ) {
      return {
        ok: false,
        message: this.t('terminal.cpTargetDirectoryMissing', {
          path: rawTargetPath,
        }),
      }
    }

    if (existingTarget?.data.type === 'd') {
      return {
        ok: true,
        parent: existingTarget,
        name: sourceNode.data.name,
      }
    }

    const parentInfo = this.getNodeFromPath(normalizedTargetPath, {
      stopBeforeLast: true,
      includeFiles: true,
    })
    if (!parentInfo || !parentInfo.node || !parentInfo.targetName) {
      return {
        ok: false,
        message: this.t('terminal.cpInvalidTarget', { path: rawTargetPath }),
      }
    }
    if (parentInfo.node.data.type !== 'd') {
      return {
        ok: false,
        message: this.t('terminal.cpInvalidTarget', { path: rawTargetPath }),
      }
    }

    return {
      ok: true,
      parent: parentInfo.node,
      name: parentInfo.targetName,
    }
  },

  cloneNodeForCopy(sourceNode, targetParent, targetName) {
    if (sourceNode.data.type === 'd') {
      const copiedDirectory = this.createDirectoryNode(targetParent, targetName)
      copiedDirectory.data.rights = sourceNode.data.rights
      copiedDirectory.data.hidden = targetName.startsWith('.')
      const sourceChildren = sourceNode.children || sourceNode._children || []
      sourceChildren.forEach(child => {
        this.cloneNodeForCopy(child, copiedDirectory, child.data.name)
      })
      return copiedDirectory
    }

    const copiedFile = this.createFileNode(targetParent, targetName)
    copiedFile.data.rights = sourceNode.data.rights
    copiedFile.data.hidden = targetName.startsWith('.')
    copiedFile.data.content = sourceNode.data.content || ''
    return copiedFile
  },

  removeItem(params) {
    //rm
    const args = Array.isArray(params) ? params : params ? [params] : []
    if (!args.length) {
      this.output = this.t('terminal.rmNoName')
      return
    }

    const options = args.filter(arg => arg.startsWith('-'))
    const targets = args
      .filter(arg => !arg.startsWith('-'))
      .map(arg =>
        arg.endsWith('/') && arg.length > 1
          ? arg.replace(/\/+$/, '')
          : arg === '/'
            ? arg
            : arg.replace(/\/+$/, ''),
      )
    if (!targets.length) {
      this.output = this.t('terminal.rmNoTarget')
      return
    }

    if (!this.hasPermission(this.currentNode, ['w', 'x'])) {
      this.output = this.t('terminal.rmPermissionDenied', {
        name: this.currentNode.data.name,
      })
      return
    }

    const recursive = options.some(opt => opt.includes('r'))
    const force = options.some(opt => opt.includes('f'))
    const interactive = !force && options.some(opt => opt.includes('i'))
    const children =
      this.currentNode.children || this.currentNode._children || []

    const escapeRegex = str => str.replace(/([.+?^${}()|[\]\\])/g, '\\$1')
    const globToRegex = pattern => {
      const escaped = escapeRegex(pattern)
      return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`)
    }

    function remove(tree, child) {
      if (
        tree?.name == child.parent.data.name &&
        tree?.date == child.parent?.data.date
      ) {
        const index = tree.children?.findIndex(
          _child => _child.name === child.data.name,
        )
        if (index > -1) {
          tree.children.splice(index, 1)
        }
        return
      } else {
        if (tree?.children) {
          for (let index = 0; index < tree?.children.length; index++) {
            const element = tree.children[index]

            remove(element, child)
          }
        }
      }
    }

    const blockedDirs = new Set()
    const deniedItems = new Set()
    const skippedInteractive = new Set()
    const toDelete = []
    let removedDirectoryRecursive = false
    targets.forEach(pattern => {
      const regex = globToRegex(pattern === '' ? '*' : pattern)
      children.forEach(child => {
        if (!regex.test(child.data.name)) return

        if (child.data.type === 'd' && !recursive) {
          blockedDirs.add(child.data.name)
          return
        }

        if (
          child.data.type === 'd' &&
          recursive &&
          !this.hasPermission(child, 'x')
        ) {
          deniedItems.add(child.data.name)
          return
        }

        if (child.data.type === 'd' && recursive) {
          removedDirectoryRecursive = true
        }

        if (!toDelete.includes(child)) {
          toDelete.push(child)
        }
      })
    })

    if (!toDelete.length) {
      if (blockedDirs.size && !force) {
        this.output = this.t('terminal.rmUseRecursive', {
          items: Array.from(blockedDirs).join(', '),
        })
      } else if (deniedItems.size && !force) {
        this.output = this.t('terminal.rmPermissionItems', {
          items: Array.from(deniedItems).join(', '),
        })
      } else if (!force) {
        this.output = this.t('terminal.rmNoMatch', {
          items: targets.join(', '),
        })
      } else {
        this.output = ''
      }
      return
    }

    const deletedList = []
    toDelete.forEach(child => {
      if (interactive && typeof window !== 'undefined') {
        const confirmDelete = window.confirm(
          this.t('terminal.confirmDelete', { name: child.data.name }),
        )
        if (!confirmDelete) {
          skippedInteractive.add(child.data.name)
          return
        }
      }
      remove(this.folderTreeData, child)
      const idx = children.findIndex(c => c === child)
      if (idx > -1) {
        children.splice(idx, 1)
      }
      deletedList.push(child.data.name)
    })

    this.refreshTreeView(this.currentNode)
    const deletedNames = deletedList.join(', ')
    let extraInfo = ''
    if (blockedDirs.size) {
      extraInfo += ` | ${this.t('terminal.foldersIgnored', { items: Array.from(blockedDirs).join(', ') })}`
    }
    if (deniedItems.size) {
      extraInfo += ` | ${this.t('terminal.accessDenied', { items: Array.from(deniedItems).join(', ') })}`
    }
    if (skippedInteractive.size) {
      extraInfo += ` | ${this.t('terminal.ignoredInteractive', { items: Array.from(skippedInteractive).join(', ') })}`
    }
    const base = deletedNames
      ? this.t('terminal.itemsDeleted', { items: deletedNames })
      : this.t('terminal.noItemDeleted')
    this.output = `${base}${extraInfo}`
    if (removedDirectoryRecursive) {
      this.stats.removedDirectory = true
      this.checkBadges()
    }
  },

  getFormattedDate() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${String(now.getFullYear()).slice(2).padStart(2, '0')}-${month}-${day} ${hours}:${minutes}`
  },

  ensureChildren(node) {
    if (node.children) {
      return node.children
    }
    if (node._children) {
      node.children = node._children
      return node.children
    }
    node.children = []
    return node.children
  },

  getChildNode(node, name) {
    const children = node.children || node._children || []
    return children.find(child => child.data.name === name)
  },

  getDirectoryChild(node, name) {
    const child = this.getChildNode(node, name)
    if (child && child.data.type === 'd') {
      return child
    }
    return null
  },

  createDirectoryNode(parent, name) {
    const formattedDate = this.getFormattedDate()
    const dirData = {
      name,
      type: 'd',
      rights: 'drwxr-xr-x',
      user: this.currentUser,
      group: this.currentGroups[0] || this.currentUser,
      hidden: name[0] === '.',
      date: formattedDate,
      children: [],
    }
    if (!parent.data.children) {
      parent.data.children = []
    }
    parent.data.children.push(dirData)

    const newNode = {
      data: dirData,
      parent,
      depth: (parent.depth || 0) + 1,
      children: [],
      _children: [],
    }
    const collection = this.ensureChildren(parent)
    collection.push(newNode)

    return newNode
  },

  createFileNode(parent, name) {
    const formattedDate = this.getFormattedDate()
    const fileData = {
      name,
      type: 'f',
      rights: '-rwxr-xr-x',
      user: this.currentUser,
      group: this.currentGroups[0] || this.currentUser,
      hidden: name[0] === '.',
      date: formattedDate,
      children: null,
      content: '',
    }
    if (!parent.data.children) {
      parent.data.children = []
    }
    parent.data.children.push(fileData)

    const newNode = {
      data: fileData,
      parent,
      depth: (parent.depth || 0) + 1,
      children: null,
      _children: null,
    }
    const collection = this.ensureChildren(parent)
    collection.push(newNode)

    return newNode
  },
}
