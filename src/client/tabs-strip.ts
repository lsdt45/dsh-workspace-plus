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
 *
 * Overflow: the row is bounded (52vw) so it can never crowd the session title and
 * the header controls. Chips shrink down to a readable floor first (like a
 * browser's tab strip); when even that is not enough the row scrolls, the edges
 * fade to advertise the hidden chips, the wheel scrolls the row horizontally, the
 * active chip is scrolled back into view whenever it changes, and a chevron at
 * the end opens the full tab list (the mainstream "list all tabs" affordance) with
 * one-click switching and per-row closing. A hidden chip therefore never becomes
 * unreachable: it is either scrolled to, wheeled to, or listed.
 */

import { React, E } from './platform.ts'
import { cls } from './core/text.ts'
import type { Translate } from './core/time.ts'
import { currentSessionIdOf, sessionTitleOf } from './core/view.ts'
import { StyleNode } from './ui/base.ts'
import { StatusDot, sessionStateOf } from './rows.ts'
import { useTabReorder } from './browser/dnd.ts'
import { CheckIcon16, ChevronDownIcon16 } from './icons.ts'
import { closeTab, moveTab, reconcileTabs, saveTabs, scrollDeltaFor, setActiveTab, stripCapacity, stripFillWidth, subscribeTabs, tabsActive, tabsSnapshot } from './tabs.ts'

/**
 * Bridge to the sidebar's session menu.
 *
 * The context menu state lives in the sidebar seat; a tab chip is rendered in
 * the conversation header, so the sidebar publishes its opener here and the chip
 * asks for the very same menu (rename / archive / delete / fork / pin / …) that
 * right-clicking the session row opens.
 */
export const tabsHost: { openSessionMenu: ((sessionId: string, event: any) => void) | null } = { openSessionMenu: null }

/**
 * Park the session chips (the shell's header-actions block) after the view-nav row.
 *
 * The chips belong to the shell, so CSS alone cannot know where a dynamic row
 * ends. This measures that row and publishes the offset as a custom property the
 * CSS rule consumes; the rule keeps the right-aligned position as its fallback, so
 * a markup change leaves the chips where they were instead of hiding them.
 */
function useChipsAfterNav(enabled: boolean) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const header = document.querySelector<HTMLElement>('header[data-window-drag]')
    // Tabs off: the header is the shell's again, so the parked chips go back to
    // their own slot and every measured offset is dropped.
    if (!enabled) {
      if (header) {
        for (const name of ['--bw-chips-left', '--bw-chips-right', '--bw-chips-top', '--bw-chips-bottom']) header.style.removeProperty(name)
      }
      return undefined
    }
    const place = () => {
      const header = document.querySelector<HTMLElement>('header[data-window-drag]')
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
    const nav = header ? header.querySelector('[class*="_tabs"]') : null
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
    if (observer && header) observer.observe(header)
    if (observer && nav) observer.observe(nav)
    window.addEventListener('resize', place)
    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [enabled])
}

/**
 * Mirror the "show tabs" switch into CSS.
 *
 * The header overrides (hide the crumb title line, park the session chips at the
 * measured end of the view-nav row) only make sense while the strip is drawn:
 * with tabs off they must not touch the shell's layout, so every one of those
 * rules is scoped to `html:not([data-bw-tabs-off])`.
 */
function useTabsSurface(showTabs: boolean) {
  // Layout effect: the attribute must land before the first paint, or the
  // shell's title line is hidden for one frame when tabs are off.
  const useIsoLayoutEffect = typeof React.useLayoutEffect === 'function' ? React.useLayoutEffect : React.useEffect
  useIsoLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined
    const root = document.documentElement
    if (showTabs) delete root.dataset.bwTabsOff
    else root.dataset.bwTabsOff = '1'
    return () => { delete root.dataset.bwTabsOff }
  }, [showTabs])
}

/** Re-render on tab-list changes (the list is module state, not a React store). */
function useTabs(): string[] {
  const [tabs, setTabs] = React.useState(() => tabsSnapshot())
  React.useEffect(() => subscribeTabs(() => setTabs(tabsSnapshot())), [])
  return tabs
}

