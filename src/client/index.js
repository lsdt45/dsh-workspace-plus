/**
 * dsh-workspace-plus — browser half, bundle entry (plain JavaScript, no build step
 * for the README's install path; this file is bundled into src/client.js).
 *
 * SOURCE, NOT THE SHIPPED ARTIFACT: `src/client.js` is generated from this file
 * and its siblings under `src/client/` by `scripts/build-client.mjs` (esbuild).
 * Never edit the artifact; run `npm run build` after editing here. The DSH
 * platform accepts exactly one client bundle per package
 * (`exports["./client"]`, flat module graph — see
 * @deepseek-ai/dsh-client-modules), which is why the sources are bundled instead
 * of being served as separate files.
 *
 * Three registrations:
 *  1. `sidebar.workspaces` (priority -1): replaces the shipped workspace
 *     browser with a hierarchy tree derived from "/" inside workspace titles.
 *  2. `conversation.hero.workspace.directoryFlow`: the add-workspace picking
 *     interaction for the conversation empty-state menu — native directory
 *     pick, then a parent-group popup, then create + rename with the prefix.
 *  3. `sidebar.workspaces.directoryFlow`: the same interaction for the
 *     shipped sidebar browser (fills only when that hole is declared, i.e.
 *     whenever this plugin's own browser is not the occupying entry).
 *
 * The single `hostRequire` below is the loader's factory `require`: every
 * request is a dsh client baseline module (see
 * @deepseek-ai/dsh-client-web seed.ts): react, @deepseek-ai/dsh-client-store,
 * @deepseek-ai/dsh-client-ui-primitives. The name avoids esbuild's CommonJS
 * `require` handling during bundling.
 */
import { installPlatform, React, E, ui, NS, storeKit } from './platform.js'
import { zh } from './i18n/zh.js'
import { en } from './i18n/en.js'
import { cls, basename, splitPlainSegs, splitTitleSegs, normPath } from './core/text.js'
import { bucketOf, BUCKET_ORDER, timeLabel } from './core/time.js'
import { VIEW_MODES, ARCHIVED_FILTERS, viewStateOf, sessionVisible, orderRows, pendingKindOf, sessionTitleOf, hasActiveScheduleOf, subagentRunningCounts } from './core/view.js'
import { buildSessionTree, countSessionTree, collectSessionRows, findSessionGroup, buildTree, buildWorkspaceList, countWorkspaces, materializeChain, compressTree } from './core/tree.js'
import { messageOf, SESSION_DELETE_ROUTE, checkSessionDelete, deleteSessionRecord, writeClipboardText, openSessionDirectory } from './host.js'
import { createViewStore } from './store.js'
import { icon, iconExport, resolveIcon, PinIcon16, lucideSvg, ListTreeIcon16, ListIcon16, CalendarDaysIcon16 } from './icons.js'
import { BTN, TextDialog, ConfirmDialog, createQuietBoundary, PickerList, renderWsTag, StyleNode } from './ui/base.js'
import { BetterFlow } from './ui/flow.js'
import { createBrowserModel } from './browser/model.js'
import { createDnd } from './browser/dnd.js'
import { createActions } from './browser/actions.js'
import { createTreeView } from './browser/tree-view.js'
import { createMenu } from './browser/menu.js'
import { iconOf, colorToRgb, rgbToHex, FolderRow, WorkspaceGroupRow, WorkspaceRow, sessionStateOf, PULSE_RANK, PULSE_COLORS, pulseRank, PulseGlow, relayStateOf, SessionRow, SessionGroupRow } from './rows.js'
import { SWATCHES, GLOW_MAX, ICON_CHOICES, CustomizeDialog } from './customize.js'
import { BetterWorkspaceSettings, BetterWorkspacePluginCard } from './settings.js'

