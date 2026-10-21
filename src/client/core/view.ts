/** Pure view-state rules: persistence migration, visibility, ordering, status derivation. */

export const VIEW_MODES = ['workspaces', 'projects', 'flat', 'time'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export const ARCHIVED_FILTERS = ['hide', 'show', 'only'] as const
export type ArchivedFilter = (typeof ARCHIVED_FILTERS)[number]

export type SortOrder = 'manual' | 'latest'
export type TimeDirection = 'latest' | 'oldest'

/** The pref slice the view state is derived from (persisted, older versions differ). */
export interface ViewPrefs {
  viewMode?: string
  timeDirection?: string
  sortOrder?: string
  archivedFilter?: string
  /** Pre-0.9 key: selected a view instead of an order. */
  sortMode?: string
  [key: string]: unknown
}

export interface ViewState {
  mode: ViewMode
  dir: TimeDirection
  sortOrder: SortOrder
  archivedFilter: ArchivedFilter
}

/**
 * The subset of the shell's SessionSummary this plugin reads. The host owns the
 * real shape; every field is optional because snapshots differ between host
 * versions (and the plugin must tolerate a partial snapshot).
 */
export interface SessionSummaryLike {
  id: string
  title?: string
  displayTitle?: string
  blank?: boolean
  origin?: string
  updatedAt?: number
  running?: boolean
  parentId?: string
  parentSessionId?: string
  retainedBy?: { mainView?: number }
  projectionValues?: { schedule?: unknown[] }
  [key: string]: unknown
}

/** The subset of the shell's session-list snapshot this plugin reads. */
export interface SessionListLike {
  byId?: Record<string, SessionSummaryLike | undefined>
  [key: string]: unknown
}

/** A row the ordered views sort. */
export interface SortableRow {
  updatedAt?: number
}

// Shared by both controls; persisted hydration replaces defaults wholesale.
// Legacy sortMode selected a view, so the new independent key is sortOrder.
export const viewStateOf = (prefs: ViewPrefs | null | undefined): ViewState => {
  const p = prefs || {}
  const legacy = p.sortMode
  let mode: ViewMode = 'projects'
  if ((VIEW_MODES as readonly string[]).includes(p.viewMode as string)) mode = p.viewMode as ViewMode
  else if (p.viewMode === undefined && (legacy === 'latest' || legacy === 'oldest')) mode = 'time'
  let dir: TimeDirection = 'latest'
  if (p.timeDirection === 'oldest' || (p.timeDirection === undefined && legacy === 'oldest')) dir = 'oldest'
  return {
    mode,
    dir,
    sortOrder: p.sortOrder === 'latest' ? 'latest' : 'manual',
    archivedFilter: (ARCHIVED_FILTERS as readonly string[]).includes(p.archivedFilter as string)
      ? p.archivedFilter as ArchivedFilter
      : 'hide',
  }
}

// Subagent children stay in their parent catalog; only the current blank
// is visible. Archive filtering is identical in all views and search.
export const sessionVisible = (
  summary: SessionSummaryLike | null | undefined,
  current: string | null,
  archivedSet: ReadonlySet<string>,
  archivedFilter: ArchivedFilter = 'hide',
): boolean => {
  if (!summary || summary.origin === 'subagent' || (summary.blank && summary.id !== current)) return false
  const archived = archivedSet.has(summary.id)
  if (archivedFilter === 'only') return archived
  if (archivedFilter === 'show') return true
  return !archived
}

/** Stable copy of the rows, newest first, when the order asks for time sorting. */
export const orderRows = <T extends SortableRow>(rows: readonly T[], sortOrder: SortOrder | string): T[] => {
  if (sortOrder !== 'latest') return rows.slice()
  return rows.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

/** Pending-interaction entry shape (kind/status/type all name the same idea). */
interface PendingEntry {
  kind?: string
  status?: string
  type?: string
  [key: string]: unknown
}

const pendingKind = (entry: unknown): string | undefined => {
  if (!entry) return undefined
  const p = entry as PendingEntry
  return p.kind || p.status || p.type || 'pending'
}

/** Pending-interaction kind from either a Map or a plain record keyed by session id. */
export const pendingKindOf = (pending: unknown, id: string): string | undefined => {
  if (!pending) return undefined
  const source = pending as { get?: (key: string) => unknown } & Record<string, unknown>
  const p = typeof source.get === 'function' ? source.get(id) : source[id]
  return pendingKind(p)
}

/**
 * Pending-interaction kind from the host status store. That store is the live
 * source of session status (running / completion-unread / pending
 * interaction); the session list snapshot carries none of it.
 */
export const statusPendingKindOf = (status: unknown): string | undefined => {
  const p = status as { pendingInteraction?: unknown } | null | undefined
  return pendingKind(p && p.pendingInteraction)
}

/**
 * The Session the main view is showing, in the shell's own terms.
 *
 * The sessions list snapshot carries no `current` field: the shell records the
 * session on screen as a `mainView` RETENTION on that summary (ui-workspace
 * calls `sessions.retain(id, { source: 'mainView' })` inside replaceMain), and
 * the shipped sidebar derives its own "current" highlight the same way. One
 * session holds that retention at a time; the first hit wins so a navigation
 * transition still names one session instead of none.
 *
 * Reading this field instead of a made-up `list.current` is what makes plain
 * sidebar clicks replace the current tab, keeps the current row highlighted,
 * and lets the New Session page (blank) appear at all: the shell shows a blank
 * session only while it is the current one.
 */
export const currentSessionIdOf = (list: SessionListLike | null | undefined): string | null => {
  const byId = list && list.byId
  if (!byId) return null
  for (const summary of Object.values(byId)) {
    if (!summary || !summary.retainedBy) continue
    if ((summary.retainedBy.mainView || 0) > 0) return String(summary.id)
  }
  return null
}

export const sessionTitleOf = (summary: Pick<SessionSummaryLike, 'blank' | 'displayTitle' | 'title'> | null | undefined, t: (key: string) => string): string => {
  if (!summary) return ''
  if (summary.blank) return t('session.new')
  return String(summary.displayTitle || summary.title || '')
}

/**
 * Active-schedule marker, mirroring the official tree's
 * hasActiveSchedule(): the list projection carries one entry per active
 * Schedule record, and a non-empty projection is the badge's only gate.
 * Defensive shapes (missing/mis-typed projection) degrade to false.
 */
export const hasActiveScheduleOf = (summary: SessionSummaryLike | null | undefined): boolean => !!(summary
  && summary.projectionValues
  && Array.isArray(summary.projectionValues.schedule)
  && summary.projectionValues.schedule.length > 0)

/**
 * Running subagent descendants per session (light lineage walk over
 * parent links) — a parent row keeps its "ongoing" ring while a spawned
 * subagent is still working. The client SessionSummary exposes the
 * parent as parentId (the session controller maps parentSessionId to
 * parentId on the wire); the old parentSessionId spelling is kept as a
 * fallback for profiles serving the pre-rename shape.
 */
export const subagentRunningCounts = (
  byId: Record<string, SessionSummaryLike | undefined> | null | undefined,
  runningOf?: ((id: string) => boolean) | null,
): Map<string, number> => {
  const children = new Map<string, SessionSummaryLike[]>()
  for (const id of Object.keys(byId || {})) {
    const summary = byId![id]
    const parentId = summary && (summary.parentId || summary.parentSessionId)
    if (!summary || !parentId) continue
    let list = children.get(parentId)
    if (!list) { list = []; children.set(parentId, list) }
    list.push(summary)
  }
  const countFor = (rootId: string): number => {
    let count = 0
    const queue = (children.get(rootId) || []).slice()
    const seen = new Set([rootId])
    while (queue.length > 0) {
      const summary = queue.shift() as SessionSummaryLike | undefined
      if (!summary || seen.has(summary.id)) continue
      seen.add(summary.id)
      const running = typeof runningOf === 'function' ? runningOf(summary.id) === true : !!summary.running
      if (running) count += 1
      const kids = children.get(summary.id)
      if (kids) for (const kid of kids) queue.push(kid)
    }
    return count
  }
  const counts = new Map<string, number>()
  for (const id of Object.keys(byId || {})) counts.set(id, countFor(id))
  return counts
}
