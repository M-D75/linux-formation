// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const permissionsMethods = {
  buildRightsInfos() {
    //
    const usersR = this.chmodInfos.rights.split('').slice(1, 4)

    // mdi-pen-plus
    // mdi-book-open-outline
    // mdi-robot-excited

    // mdi-pen-remove
    // mdi-notebook-remove
    // mdi-robot-off

    this.chmodInfos.data.user = [
      {
        title: this.t('terminal.chmodUserCan'),
        value: 0,
        props: {
          prependIcon: 'mdi-account',
        },
      },
    ]

    let list = {
      0: {
        // not r
        title: '[-]',
        props: {
          appendIcon: 'mdi-notebook-remove',
          color: 'red',
        },
      },
      1: {
        // not w
        title: '[-]',
        props: {
          appendIcon: 'mdi-pen-remove',
          color: 'red',
        },
      },
      2: {
        // not x
        title: '[-]',
        props: {
          appendIcon: 'mdi-robot-off',
          color: 'red',
        },
      },
      r: {
        title: this.t('terminal.chmodReadUser'),
        value: 1,
        props: {
          appendIcon: 'mdi-book-open-outline',
          color: 'blue',
        },
      },
      w: {
        title: this.t('terminal.chmodWriteUser'),
        value: 2,
        props: {
          appendIcon: 'mdi-pen-plus',
          color: 'blue',
        },
      },
      x: {
        title: this.t('terminal.chmodExecuteUser'),
        value: 3,
        props: {
          appendIcon: 'mdi-robot-excited',
          color: 'blue',
        },
      },
    }

    for (let index = 0; index < usersR.length; index++) {
      const element = usersR[index]

      if (element != '-') this.chmodInfos.data.user.push(list[element])
      else this.chmodInfos.data.user.push(list[index.toString()])
    }

    let binSVal = usersR
      .map(v => (v != '-' ? '1' : '0'))
      .reverse()
      .join('')
    this.chmodInfos.data.user.push({
      title: `${usersR.join('')} = ${binSVal
        .split('')
        .map((v, i) => 2 ** i * parseInt(v))
        .reverse()
        .join(
          ' + ',
        )} = ${parseInt(binSVal.split('').reverse().join('').toString(), 2).toString()}`,
    })

    //
    list = {
      0: {
        // not r
        title: '[-]',
        props: {
          appendIcon: 'mdi-notebook-remove',
          color: 'red',
        },
      },
      1: {
        // not w
        title: '[-]',
        props: {
          appendIcon: 'mdi-pen-remove',
          color: 'red',
        },
      },
      2: {
        // not x
        title: '[-]',
        props: {
          appendIcon: 'mdi-robot-off',
          color: 'red',
        },
      },
      r: {
        title: this.t('terminal.chmodReadGroup'),
        value: 1,
        props: {
          appendIcon: 'mdi-book-open-outline',
          color: 'blue',
        },
      },
      w: {
        title: this.t('terminal.chmodWriteGroup'),
        value: 2,
        props: {
          appendIcon: 'mdi-pen-plus',
          color: 'blue',
        },
      },
      x: {
        title: this.t('terminal.chmodExecuteGroup'),
        value: 3,
        props: {
          appendIcon: 'mdi-robot-excited',
          color: 'blue',
        },
      },
    }

    // group
    const groupR = this.chmodInfos.rights.split('').slice(4, 7)

    this.chmodInfos.data.group = [
      {
        title: this.t('terminal.chmodGroupCan'),
        value: 0,
        props: {
          prependIcon: 'mdi-account-group',
        },
      },
    ]

    for (let index = 0; index < groupR.length; index++) {
      const element = groupR[index]
      if (element != '-') this.chmodInfos.data.group.push(list[element])
      else this.chmodInfos.data.group.push(list[index.toString()])
    }

    binSVal = groupR
      .map(v => (v != '-' ? '1' : '0'))
      .reverse()
      .join('')
    this.chmodInfos.data.group.push({
      title: `${groupR.join('')} = ${binSVal
        .split('')
        .map((v, i) => 2 ** i * parseInt(v))
        .reverse()
        .join(
          ' + ',
        )} = ${parseInt(binSVal.split('').reverse().join('').toString(), 2).toString()}`,
    })

    // others
    const otherR = this.chmodInfos.rights.split('').slice(7, 10)
    this.chmodInfos.data.other = [
      {
        title: this.t('terminal.chmodOtherCan'),
        value: 0,
        props: {
          prependIcon: 'mdi-earth',
        },
      },
    ]

    for (let index = 0; index < otherR.length; index++) {
      const element = otherR[index]

      if (element != '-') this.chmodInfos.data.other.push(list[element])
      else this.chmodInfos.data.other.push(list[index.toString()])
    }

    binSVal = otherR
      .map(v => (v != '-' ? '1' : '0'))
      .reverse()
      .join('')
    this.chmodInfos.data.other.push({
      title: `${otherR.join('')} = ${binSVal
        .split('')
        .map((v, i) => 2 ** i * parseInt(v))
        .reverse()
        .join(
          ' + ',
        )} = ${parseInt(binSVal.split('').reverse().join('').toString(), 2).toString()}`,
    })
  },

  handleChmod(params) {
    const args = Array.isArray(params) ? params : [params]
    if (!args.length) {
      this.output = this.t('terminal.chmodUsage')
      return 'error'
    }

    this.chmodInfos.fileName = ''
    this.chmodInfos.rights = '----------'
    this.chmodInfos.data.user = []
    this.chmodInfos.data.group = []
    this.chmodInfos.data.other = []

    const options = args.filter(arg => arg.startsWith('-'))
    const rest = args.filter(arg => !arg.startsWith('-'))

    if (rest.length < 2) {
      this.output = this.t('terminal.chmodNeedFile')
      return 'error'
    }

    const recursive = options.some(opt => opt.includes('R'))
    const modeSpec = rest.shift()
    const isNumeric = /^[0-7]{3}$/.test(modeSpec)

    const symbolicSegments = !isNumeric ? modeSpec.split(',') : []
    if (!isNumeric) {
      const validSymbolic = symbolicSegments.every(segment =>
        /^[ugoa]*[+-=][rwx]+$/.test(segment),
      )
      if (!validSymbolic) {
        this.output = this.t('terminal.chmodInvalidSymbolic')
        return 'error'
      }
    }

    const updated = []
    const missing = []
    const denied = []

    rest.forEach(targetPath => {
      const resolved = this.getNodeFromPath(targetPath, { includeFiles: true })
      if (!resolved) {
        missing.push(targetPath)
        return
      }

      const node = resolved.node
      if (!this.isOwner(node)) {
        denied.push(targetPath)
        return
      }

      this.applyChmodToNode(node, { modeSpec, isNumeric, symbolicSegments })
      if (recursive && node.data.type === 'd') {
        this.applyChmodRecursive(
          node,
          { modeSpec, isNumeric, symbolicSegments },
          denied,
        )
      }

      this.chmodInfos.fileName = node.data.name
      this.chmodInfos.rights = node.data.rights
      this.buildRightsInfos()
      updated.push(targetPath)
    })

    if (updated.length) {
      this.preserveCurrentPath()
      this.createTree({ preserveSelection: true })
      this.emitTreeSignal()
    }

    const messages = []
    if (updated.length) {
      messages.push(
        this.t('terminal.chmodUpdated', { items: updated.join(', ') }),
      )
    }
    if (missing.length) {
      messages.push(this.t('terminal.notFound', { items: missing.join(', ') }))
    }
    if (denied.length) {
      messages.push(
        this.t('terminal.accessDenied', { items: denied.join(', ') }),
      )
    }

    this.output = messages.join(' | ') || this.t('terminal.noUpdate')
    if (!updated.length) {
      return 'warning'
    }
    return 'valid'
  },

  applyChmodToNode(node, { modeSpec, isNumeric, symbolicSegments }) {
    if (isNumeric) {
      let permStr = this.convertNumericPermissions(modeSpec)
      node.data.rights = permStr
      node.data.rights =
        node.data.type.replace('f', '-') + node.data.rights.slice(1)
      node.rights = node.data.rights
      return
    }

    let rights = node.data.rights
    symbolicSegments.forEach(segment => {
      rights = this.applySymbolicPermissions(rights, segment)
    })
    node.data.rights = node.data.type.replace('f', '-') + rights.slice(1)
    node.rights = node.data.rights
  },

  applyChmodRecursive(node, format, denied) {
    const stack = [...(node.children || node._children || [])]
    while (stack.length) {
      const current = stack.pop()
      if (!this.isOwner(current)) {
        denied.push(
          this.getPath(current).replace('root', '') || current.data.name,
        )
        continue
      }
      this.applyChmodToNode(current, format)
      if (current.data.type === 'd') {
        const nextChildren = current.children || current._children || []
        stack.push(...nextChildren)
      }
    }
  },

  convertNumericPermissions(numeric) {
    const permissionMap = [
      '---',
      '--x',
      '-w-',
      '-wx',
      'r--',
      'r-x',
      'rw-',
      'rwx',
    ]

    return `d${permissionMap[numeric[0]]}${permissionMap[numeric[1]]}${permissionMap[numeric[2]]}`
  },

  applySymbolicPermissions(currentRights, symbolic) {
    let [owner, group, other] = currentRights.slice(1).match(/.{3}/g) // Obtenir les permissions

    // decomposition de la commande
    const match = symbolic.match(/^([ugoa]+)([+-=])([rwx]+)$/)
    if (!match) {
      return currentRights
    }
    const [, entities, operation, modes] = match

    // appliquer la modification aux entités concernées
    for (const entity of entities) {
      switch (entity) {
        case 'u':
          owner = this.updateRights(owner, operation, modes)
          break
        case 'g':
          group = this.updateRights(group, operation, modes)
          break
        case 'o':
          other = this.updateRights(other, operation, modes)
          break
        case 'a':
          owner = this.updateRights(owner, operation, modes)
          group = this.updateRights(group, operation, modes)
          other = this.updateRights(other, operation, modes)
          break
      }
    }

    return `d${owner}${group}${other}`
  },

  updateRights(current, operation, modes) {
    let updated = current

    for (const mode of modes) {
      let position = 'rwx'.indexOf(mode)
      switch (operation) {
        case '+':
          if (!updated.includes(mode))
            updated =
              updated.slice(0, position) + mode + updated.slice(position + 1)
          break
        case '-':
          updated = updated.replace(mode, '-')
          break
        case '=':
          updated = mode
          break
      }
    }

    // complete les caracteere
    // updated = updated.split('').sort().join('').padEnd(3, '-');

    return updated
  },

  getPermissionBlock(node) {
    const meta = node?.data ?? node
    if (!meta?.rights) {
      return ''
    }
    const rights = meta.rights
    const owner = rights.slice(1, 4)
    const group = rights.slice(4, 7)
    const other = rights.slice(7, 10)

    if (meta.user === this.currentUser) {
      return owner
    }
    if (this.currentGroups?.includes(meta.group)) {
      return group
    }
    return other
  },

  isOwner(node) {
    const meta = node?.data ?? node
    return meta?.user === this.currentUser
  },

  hasPermission(node, permissions) {
    const block = this.getPermissionBlock(node)
    if (!block) {
      return false
    }

    const perms = Array.isArray(permissions)
      ? permissions
      : typeof permissions === 'string' && permissions.length > 0
        ? permissions.split('')
        : []

    if (perms.length === 0) {
      return true
    }

    return perms.every(perm => block.includes(perm))
  },
}
