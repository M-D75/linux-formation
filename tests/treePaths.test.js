import test from 'node:test'
import { setImmediate } from 'node:timers'
import assert from 'node:assert/strict'
import { hierarchy } from 'd3'
import {
  treeBranchPath,
  treeRoutePath,
  traceVisibleTreePath,
  commandPathCandidates,
} from '../src/services/treePaths.js'

function fixture() {
  const root = hierarchy({
    name: 'root',
    type: 'd',
    children: [
      {
        name: 'home',
        type: 'd',
        children: [
          {
            name: 'user',
            type: 'd',
            children: [
              {
                name: 'documents',
                type: 'd',
                children: [{ name: 'notes.txt', type: 'f' }],
              },
              { name: 'pictures', type: 'd' },
            ],
          },
        ],
      },
    ],
  })
  const [home] = root.children,
    [user] = home.children,
    [documents, pictures] = user.children
  return { root, home, user, documents, pictures, file: documents.children[0] }
}

test('typing resolves relative and absolute paths, files, and repeated parent steps', () => {
  const { root, home, user, documents, pictures, file } = fixture()
  assert.deepEqual(
    traceVisibleTreePath(root, user, 'documents/notes.txt').nodes,
    [user, documents, file],
  )
  assert.deepEqual(traceVisibleTreePath(root, documents, '../pictures').nodes, [
    documents,
    user,
    pictures,
  ])
  assert.deepEqual(traceVisibleTreePath(root, documents, '../../').nodes, [
    documents,
    user,
    home,
  ])
  assert.equal(
    traceVisibleTreePath(root, user, '/home/user/documents/notes.txt').target,
    file,
  )
  assert.equal(traceVisibleTreePath(root, root, '../').target, root)
  assert.equal(traceVisibleTreePath(root, user, 'documents/notes.txt/..'), null)
  assert.equal(traceVisibleTreePath(root, user, 'documents/notes.txt/'), null)
  assert.equal(traceVisibleTreePath(root, user, '/home/users/documents'), null)
})

test('typing never opens a collapsed folder or highlights a hidden target', () => {
  const { root, user, documents } = fixture()
  documents._children = documents.children
  documents.children = null
  assert.equal(traceVisibleTreePath(root, user, 'documents/notes.txt'), null)
  assert.equal(traceVisibleTreePath(root, user, 'documents').target, documents)
  assert.equal(documents.children, null)
})

test('directional routes follow exactly the existing branch curves in both directions', () => {
  const a = { x: 20, y: 0 },
    b = { x: 80, y: 100 },
    c = { x: 5, y: 200 }
  assert.equal(treeRoutePath([a, b]), treeBranchPath(a, b))
  assert.equal(treeRoutePath([b, a]), 'M 100 80 C 50 80, 50 20, 0 20')
  assert.equal(
    treeRoutePath([c, b, a]),
    'M 200 5 C 150 5, 150 80, 100 80 C 50 80, 50 20, 0 20',
  )
})

test('command targets exclude options, permission modes, and text arguments', () => {
  assert.deepEqual(commandPathCandidates(['ls', '-la', 'documents']), [
    'documents',
  ])
  assert.deepEqual(commandPathCandidates(['chmod', 'g+w', 'documents']), [
    'documents',
  ])
  assert.deepEqual(
    commandPathCandidates(['head', '-n', '5', 'documents/notes.txt']),
    ['documents/notes.txt'],
  )
  assert.deepEqual(
    commandPathCandidates(['cp', '-r', 'documents', 'pictures']),
    ['documents', 'pictures'],
  )
  assert.deepEqual(commandPathCandidates(['/home/user/documents']), [
    '/home/user/documents',
  ])
  assert.deepEqual(commandPathCandidates(['echo', 'documents']), [])
})

import { navigationMethods } from '../src/features/training/navigation.js'
import { treeMethods } from '../src/features/training/tree.js'

function navigationContext() {
  const tree = fixture()
  const animations = []
  const context = {
    ...navigationMethods,
    ...treeMethods,
    root: tree.root,
    currentNode: tree.documents,
    pwd: '',
    treeLayoutVersion: 0,
    cDirect: {},
    hasPermission: () => true,
    t: key => key,
    createOutputAnimate: () => {},
    trackDirectoryVisit: () => {},
    refreshTreeView() {
      this.treeLayoutVersion++
      return Promise.resolve(true)
    },
    animateTreePath(from, to) {
      animations.push([from, to])
    },
  }
  for (const node of tree.root.descendants()) node._children = node.children
  return { ...tree, context, animations }
}

