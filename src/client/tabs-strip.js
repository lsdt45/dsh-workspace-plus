/**
 * The session tab strip.
 *
 * One chip per open session, drawn in the conversation header: the chip's dot is
 * the same StatusDot the sidebar rows use, the label is the session title, and
 * the active chip is the session the shell is showing (the seat's `sessionId`).
 *
 * The strip owns no shell state: the list comes from tabs.js' persisted store and
 * the titles/statuses are read opportunistically, so the seat renders even when
 * the shell hands it none of those props.
 */

import { React, E } from './platform.js'
import { cls } from './core/text.js'
import { currentSessionIdOf, sessionTitleOf } from './core/view.js'
import { StyleNode } from './ui/base.js'
import { StatusDot, sessionStateOf } from './rows.js'
import { useTabReorder } from './browser/dnd.js'
import { closeTab, moveTab, reconcileTabs, saveTabs, setActiveTab, subscribeTabs, tabsActive, tabsSnapshot } from './tabs.js'

/**
 * Bridge to the sidebar's session menu.
 *
 * The context menu state lives in the sidebar seat; a tab chip is rendered in
 * the conversation header, so the sidebar publishes its opener here and the chip
 * asks for the very same menu (rename / archive / delete / fork / pin / …) that
 * right-clicking the session row opens.
 */
export const tabsHost = { openSessionMenu: null }

/**
 * Park the session chips (the shell's header-actions block) after the view-nav row.
 *
 * The chips belong to the shell, so CSS alone cannot know where a dynamic row
 * ends. This measures that row and publishes the offset as a custom property the
 * CSS rule consumes; the rule keeps the right-aligned position as its fallback, so
 * a markup change leaves the chips where they were instead of hiding them.
 */
function useChipsAfterNav() {
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const place = () => {
      const header = document.querySelector('header[data-window-drag]')
      if (!header) return
      const nav = header.querySelector('[class*="_tabs"]')
      if (!nav) return
      const head = header.getBoundingClientRect()
      // The nav row itself spans the header; the anchor is its LAST item, so the
      // chips land after "编队" rather than after the row's trailing whitespace.
      const items = nav.children && nav.children.length ? nav.children : [nav]
      const last = items[items.length - 1]
      const row = (last || nav).getBoundingClientRect()
      if (!head.width || !row.width) return
      const offset = Math.max(24, Math.round(row.right - head.left + 18))
      // A pathological measurement must never park the chips off-screen: keep the
      // right-aligned fallback instead.
      if (offset > head.width - 220) return
      header.style.setProperty('--bw-chips-left', offset + 'px')
      header.style.setProperty('--bw-chips-right', 'auto')
      // Vertically centre the chips on the nav item they follow, so both sides of
      // the row share one baseline instead of the chips riding a few pixels high.
      const chips = header.querySelector('[class*="_headerActions"]')
      if (chips) {
        const chipsHeight = chips.getBoundingClientRect().height
        if (chipsHeight > 0) {
          // The nav item's box includes the active underline and its padding, so
          // its geometric centre sits below the text, and the chips block carries
          // a little of its own padding on top of that. Measured on two live
          // screenshots: 2 CSS px low after the first correction, so the bias is
          // now 4.
          const top = Math.round(row.top + row.height / 2 - head.top - chipsHeight / 2 - 4)
          header.style.setProperty('--bw-chips-top', top + 'px')
          header.style.setProperty('--bw-chips-bottom', 'auto')
        }
      }
    }
    place()
    const header = document.querySelector('header[data-window-drag]')
    const nav = header ? header.querySelector('[class*="_tabs"]') : null
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
    if (observer && header) observer.observe(header)
    if (observer && nav) observer.observe(nav)
    window.addEventListener('resize', place)
    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [])
}

/** Re-render on tab-list changes (the list is module state, not a React store). */
function useTabs() {
  const [tabs, setTabs] = React.useState(() => tabsSnapshot())
  React.useEffect(() => subscribeTabs(() => setTabs(tabsSnapshot())), [])
  return tabs
}

/** Stable dependency for hosts whose workspace store carries no archive list. */
const NO_ARCHIVED = []

/**
 * Keep the strip true to whatever the shell puts on screen.
 *
 * Navigation does not always start from a session row, so the strip cannot rely
 * on the click handlers that write the tab list: "new session" (the workspace +
 * button or the shortcut), fork, the command palette and the strip's own chips
 * all move the main view directly. Every one of them ends in
 * uiWorkspace.replaceMain, which moves the `mainView` RETENTION between session
 * summaries — the shell's only "session on screen" record (the list snapshot has
 * no `current` field) — so one effect on the session store covers all paths.
 *
 * This is also what makes a new session open a NEW page: its summary is blank
 * until the first prompt, and a blank session always gets its own tab.
 */
