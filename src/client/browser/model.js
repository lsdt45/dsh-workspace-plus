/**
 * Derived sidebar model: a pure projection of the host snapshots plus the view
 * preferences. No React, no setters — every value is a function of the input
 * object, so it can be re-derived on each render and unit-tested on its own.
 * The component destructures the result back into the names its render body
 * already uses.
 */
import { sessionVisible, orderRows, pendingKindOf, statusPendingKindOf, sessionTitleOf, hasActiveScheduleOf, currentSessionIdOf } from '../core/view.js'
import { buildSessionTree, buildTree, buildWorkspaceList, compressTree, materializeChain } from '../core/tree.js'
import { pulseRank, relayStateOf } from '../rows.js'

/** Inputs are host snapshots, view preferences and two injected predicates. */
export function createBrowserModel(input) {
  const {
    normalizedQuery, items, list, archivedSet, archivedFilter, subCounts, pending, statuses, t,
    sessionSectionOf, drag, sortOrder, viewMode, storeFolders, compactChains,
    workspaceGroupOf, statusPulse, expandedMap, sessionsExpandedMap, sessionGroupsMap,
  } = input
// The shell marks the session on screen with a mainView retention, not with a
// list-level `current` field; deriving it once per render keeps blank-session
// visibility (only the current blank shows) and the read-already relay correct.
const currentSessionId = currentSessionIdOf(list)
const accounted = new Set()
const workspaceIndexOf = new Map()
for (const workspace of items || []) for (const id of workspace.sessionIds || []) { accounted.add(id); workspaceIndexOf.set(id, workspace.workspaceId) }
/** One session's live status record, when the profile serves the status store. */
const statusOf = (id) => (statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined)
const sessionRowOf = (id) => {
  const summary = list && list.byId ? list.byId[id] : undefined
  if (!sessionVisible(summary, currentSessionId, archivedSet, archivedFilter)) return null
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
const ungrouped = []
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
const sectionedSessions = ((list && list.ids) || []).filter(id => sessionSectionOf(id) !== null).map(sessionRowOf).filter(Boolean)

// While a workspace drag is active, single-child chains render UNCOMPRESSED:
// a merged "group/workspace" row hides every folder level of the chain inside
// its label, and those levels are exactly the drop targets for "move into
// this group". Suspending the merge for the drag's duration re-exposes each
// level as a real folder row (folder expansion defaults apply); when the
// drag ends, the chains merge back. Session drags keep the merged view —
// their drop targets live inside workspace rows, which compression merges.
const draggingWorkspace = drag !== null && drag.kind === 'workspace'
const workspaceRecency = new Map()
const visibleItems = (items || []).filter(workspace => {
  const rows = (workspace.sessionIds || []).filter(id => sessionSectionOf(id) === null).map(sessionRowOf).filter(Boolean)
  workspaceRecency.set(workspace.workspaceId, rows.reduce((latest, row) => Math.max(latest, row.updatedAt), 0))
  return archivedFilter !== 'only' || rows.length > 0
})
const recency = sortOrder === 'latest' ? workspaceRecency : undefined
const projectItems = visibleItems.filter(workspace => !workspaceGroupOf(workspace.workspaceId))
const tree = (() => {
  if (viewMode === 'workspaces') return buildWorkspaceList(projectItems, recency)
  const built = buildTree(projectItems, archivedFilter === 'only' ? [] : storeFolders, recency)
  if (!compactChains || draggingWorkspace) return built
  return { ...built, folders: built.folders.map((f) => materializeChain(compressTree(f))), workspaces: built.workspaces }
})()

const sessionsOf = (workspace, includeSectioned = false) => {
  const rows = []
  for (const id of workspace.sessionIds || []) {
    if (!includeSectioned && sessionSectionOf(id) !== null) continue
    const row = sessionRowOf(id)
    if (row) rows.push(row)
  }
  return orderRows(rows, sortOrder)
}

const searchAgent = (agent) => {
  // Returns a pruned copy of the tree node, or null when nothing matches.
  if (!normalizedQuery) return agent
  if (agent.kind === 'ws') {
    const ws = agent.workspace
    const sessions = sessionsOf(ws)
    const wsHit = ws.leaf.toLowerCase().includes(normalizedQuery) || ws.title.toLowerCase().includes(normalizedQuery)
    if (wsHit || sessions.some(s => s.title.toLowerCase().includes(normalizedQuery))) {
      return { ...agent, node: agent, folders: [], workspaces: [ws] }
    }
    return null
  }
  const folders = []
  for (const folder of agent.folders) {
    const hit = searchAgent(folder)
    if (hit) folders.push(hit)
  }
  const workspaces = []
  for (const workspace of agent.workspaces) {
    const sessions = sessionsOf(workspace)
    const wsHit = workspace.leaf.toLowerCase().includes(normalizedQuery) || workspace.title.toLowerCase().includes(normalizedQuery)
    const matchedSessions = wsHit ? sessions : sessions.filter(s => s.title.toLowerCase().includes(normalizedQuery))
    if (wsHit || matchedSessions.length > 0) workspaces.push({ workspace, matchedSessions })
  }
  if (folders.length === 0 && workspaces.length === 0) return null
  return { node: agent, folders, workspaces }
}
const searched = normalizedQuery ? searchAgent(tree) : null
const searching = normalizedQuery !== ''
// The session on screen is read by definition, so a collapse relay must not
// bubble its completion reminder either (the row suppresses it on its own).
const viewedSessionId = currentSessionId
const nodePulseOf = (sessionNode) => {
  let best = null
  for (const group of sessionNode.groups || []) {
    const s = nodePulseOf(group)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  for (const row of sessionNode.sessions || []) {
    const s = relayStateOf(row, viewedSessionId !== null && String(row.id) === viewedSessionId)
    if (pulseRank(s) > pulseRank(best)) best = s
  }
  return best
}
// A COLLAPSED workspace row relays its whole session tree; an open row
// shows the real dots (deeper collapsed groups relay on their own rows).
const wsPulseOf = (workspace) => (!statusPulse || searching || sessionsOpenOf(workspace.workspaceId))
  ? null
  : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
// A collapsed FOLDER hides everything below — including open workspaces —
// so its aggregation ignores inner expansion states entirely.
const wsAllPulseOf = (workspace) => (!statusPulse || searching)
  ? null
  : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
const folderPulseOf = (node) => {
  if (node.kind === 'ws') return wsAllPulseOf(node.workspace)
  let best = null
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

const folderExpanded = (path) => (expandedMap ? expandedMap[path] !== false : true)
const sessionsOpenOf = (workspaceId) => (sessionsExpandedMap ? sessionsExpandedMap[workspaceId] !== false : true)
const sessionGroupOpen = (key) => (sessionGroupsMap ? sessionGroupsMap[key] !== false : true)

  /* --------------------- status breathing relay -------------------- */

  return {
    searching, accounted, workspaceIndexOf, sessionRowOf, ungrouped,
    sectionedSessions, visibleItems, workspaceRecency, recency, projectItems, tree,
    sessionsOf, searchAgent, searched, nodePulseOf, wsPulseOf, wsAllPulseOf,
    folderPulseOf, folderExpanded, sessionsOpenOf, sessionGroupOpen,
  }
}