/** Stable dependency for hosts whose workspace store carries no archive list. */
const NO_ARCHIVED: string[] = []

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
function useTabSync(sessions: any, useWorkspaces: any) {
  const workspaces = typeof useWorkspaces === 'function' ? useWorkspaces((s: any) => s) : null
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

/* ------------------------------ overflow ------------------------------- */

/** Where the chip row sits in its own scroll range (all three drive CSS). */
interface StripOverflow {
  /** The row is wider than the slot: chips are cut off somewhere. */
  overflowing: boolean
  /** Chips are cut off on the left (the row is scrolled right). */
  canLeft: boolean
  /** Chips are cut off on the right (the common case). */
  canRight: boolean
}

const NO_OVERFLOW: StripOverflow = { overflowing: false, canLeft: false, canRight: false }

const sameOverflow = (left: StripOverflow, right: StripOverflow): boolean =>
  left.overflowing === right.overflowing && left.canLeft === right.canLeft && left.canRight === right.canRight

/** Whether a node is one of our chips (never the injected <style> element). */
const isChipNode = (node: any): boolean =>
  !!node && typeof node.className === 'string' && node.className.split(/\s+/).indexOf('bw-tab') !== -1

/**
 * Measure the row against its slot and keep the result current.
 *
 * Observes the row AND every chip: renaming a session changes a chip's width
 * without resizing the row, which is exactly the case where the row would
 * overflow unnoticed. Re-running on tab-count / active-tab changes re-binds the
 * per-chip observations after a re-render.
 */
function useStripOverflow(stripRef: any, deps: any[]): StripOverflow {
  const [state, setState] = React.useState(() => NO_OVERFLOW)
  const measure = () => {
    const el = stripRef.current
    if (!el) return
    const next: StripOverflow = {
      overflowing: el.scrollWidth > el.clientWidth + 1,
      canLeft: el.scrollLeft > 1,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    }
    setState((previous: StripOverflow) => (sameOverflow(previous, next) ? previous : next))
  }
  React.useLayoutEffect(() => {
    measure()
    const el = stripRef.current
    if (!el || typeof el.addEventListener !== 'function') return undefined
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null
    if (observer) {
      observer.observe(el)
      for (const node of Array.from(el.children || []) as any[]) if (isChipNode(node)) observer.observe(node)
    }
    el.addEventListener('scroll', measure, { passive: true })
    return () => {
      el.removeEventListener('scroll', measure)
      if (observer) observer.disconnect()
    }
  }, deps)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return state
}

/**
 * Scroll the active chip back into view whenever it changes.
 *
 * Switching tabs (from a chip, the sidebar, the overflow list or the keyboard)
 * must never leave the current page's chip outside the row. The scroll is an
 * instant write, not a smooth animation: the shell remounts the header while
 * navigating, so an animation would be cut off mid-flight and leave the chip
 * half-visible. A short follow-up check catches the reconciliation that drops an
 * abandoned blank tab one frame after the switch (it shifts every later chip).
 */
function useRevealActive(stripRef: any, sessionId: string | null, tabCount: number) {
  React.useLayoutEffect(() => {
    const reveal = () => {
      const el = stripRef.current
      if (!el || typeof el.querySelector !== 'function') return
      const chip = el.querySelector('[data-bw-active="1"]')
      if (!chip || typeof chip.getBoundingClientRect !== 'function') return
      const delta = scrollDeltaFor(el.getBoundingClientRect(), chip.getBoundingClientRect(), 6)
      if (delta) el.scrollLeft += delta
    }
    reveal()
    if (typeof setTimeout !== 'function') return undefined
    const timer = setTimeout(reveal, 120)
    return () => clearTimeout(timer)
  }, [sessionId, tabCount])
}

/**
 * Wheel scrolling for the chip row.
 *
 * A vertical wheel normally bubbles to the transcript, so the strip would only
 * ever be scrollable with a horizontal trackpad gesture. While the pointer is
 * over an overflowing row the wheel drives the row instead (and is consumed only
 * when the row actually moved). The listener is native and non-passive: React's
 * onWheel is passive, so preventDefault there would be ignored.
 */
function useWheelScroll(stripRef: any) {
  React.useEffect(() => {
    const el = stripRef.current
    if (!el || typeof el.addEventListener !== 'function') return undefined
    const onWheel = (event: any) => {
      if (el.scrollWidth <= el.clientWidth + 1) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!delta) return
      const before = el.scrollLeft
      el.scrollLeft = before + delta
      if (el.scrollLeft !== before && typeof event.preventDefault === 'function') event.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
}

/**
 * Let the strip claim the header space that actually exists — carefully.
 *
 * The conversation header is a grid of [leading area][session title row]. The
 * leading column sizes to the strip's content, so a strip that stopped after
 * its last chip left a large empty band between the tabs and the header
 * utilities. Measuring the first control to the right and stretching the row to
 * it fixes that gap, but the measurement MUST NOT be re-run against the layout
 * it just changed: some hosts reflow their right-hand controls when the title
 * row shrinks, and chasing them on every pass walked them rightwards until they
 * vanished (the reported regression). Hence:
 *
 *  - one measurement epoch per header width; the first successful result is
 *    LATCHED — later passes may only shrink it, never grow it;
 *  - a follow-up pass that finds the limit farther right than the latched one
 *    means the host is being pushed around: the row falls back to its CSS width
 *    (unstable epoch, no more measuring until a resize);
 *  - the row never grows past what the open chips can fill (stripCapacity), so
 *    a couple of tabs never stretch the strip into the host's controls;
 *  - a reserve keeps a minimum slice of the header for the host controls.
 *
 * A window resize starts a fresh epoch: the row is released to its natural
 * width first, then measured once after layout settles.
 */
function useStripFill(barRef: any, deps: any[], tabCount: number): number {
  const [width, setWidth] = React.useState(0)
  const epochRef = React.useRef({ headerWidth: -1, width: 0, limit: 0, locked: false, unstable: false })

  /** Measure the current layout; with `steady` set, only verify/shrink a latched row. */
  const measure = (steady?: boolean) => {
    const bar = barRef.current
    if (!bar || typeof document === 'undefined' || typeof bar.getBoundingClientRect !== 'function') return
    const header = typeof bar.closest === 'function'
      ? bar.closest('header[data-window-drag]')
      : document.querySelector('header[data-window-drag]')
    if (!header || typeof header.getBoundingClientRect !== 'function') return
    const barRect = bar.getBoundingClientRect()
    const headerRect = header.getBoundingClientRect()
    if (!barRect.width || !headerRect.width) return
    if (Math.abs(epochRef.current.headerWidth - headerRect.width) > 1) {
      epochRef.current = { headerWidth: headerRect.width, width: 0, limit: 0, locked: false, unstable: false }
    }
    const epoch = epochRef.current
    if (epoch.unstable) return
    // The grid item holding the strip: its right edge is where the session title
    // row begins. Walk up until the parent IS the header (the host nests the
    // header in more than one shape: sometimes title row is a direct child,
    // sometimes it lives deeper under a display:contents wrapper).
    let gridItem: any = bar
    while (gridItem && gridItem.parentElement && gridItem.parentElement !== header) gridItem = gridItem.parentElement
    const leadingRight = gridItem && gridItem !== bar
      ? gridItem.getBoundingClientRect().right
      : barRect.right
    let limit = 0
    const nodes = Array.from(header.querySelectorAll('*')) as any[]
    for (const node of nodes) {
      // Skip the strip itself and anything that CONTAINS it (the leading grid
      // item): their right edge is the row's own edge, never a control.
      if (bar === node || (typeof bar.contains === 'function' && bar.contains(node))) continue
      if (typeof node.contains === 'function' && node.contains(bar)) continue
      const rect = node.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) continue
      // Same band as the strip: the navigation row below must not cap the row.
      if (rect.bottom <= barRect.top + 2 || rect.top >= barRect.bottom - 2) continue
      // A hidden-but-rendered node (collapsed menu, tooltip, transition ghost) has
      // a box but must never cap the row.
      if (typeof getComputedStyle === 'function') {
        const style = getComputedStyle(node)
        if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue
      }
      // Structural scaffolding: the title row (and any wrapper of it) starts at
      // the leading area's right edge and runs to the header's right edge. It is
      // layout, not a control, so it must never become the limit.
      if (rect.left <= leadingRight + 8 && rect.right >= headerRect.right - 40) continue
      // Only the right-hand control cluster may cap the row: an element further
      // left inside the title row (title text, a status chip) must not become
      // the limit, or the strip would overlap it.
      if (headerRect.right - rect.right > 120) continue
      if (rect.left <= barRect.left + 8) continue
      if (!limit || rect.left < limit) limit = rect.left
    }
    let next = stripFillWidth(limit, barRect.left, headerRect.width, 220, 100)
    if (next > 0) next = Math.min(next, stripCapacity(tabCount))
    if (next > 0 && steady && epoch.locked && limit > epoch.limit + 24) {
      // Our own widening moved the host controls further right: the layout is
      // chasing us. Give the row back to CSS and stop measuring this epoch.
      epoch.unstable = true
      epoch.width = 0
      setWidth(0)
      return
    }
    if (next > 0 && epoch.locked) next = Math.min(next, epoch.width)
    if (next > 0) {
      epoch.locked = true
      epoch.width = next
      epoch.limit = limit
    } else if (!steady) {
      epoch.locked = false
    }
    setWidth((previous: number) => (previous === next ? previous : next))
  }

  React.useLayoutEffect(() => {
    measure()
    if (typeof setTimeout !== 'function') return undefined
    // Host chrome (utilities, dropdowns) can arrive a few frames after the strip
    // mounts: retry while nothing was measured. Never retry after a latch (that
    // is the loop that used to push the header controls away).
    const retry = () => { if (!epochRef.current.locked && !epochRef.current.unstable) measure() }
    const timers = [400, 1500, 3200].map((delay) => setTimeout(retry, delay))
    return () => { for (const timer of timers) clearTimeout(timer) }
  }, deps)
  // Verify the latched row once the browser has laid it out; a pushed-around
  // host reverts the row to its natural width instead of drifting.
  React.useEffect(() => {
    if (!width || typeof setTimeout !== 'function') return undefined
    const timer = setTimeout(() => measure(true), 260)
    return () => clearTimeout(timer)
  }, [width])
  // A window resize is a genuinely new layout: release the row, then measure the
  // natural layout once. The header observer catches sidebar/layout changes too.
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined
    const reset = () => {
      epochRef.current = { headerWidth: -1, width: 0, limit: 0, locked: false, unstable: false }
      setWidth(0)
      if (typeof setTimeout === 'function') setTimeout(() => measure(), 240)
    }
    window.addEventListener('resize', reset)
    const bar = barRef.current
    const header = bar && typeof bar.closest === 'function' ? bar.closest('header[data-window-drag]') : null
    let lastHeaderWidth = header ? header.getBoundingClientRect().width : 0
    const observer = typeof ResizeObserver === 'function' && header
      ? new ResizeObserver(() => {
        const next = header.getBoundingClientRect().width
        if (Math.abs(next - lastHeaderWidth) > 1) { lastHeaderWidth = next; reset() }
      })
      : null
    if (observer && header) observer.observe(header)
    return () => {
      window.removeEventListener('resize', reset)
      if (observer) observer.disconnect()
    }
  }, [])
  return width
}

