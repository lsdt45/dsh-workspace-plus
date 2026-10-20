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
import { createLayout } from './browser/layout.js'
import { iconOf, colorToRgb, rgbToHex, FolderRow, WorkspaceGroupRow, WorkspaceRow, sessionStateOf, PULSE_RANK, PULSE_COLORS, pulseRank, PulseGlow, relayStateOf, SessionRow, SessionGroupRow } from './rows.js'
import { SWATCHES, GLOW_MAX, ICON_CHOICES, CustomizeDialog } from './customize.js'
import { BetterWorkspaceBundleConfig } from './settings.js'

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

    let statusStoreWarned = false

    function BetterBrowser(props) {
      const {
        wide, expandSidebar,
        useSessions, useSessionStatus, useSessionPendingInteraction, useWorkspaces,
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
      // Live session status lives in the host's own store: running,
      // completion-unread and the pending interaction are NOT on the session
      // list snapshot. Older hosts expose neither hook, so every read below
      // falls back to the list fields.
      const statuses = typeof useSessionStatus === 'function' ? useSessionStatus(s => s) : null
      if (statuses === null && !statusStoreWarned) {
        statusStoreWarned = true
        console.warn('[dsh-workspace-plus] host status store missing; session status dots fall back to the session list snapshot')
      }
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
      // Same shape as the official row: the status store wins when it reports a
      // running flag, and the list snapshot covers the sessions the store has
      // not seeded yet (a subagent child is not in list.ids).
      const runningOf = (id) => {
        const status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined
        if (status && status.running !== undefined) return status.running === true
        const summary = list && list.byId ? list.byId[id] : undefined
        return !!(summary && summary.running === true)
      }
      const subCounts = React.useMemo(
        () => subagentRunningCounts(list ? list.byId : {}, statuses ? runningOf : null),
        [list ? list.byId : null, statuses],
      )
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
        normalizedQuery, items, list, archivedSet, archivedFilter, subCounts, pending, statuses, t,
        sessionSectionOf, drag, sortOrder, viewMode, storeFolders, compactChains,
        workspaceGroupOf, statusPulse, expandedMap, sessionsExpandedMap, sessionGroupsMap,
      })


      // Highest-priority status across a whole session subtree (groups + rows).

      const openCtx = (kind, payload, e) => {
        if (e) e.preventDefault()
        setCtxSubmenu(null)
        setCtx({ kind, payload, x: e.clientX, y: e.clientY })
      }

      const {
        assignSessionSection, assignWorkspaceGroup, copySessionText, findTreeNode, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename
      } = createActions({
        actions, deleteAvailable, deleteSession, deleteWorkspace, deletingRef, fail, items, list, pinnedList, refreshSessions, renameByUser, renameWorkspace, sessionsOf, setDeleting, setDialog, setErrorText, setNotice, storeFolders, t, tree, workspaceGroupIds, workspaceGroupOf, workspaceGroups, workspaceIndexOf
      })

      const {
        canDragWorkspace, canMoveWorkspaceGroup, canReorderSessions, canReorderWorkspaces, commitSessionDrop, commitSessionMoveInto, commitWorkspaceDrop, commitWorkspaceMoveInto, dragMatches, folderDropEvents, nextWorkspaceAfter, rowHalf, sessDropHalf, sessionDragEvents, sessionDraggable, sgroupDropEvents, sgroupDropInto, workspaceDragEvents, workspaceGroupDropEvents, wsDropHalf, wsDropInto
      } = createDnd({
        archivedSet, assignSessionSection, assignWorkspaceGroup, automaticSort, drag, fail, findTreeNode, groupedView, insertSessionBefore, insertWorkspaceBefore, items, pinnedSet, recency, renameByUser, renameWorkspace, searching, sessionsOf, setDrag, tree, viewMode, visibleItems, workspaceGroupOf, workspaceGroups, wsDragArmTimer
      })

      const {
        bodyRows, isEmpty, matchesSession, pinnedTray, renderCustomWorkspaceGroups, renderPinnedSection, renderPlainFolder, renderProjectsHeader, renderSearchedFolder, renderSectionedSession, renderSessionNode, renderSessionRow, renderSessionTree, renderTimeBuckets, renderWorkspaceEntry, restoreSession, searchSessionNode, sectionRowsOf
      } = createTreeView({
        actions, archivedFilter, canMoveWorkspaceGroup, drag, expandedMap, fail, folderDropEvents, folderExpanded, folderPulseOf, groupedView, items, list, nodePulseOf, normalizedQuery, now, open, openCtx, phase, pinnedList, pinnedSet, projectItems, recency, rowStyleOf, searchAgent, searched, searching, sectionedSessions, sessDropHalf, sessionDragEvents, sessionDraggable, sessionGroupOpen, sessionRowOf, sessionSectionOf, sessionsOf, sessionsOpenOf, setErrorText, sgroupDropEvents, sgroupDropInto, sortOrder, startSession, statusPulse, styleEntry, t, timeDirection, timeSorted, tree, unarchiveSession, ungrouped, viewMode, visibleItems, workspaceDragEvents, workspaceGroupDropEvents, workspaceGroupOf, workspaceGroups, workspaceIndexOf, workspaceTitleOf, wsDropHalf, wsDropInto, wsPulseOf
      })

      const {
        ctxItems, handleCtxPick
      } = createMenu({
        actions, archiveSession, archivedFilter, assignSessionSection, assignWorkspaceGroup, automaticSort, copySessionText, ctx, deleteAvailable, deleting, fail, forkSession, items, keyOf, openDirectory, pinnedSet, refreshPage, renameSession, restoreSession, setCtx, setCtxSubmenu, setCustomize, setDialog, setDrag, setFlowOpen, setFlowParent, storeFolders, t, timeDirection, timeSorted, unarchiveSession, viewMode
      })

      const { render: renderLayout } = createLayout({
        actions, bodyRows, createWorkspace, ctx, ctxItems, ctxSubmenu, customize, deleting, deletingRef, dialog, errorText, expandSidebar, fail, flowOpen, flowParent, handleCtxPick, items, notice, ownMenuRoot, pickDirectory, query, renameWorkspace, searchOpen, sessionSectionOf, setCtx, setCtxSubmenu, setCustomize, setDialog, setErrorText, setFlowOpen, setFlowParent, setQuery, setSearchOpen, styleEntry, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename, t, useStore, useWorkspaces, viewMode, wide, workspaceGroupOf, workspaceGroups, workspaceIndexOf
      })

      return renderLayout()
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

      // Settings → Plugins: this bundle's own configuration, keyed by the
      // bundle's package name. The shell renders it on the bundle's page
      // between the description and the bundle's rows. (The older
      // `settings.plugin.item` card slot is not dispatched by this shell, so
      // the card it carried never appeared.)
      slots.inject('plugins.bundle.config', guarded(
        'plugins.bundle.config',
        {
          name: 'plugins.bundle.config',
          key: 'dsh-workspace-plus',
          locale: NS,
          store: viewStore,
        },
        BetterWorkspaceBundleConfig,
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
