/** Drag & drop: hit testing, drag-state arming and the commits that write host order. */

import { React } from '../platform.ts'
import { buildWorkspaceList } from '../core/tree.ts'
import { splitTitleSegs } from '../core/text.ts'
import type { WorkspaceInput, WorkspaceRow } from '../core/tree.ts'
import type { ViewMode } from '../core/view.ts'
import type { WorkspaceGroup } from '../store.ts'

/** Which edge of a row a drop targets. */
export type DropHalf = 'before' | 'after'

/** The session row fields the drag handlers read (model-derived rows; ids are host ids). */
export interface SessionDragRow {
  id: string
  title?: string
  leaf?: string
  blank?: boolean
  archived?: boolean
  [key: string]: any
}

/** The tree node the reorder reads: compressed chains still list their workspaces. */
export interface WorkspaceTreeLike {
  workspaces: ReadonlyArray<WorkspaceRow>
}

/** Where the armed drag came FROM (a workspace leaf/folder or a session id). */
export interface DragSourceState {
  workspaceId?: string
  sessionId?: string
  sectioned?: boolean
  title?: string
  leaf?: string
  folderPath?: string
}

/** The current drop target; `half` only exists on row-edge drops. */
export interface DragOverState {
  kind: 'workspace' | 'folder' | 'wgroup' | 'session' | 'sgroup'
  target: string
  half?: DropHalf
}

/** One armed drag (`kind` is 'workspace' or 'session'). */
export interface DragState {
  kind: 'workspace' | 'session'
  source: DragSourceState
  over: DragOverState | null
}

/**
 * Everything the drag layer receives from BetterBrowser. Host-injected actions
 * and snapshots stay untyped (the shell's contracts are feature-probed and
 * untyped); the plugin-local state carries real types.
 */
export interface DndInput {
  archivedSet: ReadonlySet<string>
  assignSessionSection: any
  assignWorkspaceGroup: any
  automaticSort: boolean
  drag: any
  fail: any
  findTreeNode: any
  groupedView: boolean
  insertSessionBefore: any
  insertWorkspaceBefore: any
  items: ReadonlyArray<WorkspaceInput> | null | undefined
  pinnedSet: ReadonlySet<string>
  recency: Map<string, number> | null | undefined
  renameByUser: any
  renameWorkspace: any
  sessionsOf: any
  setDrag: any
  tree: WorkspaceTreeLike
  viewMode: ViewMode
  visibleItems: ReadonlyArray<WorkspaceInput>
  workspaceGroupOf: any
  workspaceGroups: ReadonlyArray<WorkspaceGroup>
  wsDragArmTimer: { current: ReturnType<typeof setTimeout> | null }
}

/** Options for {@link useTabReorder}; the commit callback may be absent. */
export interface TabReorderOptions {
  onReorder?: ((fromId: string, toId: string) => void) | null
}

/** The drag handlers a horizontal chip spreads onto its element. */
export interface TabChipDragEvents {
  draggable: boolean
  onDragStart: (event: any) => void
  onDragOver: (event: any) => void
  onDragLeave: () => void
  onDrop: (event: any) => void
  onDragEnd: () => void
}

/** The strip's live drag state plus the per-chip drag handlers. */
export interface TabReorder {
  draggingId: string | null
  overId: string | null
  eventsFor: (id: string) => TabChipDragEvents
}

export function createDnd(input: DndInput) {
  const {
    archivedSet, assignSessionSection, assignWorkspaceGroup, automaticSort, drag, fail, findTreeNode, groupedView, insertSessionBefore, insertWorkspaceBefore, items, pinnedSet, recency, renameByUser, renameWorkspace, sessionsOf, setDrag, tree, viewMode, visibleItems, workspaceGroupOf, workspaceGroups, wsDragArmTimer
  } = input

/* ------------------------- drag & drop -------------------------- */

React.useEffect(() => {
  if (drag === null) return
  const accept = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }
  const acceptDrop = (event: DragEvent) => { event.preventDefault() }
  document.addEventListener('dragover', accept)
  document.addEventListener('drop', acceptDrop)
  return () => {
    document.removeEventListener('dragover', accept)
    document.removeEventListener('drop', acceptDrop)
  }
}, [drag === null])

