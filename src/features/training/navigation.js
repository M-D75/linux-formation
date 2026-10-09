import { resolveDirectoryNavigation } from '../../services/directoryNavigation.js'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const navigationMethods = {
  pathWayDirectory() {
    //pwd
    this.output = this.getPath(this.currentNode).replace('root', '')

    if (this.output == '') this.output = '/'

    this.pwd = this.output
    this.refreshTreeView(this.currentNode, { signal: false })
  },

  changeDirectory(params, options = {}) {
    const silent = !!options.silent
    const previousNode = this.currentNode
    const rawPath = Array.isArray(params) ? params[0] : params
    const homeDefault = !rawPath
    const path = homeDefault ? '/home/user' : rawPath
    const result = resolveDirectoryNavigation(
      this.root,
      previousNode,
      path,
      node => this.hasPermission(node, 'x'),
    )
    if (result.error) {
      this.output = this.t(`terminal.${result.error}`, { name: result.name })
      return 'warning'
    }

    // Nothing above this point changes position, metadata, or expanded branches.
    const collapse = node => {
      for (const child of node.children || node._children || []) collapse(child)
      if (node.children) {
        if (!node._children) node._children = node.children
        node.children = null
      }
    }
    collapse(path.startsWith('/') ? this.root : previousNode)
    const destination = result.destination
    const displayRoute = silent
      ? result.route
      : [...result.route, ...this.buildTreePathNodes(previousNode, destination)]
    for (const node of displayRoute) {
      for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
        if (!ancestor.children && ancestor._children)
          ancestor.children = ancestor._children
      }
    }
    this.currentNode = destination
    this.cDirect.from = previousNode?.data.name || null
    this.cDirect.to = destination.data.name
    if (!silent) {
      this.pwd = ''
      this.output = this.t(
        homeDefault ? 'terminal.folderHomeDefault' : 'terminal.folderCurrent',
        { name: destination.data.name },
      )
      this.createOutputAnimate()
      this.trackDirectoryVisit(this.getPath(destination))
    } else if (!this.pwd) {
      this.pwd = this.getPath(destination).replace('root', '') || '/'
    }
    const layout = this.refreshTreeView(destination, { signal: !silent })
    const layoutVersion = this.treeLayoutVersion
    if (!silent) {
      Promise.resolve(layout).then(settled => {
        if (
          settled &&
          layoutVersion === this.treeLayoutVersion &&
          this.currentNode === destination
        ) {
          this.animateTreePath(previousNode, destination)
        }
      })
    }
    return 'valid'
  },

  findChildGlobal(root, node) {
    const name = node?.data?.name ? node.data.name : node.name
    const depth = node?.depth || 0

    if (root?.data?.name === name && root.depth == depth) {
      return root
    }

    const children = root?.children || root?._children || []
    for (let child of children) {
      if (child.data.name === name && child.depth == depth) {
        return child
      }

      const found = this.findChildGlobal(child, node)
      if (found) return found
    }

    return null
  },

  findChild(node, name) {
    if (node?.data?.name === name) {
      return node
    }

    const children = node?.children || node?._children || []
    for (let child of children) {
      if (child.data.name === name) {
        return child
      }

      const found = this.findChild(child, name)
      if (found) return found
    }

    return null
  },

  getPath(node) {
    if (node.parent) {
      return `${this.getPath(node.parent)}/${node.data.name}`
    }
    return node.data.name
  },

  getNodeFromPath(path, options = {}) {
    const { stopBeforeLast = false, includeFiles = false } = options
    if (path === undefined || path === null) {
      return null
    }

    const isAbsolute = path.startsWith('/')
    let current = isAbsolute ? this.root : this.currentNode
    const segments = path.split('/')
    let targetName = null

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
      if (stopBeforeLast && isLast) {
        targetName = segment
        break
      }

      const children = current.children || current._children || []
      const found = children.find(child => child.data.name === segment)

      if (!found) {
        return null
      }

      if (
        found.data.type === 'f' &&
        !includeFiles &&
        !(isLast && !stopBeforeLast)
      ) {
        return null
      }

      current = found
    }

    if (stopBeforeLast) {
      return targetName ? { node: current, targetName } : null
    }

    return { node: current }
  },

  getAutocompleteContext(param) {
    if (typeof param !== 'string') {
      return null
    }

    let dirPath = ''
    let partial = param

    if (param.includes('/')) {
      const endsWithSlash = param.endsWith('/')
      if (endsWithSlash) {
        let base = param.replace(/\/+$/, '')
        if (!base && param.startsWith('/')) {
          base = '/'
        }
        dirPath = base
        partial = ''
      } else {
        const lastSlash = param.lastIndexOf('/')
        let base = param.slice(0, lastSlash)
        if (lastSlash === 0) {
          base = '/'
        }
        dirPath = base
        partial = param.slice(lastSlash + 1)
      }
    }

    if (dirPath && dirPath !== '/') {
      dirPath = dirPath.replace(/\/+$/, '')
    }

    let basePrefix = ''
    if (!dirPath) {
      basePrefix = ''
    } else if (dirPath === '/') {
      basePrefix = '/'
    } else {
      basePrefix = `${dirPath.replace(/\/+$/, '')}/`
    }

    return { dirPath, partial, basePrefix }
  },

  normalizeTutorialPath(input) {
    if (!input || typeof input !== 'string') {
      return ''
    }
    let value = input.trim()
    if (value === '' || value === '.') {
      return this.getPath(this.currentNode) || 'root'
    }
    const trimmed = value.replace(/\/+$/, '')
    if (trimmed === '') {
      return 'root'
    }
    const isAbsolute = trimmed.startsWith('/')
    const base = isAbsolute
      ? ['root']
      : (this.getPath(this.currentNode) || 'root')
          .split('/')
          .filter(seg => seg.length > 0)
    if (base[0] !== 'root') {
      base.unshift('root')
    }
    const segments = trimmed.split('/').filter(seg => seg.length > 0)
    const stack = [...base]

    segments.forEach(segment => {
      if (segment === '.' || segment === '') {
        return
      }
      if (segment === '..') {
        if (stack.length > 1) {
          stack.pop()
        }
        return
      }
      stack.push(segment)
    })

    return stack.join('/')
  },

  preserveCurrentPath() {
    const nodePath = this.currentNode ? this.getPath(this.currentNode) : ''
    let normalized = nodePath ? nodePath.replace('root', '') : '/'
    if (!normalized || normalized === '') {
      normalized = '/'
    }
    this.pwd = normalized
  },
}