test('cd ../ keeps the departure visible and animates back to its parent', async () => {
  const { root, user, documents, context, animations } = navigationContext()
  assert.equal(context.changeDirectory('../'), 'valid')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(context.currentNode, user)
  assert.ok(root.descendants().includes(documents))
  assert.deepEqual(animations, [[documents, user]])
})

test('cd ../pictures follows the shared parent and ignores superseded animations', async () => {
  const { root, user, documents, pictures, context, animations } =
    navigationContext()
  assert.equal(context.changeDirectory('../pictures'), 'valid')
  const route = context.buildTreePathNodes(documents, pictures)
  assert.equal(route.length, 3)
  assert.equal(route[1], user)
  assert.ok(root.descendants().includes(documents))
  assert.equal(context.changeDirectory('../'), 'valid')
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(animations, [[pictures, user]])
})

test('repeated parent traversal reaches home while keeping the route connected', async () => {
  const { root, home, documents, context, animations } = navigationContext()
  assert.equal(context.changeDirectory('../../'), 'valid')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(context.currentNode, home)
  assert.ok(root.descendants().includes(documents))
  assert.deepEqual(animations, [[documents, home]])
})

function assertFailedNavigationUnchanged(context, path) {
  const node = context.currentNode
  context.pwd = '/home/user'
  context.cDirect = { from: 'home', to: 'user' }
  const references = context.root
    .descendants()
    .map(item => [item, item.children, item._children])
  const sideEffects = []
  context.refreshTreeView = () => sideEffects.push('render')
  context.createOutputAnimate = () => sideEffects.push('animate')
  context.trackDirectoryVisit = () => sideEffects.push('visit')
  assert.equal(context.changeDirectory(path), 'warning')
  assert.equal(context.currentNode, node)
  assert.equal(context.pwd, '/home/user')
  assert.deepEqual(context.cDirect, { from: 'home', to: 'user' })
  for (const [item, children, hidden] of references) {
    assert.equal(item.children, children)
    assert.equal(item._children, hidden)
  }
  assert.deepEqual(sideEffects, [])
}

test('invalid relative cd keeps the current folder and every expanded branch unchanged', () => {
  const { user, context } = navigationContext()
  context.currentNode = user
  assertFailedNavigationUnchanged(context, 'documents/inexistant')
  assert.equal(context.output, 'terminal.folderNotFound')
})

test('invalid absolute cd does not move to root or collapse the tree', () => {
  const { context } = navigationContext()
  assertFailedNavigationUnchanged(context, '/home/user/documents/inexistant')
})

test('invalid target after ../ does not commit the parent traversal', () => {
  const { context } = navigationContext()
  assertFailedNavigationUnchanged(context, '../inexistant')
})

test('permission failure in the final segment leaves the entire workspace unchanged', () => {
  const { user, documents, context } = navigationContext()
  context.currentNode = user
  context.hasPermission = node => node !== documents.children[0]
  // Use a directory to exercise permission checks after a successful intermediate segment.
  documents.children[0].data.type = 'd'
  assertFailedNavigationUnchanged(context, 'documents/notes.txt')
  assert.equal(context.output, 'terminal.folderPermissionDenied')
})

test('parent permission failure is atomic', () => {
  const { user, context } = navigationContext()
  context.hasPermission = node => node !== user
  assertFailedNavigationUnchanged(context, '../pictures')
  assert.equal(context.output, 'terminal.parentPermissionDenied')
})

test('cd to a file fails without moving into its containing directory', () => {
  const { user, context } = navigationContext()
  context.currentNode = user
  assertFailedNavigationUnchanged(context, 'documents/notes.txt')
})

test('successful absolute cd resolves collapsed branches and opens a connected route', async () => {
  const { root, user, documents, context, animations } = navigationContext()
  context.currentNode = user
  user.children = null
  assert.equal(context.changeDirectory('/home/user/documents'), 'valid')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(context.currentNode, documents)
  assert.ok(root.descendants().includes(documents))
  assert.deepEqual(animations, [[user, documents]])
})

test('cd with no argument returns home with one update and one journey', async () => {
  const { user, documents, context, animations } = navigationContext()
  assert.equal(context.changeDirectory([]), 'valid')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(context.currentNode, user)
  assert.equal(context.treeLayoutVersion, 1)
  assert.deepEqual(animations, [[documents, user]])
})
