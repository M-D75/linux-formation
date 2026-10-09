// Resolve the whole journey before committing any workspace or display changes.
export function resolveDirectoryNavigation(root, start, path, canTraverse) {
  let node = path.startsWith('/') ? root : start
  if (!node) return { error: 'folderNotFound', name: path }
  const route = [node]
  for (const segment of path.split('/').filter(Boolean)) {
    if (segment === '.') continue
    let next
    if (segment === '..') {
      next = node.parent || node
      if (next !== node && !canTraverse(next)) {
        return { error: 'parentPermissionDenied', name: next.data.name }
      }
    } else {
      const children = [...(node.children || []), ...(node._children || [])]
      next = children.find(
        child => child.data.name === segment && child.data.type === 'd',
      )
      if (!next) return { error: 'folderNotFound', name: segment }
      if (!canTraverse(next))
        return { error: 'folderPermissionDenied', name: next.data.name }
    }
    if (next !== node) route.push(next)
    node = next
  }
  return { destination: node, route }
}
