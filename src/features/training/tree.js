import * as d3 from 'd3'
import { treeBranchPath } from '../../services/treePaths.js'
import { treeRoutePath } from '../../services/treePaths.js'
import { traceVisibleTreePath } from '../../services/treePaths.js'
import { commandPathCandidates } from '../../services/treePaths.js'
import { NAVIGATION_START_PATH } from './workspaceData.js'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const treeMethods = {
  refreshTreeView(source = null, options = {}) {
    if (typeof this.updateTree !== 'function') {
      return
    }
    const layout = this.updateTree(source || this.currentNode || this.root)
    if (options.signal !== false) {
      this.emitTreeSignal()
    }
    return layout
  },

  emitTreeSignal() {
    if (
      !this.$refs.mainPanel ||
      !this.$refs.commandInputWrapper ||
      !this.$refs.tree
    ) {
      return
    }
    const panelRect = this.$refs.mainPanel.getBoundingClientRect()
    const startRect = this.$refs.commandInputWrapper.getBoundingClientRect()
    const treeTarget = this.$refs.tree.querySelector('svg') || this.$refs.tree
    if (!startRect || !treeTarget) {
      return
    }
    const endRect = treeTarget.getBoundingClientRect()
    const startX = startRect.left + startRect.width / 1.2 - panelRect.left
    const startY = startRect.top - panelRect.top
    const endX = endRect.left + endRect.width / 2 - panelRect.left
    const endY = endRect.top + 80 - panelRect.top

    // const offsets = [-5, 0, 20, 10, 60, 40, 30];
    //randomeize offsets value between -5 and 90
    const offsets = Array.from(
      { length: 7 },
      () => Math.floor(Math.random() * 95) - 5,
    )

    // offsets.sort(() => Math.random() - 0.5);
    offsets.forEach((offset, index) => {
      const id = ++this.signalCounter
      const style = {
        left: `${startX}px`,
        top: `${startY + offset}px`,
        '--signal-end-x': `${endX - startX}px`,
        '--signal-end-y': `${endY - startY - offset * 0.2}px`,
        animationDelay: `${index * 80}ms`,
      }
      this.signals.push({ id, style })
      const timer = setTimeout(
        () => {
          this.signals = this.signals.filter(sig => sig.id !== id)
        },
        850 + index * 40,
      )
      this.signalTimers.push(timer)
    })
  },

  createOutputAnimate() {
    const width = 500
    const height = 110

    const decalageX = 10
    const _vue = this

    d3.select(this.$refs.output_animate)
      .selectAll('svg')
      .each(function () {
        d3.select(this).selectAll('*').interrupt()
      })
      .remove()
    if (!_vue.cDirect.from) return

    const svg = d3
      .select(this.$refs.output_animate)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-100, -100, width + 100, height + 100])
      .style('overflow', 'visible')

    let g = svg
      .append('g')
      .attr('transform', () => `translate(${width / 2},${0})`)

    g.append('text')
      .text(this.t('navigation.chmodHeader'))
      .attr('dy', '.35em')
      .attr('dx', '1.7em')
      // .attr('x', width/2)
      .attr('text-anchor', 'middle') // Centre horizontalement
      .attr('dominant-baseline', 'middle') // Centre verticalement
      // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
      .attr('font-size', '17px')
      .style('user-select', 'none')

    g = svg
      .append('g')
      .attr('transform', () => `translate(${decalageX},${height / 2})`)

    g.append('text')
      .text(_vue.cDirect.from)
      .attr('dy', '.15em')
      .attr('dx', '1em')
      // .attr('x', width/2)
      .attr('text-anchor', 'middle') // Centre horizontalement
      .attr('dominant-baseline', 'middle') // Centre verticalement
      // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
      .attr('font-size', '17px')
      .style('user-select', 'none')

    g.append('foreignObject')
      .attr('width', 50)
      .attr('height', 50)
      .attr('x', 0)
      .attr('y', 0)
      .html(
        '<i class="mdi mdi-folder-open-outline mdi-icon-folder" style="font-size: 40px"></i>',
      )

    const numArrows = 5
    const duration = 2000

    // Création des flèches dans des `foreignObject`
    const arrows = Array.from({ length: numArrows }, () => {
      return svg
        .append('foreignObject')
        .attr('x', 60)
        .attr('y', height / 2 - decalageX)
        .attr('width', 50)
        .attr('height', 50)
        .attr('opacity', 1)
        .html(
          '<i class="mdi mdi-chevron-right mdi-icon-folder" style="font-size: 50px"></i>',
        )
    })

    // Fonction pour animer une flèche
    function animateArrow(arrow, index) {
      if (!arrow.node()?.isConnected) return
      arrow
        .attr('x', 60)
        .attr('opacity', 1)
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('x', width - decalageX - 50)
        .attr('opacity', 0)
        .on('end', () => {
          animateArrow(arrow, index)
        })
    }

    // Lancer l'animation pour chaque flèche
    arrows.forEach((arrow, index) =>
      setTimeout(() => animateArrow(arrow, index), index * 300),
    )

    g = svg
      .append('g')
      .attr('transform', () => `translate(${width - decalageX}, ${height / 2})`)

    g.append('text')
      .text(_vue.cDirect.to)
      .attr('dy', '.15em')
      .attr('dx', '1em')
      // .attr('x', width/2)
      .attr('text-anchor', 'middle') // Centre horizontalement
      .attr('dominant-baseline', 'middle') // Centre verticalement
      // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
      .attr('font-size', '17px')
      .style('user-select', 'none')

    g.append('foreignObject')
      .attr('width', 50)
      .attr('height', 50)
      .attr('x', 0)
      .attr('y', 0)
      .html(
        '<i class="mdi mdi-folder-outline mdi-icon-folder" style="font-size: 40px"></i>',
      )
  },

  createTree() {
    const width = 1500
    const height = 800

    let i = 0
    let children_initiated = false

    clearTimeout(this.pathPreviewTimer)
    ++this.treeLayoutVersion
    this.clearTreePathOverlays()
    d3.select(this.$refs.tree)
      .selectAll('svg')
      .each(function () {
        d3.select(this).selectAll('*').interrupt().interrupt('tree-layout')
      })
      .remove()

    const svg = d3
      .select(this.$refs.tree)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-100, -100, width + 100, height + 100])
      .style('overflow', 'visible')
    this.treeSvg = svg

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)

    let root = d3.hierarchy(this.folderTreeData)
    this.root = root
    root.x0 = height / 2
    root.y0 = 0

    if (!this.currentNode) {
      this.currentNode = root
      setTimeout(
        function () {
          this.changeDirectory(this.missionStartPath || NAVIGATION_START_PATH, {
            silent: true,
          })
          this.cDirect.from = null
          this.createOutputAnimate()
        }.bind(this),
        750,
      )
    } else {
      this.currentNode = root
      setTimeout(
        function () {
          this.changeDirectory(this.pwd, { silent: true })
          // this.cDirect.from = null;
          // this.createOutputAnimate()
        }.bind(this),
        50,
      )
    }

    const update = source => {
      const layoutVersion = ++this.treeLayoutVersion
      this.clearTreePathOverlays()

      if (source.id == this.root.id) i = 0

      const treeLayout = d3.tree().size([height, width - 120])
      console.log('this.root:', this.root)

      treeLayout(this.root)
      const nodes = this.root.descendants()
      const node = svg
        .selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i))

      const _vue = this

      // Supprimer les anciens nœuds
      const nodeExit = node
        .exit()
        .transition()
        .duration(500)
        .attr('transform', () => `translate(${source.y},${source.x})`)
        .remove()

      nodeExit.select('circle').attr('r', 0.6)
      nodeExit.select('rect').attr('r', 0.6)
      nodeExit.select('text').style('fill-opacity', 0.6)

      // Ajouter de nouveaux nœuds
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', d =>
          d.id == this.currentNode?.id &&
          d?.data?.name == _vue.currentNode?.data?.name &&
          d?.depth == _vue.currentNode?.depth
            ? 'node current'
            : 'node',
        )
        .attr('transform', () => `translate(${width + 1000},${height / 2})`)
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', 1)
          tooltip
            .html(d.data.name != 'root' ? d.data.name : '/')
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
        })
        .on('mousemove', event => {
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
        })
        .on('mouseout', () => {
          tooltip.transition().duration(200).style('opacity', 0)
        })
        .on('click', (event, d) => {
          if (d.children) {
            // d._children = d.children;
            d.children = null
          } else {
            d.children = d._children
            // d._children = null;
          }
          update(d)
        })

      d3.selectAll('circle.indicator-current')
        .transition()
        .duration(500)
        .attr('transform', 'scale(0)')
        .remove()

      nodeEnter.each(function (d) {
        // Vérifier la valeur de 'type' pour chaque nœud
        if (d.data.type == 'd') {
          // directory
          d3.select(this)
            .append('circle')
            .attr('r', 20)
            .attr('fill', d => (d._children ? 'lightsteelblue' : '#fff'))
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
        } else {
          // files
          d3.select(this)
            .append('rect')
            .attr('width', 20)
            .attr('height', 20)
            .attr('x', -10) // Pour centrer le carré
            .attr('y', -10) // Pour centrer le carré
            .style('fill', 'white')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 3)
            .style('fill-opacity', 0.3)
        }
      })

      nodeEnter
        .append('text')
        .attr('dy', '.35em')
        .attr('x', d => (d.children || d._children ? -25 : 25))
        .attr('text-anchor', d => (d.children || d._children ? 'end' : 'start'))
        .text(d => d.data.name)
        .attr('font-size', '17px')
        .style('user-select', 'none')

      // mdi mdi-file-chart-outline
      nodeEnter
        .append('foreignObject')
        .attr('x', -20)
        .attr('y', -80)
        .attr('width', 200)
        .attr('height', 200)
        .html(d =>
          d.data.type == 'd'
            ? d._children
              ? '<i class="mdi mdi-folder  mdi-icon-folder" style="font-size: 40px"></i>'
              : '<i class="mdi mdi-folder-open mdi-icon-folder" style="font-size: 40px"></i>'
            : '<i class="mdi mdi-file-chart-outline mdi-icon-folder" style="font-size: 40px"></i>',
        )

      // Mise à jour des nœuds existants
      const nodeUpdate = nodeEnter.merge(node)

      // Transition des nœuds vers leur nouvelle position
      const nodeMovement = nodeUpdate
        .transition('tree-layout')
        .duration(750)
        .attr('transform', d => `translate(${d.y},${d.x})`)

      // Mettre à jour les classes des nœuds pour refléter l'état du dossier courant
      nodeUpdate.attr('class', d =>
        d.id == _vue.currentNode?.id ? 'node current' : 'node',
      )

      nodeUpdate
        .select('foreignObject')
        .attr('class', d => (d.id == _vue.currentNode?.id ? 'fadein' : ''))
        .html(d =>
          d.data.type == 'd'
            ? d?._children
              ? '<i class="mdi mdi-folder  mdi-icon-folder" style="font-size: 40px"></i>'
              : d.data?.children?.length != 0
                ? '<i class="mdi mdi-folder-open mdi-icon-folder" style="font-size: 40px"></i>'
                : '<i class="mdi mdi-folder-hidden mdi-icon-folder" style="font-size: 40px"></i>'
            : '<i class="mdi mdi-file-chart-outline mdi-icon-folder" style="font-size: 40px"></i>',
        )

      nodeUpdate.each(function (d) {
        if (
          _vue.currentNode?.id == d.id &&
          d?.data?.name == _vue.currentNode?.data?.name &&
          d?.depth == _vue.currentNode?.depth
        ) {
          d3.select(this)
            .append('circle')
            .attr('class', 'indicator-current')
            .attr('r', 10)
            .attr('fill', 'black')

          d3.select(this)
            .append('circle')
            .attr('class', 'indicator-current')
            .attr('r', 5)
            .attr('fill', 'orange')
        }
      })

      // Mettre à jour les cercles pour refléter l'état du dossier courant
      nodeUpdate
        .select('circle')
        .transition()
        .duration(750)
        .attr('fill', d => {
          if (
            d.id == this.currentNode?.id &&
            d?.data?.name == _vue.currentNode?.data?.name &&
            d?.depth == _vue.currentNode?.depth
          ) {
            return 'orange'
          }
          return d._children ? '#00A5DB' : '#fff'
        })
        .attr('stroke-width', d =>
          d.id == _vue.currentNode?.id &&
          d?.data?.name == _vue.currentNode?.data?.name &&
          d?.depth == _vue.currentNode?.depth
            ? 6
            : 4,
        )
        .attr('stroke', d =>
          d.id == _vue.currentNode?.id ? 'black' : '#232B33',
        )

      // Liens entre les nœuds
      const links = this.root.links()

      const link = svg.selectAll('path.link').data(links, d => d.target.id)

      // Supprimer les anciens liens
      link
        .exit()
        // .interrupt()
        .transition()
        .duration(750)
        .attr('d', () => {
          const o = { x: source.x0, y: source.y0 }
          return diagonal(o, o)
        })
        .remove()

      // Ajouter de nouveaux liens
      const linkEnter = link
        .enter()
        .insert('path', 'g')
        .attr('class', 'link')
        .attr('opacity', 1)
        .attr('d', () => {
          const o = { x: source.x0, y: source.y0 }
          return diagonal(o, o)
        })
        .attr('fill', 'none')
        .attr('stroke', d =>
          _vue.isPathToCurrentNode(d.target)
            ? !_vue.pwd || _vue.pwd == ''
              ? '#986547'
              : '#5FADAD'
            : '#ccc',
        )
        .attr('stroke-width', d => (_vue.isPathToCurrentNode(d.target) ? 5 : 2))
        .attr('stroke-dasharray', d =>
          _vue.isPathToCurrentNode(d.target) ? '6 9' : '0',
        )

      // Mettre à jour les liens existants
      const linkMovement = linkEnter
        .merge(link)
        .transition('tree-layout')
        .duration(750)
        .attr('d', d => diagonal(d.source, d.target))
        .attr('stroke', d =>
          _vue.isPathToCurrentNode(d.target)
            ? !_vue.pwd || _vue.pwd == ''
              ? '#986547'
              : '#5FADAD'
            : '#ccc',
        )
        .attr('stroke-width', d => (_vue.isPathToCurrentNode(d.target) ? 5 : 2))
        .attr('stroke-dasharray', d =>
          _vue.isPathToCurrentNode(d.target) ? '6 9' : '0',
        )
        .attr('class', d =>
          _vue.isPathToCurrentNode(d.target) ? 'link current-path' : 'link',
        )
      // .on('end', function repeat(d) {
      //     if (_vue.isPathToCurrentNode(d.target)) {
      //         d3.select(this)
      //             .transition()
      //             .duration(500)
      //             .attr('opacity', 0.3)
      //             .transition()
      //             .duration(500)
      //             .attr('opacity', 1)
      //             .on('end', repeat);
      //     }
      // });

      nodes.forEach(d => {
        d.x0 = d.x
        d.y0 = d.y
      })
      return Promise.allSettled([nodeMovement.end(), linkMovement.end()]).then(
        results => {
          if (
            layoutVersion !== this.treeLayoutVersion ||
            results.some(result => result.status === 'rejected')
          )
            return false
          this.schedulePathPreview()
          return true
        },
      )
    }

    const diagonal = treeBranchPath

    if (!children_initiated) {
      this.root.descendants().forEach(d => {
        d._children = d.children
        if (d.depth > 0) {
          d.children = null
        }
      })

      children_initiated = true
    }

    update(this.root)
    this.updateTree = update // Stocker la fonction `update` pour les mises à jour futures
  },

  resolvePath(path) {
    // Si le chemin commence par '/', c'est un chemin absolu : on part de la racine.
    // Sinon, c'est un chemin relatif : on part du dossier courant.
    let current = path[0] === '/' ? this.root : this.currentNode
    // Découper le chemin en segments en supprimant les éventuels segments vides.
    const segments = path.split('/').filter(seg => seg.length > 0)

    for (let seg of segments) {
      if (seg === '.') {
        continue
      } else if (seg === '..') {
        if (current.parent) {
          current = current.parent
        } else {
          // On ne peut pas monter au-dessus de la racine.
          return null
        }
      } else {
        // Rechercher parmi les enfants visibles et/ou cachés (selon votre logique)
        let found = null
        const children = current.children || current._children || []
        found = children.find(
          child => child.data.name === seg && child.data.type === 'd',
        )
        if (!found) {
          // Si le dossier n'est pas trouvé, le chemin est invalide
          return null
        }
        current = found
      }
    }
    return current
  },

  isPathToCurrentNode(node) {
    let currentNode = this.currentNode
    while (currentNode) {
      if (currentNode.id === node.id && currentNode.depth == node.depth) {
        // Si le nœud actuel est le nœud cible en fonction de l'id et du depth
        return true
      }
      currentNode = currentNode.parent
    }
    return false
  },

  findNodeInTree(node, nodeName, depth) {
    if (
      node?.data?.name == nodeName &&
      (node.depth == depth || depth == undefined)
    ) {
      return node
    }

    if (node.children) {
      for (let child of node.children) {
        const found = this.findNodeInTree(child, nodeName, depth)

        if (found) {
          return found
        }
      }
    } else if (node._children) {
      for (let child of node._children) {
        const found = this.findNodeInTree(child, nodeName, depth)

        if (found) {
          return found
        }
      }
    }

    return null
  },

  updateNode(node_parent, nodeName, depth, node_update) {
    if (
      node_parent?.data?.name == nodeName &&
      (node_parent.depth == depth || depth == undefined)
    ) {
      return
    }

    if (node_parent.children) {
      for (let child of node_parent.children) {
        if (child.name == nodeName) {
          Object.assign(child, node_update)
          return
        }
        this.updateNode(child, nodeName, depth, node_update)
      }
    } else if (node_parent._children) {
      for (let child of node_parent._children) {
        if (child.name == nodeName) {
          Object.assign(child, node_update)
          return
        }
        this.updateNode(child, nodeName, depth, node_update)
      }
    }

    return null
  },

  buildTreePathNodes(startNode, endNode) {
    if (!startNode || !endNode) {
      return []
    }
    if (startNode === endNode) {
      return [startNode]
    }
    const startAncestors = []
    let cursor = startNode
    while (cursor) {
      startAncestors.push(cursor)
      cursor = cursor.parent
    }
    const endAncestorSet = new Set()
    cursor = endNode
    while (cursor) {
      endAncestorSet.add(cursor)
      cursor = cursor.parent
    }
    let lca = null
    for (const candidate of startAncestors) {
      if (endAncestorSet.has(candidate)) {
        lca = candidate
        break
      }
    }
    if (!lca) {
      return []
    }
    const path = []
    cursor = startNode
    while (cursor && cursor !== lca) {
      path.push(cursor)
      cursor = cursor.parent
    }
    path.push(lca)
    const downward = []
    cursor = endNode
    while (cursor && cursor !== lca) {
      downward.push(cursor)
      cursor = cursor.parent
    }
    while (downward.length) {
      const node = downward.pop()
      if (node !== lca) {
        path.push(node)
      }
    }
    return path
  },

  clearTreePathOverlays(className = null) {
    if (!this.treeSvg) return
    const overlays = this.treeSvg.selectAll(
      className ? `.${className}` : '.cd-path-overlay, .typing-path-overlay',
    )
    overlays.interrupt().selectAll('*').interrupt()
    overlays.remove()
  },

  schedulePathPreview() {
    clearTimeout(this.pathPreviewTimer)
    this.clearTreePathOverlays('typing-path-overlay')
    this.pathPreviewTimer = setTimeout(() => this.previewCommandPaths(), 140)
  },

  previewCommandPaths() {
    this.clearTreePathOverlays('typing-path-overlay')
    if (
      !this.treeSvg ||
      !this.root ||
      this.isPermissionsMission ||
      !this.command.trim()
    )
      return
    // Wait for the actual SVG branches to reach their new positions.
    if (
      this.treeSvg
        .selectAll('g.node')
        .nodes()
        .some(node => d3.active(node, 'tree-layout'))
    )
      return
    const { mainPart, redirectionPart } = this.extractRedirection(
      this.command.trim(),
    )
    const candidates = commandPathCandidates(this.tokenizeArguments(mainPart))
    const redirect = this.tokenizeArguments(
      redirectionPart.replace(/^>>?\s*/, ''),
    )[0]
    if (redirect) candidates.push(redirect)
    const traces = [...new Set(candidates)]
      .map(path => traceVisibleTreePath(this.root, this.currentNode, path))
      .filter(Boolean)
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    for (const { nodes, target } of traces) {
      const overlay = this.treeSvg
        .append('g')
        .attr('class', 'typing-path-overlay')
        .attr('pointer-events', 'none')
        .attr('role', 'img')
        .attr(
          'aria-label',
          `${this.t('navigation.treeLegendPreview')} : ${this.getPath(target).replace('root', '') || '/'}`,
        )
      if (nodes.length > 1) {
        const path = overlay
          .append('path')
          .attr('d', treeRoutePath(nodes))
          .attr('fill', 'none')
          .attr('stroke', '#7c3aed')
          .attr('stroke-width', 5)
          .attr('stroke-linecap', 'round')
        const length = path.node().getTotalLength()
        if (!reducedMotion)
          path
            .attr('stroke-dasharray', `${length} ${length}`)
            .attr('stroke-dashoffset', length)
            .transition()
            .duration(450)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
      }
      const halo = overlay
        .append('circle')
        .attr('cx', target.y)
        .attr('cy', target.x)
        .attr('r', 31)
        .attr('fill', '#7c3aed')
        .attr('fill-opacity', 0.12)
        .attr('stroke', '#7c3aed')
        .attr('stroke-width', 4)
      if (!reducedMotion)
        halo.attr('r', 23).transition().duration(450).attr('r', 31)
    }
  },

  animateTreePath(fromNode, toNode) {
    if (!this.treeSvg || !fromNode || !toNode || this.isPermissionsMission)
      return
    const visible = new Set(this.root.descendants())
    const nodes = this.buildTreePathNodes(fromNode, toNode)
    if (!nodes.length || nodes.some(node => !visible.has(node))) return
    this.clearTreePathOverlays('cd-path-overlay')
    const overlay = this.treeSvg
      .append('g')
      .attr('class', 'cd-path-overlay')
      .attr('pointer-events', 'none')
      .attr('aria-hidden', 'true')
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const pulse = () => {
      overlay
        .append('circle')
        .attr('cx', toNode.y)
        .attr('cy', toNode.x)
        .attr('r', 24)
        .attr('fill', 'none')
        .attr('stroke', '#087c80')
        .attr('stroke-width', 5)
        .transition()
        .duration(reducedMotion ? 0 : 450)
        .attr('r', 38)
        .attr('opacity', 0)
        .remove()
      overlay
        .transition()
        .delay(reducedMotion ? 600 : 500)
        .remove()
    }
    if (nodes.length === 1 || reducedMotion) {
      pulse()
      return
    }
    const path = overlay
      .append('path')
      .attr('d', treeRoutePath(nodes))
      .attr('fill', 'none')
      .attr('stroke', '#087c80')
      .attr('stroke-width', 6)
      .attr('stroke-linecap', 'round')
    const pathEl = path.node()
    const length = pathEl.getTotalLength()
    if (!length) {
      pulse()
      return
    }
    const duration = Math.min(2200, Math.max(650, (nodes.length - 1) * 450))
    path
      .attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
    const marker = overlay
      .append('circle')
      .attr('r', 10)
      .attr('fill', '#fff')
      .attr('stroke', '#087c80')
      .attr('stroke-width', 5)
      .attr('transform', `translate(${fromNode.y},${fromNode.x})`)
    marker
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attrTween('transform', () => t => {
        const point = pathEl.getPointAtLength(t * length)
        return `translate(${point.x},${point.y})`
      })
      .on('end', () => {
        marker.remove()
        pulse()
      })
  },
}
