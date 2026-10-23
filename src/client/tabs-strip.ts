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
import { useHoverTip } from './ui/tooltip.ts'
import { useTabReorder } from './browser/dnd.ts'
import { CheckIcon16, ChevronDownIcon16, PlusIcon16 } from './icons.ts'
import { closeTab, moveTab, reconcileTabs, saveTabs, scrollDeltaFor, setActiveTab, stripFillWidth, subscribeTabs, tabsActive, tabsSnapshot } from './tabs.ts'

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
 * Mirror the "show tabs" switch into CSS.
 *
 * The header override (hide the crumb title line) only makes sense while the
 * strip is drawn:
 * with tabs off the shell's header must render exactly as shipped, so the rule
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
 * Room the tab row may occupy before the header's right-hand controls.
 *
 * Chips are content-sized now (no flex-grow), so this is a CAP rather than a
 * stretch: the row stays as wide as its chips need and only this measurement
 * keeps it from running into the window utilities. The measurement walks the
 * header for the first control right of the strip in the same band — the parked
 * session chips sit on the view-nav row and are filtered out by that band test.
 */
function useStripFill(barRef: any, deps: any[]): number {
  const [room, setRoom] = React.useState(0)
  const measure = () => {
    const bar = barRef.current
    if (!bar || typeof document === 'undefined' || typeof bar.getBoundingClientRect !== 'function') return
    const header = typeof bar.closest === 'function'
      ? bar.closest('header[data-window-drag]')
      : document.querySelector('header[data-window-drag]')
    if (!header || typeof header.getBoundingClientRect !== 'function') return
    const barRect = bar.getBoundingClientRect()
    const headerRect = header.getBoundingClientRect()
    if (!barRect.width || !headerRect.width) return
    // The grid item holding the strip: its right edge is where the title row begins.
    let gridItem: any = bar
    while (gridItem && gridItem.parentElement && gridItem.parentElement !== header) gridItem = gridItem.parentElement
    const leadingRight = gridItem && gridItem !== bar
      ? gridItem.getBoundingClientRect().right
      : barRect.right
    let limit = 0
    for (const node of Array.from(header.querySelectorAll('*')) as any[]) {
      if (bar === node || (typeof bar.contains === 'function' && bar.contains(node))) continue
      if (typeof node.contains === 'function' && node.contains(bar)) continue
      const rect = node.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) continue
      // Same band as the strip only: the view-nav row (with the parked chips) must
      // never cap the tab row.
      if (rect.bottom <= barRect.top + 2 || rect.top >= barRect.bottom - 2) continue
      if (typeof getComputedStyle === 'function') {
        const style = getComputedStyle(node)
        if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue
      }
      // Structural scaffolding (the title row and its wrappers) is layout, not a control.
      if (rect.left <= leadingRight + 8 && rect.right >= headerRect.right - 40) continue
      if (headerRect.right - rect.right > 120) continue
      if (rect.left <= barRect.left + 8) continue
      if (!limit || rect.left < limit) limit = rect.left
    }
    const next = stripFillWidth(limit, barRect.left, headerRect.width, 0, 100)
    setRoom((previous: number) => (previous === next ? previous : next))
  }
  React.useLayoutEffect(() => {
    measure()
    if (typeof setTimeout !== 'function') return undefined
    const timers = [80, 300, 900].map((delay) => setTimeout(measure, delay))
    return () => { for (const timer of timers) clearTimeout(timer) }
  }, deps)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return room
}

/** Header custom property carrying the parked chips' vertical offset. */
const CHIPS_TOP_VAR = '--bw-chips-top'

/**
 * Park the shell's session chips (agent team / mode / subagents) on the right end
 * of the view-nav row.
 *
 * The chips belong to the shell and CSS pins them to that row's right edge (see
 * the headerActions rule in styles.ts); this hook only measures the row's vertical
 * centre so the chips line up with the view-nav items.
 *
 * Cold start is the hard case and the reason this hook is shaped the way it is:
 * the header mounts first, while the chips come from other plugins and appear a
 * frame (or several) later — sometimes with zero height until their own data
 * arrives. Two rules follow, and both were violated by the first version (which
 * only recovered when switching a tab rebuilt the header):
 *
 *  - a measurement that finds no chips, or chips with no height, must NOT be
 *    treated as final: it schedules another attempt instead of giving up;
 *  - a DOM mutation must re-measure even when the header and nav row are the same
 *    nodes, because that is exactly how the chips arrive (a child subtree grows).
 *
 * A settled measurement stops the retry chain so an idle header costs nothing.
 */