function useTabSync(sessions, useWorkspaces) {
  const workspaces = typeof useWorkspaces === 'function' ? useWorkspaces((s) => s) : null
  const archivedIds = workspaces && Array.isArray(workspaces.archivedSessionIds) ? workspaces.archivedSessionIds : NO_ARCHIVED
  const previousRef = React.useRef(null)
  React.useEffect(() => {
    const current = currentSessionIdOf(sessions)
    const previous = previousRef.current
    previousRef.current = current
    if (!current) return
    // The store copy keeps the chip responsive for the frame between a click
    // and the shell's navigation; the retention stays the authority.
    setActiveTab(current)
    const byId = sessions && sessions.byId ? sessions.byId : null
    const archived = new Set(archivedIds.map(String))
    saveTabs(reconcileTabs(tabsSnapshot(), current, previous, {
      isBlank: (id) => !!(byId && byId[id] && byId[id].blank),
      isArchived: (id) => archived.has(String(id)),
    }))
  }, [sessions, archivedIds])
}

export function TabsStrip(props) {
  const { useSessions, useSessionStatus, useWorkspaces, t, open } = props
  useChipsAfterNav()
  const stored = useTabs()
  // Reordering is dnd.js' job (the same HTML5 drag the sidebar rows use); the
  // strip only commits the move into its own store.
  // Live reordering is its own preview: no drop-target highlight, which used to
  // flash the emphasis style onto the chip that slid away.
  const { draggingId, eventsFor } = useTabReorder({
    onReorder: (fromId, toId) => { saveTabs(moveTab(tabsSnapshot(), fromId, toId)) },
  })
  const sessions = typeof useSessions === 'function' ? useSessions((s) => s) : null
  useTabSync(sessions, useWorkspaces)
  const statuses = typeof useSessionStatus === 'function' ? useSessionStatus((s) => s) : null
  if (sessions === null && typeof useSessions !== 'function') return null
  // The mainView retention is the authoritative "on screen" marker; the tab
  // store copy covers the frame between a chip click and the shell's
  // navigation, and a session-scoped host may hand sessionId down directly.
  const bound = props.sessionId === undefined || props.sessionId === null ? null : String(props.sessionId)
  const liveCurrent = currentSessionIdOf(sessions)
  const sessionId = liveCurrent || tabsActive() || bound || null
  // The current session is always one of the tabs: before the first sync the
  // list derives it from what the shell is showing instead of writing state
  // during render.
  const tabs = stored.length ? stored : (sessionId ? [sessionId] : [])
  if (tabs.length === 0) return null
  const titleOf = (id) => {
    // sessionTitleOf localizes the provisional New Session page instead of
    // leaking its raw id into the chip.
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    return sessionTitleOf(summary, t) || id
  }
  const stateOf = (id) => {
    const status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    return sessionStateOf({
      running: status ? status.running === true : !!(summary && summary.running),
      completed: status ? status.completionUnread === true : !!(summary && summary.completed),
      pending: status && status.pendingInteraction ? status.pendingInteraction.kind : undefined,
    }, sessionId === id)
  }
  const switchTo = (id) => {
    setActiveTab(id)
    if (typeof open === 'function' && id !== sessionId) open(id)
  }
  const closeOne = (event, id) => {
    event.stopPropagation()
    event.preventDefault()
    const result = closeTab(tabs, id, sessionId)
    saveTabs(result.tabs)
    if (result.next) switchTo(result.next)
  }
  return E('div', { className: 'bw-tabs', role: 'tablist', 'aria-label': t('tabs.label'), 'data-bw-tabs': String(tabs.length) },
    StyleNode(),
    tabs.map((id) => {
      const active = sessionId === id
      const state = stateOf(id)
      const title = titleOf(id)
      // Inline as well as the class: the shell's stylesheet order is out of our
      // hands, and the active tab must be unmistakable either way.
      // Quiet, native-looking active state: the same 2px underline and brand
      // colour the shell gives its own active view tab, no fill and no border.
      const activeStyle = active ? { boxShadow: 'inset 0 -2px 0 var(--dsw-alias-brand-primary, #5b8def)' } : undefined
      return E('div', {
        key: id,
        className: cls('bw-tab', active && 'bw-tab-active', draggingId === id && 'bw-tab-dragging'),
        'data-bw-active': active ? '1' : '0',
        role: 'tab',
        tabIndex: active ? 0 : -1,
        'aria-selected': active,
        title,
        draggable: true,
        style: activeStyle,
        onClick: () => switchTo(id),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); switchTo(id) }
        },
        onContextMenu: (event) => {
          if (!tabsHost.openSessionMenu) return
          event.preventDefault()
          event.stopPropagation()
          tabsHost.openSessionMenu(id, event)
        },
        ...eventsFor(id),
      },
        state
          ? E(StatusDot, { state, label: t('tabs.' + state) })
          : E('span', { className: 'bw-tab-dot', 'aria-hidden': 'true' }),
        E('span', { className: 'bw-tab-label', style: active ? { color: 'var(--dsw-alias-brand-primary, #5b8def)', fontWeight: 600 } : undefined }, title),
        E('button', {
          type: 'button',
          className: 'bw-tab-close',
          draggable: false,
          'aria-label': t('tabs.close'),
          title: t('tabs.close'),
          onClick: (event) => closeOne(event, id),
        }, '×'),
      )
    }),
  )
}

