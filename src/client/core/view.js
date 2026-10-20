/** Pure view-state rules: persistence migration, visibility, ordering, status derivation. */

export const VIEW_MODES = ['workspaces', 'projects', 'flat', 'time']

export const ARCHIVED_FILTERS = ['hide', 'show', 'only']

    // Shared by both controls; persisted hydration replaces defaults wholesale.
    // Legacy sortMode selected a view, so the new independent key is sortOrder.
export const viewStateOf = (prefs) => {
  const p = prefs || {}
  const legacy = p.sortMode
  let mode = 'projects'
  if (VIEW_MODES.includes(p.viewMode)) mode = p.viewMode
  else if (p.viewMode === undefined && (legacy === 'latest' || legacy === 'oldest')) mode = 'time'
  let dir = 'latest'
  if (p.timeDirection === 'oldest' || (p.timeDirection === undefined && legacy === 'oldest')) dir = 'oldest'
  return {
    mode,
    dir,
    sortOrder: p.sortOrder === 'latest' ? 'latest' : 'manual',
    archivedFilter: ARCHIVED_FILTERS.includes(p.archivedFilter) ? p.archivedFilter : 'hide',
  }
}

    // Subagent children stay in their parent catalog; only the current blank
    // is visible. Archive filtering is identical in all views and search.
export const sessionVisible = (summary, current, archivedSet, archivedFilter = 'hide') => {
  if (!summary || summary.origin === 'subagent' || (summary.blank && summary.id !== current)) return false
  const archived = archivedSet.has(summary.id)
  if (archivedFilter === 'only') return archived
  if (archivedFilter === 'show') return true
  return !archived
}

export const orderRows = (rows, sortOrder) => {
  if (sortOrder !== 'latest') return rows
  return rows.slice().sort((a, b) => b.updatedAt - a.updatedAt)
}

export const pendingKindOf = (pending, id) => {
  if (!pending) return undefined
  const p = typeof pending.get === 'function' ? pending.get(id) : pending[id]
  if (!p) return undefined
  return p.kind || p.status || p.type || 'pending'
}

/**
 * Pending-interaction kind from the host status store. That store is the live
 * source of session status (running / completion-unread / pending
 * interaction); the session list snapshot carries none of it.
 */
export const statusPendingKindOf = (status) => {
  const p = status && status.pendingInteraction
  if (!p) return undefined
  return p.kind || p.status || p.type || 'pending'
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
export const currentSessionIdOf = (list) => {
  const byId = list && list.byId
  if (!byId) return null
  for (const summary of Object.values(byId)) {
    if (!summary || !summary.retainedBy) continue
    if ((summary.retainedBy.mainView || 0) > 0) return String(summary.id)
  }
  return null
}

export const sessionTitleOf = (summary, t) => {
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
export const hasActiveScheduleOf = (summary) => !!(summary
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
export const subagentRunningCounts = (byId, runningOf) => {
  const children = new Map()
  for (const id of Object.keys(byId || {})) {
    const summary = byId[id]
    const parentId = summary && (summary.parentId || summary.parentSessionId)
    if (!summary || !parentId) continue
    let list = children.get(parentId)
    if (!list) { list = []; children.set(parentId, list) }
    list.push(summary)
  }
  const countFor = (rootId) => {
    let count = 0
    const queue = (children.get(rootId) || []).slice()
    const seen = new Set([rootId])
    while (queue.length > 0) {
      const summary = queue.shift()
      if (!summary || seen.has(summary.id)) continue
      seen.add(summary.id)
      const running = typeof runningOf === 'function' ? runningOf(summary.id) === true : !!summary.running
      if (running) count += 1
      const kids = children.get(summary.id)
      if (kids) for (const kid of kids) queue.push(kid)
    }
    return count
  }
  const counts = new Map()
  for (const id of Object.keys(byId || {})) counts.set(id, countFor(id))
  return counts
}
