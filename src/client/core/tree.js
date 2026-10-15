/** Pure virtual-tree builders (title "/" hierarchy plus single-child chain compression). */

import { splitTitleSegs, normPath, basename } from './text.js'
import { orderRows } from './view.js'

/**
 * Session nesting inside one workspace: same "/" convention as workspace
 * titles. Groups are virtual (projection of names). Rows keep the Host
 * workspace.sessionIds (manual) order — drag-to-reorder must be visible.
 */
export function buildSessionTree(rows, sortOrder = 'manual') {
  const root = { path: '', name: '', groups: [], sessions: [] }
  const byPath = new Map([['', root]])
  // SEGMENT-driven: paths arrive as already-split segment arrays (URL-aware
  // splitTitleSegs can yield segments containing "//", e.g. the
  // "scheme://host" authority segment) and are joined into the path KEY
  // verbatim — never re-split on "/", which would shred an authority
  // segment into "https:" + "" + host.
  const ensure = (segs) => {
    let node = root
    let key = ''
    for (const seg of segs) {
      key = key === '' ? seg : key + '/' + seg
      let next = byPath.get(key)
      if (!next) {
        next = { path: key, name: seg, groups: [], sessions: [] }
        byPath.set(key, next)
        node.groups.push(next)
      }
      node = next
    }
    return node
  }
  for (const row of rows || []) {
    const segs = splitTitleSegs(row.title)
    const folderPath = segs.slice(0, -1).join('/')
    const leaf = segs.length > 0 ? segs[segs.length - 1] : row.title
    ensure(segs.slice(0, -1)).sessions.push({ ...row, leaf })
  }
  const sortRec = (node) => {
    for (const group of node.groups) sortRec(group)
    node.updatedAt = node.sessions.concat(node.groups).reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0)
    if (sortOrder === 'latest') {
      node.sessions = orderRows(node.sessions, sortOrder)
      node.groups.sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name, 'zh'))
    } else node.groups.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }
  sortRec(root)
  return root
}

export const countSessionTree = (node) => node.sessions.length + node.groups.reduce((sum, group) => sum + countSessionTree(group), 0)

export const collectSessionRows = (node) => {
  const out = node.sessions.slice()
  for (const group of node.groups) out.push(...collectSessionRows(group))
  return out
}

export const findSessionGroup = (node, path) => {
  if (node.path === path) return node
  for (const group of node.groups) {
    const hit = findSessionGroup(group, path)
    if (hit) return hit
  }
  return null
}

/**
 * Build the folder tree. Folders are virtual: they exist where workspace
 * titles contain "/", plus the explicit empty folders the user created.
 * Returns { path, name, folders, workspaces } with workspaces carrying
 * their leaf display name.
 */
export function buildTree(items, explicitFolders, recency) {
  const root = { path: '', name: '', folders: [], workspaces: [] }
  const byPath = new Map([['', root]])
  // SEGMENT-driven, same as buildSessionTree: the joined path is only a
  // KEY; parsing it back on "/" would break URL authority segments.
  const ensure = (segs) => {
    let node = root
    let key = ''
    for (const seg of segs) {
      key = key === '' ? seg : key + '/' + seg
      let next = byPath.get(key)
      if (!next) {
        next = { path: key, name: seg, folders: [], workspaces: [] }
        byPath.set(key, next)
        node.folders.push(next)
      }
      node = next
    }
    return node
  }
  for (const folder of explicitFolders || []) {
    const segs = splitTitleSegs(normPath(folder))
    if (segs.length > 0) ensure(segs)
  }
  for (const workspace of items || []) {
    const segs = splitTitleSegs(workspace.title)
    const folderPath = segs.slice(0, -1).join('/')
    const leaf = segs.length > 0 ? segs[segs.length - 1] : (basename(workspace.path) || String(workspace.title || '') || String(workspace.workspaceId || ''))
    ensure(segs.slice(0, -1)).workspaces.push({
      workspaceId: workspace.workspaceId,
      title: String(workspace.title || ''),
      path: String(workspace.path || ''),
      sessionIds: Array.isArray(workspace.sessionIds) ? workspace.sessionIds : [],
      leaf,
      folderPath,
      updatedAt: recency ? (recency.get(workspace.workspaceId) || 0) : 0,
    })
  }
  const sortRec = (node) => {
    for (const child of node.folders) sortRec(child)
    node.updatedAt = node.workspaces.concat(node.folders).reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0)
    if (recency) {
      node.workspaces = orderRows(node.workspaces, 'latest')
      node.folders.sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name, 'zh'))
    } else node.folders.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }
  sortRec(root)
  return root
}

    // Preserve title and folderPath: changing the view must never rename a
    // workspace, including when a drag reorders the flat workspace list.