function useChipsAfterNav(enabled: boolean) {
  const useIsoLayoutEffect = typeof React.useLayoutEffect === 'function' ? React.useLayoutEffect : React.useEffect
  useIsoLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined
    let header: HTMLElement | null = null
    let nav: HTMLElement | null = null
    let headerObserver: ResizeObserver | null = null
    let navObserver: ResizeObserver | null = null
    let chipsObserver: ResizeObserver | null = null
    /** Watches the mounted header's subtree for the chips element appearing. */
    let headerTreeObserver: MutationObserver | null = null
    /** Document-level watch that only asks "is the header still the same node?". */
    let bodyObserver: MutationObserver | null = null
    /** The chips element currently observed, to detect a swap. */
    let observedChips: HTMLElement | null = null
    let timers: ReturnType<typeof setTimeout>[] = []
    let stopped = false
    /** The offset currently written, so an unchanged measurement stays quiet. */
    let applied: number | null = null
    /** Whether a retry chain is already running (never start a second one). */
    let retrying = false
    /** Open-ended settle window: cold start can take a while on a loaded machine. */
    const RETRY_DELAYS = [40, 90, 180, 350, 650, 1000, 1500, 2200]
    let retryIndex = 0

    const clearTimers = () => {
      for (const timer of timers) clearTimeout(timer)
      timers = []
    }

    const observeChips = (chips: HTMLElement | null) => {
      if (chipsObserver) { chipsObserver.disconnect(); chipsObserver = null }
      observedChips = chips
      if (!chips || typeof ResizeObserver !== 'function') return
      // The chips' own height is an input to the calculation: when they gain
      // content (an async badge, a label) the offset must be recomputed.
      chipsObserver = new ResizeObserver(() => requestMeasure())
      chipsObserver.observe(chips)
    }

    /**
     * Watch the mounted header for the chips element appearing or being swapped.
     *
     * This is the cold-start path: the header exists from the first frame, while
     * the chips (owned by other plugins) mount into it later. Watching the header
     * subtree is cheap — it is a narrow band whose content changes on navigation,
     * not on every streamed token — and the callback only re-measures when the
     * chips element is actually a different node.
     */
    const watchHeaderTree = (node: HTMLElement) => {
      if (headerTreeObserver) headerTreeObserver.disconnect()
      if (typeof MutationObserver !== 'function') return
      headerTreeObserver = new MutationObserver(() => {
        if (stopped || !node.isConnected) return
        if (node.querySelector('[class*="_headerActions"]') !== observedChips) requestMeasure()
      })
      headerTreeObserver.observe(node, { childList: true, subtree: true })
    }

    const bind = (next: HTMLElement) => {
      if (headerObserver) headerObserver.disconnect()
      if (navObserver) navObserver.disconnect()
      header = next
      nav = next.querySelector<HTMLElement>('[class*="_tabs"]')
      watchHeaderTree(next)
      observeChips(next.querySelector<HTMLElement>('[class*="_headerActions"]'))
      if (typeof ResizeObserver !== 'function') return
      headerObserver = new ResizeObserver(() => requestMeasure())
      headerObserver.observe(next)
      if (nav) {
        navObserver = new ResizeObserver(() => requestMeasure())
        navObserver.observe(nav)
      }
    }

    /**
     * Measure once. Returns true when the offset was decided (written or already
     * correct), false when the inputs are not there yet and a retry is owed.
     */
    const place = (): boolean => {
      if (stopped) return true
      const current = document.querySelector<HTMLElement>('header[data-window-drag]')
      if (!current) return false
      if (current !== header) bind(current)
      const chips = current.querySelector<HTMLElement>('[class*="_headerActions"]')
      if (!chips) { observeChips(null); return false }
      // Re-observe when the shell swapped the chips element inside the header
      // (a tab switch remounts the actions slot with a new node).
      if (chips !== observedChips) observeChips(chips)
      if (!nav) { nav = current.querySelector<HTMLElement>('[class*="_tabs"]'); if (!nav) return false }
      const head = current.getBoundingClientRect()
      const chipsHeight = chips.getBoundingClientRect().height
      const row = nav.getBoundingClientRect()
      // A header that has not been laid out yet, or chips that have mounted but
      // not sized, are "not ready" — not "zero offset".
      if (!head.height || !row.height || chipsHeight <= 0) return false
      const maxTop = Math.max(0, head.height - chipsHeight)
      const top = Math.max(0, Math.min(maxTop, Math.round(row.top + row.height / 2 - head.top - chipsHeight / 2)))
      if (top !== applied) {
        current.style.setProperty(CHIPS_TOP_VAR, top + 'px')
        applied = top
      }
      return true
    }

    /** Coalesce bursts of mutations into one measurement per frame. */
    let frame = 0
    const requestMeasure = () => {
      if (stopped) return
      if (typeof requestAnimationFrame !== 'function') { measure() ; return }
      if (frame) return
      frame = requestAnimationFrame(() => { frame = 0; measure() })
    }

    /**
     * Measure now, and if the inputs are not ready yet, keep retrying on the
     * backoff schedule. A successful measurement ends the chain.
     */
    const measure = () => {
      if (stopped) return
      if (place()) { retryIndex = 0; return }
      scheduleRetry()
    }

    const scheduleRetry = () => {
      if (stopped || retrying) return
      if (retryIndex >= RETRY_DELAYS.length) return
      retrying = true
      const delay = RETRY_DELAYS[retryIndex++]
      timers.push(setTimeout(() => {
        retrying = false
        if (stopped) return
        if (!place()) scheduleRetry()
        else retryIndex = 0
      }, delay))
    }

    if (!enabled) {
      const current = document.querySelector<HTMLElement>('header[data-window-drag]')
      if (current) current.style.removeProperty(CHIPS_TOP_VAR)
      return undefined
    }
    measure()
    // The body observer only has to notice the header (re)mounting; the header's
    // own subtree is where the chips appear, and that is watched per header below
    // so a streaming conversation does not drive a measurement per token.
    if (typeof MutationObserver === 'function' && document.body) {
      bodyObserver = new MutationObserver(() => {
        if (stopped) return
        const current = document.querySelector<HTMLElement>('header[data-window-drag]')
        // Only the header identity matters here; the header's own subtree (where
        // the chips appear) is watched by watchHeaderTree, so a busy conversation
        // never drives a measurement.
        if (current && current !== header) requestMeasure()
      })
      bodyObserver.observe(document.body, { childList: true, subtree: false })
    }
    window.addEventListener('resize', requestMeasure)
    return () => {
      stopped = true
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      clearTimers()
      if (headerObserver) headerObserver.disconnect()
      if (navObserver) navObserver.disconnect()
      if (chipsObserver) chipsObserver.disconnect()
      if (headerTreeObserver) headerTreeObserver.disconnect()
      if (bodyObserver) bodyObserver.disconnect()
      window.removeEventListener('resize', requestMeasure)
      const current = document.querySelector<HTMLElement>('header[data-window-drag]')
      if (current) current.style.removeProperty(CHIPS_TOP_VAR)
    }
  }, [enabled])
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
  /**
   * Start a brand-new session, exactly like the shell's own "New session"
   * (the + on a workspace row, Ctrl+N, the command palette). The shell picks the
   * workspace — the current one, else the most recent — so this button must not
   * invent a workspace id of its own.
   */
  newSession?: () => void
  /** Session id the hosting seat scopes this strip to, when it hands one down. */
  sessionId?: string | number | null
}