const rowHalf = (event: any) => {
  const rect = event.currentTarget.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}
const dragMatches = (kind: string) => drag !== null && drag.kind === kind
const canReorderWorkspaces = !automaticSort && groupedView && typeof insertWorkspaceBefore === 'function'
const canMoveWorkspaceGroup = groupedView && workspaceGroups.length > 0
const canDragWorkspace = canReorderWorkspaces || canMoveWorkspaceGroup
// Session REORDER needs the host insertSessionBefore action; dragging a
// session onto a sub-group row (a pure rename) stays available without it.
const canReorderSessions = typeof insertSessionBefore === 'function'

/* --------------------- workspace drag & drop -------------------- */

const wsDropHalf = (workspaceId: string) => {
  if (!dragMatches('workspace') || !canReorderWorkspaces) return null
  const over = drag.over
  return over && over.kind === 'workspace' && over.target === workspaceId ? over.half : null
}
const wsDropInto = (path: string) => dragMatches('workspace') && drag.over && drag.over.kind === 'folder' && drag.over.target === path
const workspaceDragEvents = (workspace: WorkspaceInput) => ({
  draggable: canDragWorkspace,
  onDragStart: (event: any) => {
    if (!canDragWorkspace) return
    event.stopPropagation()
    try {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', workspace.workspaceId)
    } catch { /* drag payload is best-effort */ }
    // Drag identity derives from the RAW title, never the displayed leaf:
    // a compressed single-chain row shows "group/workspace" as its leaf with
    // folderPath '' — carrying that would make move-into / cross-folder
    // drops rebuild titles like "x/group/workspace". The real leaf and
    // folder keep every drop target's rename correct.
    const segs = splitTitleSegs(workspace.title)
    const sourceLeaf = segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || String(workspace.workspaceId))
    const sourceFolder = segs.length > 1 ? segs.slice(0, -1).join('/') : ''
    // Deferred by one frame on purpose (Chromium cancels a just-started
    // drag whose source element is moved out from under the cursor; see
    // wsDragArmTimer above). By the next frame the gesture has settled
    // and the chain expansion is an ordinary mid-drag update.
    if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current)
    wsDragArmTimer.current = setTimeout(() => {
      wsDragArmTimer.current = null
      setDrag({ kind: 'workspace', source: { workspaceId: workspace.workspaceId, leaf: sourceLeaf, folderPath: sourceFolder }, over: null })
    }, 0)
  },
  onDragEnd: () => {
    if (wsDragArmTimer.current !== null) { clearTimeout(wsDragArmTimer.current); wsDragArmTimer.current = null }
    setDrag(null)
  },
  onDragOver: (event: any) => {
    if (!dragMatches('workspace') || !canDragWorkspace) return
    if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return
    event.preventDefault()
    event.stopPropagation()
    try { event.dataTransfer.dropEffect = 'move' } catch { }
    const half = rowHalf(event)
    setDrag((current: DragState | null) => (current && current.over && current.over.kind === 'workspace' && current.over.target === workspace.workspaceId && current.over.half === half)
      ? current
      : (current ? { ...current, over: { kind: 'workspace', target: workspace.workspaceId, half } } : current))
  },
  onDrop: (event: any) => {
    if (!dragMatches('workspace') || !canDragWorkspace) return
    if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return
    event.preventDefault()
    event.stopPropagation()
    const half = drag.over && drag.over.kind === 'workspace' && drag.over.target === workspace.workspaceId ? drag.over.half : rowHalf(event)
    commitWorkspaceDrop(workspace, half)
  },
})
const folderDropEvents = (path: string) => ({
  onDragOver: (event: any) => {
    if (!dragMatches('workspace') || !canReorderWorkspaces || workspaceGroupOf(drag.source.workspaceId)) return
    event.preventDefault()
    event.stopPropagation()
    try { event.dataTransfer.dropEffect = 'move' } catch { }
    setDrag((current: DragState | null) => (current && current.over && current.over.kind === 'folder' && current.over.target === path)
      ? current
      : (current ? { ...current, over: { kind: 'folder', target: path } } : current))
  },
  onDrop: (event: any) => {
    if (!dragMatches('workspace') || !canReorderWorkspaces || workspaceGroupOf(drag.source.workspaceId)) return
    event.preventDefault()
    event.stopPropagation()
    commitWorkspaceMoveInto(path)
  },
})
const nextWorkspaceAfter = (folderPath: string, workspaceId: string) => {
  const groupId = workspaceGroupOf(workspaceId)
  if (groupId) {
    const rows = buildWorkspaceList(visibleItems.filter(workspace => workspaceGroupOf(workspace.workspaceId) === groupId), recency).workspaces
    const index = rows.findIndex(workspace => workspace.workspaceId === workspaceId)
    return rows[index + 1] && rows[index + 1].workspaceId
  }
  if (viewMode === 'workspaces') {
    const index = tree.workspaces.findIndex(workspace => workspace.workspaceId === workspaceId)
    return tree.workspaces[index + 1] && tree.workspaces[index + 1].workspaceId
  }
  const node = findTreeNode(tree, folderPath)
  if (!node) return undefined
  const index = node.workspaces.findIndex((w: WorkspaceRow) => w.workspaceId === workspaceId)
  return index === -1 ? undefined : (node.workspaces[index + 1] ? node.workspaces[index + 1].workspaceId : undefined)
}
const commitWorkspaceDrop = (targetWorkspace: WorkspaceInput, half: DropHalf) => {
  if (!drag || !canDragWorkspace) { setDrag(null); return }
  const source = drag.source
  setDrag(null)
  if (source.workspaceId === targetWorkspace.workspaceId) return
  const sourceGroup = workspaceGroupOf(source.workspaceId)
  const targetGroup = workspaceGroupOf(targetWorkspace.workspaceId)
  const anchor = half === 'after'
    ? nextWorkspaceAfter(targetWorkspace.folderPath || '', targetWorkspace.workspaceId)
    : targetWorkspace.workspaceId
  if (sourceGroup !== targetGroup) assignWorkspaceGroup(source.workspaceId, targetGroup)
  if (!canReorderWorkspaces) return
  const sameFolder = sourceGroup !== targetGroup || !!targetGroup || viewMode === 'workspaces' || (targetWorkspace.folderPath || '') === source.folderPath
  const chain = sameFolder
    ? Promise.resolve()
    : Promise.resolve().then(() => {
      const newTitle = (targetWorkspace.folderPath || '') !== '' ? (targetWorkspace.folderPath || '') + '/' + source.leaf : source.leaf
      return renameWorkspace(source.workspaceId, newTitle)
    })
  chain
    .then(() => (anchor !== undefined ? insertWorkspaceBefore(source.workspaceId, anchor) : insertWorkspaceBefore(source.workspaceId)))
    .catch(fail)
}
const commitWorkspaceMoveInto = (folderPath: string) => {
  if (!drag || !canReorderWorkspaces || viewMode !== 'projects' || workspaceGroupOf(drag.source.workspaceId)) { setDrag(null); return }
  const source = drag.source
  setDrag(null)
  if (source.folderPath === folderPath) return
  const newTitle = folderPath !== '' ? folderPath + '/' + source.leaf : source.leaf
  Promise.resolve()
    .then(() => renameWorkspace(source.workspaceId, newTitle))
    .then(() => insertWorkspaceBefore(source.workspaceId))
    .catch(fail)
}
const workspaceGroupDropEvents = (groupId: string) => ({
  onDragOver: (event: any) => {
    if ((!dragMatches('workspace') && !dragMatches('session')) || !canMoveWorkspaceGroup) return
    event.preventDefault()
    event.stopPropagation()
    try { event.dataTransfer.dropEffect = 'move' } catch {}
    setDrag((current: DragState | null) => {
      if (!current || (current.over && current.over.kind === 'wgroup' && current.over.target === groupId)) return current
      return { ...current, over: { kind: 'wgroup', target: groupId } }
    })
  },
  onDrop: (event: any) => {
    if ((!dragMatches('workspace') && !dragMatches('session')) || !canMoveWorkspaceGroup) return
    event.preventDefault()
    event.stopPropagation()
    if (drag.kind === 'session') assignSessionSection(drag.source.sessionId, groupId)
    else assignWorkspaceGroup(drag.source.workspaceId, groupId)
    setDrag(null)
  },
})

