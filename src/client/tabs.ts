/**
 * Browser-style session tabs.
 *
 * The tab list is the ordered set of sessions kept open in the main panel; the
 * active tab is simply the shell's current session, so it needs no state of its
 * own. The rules are pure and the list lives in its own tiny persisted store:
 * the seat that hosts the strip is not guaranteed to receive the shell's view
 * store, so tabs must not depend on it.
 */

/** How many sessions stay open at once; opening one more drops the oldest. */
export const MAX_TABS = 12

/** localStorage key, versioned like the view store. */
const STORAGE_KEY = 'dsh.betterWorkspace.tabs.v1'

/** Ids arrive from the host as strings or numbers; tabs always compare as strings. */
const tabIdOf = (value: unknown): string => (value === undefined || value === null ? '' : String(value))

/** Coerce persisted or host values into a unique, bounded list of tab ids. */
export function normalizeTabs(value: unknown): string[] {
  const list: string[] = []
  const seen = new Set<string>()
  for (const entry of Array.isArray(value) ? value : []) {
    const id = tabIdOf(entry)
    if (!id || seen.has(id)) continue
    seen.add(id)
    list.push(id)
    if (list.length >= MAX_TABS) break
  }
  return list
}

/**
 * Open a session in its own tab.
 *
 * A session already open keeps its position (the tab is selected, never
 * duplicated); a new one appends, and the oldest tab drops once the strip is
 * full so the list stays bounded.
 */
export function openTab(tabs: unknown, sessionId: unknown): string[] {
  const id = tabIdOf(sessionId)
  const list = normalizeTabs(tabs)
  if (!id || list.includes(id)) return list
  list.push(id)
  return list.length > MAX_TABS ? list.slice(list.length - MAX_TABS) : list
}

/**
 * Replace the session inside one tab, in place.
 *
 * The strip grows nothing: the current tab switches to the clicked session.
 * This is the opt-in gesture (Shift+click, or the "open in a new tab" setting
 * turned off). When the clicked session is already open elsewhere, the previous
 * tab is dropped so a session never occupies two tabs.
 */
export function replaceTab(tabs: unknown, previousId: unknown, nextId: unknown): string[] {
  const prev = tabIdOf(previousId)
  const next = tabIdOf(nextId)
  const list = normalizeTabs(tabs)
  if (!next) return list
  if (!list.length) return [next]
  const at = prev ? list.indexOf(prev) : -1
  if (at < 0) return list.includes(next) ? list : openTab(list, next)
  if (list.includes(next)) return list.filter((id) => id !== prev)
  const copy = list.slice()
  copy[at] = next
  return copy
}

/** How a sidebar click should open a session. */
export interface ClickTabOptions {
  /**
   * Whether a plain click opens the session in a new tab.
   *
   * Defaults to true: clicking through the sidebar must never cost you the page
   * you had open, which is the browser behaviour people expect from a tab strip.
   * The plugin setting restores the original replace-in-place gesture.
   */
  newTabOnClick?: boolean
  /** Shift inverts the configured gesture (the tab strip's long-standing shortcut). */
  shift?: boolean
}

/**
 * The tab list a session click produces.
 *
 * One rule covers all four combinations of the setting and the Shift modifier,
 * because Shift means "the other gesture" either way: with the default setting
 * a plain click opens a tab and Shift replaces, and with the setting off a plain
 * click replaces while Shift opens a tab. A session that is already open keeps
 * its chip either way (openTab and replaceTab both refuse to duplicate it).
 */
export function tabsForClick(tabs: unknown, activeId: unknown, clickedId: unknown, options: ClickTabOptions = {}): string[] {
  const opensTab = (options.newTabOnClick !== false) !== (options.shift === true)
  if (!opensTab) return replaceTab(tabs, activeId, clickedId)
  // A fresh browser (or cleared storage) starts with an empty list while a
  // session is already on screen. Seeding it first keeps that page reachable as
  // a chip and makes the clicked session land at the end, like every other open.
  const list = normalizeTabs(tabs)
  const active = tabIdOf(activeId)
  return openTab(list.length === 0 && active ? [active] : list, clickedId)
}

