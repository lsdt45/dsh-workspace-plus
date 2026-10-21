/**
 * Derived sidebar model: a pure projection of the host snapshots plus the view
 * preferences. No React, no setters — every value is a function of the input
 * object, so it can be re-derived on each render and unit-tested on its own.
 * The component destructures the result back into the names its render body
 * already uses.
 */
import { sessionVisible, orderRows, pendingKindOf, statusPendingKindOf, sessionTitleOf, hasActiveScheduleOf, currentSessionIdOf } from '../core/view.ts'
import type { ArchivedFilter, SessionListLike, SessionSummaryLike, SortOrder, ViewMode } from '../core/view.ts'
import { buildSessionTree, buildTree, buildWorkspaceList, compressTree, materializeChain } from '../core/tree.ts'
import type { SessionTreeNode, WorkspaceInput, WorkspaceRow } from '../core/tree.ts'
import { pulseRank, relayStateOf } from '../rows.ts'
import type { SessionRowNode, SessionState, SessionStatusFields } from '../rows.ts'
import type { Translate } from '../core/time.ts'

/** A session summary as the sidebar reads it (the list snapshot plus derived fields). */
export interface BrowserSessionSummary extends SessionSummaryLike {
  cwd?: string
  completed?: boolean
}

/** The session-list snapshot plus the ordered id list the sidebar walks. */
export interface BrowserSessionList extends SessionListLike {
  ids?: string[]
  byId?: Record<string, BrowserSessionSummary | undefined>
}

/** Drag state the sidebar reads: the dragged kind plus the row hovered right now. */
export interface BrowserDrag {
  kind: string
  over?: { kind: string; target: string } | null
}

/** A custom workspace group (only the fields the sidebar reads). */
export interface BrowserWorkspaceGroup {
  id: string
  name: string
}

/** One session row as the tree renders it (the row node plus the sidebar's own flags). */
export interface BrowserSessionRow extends SessionRowNode {
  cwd: string
  blank: boolean
  archived: boolean
  running: boolean
  completed: boolean
  hasActiveSchedule: boolean
  pending?: string
  /** Project badge carried by tray and timeline rows. */
  workspaceTag?: string
}

/**
 * A tree node as the sidebar renders it: a plain folder node, a compressed
 * chain or the folder-tree root. `workspace` is only set on a compressed
 * workspace chain, where it is the materialised row.
 */
export interface BrowserTreeNode {
  path: string
  name?: string
  kind?: 'ws' | 'folder'
  folders: BrowserTreeNode[]
  workspaces: WorkspaceRow[]
  updatedAt?: number
  workspace?: WorkspaceRow
}

/** Inputs are host snapshots, view preferences and two injected predicates. */
export interface BrowserModelInput {
  items?: ReadonlyArray<WorkspaceInput> | null
  list?: BrowserSessionList | null
  archivedSet: ReadonlySet<string>
  archivedFilter: ArchivedFilter
  subCounts: ReadonlyMap<string, number>
  pending?: any
  statuses?: any
  t: Translate
  sessionSectionOf: (id: string) => string | null
  drag: BrowserDrag | null
  sortOrder: SortOrder
  viewMode: ViewMode
  storeFolders?: ReadonlyArray<string | null | undefined> | null
  compactChains: boolean
  workspaceGroupOf: (workspaceId: string) => string
  statusPulse: boolean
  expandedMap?: Record<string, boolean | undefined> | null
  sessionsExpandedMap?: Record<string, boolean | undefined> | null
  sessionGroupsMap?: Record<string, boolean | undefined> | null
}