/* ---------------------- session drag & drop --------------------- */

const sessDropHalf = (sessionId: string) => {
  // Time views and pinned rows never anchor a reorder: their visual
  // position is derived (recency / pin order), not the host manual
  // order, so a committed drop there would silently reorder nothing.
  if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView) return null
  const over = drag.over
  return over && over.kind === 'session' && over.target === sessionId ? over.half : null
}
const sgroupDropInto = (workspaceId: string, path: string) => !automaticSort && dragMatches('session') && !drag.source.sectioned && drag.source.workspaceId === workspaceId && drag.over && drag.over.kind === 'sgroup' && drag.over.target === path
// Section moves are local and allow pins and archives. Legacy title
// grouping and host reorder targets retain their stricter guards.
const sessionDraggable = (session: SessionDragRow) => {
  if (!groupedView || session.blank) return false
  if (workspaceGroups.length > 0) return true
  return !automaticSort && !session.archived && !pinnedSet.has(session.id)
}
const sessionDragEvents = (session: SessionDragRow, workspaceId: string | null | undefined, sectioned = false) => ({
  draggable: sessionDraggable(session),
  onDragStart: (event: any) => {
    if (!sessionDraggable(session)) return
    event.stopPropagation()
    try {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', session.id)
    } catch { }
    setDrag({ kind: 'session', source: { sessionId: session.id, workspaceId, sectioned, title: session.title, leaf: session.leaf || session.title }, over: null })
  },
  onDragEnd: () => setDrag(null),
  onDragOver: (event: any) => {
    // Pinned rows are not reorder anchors (visible position ≠ host
    // order); drop targets stay plain rows only. Belt-and-braces: the
    // source side already refuses to arm for pinned rows.
    if (!dragMatches('session') || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView
      || drag.source.workspaceId !== workspaceId
      || session.archived || archivedSet.has(drag.source.sessionId)
      || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
    event.preventDefault()
    event.stopPropagation()
    try { event.dataTransfer.dropEffect = 'move' } catch { }
    const half = rowHalf(event)
    setDrag((current: DragState | null) => (current && current.over && current.over.kind === 'session' && current.over.target === session.id && current.over.half === half)
      ? current
      : (current ? { ...current, over: { kind: 'session', target: session.id, half } } : current))
  },
  onDrop: (event: any) => {
    if (!dragMatches('session') || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView
      || drag.source.workspaceId !== workspaceId
      || session.archived || archivedSet.has(drag.source.sessionId)
      || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
    event.preventDefault()
    event.stopPropagation()
    const half = drag.over && drag.over.kind === 'session' && drag.over.target === session.id ? drag.over.half : rowHalf(event)
    commitSessionDrop(workspaceId, session.id, half)
  },
})
const sgroupDropEvents = (workspaceId: string, path: string) => ({
  onDragOver: (event: any) => {
    if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView
      || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return
    event.preventDefault()
    event.stopPropagation()
    try { event.dataTransfer.dropEffect = 'move' } catch { }
    setDrag((current: DragState | null) => (current && current.over && current.over.kind === 'sgroup' && current.over.target === path)
      ? current
      : (current ? { ...current, over: { kind: 'sgroup', target: path } } : current))
  },
  onDrop: (event: any) => {
    if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView
      || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return
    event.preventDefault()
    event.stopPropagation()
    commitSessionMoveInto(workspaceId, path)
  },
})
const commitSessionDrop = (workspaceId: string | null | undefined, targetSessionId: string, half: DropHalf) => {
  if (!drag) return
  const source = drag.source
  setDrag(null)
  // Same guards as the drop handlers (time views / pinned rows are not
  // reorder surfaces) — a stale drag never commits an invisible move.
  if (!canReorderSessions || automaticSort || !groupedView) return
  if (archivedSet.has(source.sessionId) || archivedSet.has(targetSessionId)) return
  if (pinnedSet.has(source.sessionId) || pinnedSet.has(targetSessionId)) return
  if (source.sessionId === targetSessionId) return
  const workspace = (items || []).find(w => w.workspaceId === workspaceId)
  if (!workspace) return
  const flat = sessionsOf(workspace)
  const index = flat.findIndex((s: SessionDragRow) => s.id === targetSessionId)
  const anchor = half === 'after'
    ? (index === -1 ? undefined : (flat[index + 1] ? flat[index + 1].id : undefined))
    : targetSessionId
  Promise.resolve()
    .then(() => (anchor !== undefined ? insertSessionBefore(workspaceId, source.sessionId, anchor) : insertSessionBefore(workspaceId, source.sessionId)))
    .catch(fail)
}
const commitSessionMoveInto = (workspaceId: string | null | undefined, groupPath: string) => {
  if (!drag || automaticSort || !groupedView || archivedSet.has(drag.source.sessionId)) { setDrag(null); return }
  const source = drag.source
  setDrag(null)
  const newTitle = groupPath !== '' ? groupPath + '/' + source.leaf : source.leaf
  if (newTitle === source.title) return
  Promise.resolve()
    .then(() => renameByUser(source.sessionId, newTitle))
    .catch(fail)
}


  return { canDragWorkspace, canMoveWorkspaceGroup, canReorderSessions, canReorderWorkspaces, commitSessionDrop, commitSessionMoveInto, commitWorkspaceDrop, commitWorkspaceMoveInto, dragMatches, folderDropEvents, nextWorkspaceAfter, rowHalf, sessDropHalf, sessionDragEvents, sessionDraggable, sgroupDropEvents, sgroupDropInto, workspaceDragEvents, workspaceGroupDropEvents, wsDropHalf, wsDropInto }
}

/* --------------------- horizontal reorder (tab strip) --------------------- */

/**
 * Drag reordering for a flat horizontal list of keyed chips (the session tabs).
 *
 * This is the same HTML5 drag mechanism the tree rows use — `draggable` sources,
 * `dragover`/drop targets and the document-level accept installed while a drag
 * is armed (without it a release outside any chip cancels the gesture). It is a
 * separate hook rather than part of `createDnd` because that one is bound to the
 * sidebar's tree state and host-order commits, while the strip reorders local
 * state and only needs "the moved chip takes the target's place".
 *
 * @param onReorder - commits the move: called with (fromId, toId) on a drop.
 * @returns the dragging id, the current drop target, and per-chip drag events.
 */
export function useTabReorder({ onReorder }: TabReorderOptions): TabReorder {
  const [dragId, setDragId] = React.useState(null)
  const [overId, setOverId] = React.useState(null)
  // Last chip the pointer entered; kept in a ref so the reorder fires once per
  // target and never from inside a state updater (React may run those twice).
  const lastOverRef = React.useRef(null)
  React.useEffect(() => {
    if (dragId === null) return undefined
    const accept = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    }
    const acceptDrop = (event: DragEvent) => { event.preventDefault() }
    document.addEventListener('dragover', accept)
    document.addEventListener('drop', acceptDrop)
    return () => {
      document.removeEventListener('dragover', accept)
      document.removeEventListener('drop', acceptDrop)
    }
  }, [dragId === null])
  const eventsFor = (id: string): TabChipDragEvents => ({
    draggable: true,
    onDragStart: (event: any) => {
      lastOverRef.current = null
      setDragId(id)
      try {
        event.dataTransfer.setData('text/plain', id)
        event.dataTransfer.effectAllowed = 'move'
      } catch {}
    },
    onDragOver: (event: any) => {
      if (!dragId || dragId === id) return
      event.preventDefault()
      try { event.dataTransfer.dropEffect = 'move' } catch {}
      // Reorder as the pointer enters a new chip: the strip re-renders in the
      // new order immediately, so the move is previewed live instead of only
      // landing on drop.
      if (lastOverRef.current === id) return
      lastOverRef.current = id
      setOverId(id)
      if (typeof onReorder === 'function') onReorder(dragId, id)
    },
    onDragLeave: () => { if (lastOverRef.current === id) lastOverRef.current = null; setOverId((current: string | null) => (current === id ? null : current)) },
    onDrop: (event: any) => {
      // The order already followed the pointer during dragover; the drop only
      // ends the gesture.
      event.preventDefault()
      lastOverRef.current = null
      setDragId(null)
      setOverId(null)
    },
    onDragEnd: () => { lastOverRef.current = null; setDragId(null); setOverId(null) },
  })
  return { draggingId: dragId, overId, eventsFor }
}