/* --------------------------- overflow menu ---------------------------- */

/** Props of {@link TabsOverflowMenu}: everything the strip already knows. */
export interface TabsOverflowMenuProps {
  /** Every open tab, in strip order. */
  tabs: string[]
  /** The session on screen (marked with a check). */
  activeId: string | null
  /** Chip label for a tab (localized titles, id fallback). */
  titleOf: (id: string) => string
  /** Status descriptor for a tab (null when idle). */
  stateOf: (id: string) => string | null
  /** Whether the plugin draws its own status dots. */
  statusDots: boolean
  t: Translate
  /** Trigger rect the panel hangs from (viewport coordinates). */
  anchor: { left: number; right: number; top: number; bottom: number } | null
  onSelect: (id: string) => void
  onClose: () => void
  onCloseTab: (event: any, id: string) => void
  onContextMenu?: ((id: string, event: any) => void) | null
}

/**
 * The "all tabs" panel behind the strip's chevron.
 *
 * A fixed panel (not a child of the strip) so the header's clipping and the
 * row's own scroll position cannot crop it. Lists every open tab — visible or
 * hidden — with its status dot, a check on the one on screen, and a per-row
 * close; right-clicking a row asks the sidebar for the same session menu the
 * chips use. Keyboard: ↑/↓ move, Enter switches, Esc closes.
 */