window.__ModuleLoader__.load({
  id: 'dsh-workspace-plus',
  factory: (hostRequire) => {
    installPlatform(hostRequire)
    // Defined after the install: a class heritage expression evaluates when the
    // class is defined, so a module-level boundary class would see a null React.
    const QuietBoundary = createQuietBoundary()

    /* ============================== styles ============================ */

    /* ========================== view store =========================== */

    /* ============================ flow dialog ========================= */

    /* ============================== rows ============================== */

    /* ============================= browser ============================ */

    function BetterBrowser(props) {
      const {
        wide, expandSidebar,
        useSessions, useSessionPendingInteraction, useWorkspaces,
        useStore, actions,
        startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace,
        archiveSession, unarchiveSession, createWorkspace, pickDirectory, insertWorkspaceBefore, insertSessionBefore,
        deleteSession, checkSessionDelete: checkDelete, openDirectory, refreshSessions, refreshPage,
        t,
      } = props

      if (typeof useWorkspaces !== 'function' || typeof useSessions !== 'function') {
        console.error('[dsh-workspace-plus] standard snapshot hooks missing; browser renders nothing')
        return null
      }

      const items = useWorkspaces(s => s.items)
      const phase = useWorkspaces(s => s.phase)
      const archivedSessionIds = useWorkspaces(s => s.archivedSessionIds) || []
      const list = useSessions(s => s)
      const pending = useSessionPendingInteraction ? useSessionPendingInteraction(s => s) : null
      const storeFolders = useStore ? (useStore(s => s.folders) || []) : []
      const workspaceGroups = useStore ? (useStore(s => s.workspaceGroups) || []) : []
      const workspaceGroupById = useStore ? (useStore(s => s.workspaceGroupById) || {}) : {}
      const sessionSectionById = useStore ? (useStore(s => s.sessionSectionById) || {}) : {}
      const workspaceGroupIds = new Set(workspaceGroups.map(group => group.id))
      const workspaceGroupOf = id => workspaceGroupIds.has(workspaceGroupById[id]) ? workspaceGroupById[id] : ''
      // null follows the host workspace; '' explicitly lives under Projects.
      const sessionSectionOf = id => {
        if (!Object.prototype.hasOwnProperty.call(sessionSectionById, id)) return null
        const groupId = sessionSectionById[id]
        if (groupId === '' || workspaceGroupIds.has(groupId)) return groupId
        return null
      }
      const expandedMap = useStore ? (useStore(s => s.expanded) || {}) : {}
      const sessionsExpandedMap = useStore ? (useStore(s => s.sessionsExpanded) || {}) : {}
      const sessionGroupsMap = useStore ? (useStore(s => s.sessionGroups) || {}) : {}
      const prefsMap = useStore ? (useStore(s => s.prefs) || {}) : {}
      const stylingMap = useStore ? (useStore(s => s.styling) || {}) : {}
      const compactChains = prefsMap.compactChains !== false
      const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefsMap)
      const timeSorted = viewMode === 'time'
      const automaticSort = timeSorted || sortOrder === 'latest'
      const groupedView = viewMode === 'projects' || viewMode === 'workspaces'
      const pinnedList = useStore ? (useStore(s => s.pinned) || []) : []
      const statusPulse = prefsMap.statusPulse !== false
      const archivedSet = new Set(archivedSessionIds)
      const subCounts = React.useMemo(() => subagentRunningCounts(list ? list.byId : {}), [list ? list.byId : null])
      // Pinned membership set + workspace lookup for the global pinned tray.
      const pinnedSet = new Set(pinnedList.map(String).filter(id => !archivedSet.has(id)))
      const workspaceTitleOf = (workspaceId) => {
        const workspace = (items || []).find(w => w.workspaceId === workspaceId)
        if (!workspace) return ''
        const segs = splitTitleSegs(workspace.title)
        return segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || '')
      }

      const [query, setQuery] = React.useState('')
      const [searchOpen, setSearchOpen] = React.useState(false)
      const [flowOpen, setFlowOpen] = React.useState(false)
      const [flowParent, setFlowParent] = React.useState('') // parent path prefill for the add-workspace flow (context menu entry)
      const [dialog, setDialog] = React.useState(null) // { kind, ... }
      const [ctx, setCtx] = React.useState(null) // context menu { kind, payload, x, y }
      const [ctxSubmenu, setCtxSubmenu] = React.useState(null)
      const [customize, setCustomize] = React.useState(null) // { kind, entryKey, name }
      const [errorText, setErrorText] = React.useState(null)
      const [drag, setDrag] = React.useState(null) // { kind: 'workspace'|'session', source, over } | null
      const [deleteAvailable, setDeleteAvailable] = React.useState(typeof deleteSession === 'function' && !checkDelete)
      const [deleting, setDeleting] = React.useState(false)
      const deletingRef = React.useRef(false)
      const [notice, setNotice] = React.useState(null)
      const ownMenuRoot = React.useRef(null)
      React.useEffect(() => {
        // The installed context-menu plugin listens at document capture. Mark
        // our rows handled at window capture, then let React open their menu.
        const ownContextMenu = event => {
          if (!event.target || typeof event.target.closest !== 'function') return
          const row = event.target.closest('[data-bw-context]')
          if (row && ownMenuRoot.current && ownMenuRoot.current.contains(row)) event.preventDefault()
        }
        window.addEventListener('contextmenu', ownContextMenu, true)
        return () => window.removeEventListener('contextmenu', ownContextMenu, true)
      }, [])
      React.useEffect(() => {
        if (!ctx || ctx.kind !== 'session' || typeof checkDelete !== 'function') return
        let alive = true
        Promise.resolve().then(checkDelete).then(available => { if (alive) setDeleteAvailable(available === true) }).catch(() => { if (alive) setDeleteAvailable(false) })
        return () => { alive = false }
      }, [ctx, checkDelete])
      React.useEffect(() => {
        if (!notice) return
        const timer = setTimeout(() => setNotice(null), 2500)
        return () => clearTimeout(timer)
      }, [notice])
      // Workspace drags arm their state one frame LATE (see workspaceDragEvents):
      // arming synchronously re-renders during the dragstart dispatch, the chain
      // expansion inserts rows above the drag source, the cursor leaves the
      // source element, and Chromium cancels the whole gesture. dragEnd clears
      // the timer so a same-tick cancel never leaves a ghost drag behind.
      const wsDragArmTimer = React.useRef(null)
      // Quote-on-land eligibility sets (mount-scoped):
      // - blankSeen: ids observed BLANK in any snapshot. A blank row is a
      //   freshly created New Session, so ONLY these may ever receive an
      //   automatic quote. A titled row missing from blankSeen — rows that
      //   stream into the store after mount, fork children (born titled),
      //   rows hidden by load-time filtering — predates this mount or was
      //   named deliberately, and is NEVER touched. (0.9.1 keyed "fresh" off
      //   the first snapshot instead, so late-arriving OLD sessions were
      //   misquoted; blank is the only trustworthy birth mark.)
      // - humanTouched: ids renamed through THIS component's user actions
      //   (rename dialog, drag into a group, group prefix rewrite). A
      //   user-written "/" is a deliberate grouping; a user-written quote
      //   pair is the verbatim escape. The host pins user titles (a later
      //   automatic name is superseded), so the mark is final.
      // - autoStable: id → { title, since } for freshly landed automatic
      //   titles waiting out the stabilization window below.
      const blankSeenRef = React.useRef(null)
      const humanTouchedRef = React.useRef(null)
      const autoStableRef = React.useRef(null)
      const stableTimerRef = React.useRef(null)
      const [stableTick, setStableTick] = React.useState(0)
      // The wire cannot tell the deterministic fallback title (first user
      // message echo, "/"-prone) from the async LLM name that replaces it
      // seconds later — SessionSummary carries no source field. So a landed
      // "/"-bearing title is quoted only after it survives 20s unchanged;
      // any rename resets the window, and the common slash-free LLM name
      // simply releases the session untouched. Only the "new session
      // auto-title stayed slashy" case gets wrapped.
      const TITLE_STABLE_MS = 20000

      // User-driven renames funnel through here: mark first so the
      // quote-on-land effect never second-guesses a deliberate title.
      const renameByUser = (sessionId, title) => {
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        humanTouchedRef.current.add(String(sessionId))
        if (autoStableRef.current) autoStableRef.current.delete(String(sessionId))
        return renameSession(sessionId, title)
      }

      React.useEffect(() => {
        if (!list || !list.byId || typeof renameSession !== 'function') return
        if (blankSeenRef.current === null) blankSeenRef.current = new Set()
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        if (autoStableRef.current === null) autoStableRef.current = new Map()
        const blankSeen = blankSeenRef.current
        const touched = humanTouchedRef.current
        const stable = autoStableRef.current
        const now = Date.now()
        const fixes = []
        let deadline = Infinity
        for (const id of Object.keys(list.byId)) {
          const summary = list.byId[id]
          if (!summary) continue
          if (summary.blank) { blankSeen.add(id); stable.delete(id); continue }
          if (!blankSeen.has(id) || touched.has(id)) { stable.delete(id); continue }
          const text = String(summary.title || '')
          if (text.trim() === '' || text.includes('“') || text.includes('"') || !text.includes('/')) {
            stable.delete(id) // quoted already, or the LLM name arrived slash-free: done
            continue
          }
          const prev = stable.get(id)
          if (prev && prev.title === text) {
            if (now - prev.since >= TITLE_STABLE_MS) {
              stable.delete(id)
              fixes.push([id, '“' + text + '”'])
            } else {
              deadline = Math.min(deadline, prev.since + TITLE_STABLE_MS)
            }
            continue
          }
          stable.set(id, { title: text, since: now }) // new landing or fallback→LLM rename: reset
          deadline = Math.min(deadline, now + TITLE_STABLE_MS)
        }
        for (const id of Array.from(stable.keys())) {
          if (!list.byId[id]) stable.delete(id) // session vanished (archived/deleted): drop the wait
        }
        if (stableTimerRef.current !== null) { clearTimeout(stableTimerRef.current); stableTimerRef.current = null }
        if (deadline !== Infinity) {
          stableTimerRef.current = setTimeout(() => {
            stableTimerRef.current = null
            setStableTick(t => t + 1) // re-evaluate through the effect, never rename from a stale closure
          }, Math.max(1, deadline - now))
        }
        if (fixes.length === 0) return
        Promise.resolve()
          .then(async () => { for (const [id, next] of fixes) await renameSession(id, next) })
          .catch(() => { /* display-layer fallback keeps the row flat; a later snapshot re-evaluates */ })
      }, [list, stableTick])
      React.useEffect(() => () => {
        if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current)
      }, [])

      /**
       * Stale-pin self-heal: unpin only sessions that were SEEN in list.byId
       * on a previous snapshot and later vanished (hard delete). Progressive
       * hydration never un-sees an id it has not shown yet, so mount-time
       * partial snapshots never strip pins; archived ids remain in byId and
       * keep their pin for the unarchive path.
       */
      const seenIdsRef = React.useRef(null)
      React.useEffect(() => {
        if (!list || !list.byId) return
        if (seenIdsRef.current === null) seenIdsRef.current = new Set()
        const seen = seenIdsRef.current
        const current = new Set(Object.keys(list.byId))
        const pinnedNow = new Set((Array.isArray(pinnedList) ? pinnedList : []).map(String))
        if (pinnedNow.size > 0) {
          for (const id of Array.from(seen)) {
            if (!current.has(id) && pinnedNow.has(id)) actions.togglePin(id)
          }
        }
        for (const id of current) seen.add(id)
      }, [list, pinnedList])
      const normalizedQuery = query.trim().toLowerCase()
      const now = Date.now()
      React.useEffect(() => {
        if (wsDragArmTimer.current !== null) { clearTimeout(wsDragArmTimer.current); wsDragArmTimer.current = null }
        setDrag(null)
        return () => { if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current) }
      }, [viewMode, sortOrder, archivedFilter, normalizedQuery])

      const fail = (text) => { setFlowOpen(false); setDialog(null); setNotice(null); setErrorText(String(text || 'unknown error')) }

      const styleEntry = (key) => stylingMap[key] || null
      const rowStyleOf = (key) => {
        const entry = styleEntry(key)
        if (!entry || !entry.color) return null
        const glow = Number(entry.glow) || 0
        const weight = Number(entry.weight) || 0
        const shadow = entry.shadow === true
        const shadows = []
        if (glow > 0) shadows.push('0 0 ' + glow + 'px ' + entry.color)
        if (shadow) shadows.push('1px 1px 2px rgba(0,0,0,.85)')
        return {
          color: entry.color,
          fontWeight: weight > 0 ? weight : undefined,
          textShadow: shadows.length > 0 ? shadows.join(',') : undefined,
        }
      }
      const keyOf = (kind, payload) => {
        if (kind === 'folder') return 'folder:' + payload.path
        if (kind === 'workspace') return 'workspace:' + payload.workspaceId
        if (kind === 'session') return 'session:' + payload.id
        if (kind === 'sgroup') return 'sgroup:' + payload.workspaceId + '|' + payload.path
        return String(kind)
      }

      // accounted: ids bound to some workspace (host membership); their
      // workspace id doubles as tray provenance. All rows build through
      // sessionRowOf so visibility, translations, and derived flags stay
      // identical across the tree, the ungrouped area, and the pinned tray.
      // Derived once per render; the destructuring keeps every downstream name
      // unchanged, so the rest of this component reads as before.
      const {
        searching, accounted, workspaceIndexOf, sessionRowOf, ungrouped,
        sectionedSessions, visibleItems, workspaceRecency, recency, projectItems, tree,
        sessionsOf, searchAgent, searched, nodePulseOf, wsPulseOf, wsAllPulseOf,
        folderPulseOf, folderExpanded, sessionsOpenOf, sessionGroupOpen,
      } = createBrowserModel({
        normalizedQuery, items, list, archivedSet, archivedFilter, subCounts, pending, t,
        sessionSectionOf, drag, sortOrder, viewMode, storeFolders, compactChains,
        workspaceGroupOf, statusPulse, expandedMap, sessionsExpandedMap, sessionGroupsMap,
      })

      /* --------------------- status breathing relay -------------------- */

      // Highest-priority status across a whole session subtree (groups + rows).

      const openCtx = (kind, payload, e) => {
        if (e) e.preventDefault()
        setCtxSubmenu(null)
        setCtx({ kind, payload, x: e.clientX, y: e.clientY })
      }

      /* --------------------------- dialogs --------------------------- */
      // TextDialog / ConfirmDialog are module-level components: a per-render
      // inline definition would remount on every parent tick and drop input.

      /* ---------------------------- render --------------------------- */


      const {
        assignSessionSection, assignWorkspaceGroup, copySessionText, findTreeNode, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename
      } = createActions({
        actions, deleteAvailable, deleteSession, deleteWorkspace, deletingRef, items, list, pinnedList, refreshSessions, renameByUser, renameWorkspace, sessionsOf, setDeleting, setDialog, setErrorText, setNotice, storeFolders, t, tree, workspaceGroupIds, workspaceGroupOf, workspaceGroups, workspaceIndexOf
      })

      const {
        canDragWorkspace, canMoveWorkspaceGroup, canReorderSessions, canReorderWorkspaces, commitSessionDrop, commitSessionMoveInto, commitWorkspaceDrop, commitWorkspaceMoveInto, dragMatches, folderDropEvents, nextWorkspaceAfter, rowHalf, sessDropHalf, sessionDragEvents, sessionDraggable, sgroupDropEvents, sgroupDropInto, workspaceDragEvents, workspaceGroupDropEvents, wsDropHalf, wsDropInto
      } = createDnd({
        archivedSet, assignSessionSection, assignWorkspaceGroup, automaticSort, drag, findTreeNode, groupedView, insertSessionBefore, insertWorkspaceBefore, items, pinnedSet, recency, renameByUser, renameWorkspace, searching, sessionsOf, setDrag, tree, viewMode, visibleItems, workspaceGroupOf, workspaceGroups, wsDragArmTimer
      })

      const {
        bodyRows, isEmpty, matchesSession, pinnedTray, renderCustomWorkspaceGroups, renderPinnedSection, renderPlainFolder, renderProjectsHeader, renderSearchedFolder, renderSectionedSession, renderSessionNode, renderSessionRow, renderSessionTree, renderTimeBuckets, renderWorkspaceEntry, restoreSession, searchSessionNode, sectionRowsOf
      } = createTreeView({
        actions, archivedFilter, canMoveWorkspaceGroup, drag, expandedMap, folderDropEvents, folderExpanded, folderPulseOf, groupedView, items, list, nodePulseOf, normalizedQuery, now, openCtx, phase, pinnedList, pinnedSet, projectItems, recency, rowStyleOf, searchAgent, searched, searching, sectionedSessions, sessDropHalf, sessionDragEvents, sessionDraggable, sessionGroupOpen, sessionRowOf, sessionSectionOf, sessionsOf, sessionsOpenOf, setErrorText, sgroupDropEvents, sgroupDropInto, sortOrder, startSession, statusPulse, styleEntry, t, timeDirection, timeSorted, tree, unarchiveSession, ungrouped, viewMode, visibleItems, workspaceDragEvents, workspaceGroupDropEvents, workspaceGroupOf, workspaceGroups, workspaceIndexOf, workspaceTitleOf, wsDropHalf, wsDropInto, wsPulseOf
      })

      const {
        ctxItems, handleCtxPick
      } = createMenu({
        actions, archiveSession, archivedFilter, assignSessionSection, assignWorkspaceGroup, automaticSort, copySessionText, ctx, deleteAvailable, deleting, forkSession, keyOf, openDirectory, pinnedSet, refreshPage, renameSession, restoreSession, setCtx, setCtxSubmenu, setCustomize, setDialog, setDrag, setFlowOpen, setFlowParent, storeFolders, t, timeDirection, timeSorted, unarchiveSession, viewMode
      })

      if (!wide) {
        return E('div', { className: 'bw-rail' },
          StyleNode(),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.search'), onClick: () => { expandSidebar(); setSearchOpen(true) } }, icon('IconSearchOutline16', 18)),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.add'), onClick: () => { expandSidebar(); setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16', 18)),
        )
      }

      const dialogElement = (() => {
        if (dialog === null) return null
        if (dialog.kind === 'wgroup-new' || dialog.kind === 'wgroup-rename') return E(TextDialog, {
          key: dialog.kind, title: t(dialog.kind === 'wgroup-new' ? 'wgroup.new.title' : 'wgroup.rename'),
          hint: t('wgroup.hint'), initial: dialog.name || '',
          onConfirm: name => submitWorkspaceGroup(dialog, name), onClose: () => setDialog(null), t,
        })
        if (dialog.kind === 'wgroup-delete') return E(ConfirmDialog, {
          key: 'wgroup-delete', title: t('wgroup.delete'), body: t('wgroup.delete.body', { name: dialog.group.name }),
          onConfirm: () => { actions.deleteWorkspaceGroup(dialog.group.id); setDialog(null) },
          onClose: () => setDialog(null), t,
        })
        if (dialog.kind === 'ws-rename') return E(TextDialog, {
          key: 'ws-rename',
          title: t('ws.rename.title'),
          hint: t('ws.rename.hint'),
          initial: dialog.workspace.title || dialog.workspace.leaf,
          onConfirm: (v) => submitWorkspaceRename(dialog.workspace, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'ws-delete') return E(ConfirmDialog, {
          key: 'ws-delete',
          title: t('ws.delete.title'),
          body: t('ws.delete.body', { name: dialog.workspace.title || dialog.workspace.leaf }),
          onConfirm: () => submitWorkspaceDelete(dialog.workspace),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sess-rename') return E(TextDialog, {
          key: 'sess-rename',
          title: t('menu.rename'),
          initial: dialog.session.title,
          onConfirm: (v) => submitSessionRename(dialog.session, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sess-delete') return E(ConfirmDialog, {
          key: 'sess-delete', title: t('session.delete.title'),
          body: t('session.delete.body', { name: dialog.session.title }),
          confirmLabel: t(deleting ? 'session.delete.busy' : 'session.delete.confirm'), danger: true, busy: deleting,
          onConfirm: () => submitSessionDelete(dialog.session),
          onClose: () => { if (!deletingRef.current) setDialog(null) }, t,
        })
        if (dialog.kind === 'sgroup-rename') return E(TextDialog, {
          key: 'sgroup-rename',
          title: t('menu.renameSgroup'),
          hint: t('ws.rename.hint'),
          initial: dialog.target.name,
          onConfirm: (v) => submitSessionGroupRename(dialog.target, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-new') return E(TextDialog, {
          key: 'folder-new',
          title: t('folder.new.title'),
          hint: t('folder.new.hint'),
          initial: dialog.parentPath ? dialog.parentPath + '/' : '',
          onConfirm: (v) => submitFolderNew(dialog.parentPath || '', v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-rename') return E(TextDialog, {
          key: 'folder-rename',
          title: t('folder.rename.title'),
          hint: t('folder.rename.hint'),
          initial: dialog.path,
          onConfirm: (v) => submitFolderRename(dialog.path, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-delete') {
          return E(ConfirmDialog, {
            key: 'folder-delete',
            title: t('menu.removeFolder'),
            body: t('folder.delete.body', { name: dialog.path }),
            onConfirm: () => submitFolderDelete(dialog.path),
            onClose: () => setDialog(null),
            t,
          })
        }
        return null
      })()

      const flowOwner = {
        open: flowOpen,
        busy: false,
        onPicked: () => {},
        onCancel: () => setFlowOpen(false),
        onError: fail,
      }

      const viewGlyph = () => {
        if (viewMode === 'time') return E(CalendarDaysIcon16, { size: 15 })
        if (viewMode === 'flat') return E(ListIcon16, { size: 15 })
        if (viewMode === 'workspaces') return icon('IconFolderClose16', 15)
        return E(ListTreeIcon16, { size: 15 })
      }
      const renderCtxItem = (item, index) => {
        if (item.sep) return E('div', { key: 'sep-' + index, className: 'bw-ctx-sep' })
        if (item.heading) return E('div', { key: 'heading-' + index, className: 'bw-ctx-heading' }, item.heading)
        let checked
        if (item.checked !== undefined) checked = String(item.checked)
        let leading = null
        const iconClass = item.role === 'menuitemradio' ? 'bw-sort-menu-check' : cls('bw-menu-icon', item.id === 'pin' && 'bw-menu-pin')
        if (item.leading !== undefined) leading = E('span', { className: iconClass, 'aria-hidden': true }, item.leading)
        else if (item.leadingIcon) leading = E('span', { className: iconClass, 'aria-hidden': true }, E(item.leadingIcon, { size: 14 }))
        return E('button', {
          key: item.id, type: 'button',
          className: cls('bw-ctx-item', item.danger && 'bw-ctx-danger', item.sub && 'bw-ctx-subitem'),
          role: item.role || 'menuitem', 'aria-checked': checked, disabled: item.disabled === true, title: item.hint,
          'aria-haspopup': item.submenu ? 'menu' : undefined,
          'aria-expanded': item.submenu ? ctxSubmenu !== null : undefined,
          onMouseEnter: event => { if (item.submenu) openSectionMenu(event); else if (!item.groupChoice) setCtxSubmenu(null) },
          onKeyDown: event => { if (item.submenu && event.key === 'ArrowRight') { event.preventDefault(); openSectionMenu(event) } },
          onClick: event => { if (item.submenu) openSectionMenu(event); else handleCtxPick(item.id) },
        }, leading, E('span', { className: 'bw-menu-label' }, item.label), item.submenu ? icon('IconChevronRightOutline14', 14) : null, item.shortcut ? E('span', { className: 'bw-menu-shortcut' }, item.shortcut) : null)
      }
      const openSectionMenu = event => {
        const rect = event.currentTarget.getBoundingClientRect()
        let x = rect.right + 4
        if (x + 280 > window.innerWidth - 8) x = rect.left - 284
        setCtxSubmenu({ x: Math.max(8, x), y: rect.top })
      }
      const sectionMenuItems = () => {
        if (!ctx || (ctx.kind !== 'workspace' && ctx.kind !== 'session')) return []
        const isSession = ctx.kind === 'session'
        let currentGroup = workspaceGroupOf(ctx.payload.workspaceId)
        let followsWorkspace = false
        if (isSession) {
          currentGroup = sessionSectionOf(ctx.payload.id)
          followsWorkspace = currentGroup === null && workspaceIndexOf.has(ctx.payload.id)
          if (currentGroup === null && !followsWorkspace) currentGroup = ''
        }
        const choice = group => ({
          id: (isSession ? 'assign-session-section:' : 'assign-workspace-group:') + group.id, label: group.name, groupChoice: true,
          role: 'menuitemradio', checked: currentGroup === group.id,
          leading: currentGroup === group.id ? icon('IconCheckOutline16', 14) : null,
        })
        const items = [
          ...workspaceGroups.map(choice),
          choice({ id: '', name: t('wgroup.unassigned') }),
        ]
        if (isSession && workspaceIndexOf.has(ctx.payload.id)) items.push({
          id: 'follow-workspace', label: t('wgroup.followWorkspace'), groupChoice: true, role: 'menuitemradio', checked: followsWorkspace,
          leading: followsWorkspace ? icon('IconCheckOutline16', 14) : null,
        })
        items.push({ sep: true }, { id: 'new-workspace-group', label: t('wgroup.new'), groupChoice: true, leading: icon('IconPlusOutline16', 14) })
        return items
      }
      let menuHeight = 240
      if (ctx && ctx.kind === 'view') menuHeight = 450
      else if (ctx && ctx.kind === 'session') menuHeight = 400

      return E('div', { className: 'bw-root', ref: ownMenuRoot },
        StyleNode(),
        E('div', { className: 'bw-header' },
          E('div', { className: 'bw-header-title' }, t('title')),
          (searchOpen || query !== '') ? E('input', {
            className: 'bw-input',
            style: { width: 130, flex: 'none' },
            value: query,
            autoFocus: true,
            placeholder: t('search.placeholder'),
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Escape') { setQuery(''); setSearchOpen(false) } },
            onBlur: () => { if (query === '') setSearchOpen(false) },
          }) : null,
          E('button', {
            type: 'button', className: 'bw-icon-btn', 'aria-label': t('view.label'), title: t('view.label'),
            'aria-haspopup': 'menu', 'aria-expanded': ctx !== null && ctx.kind === 'view',
            onClick: (e) => { e.preventDefault(); setCtx({ kind: 'view', payload: {}, x: e.clientX, y: e.clientY }) },
          }, viewGlyph()),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('search.placeholder'), onClick: () => setSearchOpen(v => !v) }, icon('IconSearchOutline16')),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('add'), onClick: () => { setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16')),
        ),
        E('div', { className: 'bw-tree', role: 'tree', 'aria-label': t('title') }, bodyRows),
        E(BetterFlow, {
          open: flowOpen,
          busy: false,
          initialParent: flowParent,
          onPicked: flowOwner.onPicked,
          onCancel: flowOwner.onCancel,
          onError: flowOwner.onError,
          createWorkspace,
          renameWorkspace,
          pickDirectory,
          useWorkspaces,
          actions,
          useStore,
          t,
        }),
        dialogElement,
        notice ? E('div', { className: 'bw-notice', role: 'status', 'aria-live': 'polite' }, notice) : null,
        ctx !== null ? E('div', {
          className: 'bw-ctx-overlay',
          onMouseDown: () => setCtx(null),
          onContextMenu: (e) => e.preventDefault(),
          onKeyDown: event => { if (event.key === 'Escape') { setCtx(null); setCtxSubmenu(null) } },
        },
          E('div', {
            className: 'bw-ctx-menu',
            role: 'menu', 'aria-label': ctx.kind === 'view' ? t('view.label') : undefined,
            style: { left: Math.max(8, Math.min(ctx.x, window.innerWidth - 250)), top: Math.max(8, Math.min(ctx.y, window.innerHeight - menuHeight)) },
            onMouseDown: (e) => e.stopPropagation(),
            onContextMenu: (e) => e.preventDefault(),
          },
            ctxItems().map(renderCtxItem),
          ),
          (ctx.kind === 'workspace' || ctx.kind === 'session') && ctxSubmenu ? E('div', {
            className: 'bw-ctx-menu bw-ctx-submenu', role: 'menu', 'aria-label': t('wgroup.menu'),
            style: { left: ctxSubmenu.x, top: Math.max(8, Math.min(ctxSubmenu.y, window.innerHeight - (sectionMenuItems().length * 28 + 12))) },
            onMouseDown: event => event.stopPropagation(), onContextMenu: event => event.preventDefault(),
          }, sectionMenuItems().map(renderCtxItem)) : null,
        ) : null,
        E(CustomizeDialog, {
          open: customize !== null,
          kind: customize ? customize.kind : undefined,
          initial: customize ? styleEntry(customize.entryKey) : undefined,
          onChange: (style) => { if (customize) actions.setStyling(customize.entryKey, style) },
          onReset: () => { if (customize) actions.setStyling(customize.entryKey, null) },
          onClose: () => setCustomize(null),
          t,
        }),
        E(ui.Modal, {
          open: errorText !== null,
          onClose: () => setErrorText(null),
          closeLabel: t('close'),
          title: t('error.title'),
          footer: E('div', { className: 'bw-modal-actions' }, E(BTN, { variant: 'primary', onClick: () => setErrorText(null) }, t('close'))),
        }, E('div', { className: 'bw-modal-body' }, E('div', { className: 'bw-error-text', role: 'alert' }, errorText || '')), StyleNode()),
      )
    }

    /* ============================ plugin ============================== */

    const flowSource = (slots, hole) => ({
      getSnapshot: () => {
        try { return slots.entries(hole).length > 0 } catch { return false }
      },
      subscribe: (listener) => {
        try { return slots.subscribe(hole, listener) } catch { return () => {} }
      },
    })

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined || typeof slots.register !== 'function') {
        console.error('[dsh-workspace-plus] slots service unavailable; plugin idle')
        return
      }
      const sessions = ctx.get('sessions')
      const workspaces = ctx.get('workspaces')
      const uiWorkspace = ctx.get('uiWorkspace')
      if (!sessions || !workspaces || !uiWorkspace) {
        console.error('[dsh-workspace-plus] required services missing', {
          sessions: !!sessions, workspaces: !!workspaces, uiWorkspace: !!uiWorkspace,
        })
        return
      }

      if (ctx.locale && typeof ctx.locale.register === 'function') {
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { zh, en })
          } catch (localeError) {
            console.warn('[dsh-workspace-plus] dictionary registration failed', localeError)
            return () => {}
          }
        }, 'better-workspace: dictionaries')
      }

      const searchSessions = async (query, signal) => {
        const result = await sessions.search(query, signal)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session search failed')
        return result.value
      }
      const renameSession = async (sessionId, title) => {
        const binding = sessions.binding(sessionId)
        const session = binding && binding.session
        if (!session) throw new Error('unknown session "' + sessionId + '"')
        const result = await session.rename(title)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session rename failed')
      }
      const openSessionCompat = (sessionId) => {
        // 0.1.7: sessions.open 已移除；官方入口为 uiWorkspace.openSession（旧版 harness 回退保留）
        if (uiWorkspace && typeof uiWorkspace.openSession === 'function') return uiWorkspace.openSession(sessionId)
        if (typeof sessions.open === 'function') return sessions.open(sessionId)
      }
      const forkSession = (sessionId) => {
        return sessions.fork({ sessionId, increaseTitle: true })
          .then((childId) => openSessionCompat(childId))
      }

      const browserInjected = () => ({
        startSession: (workspaceId) => { uiWorkspace.startSession(workspaceId) },
        open: (sessionId) => { openSessionCompat(sessionId) },
        searchSessions,
        searchResultLimit: sessions.searchResultLimit !== undefined ? sessions.searchResultLimit : 20,
        renameSession,
        forkSession,
        deleteSession: deleteSessionRecord,
        checkSessionDelete,
        openDirectory: openSessionDirectory,
        refreshSessions: typeof sessions.refresh === 'function' ? () => sessions.refresh() : undefined,
        refreshPage: () => window.location.reload(),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
        insertWorkspaceBefore: typeof workspaces.insertBefore === 'function'
          ? (workspaceId, beforeWorkspaceId) => workspaces.insertBefore(workspaceId, beforeWorkspaceId)
          : undefined,
        // Official contract exposes session reorder through the WORKSPACES
        // service (see dsh ui-workspace client index.ts); feature-probed so
        // older hosts degrade to "group-move only" instead of a TypeError.
        insertSessionBefore: typeof workspaces.insertSessionBefore === 'function'
          ? (workspaceId, sessionId, beforeSessionId) => workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId)
          : undefined,
        archiveSession: (sessionId) => uiWorkspace.archiveSession(sessionId),
        unarchiveSession: typeof uiWorkspace.unarchiveSession === 'function'
          ? (sessionId) => uiWorkspace.unarchiveSession(sessionId)
          : undefined,
        createWorkspace: (input) => workspaces.create(input),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: {
          directoryFlow: flowSource(slots, 'sidebar.workspaces.directoryFlow'),
        },
      })
      const flowInjected = (hole) => () => ({
        createWorkspace: (input) => workspaces.create(input),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: { directoryFlow: flowSource(slots, hole) },
      })

      // Registration helper: a thrown register (semantics drift, vanishing
      // hole declaration mid-transition) degrades this one seat, never the
      // plugin fiber — the whole web boot is all-or-nothing.
      const guarded = (slotKey, options, component) => () => {
        try {
          return slots.register(options, (props) => E(QuietBoundary, null, E(component, props)))
        } catch (registerError) {
          console.warn('[dsh-workspace-plus] register skipped for ' + slotKey, registerError)
          return undefined
        }
      }

      // One shared store handle: the browser, the settings page and both
      // add-workspace flows must see the same persisted state (expansion,
      // folder list, sections, prefs, styling). Every seat below mounts it at
      // root scope — one handle, one scope — so the renderer hands them ONE
      // instance (resolveStore keys it by handle + scope).
      const viewStore = createViewStore()

      // 1+2. the two directory-flow holes (hero picker, shipped sidebar browser).
      // Since dsh 0.1.2-alpha.1 the shell's own directory picker occupies each
      // hole at priority 0, so shadow at -1 (ascending, lowest renders) exactly
      // like the sidebar.workspaces browser below. The store seat is what lets
      // the dialog offer sections/folders even when the shell hosts the flow
      // (it passes only the hole's owner props, never our browser's).
      slots.inject('conversation.hero.workspace.directoryFlow', guarded(
        'conversation.hero.workspace.directoryFlow',
        { name: 'conversation.hero.workspace.directoryFlow', store: viewStore, inject: flowInjected('conversation.hero.workspace.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))
      slots.inject('sidebar.workspaces.directoryFlow', guarded(
        'sidebar.workspaces.directoryFlow',
        { name: 'sidebar.workspaces.directoryFlow', store: viewStore, inject: flowInjected('sidebar.workspaces.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))

      // Settings → Plugins card only (the tab dispatches the intersection of
      // served namespaces — registered host-side — and settings.plugin.item
      // cards). The old left-nav settings.section entry was removed: the
      // plugins-section card is the single settings surface now.
      slots.inject('settings.plugin.item', guarded(
        'settings.plugin.item',
        {
          name: 'settings.plugin.item',
          key: 'better-workspace',
          locale: NS,
          store: viewStore,
        },
        BetterWorkspacePluginCard,
      ))

      // 3. the browser itself — lowest priority renders, shadowing the shipped entry.
      slots.inject('sidebar.workspaces', guarded(
        'sidebar.workspaces',
        {
          name: 'sidebar.workspaces',
          priority: -1,
          store: viewStore,
          inject: browserInjected,
          locale: NS,
        },
        BetterBrowser,
      ))
    }

    return {
      name: 'dsh-workspace-plus',
      inject: ['slots', 'sessions', 'workspaces', 'locale', 'uiWorkspace'],
      apply,
    }
  },
})
