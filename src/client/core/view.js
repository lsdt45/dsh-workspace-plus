/** Pure view-state rules: persistence migration, visibility, ordering, status derivation. */

export const VIEW_MODES = ['workspaces', 'projects', 'flat', 'time']

export const ARCHIVED_FILTERS = ['hide', 'show', 'only']

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

export const sessionTitleOf = (summary, t) => {
  if (!summary) return ''
  if (summary.blank) return t('session.new')
  return String(summary.displayTitle || summary.title || '')
}

export const hasActiveScheduleOf = (summary) => !!(summary
  && summary.projectionValues
  && Array.isArray(summary.projectionValues.schedule)
  && summary.projectionValues.schedule.length > 0)

export const subagentRunningCounts = (byId) => {
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
      if (summary.running) count += 1
      const kids = children.get(summary.id)
      if (kids) for (const kid of kids) queue.push(kid)
    }
    return count
  }
  const counts = new Map()
  for (const id of Object.keys(byId || {})) counts.set(id, countFor(id))
  return counts
}