export function TabsOverflowMenu(props: TabsOverflowMenuProps) {
  const { tabs, activeId, titleOf, stateOf, statusDots, t, anchor, onSelect, onClose, onCloseTab, onContextMenu } = props
  const menuRef = React.useRef(null)
  const [cursor, setCursor] = React.useState(() => {
    const at = activeId === null ? -1 : tabs.indexOf(activeId)
    return at < 0 ? 0 : at
  })
  React.useEffect(() => {
    const node = menuRef.current
    if (node && typeof node.focus === 'function') node.focus()
  }, [])
  const viewportWidth = typeof window === 'undefined' ? 0 : (window.innerWidth || 0)
  const viewportHeight = typeof window === 'undefined' ? 0 : (window.innerHeight || 0)
  const style = anchor
    ? {
      top: Math.round(anchor.bottom + 6) + 'px',
      right: Math.max(8, Math.round(viewportWidth - anchor.right)) + 'px',
      maxHeight: Math.max(160, viewportHeight - Math.round(anchor.bottom) - 14) + 'px',
    }
    : undefined
  const activeIndex = tabs.length === 0 ? -1 : Math.min(Math.max(cursor, 0), tabs.length - 1)
  const onKeyDown = (event: any) => {
    const key = event && event.key
    if (key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      if (!tabs.length) return
      event.preventDefault()
      const step = key === 'ArrowDown' ? 1 : -1
      setCursor((current: number) => ((Math.min(Math.max(current, 0), tabs.length - 1)) + step + tabs.length) % tabs.length)
      return
    }
    if (key === 'Home' || key === 'End') {
      if (!tabs.length) return
      event.preventDefault()
      setCursor(key === 'Home' ? 0 : tabs.length - 1)
      return
    }
    if (key === 'Enter' || key === ' ') {
      const id = tabs[activeIndex]
      if (!id) return
      event.preventDefault()
      onSelect(id)
    }
  }
  return E('div', { className: 'bw-tabs-menu-layer' },
    E('div', { className: 'bw-tabs-menu-overlay', onClick: onClose }),
    E('div', {
      ref: menuRef,
      className: 'bw-tabs-menu',
      role: 'menu',
      'aria-label': t('tabs.menu'),
      tabIndex: -1,
      style,
      onKeyDown,
    },
      E('div', { className: 'bw-tabs-menu-head' }, t('tabs.menuCount', { n: tabs.length })),
      E('div', { className: 'bw-tabs-menu-list' },
        tabs.map((id, index) => {
          const active = id === activeId
          const state = stateOf(id)
          return E('div', {
            key: id,
            className: cls('bw-tabs-menu-row', active && 'bw-tabs-menu-row-active', index === activeIndex && 'bw-tabs-menu-row-cursor'),
            role: 'menuitem',
            'aria-current': active ? 'true' : 'false',
            'data-bw-tab-id': id,
            onMouseEnter: () => setCursor(index),
            onClick: () => onSelect(id),
            onContextMenu: (event: any) => {
              if (!onContextMenu) return
              event.preventDefault()
              event.stopPropagation()
              onContextMenu(id, event)
            },
          },
            statusDots
              ? (state ? E(StatusDot, { state, label: t('tabs.' + state) }) : E('span', { className: 'bw-tabs-menu-dot', 'aria-hidden': 'true' }))
              : null,
            E('span', { className: 'bw-tabs-menu-label' }, titleOf(id)),
            active ? E(CheckIcon16, { size: 13, className: 'bw-tabs-menu-check' }) : null,
            E('button', {
              type: 'button',
              className: 'bw-tabs-menu-close',
              'aria-label': t('tabs.close'),
              title: t('tabs.close'),
              onClick: (event: any) => {
                event.stopPropagation()
                onCloseTab(event, id)
              },
            }, '×'),
          )
        }),
      ),
      E('div', { className: 'bw-tabs-menu-hint' }, t('tabs.menuHint')),
    ),
  )
}

