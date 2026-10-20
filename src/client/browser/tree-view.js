/** Tree rendering: workspace entries, folders, time buckets, the pinned tray and session rows. */

import { BTN } from '../ui/base.js'
import { BUCKET_ORDER, bucketOf } from '../core/time.js'
import { E } from '../platform.js'
import { FolderRow, SessionGroupRow, SessionRow, WorkspaceGroupRow, WorkspaceRow } from '../rows.js'
import { PinIcon16 } from '../icons.js'
import { buildSessionTree, buildWorkspaceList, countSessionTree } from '../core/tree.js'
import { currentSessionIdOf, orderRows } from '../core/view.js'
import { openTab, replaceTab, saveTabs, setActiveTab, tabsActive, tabsSnapshot } from '../tabs.js'

export function createTreeView(input) {
  const {
    actions, tabs, archivedFilter, canMoveWorkspaceGroup, drag, expandedMap, fail, folderDropEvents, folderExpanded, folderPulseOf, groupedView, items, list, nodePulseOf, normalizedQuery, now, open, openCtx, phase, pinnedList, pinnedSet, projectItems, recency, rowStyleOf, searchAgent, searched, searching, sectionedSessions, sessDropHalf, sessionDragEvents, sessionDraggable, sessionGroupOpen, sessionRowOf, sessionSectionOf, sessionsOf, sessionsOpenOf, setErrorText, sgroupDropEvents, sgroupDropInto, sortOrder, startSession, statusPulse, styleEntry, t, timeDirection, timeSorted, tree, unarchiveSession, ungrouped, viewMode, visibleItems, workspaceDragEvents, workspaceGroupDropEvents, workspaceGroupOf, workspaceGroups, workspaceIndexOf, workspaceTitleOf, wsDropHalf, wsDropInto, wsPulseOf
  } = input

/* ---------------------------- rows ----------------------------- */

// The shell records the session on screen as a mainView retention on its
// summary; nothing in the list snapshot is called "current". Read once per
// render for the row highlight and for the tab a plain click replaces.
const currentSessionId = currentSessionIdOf(list)

/**
 * Session list of ONE workspace in the projects view: pinned rows are
 * hidden (tray-only display — unpinning restores them) and the rest
 * render as the "/" title grouping tree in manual or recency order.
 * Search expands matching groups; pins remain tray-only. The time view never
 * routes here — the global timeline in the bodyRows assembly replaces
 * the workspace scaffolding entirely.
 */
const matchesSession = (row) => {
  if (!searching) return true
  const workspaceId = workspaceIndexOf.get(row.id)
  const workspace = (items || []).find(item => item.workspaceId === workspaceId)
  const sectionId = sessionSectionOf(row.id)
  const groupId = sectionId === null ? workspaceGroupOf(workspaceId) : sectionId
  const group = workspaceGroups.find(group => group.id === groupId)
  return (row.title + ' ' + (workspace ? workspace.title : '') + ' ' + (group ? group.name : '')).toLowerCase().includes(normalizedQuery)
}
const renderSessionTree = (workspace, depth) => {
  // Folder semantics: a closed workspace shows no sessions at all (the
  // list keeps its count badge); an open one shows the full session tree.
  if (!searching && !sessionsOpenOf(workspace.workspaceId)) return []
  const rows = sessionsOf(workspace)
  if (rows.length === 0) return []
  const unpinned = rows.filter(r => !pinnedSet.has(r.id))
  if (unpinned.length === 0) return []
  return renderSessionNode(buildSessionTree(unpinned, sortOrder), workspace.workspaceId, depth)
}

/** Recency buckets over un-pinned rows; empty buckets stay hidden. */
const renderTimeBuckets = (rows, workspaceId, depth) => {
  const buckets = new Map()
  for (const key of BUCKET_ORDER) buckets.set(key, [])
  for (const r of rows) buckets.get(bucketOf(r.updatedAt, now)).push(r)
  const direction = timeDirection === 'oldest' ? 1 : -1
  const prefix = workspaceId || 'timeline'
  const out = []
  const bucketKeys = timeDirection === 'oldest' ? BUCKET_ORDER.slice().reverse() : BUCKET_ORDER
  for (const key of bucketKeys) {
    const bucketRows = buckets.get(key)
    if (bucketRows.length === 0) continue
    out.push(E('div', { key: 'bucket-' + prefix + '-' + key, className: 'bw-bucket-header' }, t('bucket.' + key)))
    const sorted = bucketRows.slice().sort((a, b) => direction * (a.updatedAt - b.updatedAt))
    // Rows render without a workspace context: no drag surfaces here
    // (the timeline is a derived view, not a reorder surface). The
    // relative time is the tail label by default; the workspace tag
    // reveals on hover and the plugin's own bubble (ui/tooltip.js) carries
    // the full title, project and absolute timestamp.
    for (const s of sorted) out.push(renderSessionRow(s, depth, null, { workspaceTag: s.workspaceTag, tagOnHover: true, tooltip: true }))
  }
  return out
}
const searchSessionNode = (node) => {
  const groups = []
  for (const group of node.groups) {
    const hit = searchSessionNode(group)
    if (hit) groups.push(hit)
  }
  const sessions = node.sessions.filter(matchesSession)
  if (groups.length === 0 && sessions.length === 0) return null
  return { path: node.path, name: node.name, groups, sessions }
}
const renderSessionNode = (node, workspaceId, depth) => {
  const view = searching ? searchSessionNode(node) : node
  if (!view) return []
  const out = []
  for (const group of view.groups) {
    const key = workspaceId + '|' + group.path
    const open = searching || sessionGroupOpen(key)
    out.push(E(SessionGroupRow, {
      key: 'sg-' + key,
      name: group.name,
      depth,
      expanded: open,
      pulse: (statusPulse && !open) ? nodePulseOf(group) : null,
      count: countSessionTree(group),
      onToggle: () => { if (!searching) actions.setSessionGroupExpanded(key, !open) },
      onContextMenu: (e) => openCtx('sgroup', { workspaceId, path: group.path, name: group.name }, e),
      dropInto: sgroupDropInto(workspaceId, group.path),
      dragEvents: sgroupDropEvents(workspaceId, group.path),
      custStyle: rowStyleOf('sgroup:' + workspaceId + '|' + group.path),
      t,
    }))
    if (open) out.push(...renderSessionNode(group, workspaceId, depth + 1))
  }
  for (const s of view.sessions) out.push(renderSessionRow(s, depth, workspaceId))
  return out
}

/**
 * One session row anywhere it renders. opts: { pinned, inTray, workspaceTag }.
 * Pin membership marks the row automatically (pinned badge + tinted
 * backdrop) wherever it appears; inTray disables drag (tray rows are
 * projections, not reorder anchors) and keys the row apart from its
 * in-workspace sibling. Pin button hidden when the store lacks the
 * action (older host wiring).
 */
const restoreSession = (id) => {
  if (typeof unarchiveSession !== 'function') return
  Promise.resolve().then(() => unarchiveSession(id)).catch(fail)
}
const renderSessionRow = (session, depth, workspaceId, opts) => {
  const o = opts || {}
  const pinned = o.pinned === true || pinnedSet.has(session.id)
  const togglePin = typeof actions.togglePin === 'function' ? (id) => actions.togglePin(id) : undefined
  const inTray = o.inTray === true
  return E(SessionRow, {
    key: String(session.id) + (inTray ? '-tray' : ''),
    node: session,
    depth,
    // Ids compare as strings so the row and the collapse relay (model.js)
    // agree on which session is on screen whatever the host hands over.
    current: currentSessionId !== null && currentSessionId === String(session.id),
    now,
    onOpen: (id, event) => {
      if (session.archived) { setErrorText(t('session.archivedHint')); return }
      // Shift+click opens a tab of its own; a plain click swaps the session
      // inside the current tab (the original tab requirement). Both write the
      // persisted list first, so the strip reflects the click immediately.
      const newTab = !!(event && event.shiftKey)
      // A plain click swaps the session inside the ACTIVE tab. The tab store's
      // active id is the tab that actually owns the page (the main view can be
      // sessionless for a beat, e.g. right after archiving), so it replaces the
      // right one even when the shell has no current session yet.
      const active = tabsActive()
      saveTabs(newTab ? openTab(tabsSnapshot(), id) : replaceTab(tabsSnapshot(), active, id))
      // Select the tab this click wrote, so the chip highlights in the same
      // frame as the navigation instead of after the shell reports the new
      // mainView retention.
      setActiveTab(id)
      open(id)
    },
    onContextMenu: (e) => openCtx('session', session, e),
    dropHalf: workspaceId && !pinned && !o.sectioned ? sessDropHalf(session.id) : null,
    dragEvents: sessionDraggable(session) && (canMoveWorkspaceGroup || (workspaceId && !o.sectioned)) ? sessionDragEvents(session, workspaceId, o.sectioned === true) : undefined,
    custStyle: rowStyleOf('session:' + session.id),
    breathing: statusPulse,
    pinned,
    onTogglePin: session.archived ? undefined : togglePin,
    onUnarchive: typeof unarchiveSession === 'function' ? restoreSession : undefined,
    workspaceTag: o.workspaceTag,
    tagOnHover: o.tagOnHover === true,
    tooltip: o.tooltip === true,
    t,
  })
}

const renderWorkspaceEntry = (entry, depth, pulse) => {
  const { workspace } = entry
  const wsRows = sessionsOf(workspace)
  const count = countSessionTree(buildSessionTree(wsRows))
  const pinCount = wsRows.reduce((n, s) => n + (pinnedSet.has(s.id) ? 1 : 0), 0)
  const rows = [E(WorkspaceRow, {
    key: 'ws-' + workspace.workspaceId,
    workspace,
    depth,
    count,
    pinCount,
    sessionsOpen: searching ? true : sessionsOpenOf(workspace.workspaceId),
    currentInside: !!(currentSessionId !== null && (workspace.sessionIds || []).includes(currentSessionId)),
    onToggle: () => { if (!searching) actions.setSessionsExpanded(workspace.workspaceId, !sessionsOpenOf(workspace.workspaceId)) },
    // Starting a session force-expands the workspace row: the user must
    // SEE the new session appear, even if the row was collapsed.
    onStart: () => { actions.setSessionsExpanded(workspace.workspaceId, true); startSession(workspace.workspaceId) },
    onContextMenu: (e) => openCtx('workspace', workspace, e),
    dropHalf: wsDropHalf(workspace.workspaceId),
    dragEvents: workspaceDragEvents(workspace),
    custStyle: rowStyleOf('workspace:' + workspace.workspaceId),
    iconMode: (styleEntry('workspace:' + workspace.workspaceId) || {}).icon || 'solid',
    pulse,
    t,
  })]
  rows.push(...renderSessionTree(workspace, depth + 1))
  return rows
}

const renderPlainFolder = (node, depth) => {
  if (node.kind === 'ws') return renderWorkspaceEntry({ workspace: node.workspace }, depth, wsPulseOf(node.workspace))
  const expanded = searching || folderExpanded(node.path)
  const rows = [E(FolderRow, {
    key: 'f-' + node.path,
    node,
    depth,
    expanded,
    onToggle: () => { if (!searching) actions.setExpanded(node.path, !expanded) },
    onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
    dropInto: wsDropInto(node.path),
    dragEvents: folderDropEvents(node.path),
    custStyle: rowStyleOf('folder:' + node.path),
    iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
    pulse: expanded ? null : folderPulseOf(node),
    t,
  })]
  if (expanded) {
    for (const child of node.folders) rows.push(...renderPlainFolder(child, depth + 1))
    for (const workspace of node.workspaces) rows.push(...renderWorkspaceEntry({ workspace }, depth + 1, wsPulseOf(workspace)))
  }
  return rows
}
const renderSearchedFolder = (hit, depth) => {
  if (hit.kind === 'ws') return renderWorkspaceEntry({ workspace: hit.workspace }, depth)
  const node = hit.node
  const rows = [E(FolderRow, {
    key: 'f-' + node.path,
    node,
    depth,
    expanded: true,
    onToggle: () => {},
    onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
    dropInto: false,
    dragEvents: undefined,
    custStyle: rowStyleOf('folder:' + node.path),
    iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
    t,
  })]
  for (const child of hit.folders) rows.push(...renderSearchedFolder(child, depth + 1))
  for (const entry of hit.workspaces) rows.push(...renderWorkspaceEntry(entry, depth + 1))
  return rows
}

/**
 * Global pinned tray at the top of the tree: header row (pin glyph +
 * count) plus one session row per pin, tagged with its workspace leaf
 * name so the cross-workspace context stays readable. Rows open the
 * session directly (open() handles cross-workspace switching).
 */
const renderPinnedSection = (rows) => E('div', { key: 'pinned-section', className: 'bw-pinned-section' },
  E('div', { className: 'bw-pinned-header' },
    E('span', { className: 'bw-pin-mark' }, E(PinIcon16, { size: 11 })),
    E('span', null, t('pinned.header')),
    E('span', { className: 'bw-row-count' }, String(rows.length)),
  ),
  rows.map((s) => renderSessionRow(s, 0, workspaceIndexOf.get(s.id) || undefined, { pinned: true, inTray: true, workspaceTag: s.workspaceTag })),
)

// Global pinned tray: every pinned session that is visible right now,
// across workspaces and ungrouped, in pin-recency order (store order).
// Archived pins stay stored and appear as ordinary archive rows. During
// search the tray filters like any other row.
const pinnedTray = []
if (Array.isArray(pinnedList) && pinnedList.length > 0 && list) {
  for (const rawId of pinnedList) {
    const id = String(rawId)
    const row = sessionRowOf(id)
    if (!row || row.archived) continue
    if (!matchesSession(row)) continue
    const wsId = workspaceIndexOf.get(id)
    row.workspaceTag = wsId !== undefined ? workspaceTitleOf(wsId) : ''
    pinnedTray.push(row)
  }
}

const sectionRowsOf = groupId => orderRows(sectionedSessions.filter(row => sessionSectionOf(row.id) === groupId && !pinnedSet.has(row.id) && matchesSession(row)), sortOrder)
const renderSectionedSession = row => renderSessionRow(row, 0, workspaceIndexOf.get(row.id), {
  sectioned: true, workspaceTag: workspaceTitleOf(workspaceIndexOf.get(row.id)), tooltip: true,
})
const renderCustomWorkspaceGroups = () => {
  const rows = []
  for (const group of workspaceGroups) {
    const members = visibleItems.filter(workspace => workspaceGroupOf(workspace.workspaceId) === group.id)
    const looseRows = sectionRowsOf(group.id)
    if (archivedFilter === 'only' && members.length === 0 && looseRows.length === 0) continue
    const groupTree = buildWorkspaceList(members, recency)
    const groupMatch = searching && group.name.toLowerCase().includes(normalizedQuery)
    const hit = searching && !groupMatch ? searchAgent(groupTree) : null
    if (searching && !groupMatch && !hit && looseRows.length === 0) continue
    const expanded = searching || expandedMap['workspace-group:' + group.id] !== false
    rows.push(E(WorkspaceGroupRow, {
      key: 'workspace-group-' + group.id, group, expanded,
      onToggle: () => { if (!searching) actions.setExpanded('workspace-group:' + group.id, !expanded) },
      onContextMenu: event => openCtx('wgroup', group, event),
      dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === group.id,
      dragEvents: workspaceGroupDropEvents(group.id),
    }))
    if (expanded) {
      const entries = hit ? hit.workspaces : groupTree.workspaces.map(workspace => ({ workspace }))
      if (!searching || groupMatch || hit) {
        for (const entry of entries) rows.push(...renderWorkspaceEntry(entry, 0, wsPulseOf(entry.workspace)))
      }
      for (const row of looseRows) rows.push(renderSectionedSession(row))
    }
  }
  return rows
}
const renderProjectsHeader = () => {
  const looseRows = sectionRowsOf('')
  if (workspaceGroups.length === 0 && looseRows.length === 0) return []
  if (searching && !searched && looseRows.length === 0) return []
  if (archivedFilter === 'only' && projectItems.length === 0 && looseRows.length === 0) return []
  const group = { id: '', name: t('wgroup.projects') }
  return [E(WorkspaceGroupRow, {
    key: 'workspace-group-projects', group,
    onContextMenu: event => openCtx('wgroup', group, event),
    dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === '',
    dragEvents: workspaceGroupDropEvents(''),
  })]
}
let bodyRows = []
if (searching && groupedView) {
  // Grouped search preserves project provenance and expands matches.
  if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
  bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader())
  if (searched) {
    for (const child of searched.folders) bodyRows.push(...renderSearchedFolder(child, 0))
    for (const entry of searched.workspaces) bodyRows.push(...renderWorkspaceEntry(entry, 0))
  }
  for (const row of sectionRowsOf('')) bodyRows.push(renderSectionedSession(row))
} else if (timeSorted || viewMode === 'flat') {
  // Start from host accounts, not compressed tree nodes: a compressed
  // folder may be a workspace leaf and has no folders/workspaces arrays.
  const timelineRows = []
  const included = new Set()
  const append = (row) => {
    if (included.has(row.id) || pinnedSet.has(row.id) || !matchesSession(row)) return
    included.add(row.id)
    const workspaceId = workspaceIndexOf.get(row.id)
    row.workspaceTag = workspaceId !== undefined ? workspaceTitleOf(workspaceId) : ''
    timelineRows.push(row)
  }
  for (const workspace of items || []) for (const row of sessionsOf(workspace, true)) append(row)
  for (const row of ungrouped) append(row)
  if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
  if (timeSorted) {
    for (const row of renderTimeBuckets(timelineRows, null, 0)) bodyRows.push(row)
  } else {
    for (const row of orderRows(timelineRows, sortOrder)) {
      bodyRows.push(renderSessionRow(row, 0, null, { workspaceTag: row.workspaceTag, tagOnHover: true, tooltip: true }))
    }
  }
} else {
  if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
  bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader())
  for (const folder of tree.folders) bodyRows.push(...renderPlainFolder(folder, 0))
  for (const workspace of tree.workspaces) bodyRows.push(...renderWorkspaceEntry({ workspace }, 0, wsPulseOf(workspace)))
  for (const row of sectionRowsOf('')) bodyRows.push(renderSectionedSession(row))
  if (ungrouped.length > 0) {
    const plainUn = ungrouped.filter(s => sessionSectionOf(s.id) === null && !pinnedSet.has(s.id) && matchesSession(s))
    if (plainUn.length > 0) {
      bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
    }
    for (const s of plainUn) bodyRows.push(renderSessionRow(s, 0, null))
  }
}
if (searching && groupedView) {
  const matchedUngrouped = ungrouped.filter(row => sessionSectionOf(row.id) === null && !pinnedSet.has(row.id) && matchesSession(row))
  if (matchedUngrouped.length > 0) {
    bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
    for (const row of matchedUngrouped) bodyRows.push(renderSessionRow(row, 0, null))
  }
}
const isEmpty = bodyRows.length === 0
if (isEmpty) {
  let emptyText = t('empty.sessions')
  if (searching) emptyText = t('empty.search')
  else if (phase === 'pending') emptyText = '…'
  else if (archivedFilter === 'only') emptyText = t('empty.archived')
  else if (groupedView && visibleItems.length === 0) emptyText = t('empty')
  bodyRows = [E('div', { key: 'empty', className: 'bw-empty' },
    E('div', null, emptyText),
    archivedFilter !== 'show' && phase !== 'pending' ? E(BTN, { variant: 'outline', onClick: () => actions.setArchivedFilter('show') }, t('empty.showAll')) : null,
  )]
}


  return { bodyRows, isEmpty, matchesSession, pinnedTray, renderCustomWorkspaceGroups, renderPinnedSection, renderPlainFolder, renderProjectsHeader, renderSearchedFolder, renderSectionedSession, renderSessionNode, renderSessionRow, renderSessionTree, renderTimeBuckets, renderWorkspaceEntry, restoreSession, searchSessionNode, sectionRowsOf }
}
