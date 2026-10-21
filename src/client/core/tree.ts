/** Pure virtual-tree builders (title "/" hierarchy plus single-child chain compression). */

import { splitTitleSegs, normPath, basename } from './text.ts'
import { orderRows, type SortOrder } from './view.ts'

/** A session row entering the session tree (the shell summary plus the derived leaf). */
export interface SessionTreeRow {
  id?: string
  title?: string
  updatedAt?: number
  /** Last title segment: the row label inside its group. */
  leaf: string
  [key: string]: any
}

/** One virtual group of the in-workspace session tree. */
export interface SessionTreeNode {
  path: string
  name: string
  groups: SessionTreeNode[]
  sessions: SessionTreeRow[]
  updatedAt?: number
}

/**
 * Session nesting inside one workspace: same "/" convention as workspace
 * titles. Groups are virtual (projection of names). Rows keep the Host
 * workspace.sessionIds (manual) order — drag-to-reorder must be visible.
 */
export function buildSessionTree(
  rows: ReadonlyArray<Record<string, any>> | null | undefined,
  sortOrder: SortOrder | string = 'manual',
): SessionTreeNode {
  const root: SessionTreeNode = { path: '', name: '', groups: [], sessions: [] }
  const byPath = new Map<string, SessionTreeNode>([['', root]])
  // SEGMENT-driven: paths arrive as already-split segment arrays (URL-aware
  // splitTitleSegs can yield segments containing "//", e.g. the
  // "scheme://host" authority segment) and are joined into the path KEY
  // verbatim — never re-split on "/", which would shred an authority
  // segment into "https:" + "" + host.
  const ensure = (segs: string[]): SessionTreeNode => {
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
    const segs = splitTitleSegs(row.title as string | undefined)
    const leaf = segs.length > 0 ? segs[segs.length - 1] : String(row.title || '')
    ensure(segs.slice(0, -1)).sessions.push({ ...row, leaf })
  }
  const sortRec = (node: SessionTreeNode): void => {
    for (const group of node.groups) sortRec(group)
    node.updatedAt = [...node.sessions, ...node.groups].reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0)
    if (sortOrder === 'latest') {
      node.sessions = orderRows(node.sessions, sortOrder)
      node.groups.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.name.localeCompare(b.name, 'zh'))
    } else node.groups.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }
  sortRec(root)
  return root
}

export const countSessionTree = (node: SessionTreeNode): number =>
  node.sessions.length + node.groups.reduce((sum, group) => sum + countSessionTree(group), 0)

export const collectSessionRows = (node: SessionTreeNode): SessionTreeRow[] => {
  const out = node.sessions.slice()
  for (const group of node.groups) out.push(...collectSessionRows(group))
  return out
}

export const findSessionGroup = (node: SessionTreeNode, path: string): SessionTreeNode | null => {
  if (node.path === path) return node
  for (const group of node.groups) {
    const hit = findSessionGroup(group, path)
    if (hit) return hit
  }
  return null
}

/** A workspace as the host lists it (only the fields the tree reads are required). */
export interface WorkspaceInput {
  workspaceId: string
  title?: string
  path?: string
  sessionIds?: string[]
  [key: string]: any
}

/** A workspace row inside the tree (leaf label and folder path derived). */
export interface WorkspaceRow {
  workspaceId: string
  title: string
  path: string
  sessionIds: string[]
  leaf: string
  folderPath: string
  updatedAt: number
  [key: string]: any
}

/** One virtual folder of the workspace tree. */
export interface FolderNode {
  path: string
  name: string
  folders: FolderNode[]
  workspaces: WorkspaceRow[]
  updatedAt?: number
}

/**
 * Build the folder tree. Folders are virtual: they exist where workspace
 * titles contain "/", plus the explicit empty folders the user created.
 * Returns { path, name, folders, workspaces } with workspaces carrying
 * their leaf display name.
 */
export function buildTree(
  items: ReadonlyArray<WorkspaceInput> | null | undefined,
  explicitFolders: ReadonlyArray<string | null | undefined> | null | undefined,
  recency: Map<string, number> | null | undefined,
): FolderNode {
  const root: FolderNode = { path: '', name: '', folders: [], workspaces: [] }
  const byPath = new Map<string, FolderNode>([['', root]])
  // SEGMENT-driven, same as buildSessionTree: the joined path is only a
  // KEY; parsing it back on "/" would break URL authority segments.
  const ensure = (segs: string[]): FolderNode => {
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
  const sortRec = (node: FolderNode): void => {
    for (const child of node.folders) sortRec(child)
    node.updatedAt = [...node.workspaces, ...node.folders].reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0)
    if (recency) {
      node.workspaces = orderRows(node.workspaces, 'latest')
      node.folders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.name.localeCompare(b.name, 'zh'))
    } else node.folders.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }
  sortRec(root)
  return root
}

// Preserve title and folderPath: changing the view must never rename a
// workspace, including when a drag reorders the flat workspace list.
export const buildWorkspaceList = (
  items: ReadonlyArray<WorkspaceInput> | null | undefined,
  recency: Map<string, number> | null | undefined,
): FolderNode => {
  const tree = buildTree(items, [], recency)
  const byId = new Map<string, WorkspaceRow>()
  const collect = (node: FolderNode): void => {
    for (const workspace of node.workspaces) byId.set(workspace.workspaceId, { ...workspace, leaf: workspace.title || workspace.leaf })
    for (const folder of node.folders) collect(folder)
  }
  collect(tree)
  const rows = (items || []).map(workspace => byId.get(workspace.workspaceId) as WorkspaceRow)
  return { ...tree, folders: [], workspaces: orderRows(rows, recency ? 'latest' : 'manual') }
}

/** A node of the workspace tree that can be counted (folder or compressed chain). */
export interface CountableNode {
  kind?: string
  workspaces: WorkspaceRow[]
  folders: CountableNode[]
}

export const countWorkspaces = (node: CountableNode): number =>
  (node.kind === 'ws' ? 1 : node.workspaces.length + node.folders.reduce((sum, folder) => sum + countWorkspaces(folder), 0))

/**
 * A compressed chain row: either a folder chain or a workspace chain.
 * `segs` holds the relative segments accumulated while compressing (label source).
 */
export interface ChainNode {
  kind: 'ws' | 'folder'
  path: string
  segs: string[]
  pure?: string
  workspace?: WorkspaceRow
  folders: ChainNode[]
  workspaces: WorkspaceRow[]
}

export const materializeChain = (chain: ChainNode): ChainNode => chain.kind === 'ws'
  ? {
    kind: 'ws',
    path: chain.path,
    segs: chain.segs,
    pure: chain.pure,
    workspace: {
      ...(chain.workspace as WorkspaceRow),
      leaf: chain.segs.join('/') + '/' + chain.pure,
      title: (chain.workspace as WorkspaceRow).title,
      folderPath: '',
    },
    folders: [],
    workspaces: [],
  }
  : { kind: 'folder', path: chain.path, segs: chain.segs, folders: chain.folders, workspaces: chain.workspaces }

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
export function compressTree(node: FolderNode): ChainNode {
  const folders: ChainNode[] = (node.folders || []).map(compressTree)
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