/** Props of {@link TabsStrip}: the shell hooks and callbacks the seat hands down. */
export interface TabsStripProps {
  /** Session-list store hook (shell-provided). */
  useSessions?: any
  /** Session-status store hook (shell-provided). */
  useSessionStatus?: any
  /** Workspace store hook (shell-provided). */
  useWorkspaces?: any
  /** View/preference store hook (shell-provided). */
  useStore?: any
  /** Translate function bound to the plugin namespace. */
  t: Translate
  /** Open a session in the shell's main view. */
  open?: (id: string) => void
  /** Session id the hosting seat scopes this strip to, when it hands one down. */
  sessionId?: string | number | null
}

export function TabsStrip(props: TabsStripProps) {
  const { useSessions, useSessionStatus, useWorkspaces, useStore, t, open } = props
  // The seat declares the shared view store, so the settings page's two
  // "restore the host-native UI" switches are live here: tabs on/off and the
  // plugin dots vs. the host's own status lights.
  const prefs = typeof useStore === 'function' ? (useStore((s: any) => s.prefs) || {}) : {}
  const showTabs = prefs.showTabs !== false
  const statusDots = prefs.statusDots !== false
  useTabsSurface(showTabs)
  useChipsAfterNav(showTabs)
  const stored = useTabs()
  // Reordering is dnd.js' job (the same HTML5 drag the sidebar rows use); the
  // strip only commits the move into its own store.
  // Live reordering is its own preview: no drop-target highlight, which used to
  // flash the emphasis style onto the chip that slid away.
  const { draggingId, eventsFor } = useTabReorder({
    onReorder: (fromId: string, toId: string) => { saveTabs(moveTab(tabsSnapshot(), fromId, toId)) },
  })
  const sessions = typeof useSessions === 'function' ? useSessions((s: any) => s) : null
  useTabSync(sessions, useWorkspaces)
  const statuses = typeof useSessionStatus === 'function' ? useSessionStatus((s: any) => s) : null

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

  // Overflow UI state. Every hook runs unconditionally before the early returns
  // below (the strip must not change its hook order when tabs are switched off).
  const barRef = React.useRef(null)
  const stripRef = React.useRef(null)
  const moreRef = React.useRef(null)
  const anchorRef = React.useRef(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const overflow = useStripOverflow(stripRef, [tabs.length, sessionId, showTabs])
  // The row stretches to the header utilities so the chips fill the space
  // instead of leaving a dead band after the last tab.
  const fillWidth = useStripFill(barRef, [tabs.length, sessionId, showTabs], tabs.length)
  useRevealActive(stripRef, sessionId, tabs.length)
  useWheelScroll(stripRef)
  // The trigger only exists while chips are hidden; a row that suddenly fits
  // (tabs closed from the list) must not leave an anchored panel behind.
  React.useEffect(() => {
    if (menuOpen && !overflow.overflowing) setMenuOpen(false)
  }, [menuOpen, overflow.overflowing])
  React.useEffect(() => {
    if (!menuOpen || typeof window === 'undefined') return undefined
    const close = () => setMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [menuOpen])

  if (sessions === null && typeof useSessions !== 'function') return null
  // "Show session tabs" off: render nothing and let the header CSS fall back to
  // the shell's own layout — the tab list keeps syncing in the background, so
  // turning it back on restores the same strip.
  if (!showTabs) return null
  if (tabs.length === 0) return null
  const titleOf = (id: string) => {
    // sessionTitleOf localizes the provisional New Session page instead of
    // leaking its raw id into the chip.
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    return sessionTitleOf(summary, t) || id
  }
  const stateOf = (id: string) => {
    const status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    return sessionStateOf({
      running: status ? status.running === true : !!(summary && summary.running),
      completed: status ? status.completionUnread === true : !!(summary && summary.completed),
      pending: status && status.pendingInteraction ? status.pendingInteraction.kind : undefined,
    }, sessionId === id)
  }
  const switchTo = (id: string) => {
    setActiveTab(id)
    if (typeof open === 'function' && id !== sessionId) open(id)
  }
  const closeOne = (event: any, id: string) => {
    event.stopPropagation()
    event.preventDefault()
    const result = closeTab(tabs, id, sessionId)
    saveTabs(result.tabs)
    if (result.next) switchTo(result.next)
  }
  const chipOf = (id: string): any => {
    const strip = stripRef.current
    if (!strip || typeof strip.children === 'undefined') return null
    for (const node of Array.from(strip.children) as any[]) {
      if (node && typeof node.getAttribute === 'function' && node.getAttribute('data-bw-tab-id') === id) return node
    }
    return null
  }
  // Keyboard tablist navigation: ←/→ move the selection to the neighbouring
  // chip and take focus with it, so an overflowing strip is usable without a
  // pointer (and the reveal effect scrolls the newly active chip into view).
  const moveSelection = (id: string, key: string) => {
    const at = tabs.indexOf(id)
    const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
    if (!step || at < 0) return false
    const next = tabs[at + step]
    if (!next) return false
    switchTo(next)
    // The shell remounts the header while navigating, which would drop the focus
    // this render put on the chip: check now, then once more after the navigation
    // has landed, so ←/→ keep working as a continuous walk.
    const focusNext = () => {
      const node = chipOf(next)
      if (node && typeof node.focus === 'function') node.focus()
    }
    const schedule = (fn: () => void, delay: number) => (typeof setTimeout === 'function' ? setTimeout(fn, delay) : fn())
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusNext)
    else schedule(focusNext, 0)
    schedule(focusNext, 80)
    return true
  }
  const openMenu = () => {
    const node = moreRef.current
    anchorRef.current = node && typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null
    setMenuOpen((current: boolean) => !current)
  }
  return E('div', {
    ref: barRef,
    className: 'bw-tabbar',
    'data-bw-overflow': overflow.overflowing ? '1' : '0',
    // Measured room to the header utilities; undefined keeps the CSS fallback.
    style: fillWidth > 0 ? { width: fillWidth + 'px', maxWidth: 'none' } : undefined,
  },
    StyleNode(),
    E('div', {
      ref: stripRef,
      className: 'bw-tabs',
      role: 'tablist',
      'aria-label': t('tabs.label'),
      'data-bw-tabs': String(tabs.length),
      'data-bw-fade-left': overflow.canLeft ? '1' : '0',
      'data-bw-fade-right': overflow.canRight ? '1' : '0',
    },
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
          'data-bw-tab-id': id,
          role: 'tab',
          tabIndex: active ? 0 : -1,
          'aria-selected': active,
          title,
          draggable: true,
          style: activeStyle,
          onClick: () => switchTo(id),
          onKeyDown: (event: any) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              switchTo(id)
              return
            }
            moveSelection(id, event.key)
          },
          onContextMenu: (event: any) => {
            if (!tabsHost.openSessionMenu) return
            event.preventDefault()
            event.stopPropagation()
            tabsHost.openSessionMenu(id, event)
          },
          // The spread re-declares `draggable` (eventsFor always arms it) and still
          // wins at runtime; the wide record view keeps TS from flagging the repeat.
          ...(eventsFor(id) as Record<string, any>),
        },
          statusDots
            ? (state
              ? E(StatusDot, { state, label: t('tabs.' + state) })
              : E('span', { className: 'bw-tab-dot', 'aria-hidden': 'true' }))
            : null,
          E('span', { className: 'bw-tab-label', style: active ? { color: 'var(--dsw-alias-brand-primary, #5b8def)', fontWeight: 600 } : undefined }, title),
          E('button', {
            type: 'button',
            className: 'bw-tab-close',
            draggable: false,
            'aria-label': t('tabs.close'),
            title: t('tabs.close'),
            onClick: (event: any) => closeOne(event, id),
          }, '×'),
        )
      }),
    ),
    overflow.overflowing
      ? E('button', {
        ref: moreRef,
        type: 'button',
        className: cls('bw-tabs-more', menuOpen && 'bw-tabs-more-open'),
        'aria-haspopup': 'menu',
        'aria-expanded': menuOpen,
        'aria-label': t('tabs.menu'),
        title: t('tabs.menuCount', { n: tabs.length }),
        onClick: openMenu,
      }, E(ChevronDownIcon16, { size: 13 }))
      : null,
    menuOpen
      ? E(TabsOverflowMenu, {
        tabs,
        activeId: sessionId,
        titleOf,
        stateOf,
        statusDots,
        t,
        anchor: anchorRef.current,
        onSelect: (id: string) => { setMenuOpen(false); switchTo(id) },
        onClose: () => setMenuOpen(false),
        onCloseTab: (event: any, id: string) => closeOne(event, id),
        onContextMenu: tabsHost.openSessionMenu
          ? (id: string, event: any) => { setMenuOpen(false); if (tabsHost.openSessionMenu) tabsHost.openSessionMenu(id, event) }
          : null,
      })
      : null,
  )
}