export function createBrowserModel(input: BrowserModelInput) {
  const {
    items, list, archivedSet, archivedFilter, subCounts, pending, statuses, t,
    sessionSectionOf, drag, sortOrder, viewMode, storeFolders, compactChains,
    workspaceGroupOf, statusPulse, expandedMap, sessionsExpandedMap, sessionGroupsMap,
  } = input
// The shell marks the session on screen with a mainView retention, not with a
// list-level `current` field; deriving it once per render keeps blank-session
// visibility (only the current blank shows) and the read-already relay correct.
const currentSessionId = currentSessionIdOf(list)
const accounted = new Set<string>()
const workspaceIndexOf = new Map<string, string>()
for (const workspace of items || []) for (const id of workspace.sessionIds || []) { accounted.add(id); workspaceIndexOf.set(id, workspace.workspaceId) }
/** One session's live status record, when the profile serves the status store. */
const statusOf = (id: string) => (statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined)
const sessionRowOf = (id: string): BrowserSessionRow | null => {
  const summary = list && list.byId ? list.byId[id] : undefined
  if (!summary || !sessionVisible(summary, currentSessionId, archivedSet, archivedFilter)) return null
  const status = statusOf(id)
  const workspace = (items || []).find(item => item.workspaceId === workspaceIndexOf.get(id))
  return {
    id,
    cwd: summary.cwd || (workspace && workspace.path) || '',
    title: sessionTitleOf(summary, t),
    leaf: sessionTitleOf(summary, t),
    blank: !!summary.blank,
    archived: archivedSet.has(id),
    // The status store wins when present; the list snapshot only carries the
    // older fields (and no live running flag at all).
    running: status && status.running !== undefined ? status.running === true : !!summary.running,
    completed: status ? status.completionUnread === true : summary.completed === true,
    hasActiveSchedule: hasActiveScheduleOf(summary),
    subagents: subCounts.get(id) || 0,
    updatedAt: summary.updatedAt || 0,
    pending: pendingKindOf(pending, id) || statusPendingKindOf(status),
  }
}
const ungrouped: BrowserSessionRow[] = []
if (list && Array.isArray(list.ids)) {
  for (const id of list.ids) {
    if (accounted.has(id)) continue
    const row = sessionRowOf(id)
    if (row) ungrouped.push(row)
  }
  // Host has no display order for unassigned sessions; recency-desc
  // stays the shipped baseline for every mode (buckets re-sort their
  // own members in the time views).
  ungrouped.sort((a, b) => b.updatedAt - a.updatedAt)
}
const sectionedSessions = ((list && list.ids) || []).filter(id => sessionSectionOf(id) !== null).map(sessionRowOf).filter(Boolean) as BrowserSessionRow[]

// While a workspace drag is active, single-child chains render UNCOMPRESSED:
// a merged "group/workspace" row hides every folder level of the chain inside
// its label, and those levels are exactly the drop targets for "move into
// this group". Suspending the merge for the drag's duration re-exposes each
// level as a real folder row (folder expansion defaults apply); when the
// drag ends, the chains merge back. Session drags keep the merged view —
// their drop targets live inside workspace rows, which compression merges.
const draggingWorkspace = drag !== null && drag.kind === 'workspace'
const workspaceRecency = new Map<string, number>()
const visibleItems = (items || []).filter(workspace => {
  const rows = (workspace.sessionIds || []).filter(id => sessionSectionOf(id) === null).map(sessionRowOf).filter(Boolean) as BrowserSessionRow[]
  workspaceRecency.set(workspace.workspaceId, rows.reduce((latest, row) => Math.max(latest, row.updatedAt), 0))
  return archivedFilter !== 'only' || rows.length > 0
})
const recency = sortOrder === 'latest' ? workspaceRecency : undefined
const projectItems = visibleItems.filter(workspace => !workspaceGroupOf(workspace.workspaceId))
const tree: BrowserTreeNode = (() => {
  if (viewMode === 'workspaces') return buildWorkspaceList(projectItems, recency)
  const built = buildTree(projectItems, archivedFilter === 'only' ? [] : storeFolders, recency)
  if (!compactChains || draggingWorkspace) return built
  return { ...built, folders: built.folders.map((f) => materializeChain(compressTree(f))), workspaces: built.workspaces }
})()

const sessionsOf = (workspace: WorkspaceInput, includeSectioned = false): BrowserSessionRow[] => {
  const rows: BrowserSessionRow[] = []
  for (const id of workspace.sessionIds || []) {
    if (!includeSectioned && sessionSectionOf(id) !== null) continue
    const row = sessionRowOf(id)
    if (row) rows.push(row)
  }
  return orderRows(rows, sortOrder)
}

// The session on screen is read by definition, so a collapse relay must not
// bubble its completion reminder either (the row suppresses it on its own).
const viewedSessionId = currentSessionId
const nodePulseOf = (sessionNode: SessionTreeNode): SessionState | null => {
  let best: SessionState | null = null
  for (const group of sessionNode.groups || []) {
    const s = nodePulseOf(group)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  for (const row of sessionNode.sessions || []) {
    const s = relayStateOf(row as SessionStatusFields, viewedSessionId !== null && String(row.id) === viewedSessionId)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  return best
}
// A COLLAPSED workspace row relays its whole session tree; an open row
// shows the real dots (deeper collapsed groups relay on their own rows).
const wsPulseOf = (workspace: WorkspaceRow): SessionState | null => (!statusPulse || sessionsOpenOf(workspace.workspaceId))
  ? null
  : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
// A collapsed FOLDER hides everything below — including open workspaces —
// so its aggregation ignores inner expansion states entirely.
const wsAllPulseOf = (workspace: WorkspaceRow): SessionState | null => !statusPulse
  ? null
  : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
const folderPulseOf = (node: BrowserTreeNode): SessionState | null => {
  if (node.kind === 'ws') return wsAllPulseOf(node.workspace!)
  let best: SessionState | null = null
  for (const child of node.folders) {
    const s = folderPulseOf(child)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  for (const w of node.workspaces) {
    const s = wsAllPulseOf(w)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  return best
}

const folderExpanded = (path: string) => (expandedMap ? expandedMap[path] !== false : true)
const sessionsOpenOf = (workspaceId: string) => (sessionsExpandedMap ? sessionsExpandedMap[workspaceId] !== false : true)
const sessionGroupOpen = (key: string) => (sessionGroupsMap ? sessionGroupsMap[key] !== false : true)

  /* --------------------- status breathing relay -------------------- */

  return {
    accounted, workspaceIndexOf, sessionRowOf, ungrouped,
    sectionedSessions, visibleItems, workspaceRecency, recency, projectItems, tree,
    sessionsOf, nodePulseOf, wsPulseOf, wsAllPulseOf,
    folderPulseOf, folderExpanded, sessionsOpenOf, sessionGroupOpen,
  }
}