/** Predicates the tab reconciliation uses to drop unreachable tabs. */
export interface ReconcileOptions {
  /** Whether the id is a provisional New Session (blank, never engaged). */
  isBlank?: (id: string) => boolean
  /** Whether the id is archived (the shell refuses to show it). */
  isArchived?: (id: string) => boolean
}

/**
 * Reconcile the tab list with the session the shell just put on screen.
 *
 * Navigation does not always start from a session row — "new session" (+ or the
 * shortcut), fork, the command palette and the tab strip itself all move the
 * shell's main view directly — so the strip syncs on the view change rather than
 * on the click that caused it. Rules:
 *
 *  - a provisional New Session (blank, never engaged) opens a tab of its own, so
 *    "new session" reads as a new page instead of replacing the page you were on;
 *  - any other not-yet-open session swaps the session inside the previous tab,
 *    so navigation the plugin does not own (the command palette, a host entry
 *    point) never grows the strip; the plugin's own session clicks write the
 *    list themselves before navigating (see tabsForClick);
 *  - tabs left behind by abandoned provisional sessions or archived sessions are
 *    dropped: the shell hides blank sessions except the current one and refuses
 *    archived ones, so such a chip could never be reached again.
 *
 * Ids the caller knows nothing about stay untouched (a partial session snapshot
 * must never lose a tab), and the list stays bounded through openTab.
 */
export function reconcileTabs(
  tabs: unknown,
  currentId: unknown,
  previousId: unknown,
  options: ReconcileOptions = {},
): string[] {
  const current = tabIdOf(currentId)
  if (!current) return normalizeTabs(tabs)
  const isBlank = typeof options.isBlank === 'function' ? options.isBlank : () => false
  const isArchived = typeof options.isArchived === 'function' ? options.isArchived : () => false
  const kept = normalizeTabs(tabs).filter((id) => id === current || (!isBlank(id) && !isArchived(id)))
  if (kept.includes(current)) return kept
  if (isBlank(current)) return openTab(kept, current)
  return replaceTab(kept, previousId, current)
}

/**
 * Move one tab to another tab's place (drag reordering).
 *
 * Dropping tab A on tab B inserts A where B was, keeping the rest of the strip
 * in order; an unknown id or a same-slot move leaves the list untouched.
 */
export function moveTab(tabs: unknown, fromId: unknown, toId: unknown): string[] {
  const from = tabIdOf(fromId)
  const to = tabIdOf(toId)
  const list = normalizeTabs(tabs)
  const at = list.indexOf(from)
  const target = list.indexOf(to)
  if (at < 0 || target < 0 || at === target) return list
  const copy = list.slice()
  const [moved] = copy.splice(at, 1)
  // The target's ORIGINAL index is the slot the dragged tab takes; using its
  // post-removal index made an adjacent move a no-op (tab 1 could never pass
  // tab 2).
  copy.splice(Math.min(target, copy.length), 0, moved)
  return copy
}

/** One horizontal rectangle, in viewport coordinates (getBoundingClientRect shape). */
export interface Span {
  left: number
  right: number
}

/**
 * How far to add to a scroll container's scrollLeft to bring an item fully
 * into view.
 *
 * `pad` keeps a sliver of the neighbouring chip visible, so an edge chip does
 * not sit flush against the fade. Returns 0 when the item is already visible;
 * negative values scroll left, positive right. Pure numbers: the strip feeds it
 * two rects and applies the result, which keeps the reveal rule testable
 * without a DOM.
 */