export function TabsStrip(props: TabsStripProps) {
  const { useSessions, useSessionStatus, useWorkspaces, useStore, t, open, newSession } = props
  // The seat declares the shared view store, so the settings page's two
  // "restore the host-native UI" switches are live here: tabs on/off and the
  // plugin dots vs. the host's own status lights.
  const prefs = typeof useStore === 'function' ? (useStore((s: any) => s.prefs) || {}) : {}
  const workspaceItems = typeof useWorkspaces === 'function' ? useWorkspaces((s: any) => s.items) : null
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
  // The row is capped to the room before the window utilities; chips size to
  // their own titles and only shrink/scroll when that room runs out.
  const roomWidth = useStripFill(barRef, [tabs.length, sessionId, showTabs])
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
  // No chips left (every tab closed): keep the bar only so the "+" survives —
  // otherwise the last close would strand the user with no way back to a tab.
  if (tabs.length === 0 && typeof newSession !== 'function') return null
  const titleOf = (id: string) => {
    // sessionTitleOf localizes the provisional New Session page instead of
    // leaking its raw id into the chip.
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    return sessionTitleOf(summary, t) || id
  }
  // Second bubble line: the project (last workspace title segment) and the
  // absolute update time, matching the session row's bubble meta.
  const chipMetaOf = (id: string) => {
    const summary = sessions && sessions.byId ? sessions.byId[id] : undefined
    const entries = Array.isArray(workspaceItems) ? workspaceItems : []
    // The workspace snapshot lists its members: find the owner of this session.
    let workspaceId = ''
    for (const entry of entries) {
      if (!entry || !Array.isArray(entry.sessionIds)) continue
      if (entry.sessionIds.some((sid: any) => String(sid) === String(id))) { workspaceId = String(entry.workspaceId || ''); break }
    }
    const workspace = workspaceId ? entries.find((entry: any) => entry && String(entry.workspaceId) === workspaceId) : undefined
    // Last path segment, matching the sidebar's workspace tag (web/前端 -> 前端).
    const name = workspace ? String(workspace.title || '').split('/').pop() || workspace.leaf || '' : ''
    const updatedAt = Number(summary && summary.updatedAt) > 0 ? new Date(Number(summary.updatedAt)).toLocaleString() : ''
    return [name, updatedAt].filter(Boolean).join(' · ')
  }
  // Hover bubble on the chips: the chip label truncates long titles, so hovering
  // repeats the FULL title plus the project and absolute time — the same two-line
  // shape the sidebar session rows use (ui/tooltip.ts). The resolver runs only
  // while the bubble is visible, so the meta (workspace title + timestamp) is
  // derived lazily from the hovered session id.
  const chipTipState = React.useRef({ id: '' })
  const chipTip = useHoverTip({
    label: () => {
      const id = chipTipState.current.id
      if (!id) return ''
      const title = titleOf(id)
      const meta = chipMetaOf(id)
      return meta ? title + '\n' + meta : title
    },
    delayMs: 300,
    gap: 6,
    maxWidth: 380,
    prefer: 'below',
  })
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
    style: roomWidth > 0 ? { maxWidth: roomWidth + 'px' } : undefined,
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
        // Same two-line content the sidebar rows show in their bubble: the full
        // title, then project · absolute time. aria-label mirrors it for AT.
        return E('div', {
          key: id,
          className: cls('bw-tab', active && 'bw-tab-active', draggingId === id && 'bw-tab-dragging'),
          'data-bw-active': active ? '1' : '0',
          'data-bw-tab-id': id,
          role: 'tab',
          tabIndex: active ? 0 : -1,
          'aria-selected': active,
          // The plugin bubble replaces the native tooltip here (a native title
          // would double up); the chip's own label text still names it for AT.
          draggable: true,
          style: activeStyle,
          // One bubble for the whole strip: the hovered chip becomes its anchor.
          onMouseEnter: (event: any) => {
            const ref = chipTip.attach.ref
            if (ref && typeof ref === 'object') ref.current = event.currentTarget
            chipTipState.current.id = id
            chipTip.attach.onMouseEnter(event)
          },
          onMouseLeave: chipTip.attach.onMouseLeave,
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
    // "New session" sits at the end of the row, outside the scrolling list, so it
    // is reachable no matter how many chips are open or where the row is scrolled
    // to. It is the same shell entry point the workspace + and Ctrl+N use: no
    // workspace id is passed, so the shell creates the blank session in the
    // current (else most recent) workspace, and the strip's blank-session rule
    // gives it its own chip.
    typeof newSession === 'function'
      ? E('button', {
        type: 'button',
        className: 'bw-tabs-new',
        'aria-label': t('session.new'),
        title: t('session.new'),
        onClick: (event: any) => { event.stopPropagation(); newSession() },
      }, E(PlusIcon16, { size: 14 }))
      : null,
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
    // Shared bubble, rendered last so it floats above the row.
    chipTip.bubble,
  )
}
