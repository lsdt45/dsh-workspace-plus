/** Pure time bucketing and relative labels. relativeTime (ui.relativeTime) is injected as an argument. */

    /**
     * Time bucket for the sorted views: local-calendar day boundaries (the
     * label a user reads, not a UTC slice), then 7d / 30d windows, else
     * "earlier". updatedAt 0 (unknown) lands in "earlier".
     */
export const bucketOf = (updatedAt, now) => {
  const t = Number(updatedAt) || 0
  if (t <= 0) return 'earlier'
  const n = new Date(now)
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
  if (t >= today) return 'today'
  if (t >= today - 86400000) return 'yesterday'
  if (t >= today - 7 * 86400000) return 'week'
  if (t >= today - 30 * 86400000) return 'month'
  return 'earlier'
}

export const BUCKET_ORDER = ['today', 'yesterday', 'week', 'month', 'earlier']

export const FALLBACK_UNITS = { minutes: 'm', hours: 'h', days: 'd', months: 'mo', years: 'y' }

export const timeLabel = (updatedAt, now, t, relativeTime) => {
  // relativeTime is ui.relativeTime injected by the caller: this module stays
  // free of platform access (see tests/architecture.test.mjs).
  if (typeof relativeTime !== 'function') return ''
  const r = relativeTime(updatedAt, now)
  if (!r) return ''
  if (r.unit === 'now') return t('time.now')
  const key = 'time.' + r.unit
  const out = t(key, { n: r.n })
  if (typeof out === 'string' && out !== '' && out !== key) return out
  return String(r.n) + (FALLBACK_UNITS[r.unit] || '')
}