export function scrollDeltaFor(container: Span, item: Span, pad = 6): number {
  const left = Number(container.left)
  const right = Number(container.right)
  const itemLeft = Number(item.left)
  const itemRight = Number(item.right)
  // A detached/hidden node measures NaN: writing that into scrollLeft would be
  // silently ignored (or worse, reset the row), so missing geometry scrolls nothing.
  if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(itemLeft) || !Number.isFinite(itemRight)) return 0
  if (itemLeft < left + pad) return itemLeft - left - pad
  if (itemRight > right - pad) return itemRight - right + pad
  return 0
}

/**
 * Width the strip should take so the chips fill the header instead of stopping
 * after the last chip and leaving dead space.
 *
 * `limitLeft` is the left edge of the first control to the right of the strip
 * (the header utilities cluster), `barLeft` the strip's own left edge. The row
 * ends a small gap before that control; a measurement that collapses the strip
 * (no control found, or one sitting right next to the chips) is rejected with 0,
 * which leaves the CSS fallback in charge. `headerWidth` caps the result so a
 * stray full-width node can never push the row across the header.
 */
export function stripFillWidth(limitLeft: number, barLeft: number, headerWidth: number, minimum = 220, reserve = 40): number {
  const limit = Number(limitLeft)
  const left = Number(barLeft)
  const header = Number(headerWidth)
  if (!Number.isFinite(limit) || !Number.isFinite(left) || limit <= left) return 0
  // The limit already sits inside the header (left of the right-hand controls),
  // so it is normally the binding constraint. `reserve` additionally guarantees
  // the host's own right-hand controls some room: clamping the row here means the
  // strip can never squeeze those controls out of the header.
  const cap = Number.isFinite(header) && header > 0 ? header - Math.max(40, reserve) : limit - left
  const width = Math.round(Math.min(limit - left - 12, cap))
  return width >= minimum ? width : 0
}


/** Remaining tabs plus the neighbour that should take over when the closed tab was active. */
export interface CloseTabResult {
  tabs: string[]
  next: string | null
}

/**
 * Close one tab.
 */
export function closeTab(tabs: unknown, sessionId: unknown, activeSessionId?: unknown): CloseTabResult {
  const id = tabIdOf(sessionId)
  const list = normalizeTabs(tabs)
  const at = list.indexOf(id)
  if (at < 0) return { tabs: list, next: null }
  const rest = list.filter((entry) => entry !== id)
  const wasActive = tabIdOf(activeSessionId) === id
  const next = wasActive ? rest[Math.min(at, rest.length - 1)] || null : null
  return { tabs: rest, next }
}


/* ---------------------------- persisted list ---------------------------- */

/** Read the persisted list; a browser without storage (tests, SSR) starts empty. */
function loadTabs(): string[] {
  try {
    const raw = globalThis.localStorage ? globalThis.localStorage.getItem(STORAGE_KEY) : null
    return raw ? normalizeTabs(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

let tabList: string[] = loadTabs()
/** The session the shell is showing; written by the sidebar, read by the strip. */
let activeTab: string | null = null
const listeners = new Set<() => void>()

/** The current tab list (a fresh array, safe to render). */
export function tabsSnapshot(): string[] {
  return tabList.slice()
}

/** The active tab id (the session on screen), or null before the first report. */
export function tabsActive(): string | null {
  return activeTab
}

/** Record the session on screen; notifies only on change. */
export function setActiveTab(value: unknown): string | null {
  const next = tabIdOf(value) || null
  if (next === activeTab) return activeTab
  activeTab = next
  for (const listener of [...listeners]) {
    try { listener() } catch {}
  }
  return activeTab
}

/** Replace the whole list, persist it and wake every subscriber. */
export function saveTabs(value: unknown): string[] {
  const next = normalizeTabs(value)
  const same = next.length === tabList.length && next.every((id, index) => id === tabList[index])
  tabList = next
  if (!same) {
    try {
      if (globalThis.localStorage) globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    for (const listener of [...listeners]) {
      try { listener() } catch {}
    }
  }
  return tabList.slice()
}

/** Subscribe to list changes; returns the unsubscribe function. */
export function subscribeTabs(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
