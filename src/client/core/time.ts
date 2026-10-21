/** Pure time bucketing and relative labels. relativeTime (ui.relativeTime) is injected as an argument. */

/** Sort buckets of the time views, most recent first. */
export type TimeBucket = 'today' | 'yesterday' | 'week' | 'month' | 'earlier'

/** The shape `ui.relativeTime` returns (unit + count). */
export interface RelativeTime {
  unit: string
  /** Absent for the "now" unit (ui.relativeTime omits it there). */
  n?: number
}

/** Translate function injected by the shell (`t`, bound to the plugin namespace). */
export type Translate = (key: string, params?: Record<string, string | number>) => string

/** `ui.relativeTime`-shaped helper, injected as an argument. */
export type RelativeTimeFn = (updatedAt: number, now: number) => RelativeTime | null | undefined

/**
 * Time bucket for the sorted views: local-calendar day boundaries (the
 * label a user reads, not a UTC slice), then 7d / 30d windows, else
 * "earlier". updatedAt 0 (unknown) lands in "earlier".
 */
export const bucketOf = (updatedAt: number | null | undefined, now: number): TimeBucket => {
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

export const BUCKET_ORDER: readonly TimeBucket[] = ['today', 'yesterday', 'week', 'month', 'earlier']

/** Last-resort suffixes when the dictionary has no translation for a unit. */
export const FALLBACK_UNITS: Record<string, string> = { minutes: 'm', hours: 'h', days: 'd', months: 'mo', years: 'y' }

export const timeLabel = (updatedAt: number, now: number, t: Translate, relativeTime: RelativeTimeFn | null | undefined): string => {
  // relativeTime is ui.relativeTime injected by the caller: this module stays
  // free of platform access (see tests/architecture.test.ts).
  if (typeof relativeTime !== 'function') return ''
  const r = relativeTime(updatedAt, now)
  if (!r) return ''
  if (r.unit === 'now') return t('time.now')
  const key = 'time.' + r.unit
  const count = r.n ?? 0
  const out = t(key, { n: count })
  if (typeof out === 'string' && out !== '' && out !== key) return out
  return String(count) + (FALLBACK_UNITS[r.unit] || '')
}
