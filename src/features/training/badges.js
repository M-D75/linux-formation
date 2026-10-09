// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const badgesMethods = {
  hasChildNamed(node, name) {
    if (!node) return false
    const children = node.children || node._children || []
    return children.some(child => (child.data?.name || child.name) === name)
  },

  trackDirectoryVisit(path) {
    const normalized = path ? path.replace('root', '') || '/' : '/'
    if (!this.stats.visitedPaths.includes(normalized)) {
      this.stats.visitedPaths.push(normalized)
      this.checkBadges()
    }
  },

  awardBadge(id) {
    const badge = this.badges.find(b => b.id === id)
    if (!badge || badge.earned) {
      return
    }
    badge.earned = true
    this.badgeSnackbar.message = badge.title
    this.badgeSnackbar.icon = badge.icon
    this.badgeSnackbar.description = badge.description
    this.badgeSnackbar.show = true
    if (this.badgeSnackbar.timeoutId) {
      clearTimeout(this.badgeSnackbar.timeoutId)
    }
    this.badgeSnackbar.timeoutId = setTimeout(() => {
      this.badgeSnackbar.show = false
      this.badgeSnackbar.timeoutId = null
    }, 4500)
  },

  checkBadges() {
    if (this.stats.visitedPaths.length >= 10) {
      this.awardBadge('explorer')
    }
    if (this.stats.createdDirectory && this.stats.createdFile) {
      this.awardBadge('architecte')
    }
    if (this.stats.removedDirectory) {
      this.awardBadge('nettoyeur')
    }
    if (this.stats.manUses >= 3) {
      this.awardBadge('sage')
    }
    if (this.stats.tutorialCompleted) {
      this.awardBadge('mentor')
    }
    if (this.stats.permissionsCompleted) {
      this.awardBadge('gardien')
    }
    this.persistBadges()
  },

  openBadgePanel() {
    this.showBadgePanel = true
    if (this.badgeSnackbar.timeoutId) {
      clearTimeout(this.badgeSnackbar.timeoutId)
      this.badgeSnackbar.timeoutId = null
    }
    this.badgeSnackbar.show = false
  },

  loadBadgeState() {
    const badgeState = this.$store.state.badgeState || {}
    const earnedMap = badgeState.earned || {}
    this.badges = this.badges.map(badge => ({
      ...badge,
      earned: !!earnedMap[badge.id],
    }))
    const storedStats = badgeState.stats || {}
    this.stats = {
      visitedPaths: storedStats.visitedPaths
        ? [...storedStats.visitedPaths]
        : [],
      createdDirectory: !!storedStats.createdDirectory,
      createdFile: !!storedStats.createdFile,
      removedDirectory: !!storedStats.removedDirectory,
      manUses: storedStats.manUses || 0,
      tutorialCompleted: !!storedStats.tutorialCompleted,
      permissionsCompleted: !!storedStats.permissionsCompleted,
    }
  },

  persistBadges() {
    const earnedMap = {}
    this.badges.forEach(badge => {
      if (badge.earned) {
        earnedMap[badge.id] = true
      }
    })
    this.$store.commit('setBadgeState', {
      earned: earnedMap,
      stats: {
        visitedPaths: [...this.stats.visitedPaths],
        createdDirectory: this.stats.createdDirectory,
        createdFile: this.stats.createdFile,
        removedDirectory: this.stats.removedDirectory,
        manUses: this.stats.manUses,
        tutorialCompleted: this.stats.tutorialCompleted,
        permissionsCompleted: this.stats.permissionsCompleted,
      },
    })
  },
}
