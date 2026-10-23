/** Tree rendering: workspace entries, folders, time buckets, the pinned tray and session rows. */

import { BTN } from '../ui/base.ts'
import { BUCKET_ORDER, bucketOf } from '../core/time.ts'
import type { TimeBucket, Translate } from '../core/time.ts'
import { E } from '../platform.ts'
import { FolderRow, SessionGroupRow, SessionRow, WorkspaceGroupRow, WorkspaceRow } from '../rows.ts'
import type { SessionState } from '../rows.ts'
import { PinIcon16 } from '../icons.ts'
import { buildSessionTree, buildWorkspaceList, countSessionTree } from '../core/tree.ts'
import type { SessionTreeNode, WorkspaceInput, WorkspaceRow as TreeWorkspaceRow } from '../core/tree.ts'
import { currentSessionIdOf, orderRows } from '../core/view.ts'
import type { ArchivedFilter, SortOrder, TimeDirection, ViewMode } from '../core/view.ts'
import { saveTabs, setActiveTab, tabsActive, tabsForClick, tabsSnapshot } from '../tabs.ts'
import type { BrowserDrag, BrowserSessionList, BrowserSessionRow, BrowserTreeNode, BrowserWorkspaceGroup } from './model.ts'

/** Extra row flags the call sites add (pin membership, tray projection, hover tag). */
export interface SessionRowOptions {
  pinned?: boolean
  inTray?: boolean
  sectioned?: boolean
  workspaceTag?: string
  tagOnHover?: boolean
  tooltip?: boolean
}

/** Everything the tree view renders from: the derived model, drag helpers and row preferences. */
export interface BrowserTreeViewInput {
  actions: any
  tabs: any
  archivedFilter: ArchivedFilter
  canMoveWorkspaceGroup: boolean
  drag: BrowserDrag | null
  expandedMap: Record<string, boolean | undefined>
  fail: (text: string) => void
  folderDropEvents: (path: string) => any
  folderExpanded: (path: string) => boolean
  folderPulseOf: (node: BrowserTreeNode) => SessionState | null
  groupedView: boolean
  items?: ReadonlyArray<WorkspaceInput> | null
  list?: BrowserSessionList | null
  nodePulseOf: (node: SessionTreeNode) => SessionState | null
  /** Whether a plain session click opens a new tab (false = replace in place). */
  newTabOnClick: boolean
  now: number
  open?: ((sessionId: string) => unknown) | null
  openCtx: (kind: string, payload: any, event: any) => void
  phase: string
  pinnedList: ReadonlyArray<unknown>
  pinnedSet: ReadonlySet<string>
  projectItems: ReadonlyArray<WorkspaceInput>
  recency: Map<string, number> | undefined
  rowStyleOf: (key: string) => any
  sectionedSessions: ReadonlyArray<BrowserSessionRow>
  sessDropHalf: (sessionId: string) => any
  sessionDragEvents: (session: BrowserSessionRow, workspaceId: string | null | undefined, sectioned?: boolean) => any
  sessionDraggable: (session: BrowserSessionRow) => boolean
  sessionGroupOpen: (key: string) => boolean
  sessionRowOf: (id: string) => BrowserSessionRow | null
  sessionSectionOf: (id: string) => string | null
  sessionsOf: (workspace: WorkspaceInput, includeSectioned?: boolean) => BrowserSessionRow[]
  sessionsOpenOf: (workspaceId: string) => boolean
  setErrorText: (text: string) => void
  sgroupDropEvents: (workspaceId: string, path: string) => any
  sgroupDropInto: (workspaceId: string, path: string) => any
  sortOrder: SortOrder
  startSession?: ((workspaceId: string) => unknown) | null
  statusPulse: boolean
  statusDots: boolean
  styleEntry: (key: string) => any
  t: Translate
  timeDirection: TimeDirection
  timeSorted: boolean
  tree: BrowserTreeNode
  unarchiveSession?: ((sessionId: string) => unknown) | null
  ungrouped: ReadonlyArray<BrowserSessionRow>
  viewMode: ViewMode
  visibleItems: ReadonlyArray<WorkspaceInput>
  workspaceDragEvents: (workspace: TreeWorkspaceRow) => any
  workspaceGroupDropEvents: (groupId: string) => any
  workspaceGroupOf: (workspaceId: string) => string
  workspaceGroups: ReadonlyArray<BrowserWorkspaceGroup>
  workspaceIndexOf: ReadonlyMap<string, string>
  workspaceTitleOf: (workspaceId: string) => string
  wsDropHalf: (workspaceId: string) => any
  wsDropInto: (path: string) => boolean
  wsPulseOf: (workspace: TreeWorkspaceRow) => SessionState | null
}