export const buildWorkspaceList = (items, recency) => {
  const tree = buildTree(items, [], recency)
  const byId = new Map()
  const collect = (node) => {
    for (const workspace of node.workspaces) byId.set(workspace.workspaceId, { ...workspace, leaf: workspace.title || workspace.leaf })
    for (const folder of node.folders) collect(folder)
  }
  collect(tree)
  const rows = (items || []).map(workspace => byId.get(workspace.workspaceId))
  return { ...tree, folders: [], workspaces: orderRows(rows, recency ? 'latest' : 'manual') }
}

export const countWorkspaces = (node) => (node.kind === 'ws' ? 1 : node.workspaces.length + node.folders.reduce((sum, f) => sum + countWorkspaces(f), 0))

export const materializeChain = (chain) => chain.kind === 'ws'
  ? {
    kind: 'ws',
    path: chain.path,
    workspace: { ...chain.workspace, leaf: chain.segs.join('/') + '/' + chain.pure, title: chain.workspace.title, folderPath: '' },
    folders: [],
    workspaces: [],
  }
  : { kind: 'folder', path: chain.path, name: chain.segs.join('/'), folders: chain.folders, workspaces: chain.workspaces }

/**
 * VS Code-style single-child chain compression (preference-controlled):
 * a folder level holding exactly ONE child and nothing else merges into a
 * single display row; a chain ending in one workspace becomes that
 * workspace row with the merged label. Only presentation changes; the
 * underlying workspace/title data is untouched.
 *
 * The merged label is the chain RELATIVE to the first un-compressed
 * ancestor (VS Code explorer behaviour): a chain a/b/c holding only
 * workspace W shows "a/b/c/W" at the root, but the same chain nested
 * inside a populated folder "a" shows "b/c/W". Labels are therefore
 * assembled from RELATIVE segments (segs + pure leaf name) and only
 * materialised into a display node at the chain's top — the pre-0.8 code
 * prefixed each recursion level with the FULL node.path, so nested chains
 * rendered duplicated prefixes like "1/2/1/2/3/A".
 */
export function compressTree(node) {
  const folders = (node.folders || []).map(compressTree)
  const workspaces = node.workspaces || []
  if (workspaces.length === 0 && folders.length === 1) {
    // Continue the chain upward: one more relative segment in front of
    // whatever the child chain accumulated. path stays the DEEPEST full
    // path (expansion identity); the label is joined only at the top.
    const child = folders[0]
    return {
      kind: child.kind,
      path: child.path,
      segs: [node.name].concat(child.segs || []),
      pure: child.pure,
      workspace: child.workspace,
      folders: child.folders,
      workspaces: child.workspaces,
    }
  }
  if (folders.length === 0 && workspaces.length === 1) {
    return { kind: 'ws', path: node.path, segs: [node.name], pure: workspaces[0].leaf, workspace: workspaces[0], folders: [], workspaces: [] }
  }
  // Chain top (multiple children, or a mix): children are materialised
  // relative to this node; this node itself keeps its single name.
  return { kind: 'folder', path: node.path, segs: [node.name], folders: folders.map(materializeChain), workspaces }
}