export function createTreeView(input: BrowserTreeViewInput) {
  const {
    actions, tabs, archivedFilter, canMoveWorkspaceGroup, drag, expandedMap, fail, folderDropEvents, folderExpanded, folderPulseOf, groupedView, items, list, newTabOnClick, nodePulseOf, now, open, openCtx, phase, pinnedList, pinnedSet, projectItems, recency, rowStyleOf, sectionedSessions, sessDropHalf, sessionDragEvents, sessionDraggable, sessionGroupOpen, sessionRowOf, sessionSectionOf, sessionsOf, sessionsOpenOf, setErrorText, sgroupDropEvents, sgroupDropInto, sortOrder, startSession, statusPulse, statusDots, styleEntry, t, timeDirection, timeSorted, tree, unarchiveSession, ungrouped, viewMode, visibleItems, workspaceDragEvents, workspaceGroupDropEvents, workspaceGroupOf, workspaceGroups, workspaceIndexOf, workspaceTitleOf, wsDropHalf, wsDropInto, wsPulseOf
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
 * Pins remain tray-only. The time view never routes here — the global
 * timeline in the bodyRows assembly replaces the workspace scaffolding.
 */
const renderSessionTree = (workspace: WorkspaceInput, depth: number): any[] => {
  // Folder semantics: a closed workspace shows no sessions at all (the
  // list keeps its count badge); an open one shows the full session tree.
  if (!sessionsOpenOf(workspace.workspaceId)) return []
  const rows = sessionsOf(workspace)
  if (rows.length === 0) return []
  const unpinned = rows.filter(r => !pinnedSet.has(r.id))
  if (unpinned.length === 0) return []
  return renderSessionNode(buildSessionTree(unpinned, sortOrder), workspace.workspaceId, depth)
}

/** Recency buckets over un-pinned rows; empty buckets stay hidden. */
const renderTimeBuckets = (rows: BrowserSessionRow[], workspaceId: string | null, depth: number): any[] => {
  const buckets = new Map<TimeBucket, BrowserSessionRow[]>()
  for (const key of BUCKET_ORDER) buckets.set(key, [])
  for (const r of rows) buckets.get(bucketOf(r.updatedAt, now))!.push(r)
  const direction = timeDirection === 'oldest' ? 1 : -1
  const prefix = workspaceId || 'timeline'
  const out = []
  const bucketKeys = timeDirection === 'oldest' ? BUCKET_ORDER.slice().reverse() : BUCKET_ORDER
  for (const key of bucketKeys) {
    const bucketRows = buckets.get(key)!
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
const renderSessionNode = (node: SessionTreeNode, workspaceId: string, depth: number): any[] => {
  const out: any[] = []
  for (const group of node.groups) {
    const key = workspaceId + '|' + group.path
    const open = sessionGroupOpen(key)
    out.push(E(SessionGroupRow, {
      key: 'sg-' + key,
      name: group.name,
      depth,
      expanded: open,
      pulse: (statusPulse && !open) ? nodePulseOf(group) : null,
      count: countSessionTree(group),
      onToggle: () => { actions.setSessionGroupExpanded(key, !open) },
      onContextMenu: (e: any) => openCtx('sgroup', { workspaceId, path: group.path, name: group.name }, e),
      dropInto: sgroupDropInto(workspaceId, group.path),
      dragEvents: sgroupDropEvents(workspaceId, group.path),
      custStyle: rowStyleOf('sgroup:' + workspaceId + '|' + group.path),
      statusDots,
      t,
    }))
    if (open) out.push(...renderSessionNode(group, workspaceId, depth + 1))
  }
  for (const s of node.sessions) out.push(renderSessionRow(s as BrowserSessionRow, depth, workspaceId))
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
const restoreSession = (id: string): void => {
  if (typeof unarchiveSession !== 'function') return
  Promise.resolve().then(() => unarchiveSession(id)).catch(fail)
}
const renderSessionRow = (session: BrowserSessionRow, depth: number, workspaceId: string | null | undefined, opts?: SessionRowOptions): any => {
  const o: SessionRowOptions = opts || {}
  const pinned = o.pinned === true || pinnedSet.has(session.id)
  const togglePin = typeof actions.togglePin === 'function' ? (id: string) => actions.togglePin(id) : undefined
  const inTray = o.inTray === true
  return E(SessionRow, {
    key: String(session.id) + (inTray ? '-tray' : ''),
    node: session,
    depth,
    // Ids compare as strings so the row and the collapse relay (model.js)
    // agree on which session is on screen whatever the host hands over.
    current: currentSessionId !== null && currentSessionId === String(session.id),
    now,
    onOpen: (id: string, event: any) => {
      if (session.archived) { setErrorText(t('session.archivedHint')); return }
      // A plain click opens the session in a NEW tab (never on top of the page
      // you were reading); Shift inverts that to replace-in-place, or the other
      // way round when the "open in a new tab" setting is turned off. The gesture
      // is decided by tabsForClick so the rule stays a pure unit test.
      // The strip's own active id can be unset for a beat (it syncs on the view
      // change); the sidebar already knows which session is on screen, so use it
      // as the fallback that keeps that page as a chip on a fresh strip.
      const activeNow = tabsActive() || currentSessionId
      const tabsNow = tabsForClick(tabsSnapshot(), activeNow, id, {
        newTabOnClick: newTabOnClick !== false,
        shift: !!(event && event.shiftKey),
      })
      saveTabs(tabsNow)
      // Select the tab this click wrote, so the chip highlights in the same
      // frame as the navigation instead of after the shell reports the new
      // mainView retention.
      setActiveTab(id)
      open!(id)
    },
    onContextMenu: (e: any) => openCtx('session', session, e),
    dropHalf: workspaceId && !pinned && !o.sectioned ? sessDropHalf(session.id) : null,
    dragEvents: sessionDraggable(session) && (canMoveWorkspaceGroup || (workspaceId && !o.sectioned)) ? sessionDragEvents(session, workspaceId, o.sectioned === true) : undefined,
    custStyle: rowStyleOf('session:' + session.id),
    breathing: statusPulse,
    statusDots,
    pinned,
    onTogglePin: session.archived ? undefined : togglePin,
    onUnarchive: typeof unarchiveSession === 'function' ? restoreSession : undefined,
    workspaceTag: o.workspaceTag,
    tagOnHover: o.tagOnHover === true,
    tooltip: o.tooltip === true,
    t,
  })
}

const renderWorkspaceEntry = (entry: { workspace: TreeWorkspaceRow }, depth: number, pulse?: SessionState | null): any[] => {
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
    sessionsOpen: sessionsOpenOf(workspace.workspaceId),
    currentInside: !!(currentSessionId !== null && (workspace.sessionIds || []).includes(currentSessionId)),
    onToggle: () => { actions.setSessionsExpanded(workspace.workspaceId, !sessionsOpenOf(workspace.workspaceId)) },
    // Starting a session force-expands the workspace row: the user must
    // SEE the new session appear, even if the row was collapsed.
    onStart: () => { actions.setSessionsExpanded(workspace.workspaceId, true); startSession!(workspace.workspaceId) },
    onContextMenu: (e: any) => openCtx('workspace', workspace, e),
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

const renderPlainFolder = (node: BrowserTreeNode, depth: number): any[] => {
  if (node.kind === 'ws') return renderWorkspaceEntry({ workspace: node.workspace! }, depth, wsPulseOf(node.workspace!))
  const expanded = folderExpanded(node.path)
  const rows = [E(FolderRow, {
    key: 'f-' + node.path,
    node,
    depth,
    expanded,
    onToggle: () => { actions.setExpanded(node.path, !expanded) },
    onContextMenu: (e: any) => openCtx('folder', { path: node.path, name: node.name }, e),
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
/**
 * Global pinned tray at the top of the tree: header row (pin glyph +
 * count) plus one session row per pin, tagged with its workspace leaf
 * name so the cross-workspace context stays readable. Rows open the
 * session directly (open() handles cross-workspace switching).
 */
const renderPinnedSection = (rows: BrowserSessionRow[]) => E('div', { key: 'pinned-section', className: 'bw-pinned-section' },
  E('div', { className: 'bw-pinned-header' },
    E('span', { className: 'bw-pin-mark' }, E(PinIcon16, { size: 11 })),
    E('span', null, t('pinned.header')),
    E('span', { className: 'bw-row-count' }, String(rows.length)),
  ),
  rows.map((s) => renderSessionRow(s, 0, workspaceIndexOf.get(s.id) || undefined, { pinned: true, inTray: true, workspaceTag: s.workspaceTag })),
)

// Global pinned tray: every pinned session that is visible right now,
// across workspaces and ungrouped, in pin-recency order (store order).
// Archived pins stay stored and appear as ordinary archive rows.
const pinnedTray: BrowserSessionRow[] = []
if (Array.isArray(pinnedList) && pinnedList.length > 0 && list) {
  for (const rawId of pinnedList) {
    const id = String(rawId)
    const row = sessionRowOf(id)
    if (!row || row.archived) continue
    const wsId = workspaceIndexOf.get(id)
    row.workspaceTag = wsId !== undefined ? workspaceTitleOf(wsId) : ''
    pinnedTray.push(row)
  }
}

const sectionRowsOf = (groupId: string): BrowserSessionRow[] => orderRows(sectionedSessions.filter(row => sessionSectionOf(row.id) === groupId && !pinnedSet.has(row.id)), sortOrder)
const renderSectionedSession = (row: BrowserSessionRow): any => renderSessionRow(row, 0, workspaceIndexOf.get(row.id), {
  sectioned: true, workspaceTag: workspaceTitleOf(workspaceIndexOf.get(row.id)!), tooltip: true,
})
const renderCustomWorkspaceGroups = (): any[] => {
  const rows: any[] = []
  for (const group of workspaceGroups) {
    const members = visibleItems.filter(workspace => workspaceGroupOf(workspace.workspaceId) === group.id)
    const looseRows = sectionRowsOf(group.id)
    if (archivedFilter === 'only' && members.length === 0 && looseRows.length === 0) continue
    const groupTree = buildWorkspaceList(members, recency)
    const expanded = expandedMap['workspace-group:' + group.id] !== false
    rows.push(E(WorkspaceGroupRow, {
      key: 'workspace-group-' + group.id, group, expanded,
      onToggle: () => { actions.setExpanded('workspace-group:' + group.id, !expanded) },
      onContextMenu: (event: any) => openCtx('wgroup', group, event),
      dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === group.id,
      dragEvents: workspaceGroupDropEvents(group.id),
    }))
    if (expanded) {
      for (const workspace of groupTree.workspaces) rows.push(...renderWorkspaceEntry({ workspace }, 0, wsPulseOf(workspace)))
      for (const row of looseRows) rows.push(renderSectionedSession(row))
    }
  }
  return rows
}
const renderProjectsHeader = (): any[] => {
  const looseRows = sectionRowsOf('')
  if (workspaceGroups.length === 0 && looseRows.length === 0) return []
  if (archivedFilter === 'only' && projectItems.length === 0 && looseRows.length === 0) return []
  const group = { id: '', name: t('wgroup.projects') }
  return [E(WorkspaceGroupRow, {
    key: 'workspace-group-projects', group,
    onContextMenu: (event: any) => openCtx('wgroup', group, event),
    dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === '',
    dragEvents: workspaceGroupDropEvents(''),
  })]
}
let bodyRows: any[] = []
if (timeSorted || viewMode === 'flat') {
  // Start from host accounts, not compressed tree nodes: a compressed
  // folder may be a workspace leaf and has no folders/workspaces arrays.
  const timelineRows: BrowserSessionRow[] = []
  const included = new Set<string>()
  const append = (row: BrowserSessionRow): void => {
    if (included.has(row.id) || pinnedSet.has(row.id)) return
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
    const plainUn = ungrouped.filter(s => sessionSectionOf(s.id) === null && !pinnedSet.has(s.id))
    if (plainUn.length > 0) {
      bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
    }
    for (const s of plainUn) bodyRows.push(renderSessionRow(s, 0, null))
  }
}
const isEmpty = bodyRows.length === 0
if (isEmpty) {
  let emptyText = t('empty.sessions')
  if (phase === 'pending') emptyText = '…'
  else if (archivedFilter === 'only') emptyText = t('empty.archived')
  else if (groupedView && visibleItems.length === 0) emptyText = t('empty')
  bodyRows = [E('div', { key: 'empty', className: 'bw-empty' },
    E('div', null, emptyText),
    archivedFilter !== 'show' && phase !== 'pending' ? E(BTN, { variant: 'outline', onClick: () => actions.setArchivedFilter('show') }, t('empty.showAll')) : null,
  )]
}


  return { bodyRows, isEmpty, pinnedTray, renderCustomWorkspaceGroups, renderPinnedSection, renderPlainFolder, renderProjectsHeader, renderSectionedSession, renderSessionNode, renderSessionRow, renderSessionTree, renderTimeBuckets, renderWorkspaceEntry, restoreSession, sectionRowsOf }
}
