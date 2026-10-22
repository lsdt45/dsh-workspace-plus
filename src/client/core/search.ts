/**
 * Pure projections behind the search overlay: candidate rows, local
 * title/workspace matches, and the merge with the Host's full-text content page.
 *
 * No React and no platform handles (tests/architecture.test.ts enforces it): the
 * overlay component feeds snapshots in and renders what these functions return.
 */

import type { SessionListLike } from './view.ts'

/** One content hit as the Host search page returns it. */
export interface SearchContentItem {
  /** Session the matching event belongs to. */
  sessionId: string
  /** Plain-text excerpt around the strongest match, when the backend supplies it. */
  snippet?: string
}

/** One row the overlay renders. */
export interface SearchResultRow {
  id: string
  title: string
  workspace: string
  updatedAt: number
  /** Host content excerpt; only rows that matched history text carry one. */
  snippet?: string
}

/** One session eligible for search (already filtered by blank/archive rules). */
export interface SearchCandidate {
  id: string
  title: string
  workspace: string
  updatedAt: number
}

/** Whitespace-trimmed query; every matcher below treats '' as "no query". */
export const normalizeQuery = (text: unknown): string => String(text ?? '').trim()

/** Build candidates from the session snapshot, in the caller's visibility order. */
export function searchCandidates(list: SessionListLike | null | undefined, workspaceLabelOf: (id: string) => string): SearchCandidate[] {
  const ids: string[] = Array.isArray(list && list.ids) ? (list!.ids as string[]) : Object.keys((list && list.byId) || {})
  const byId: Record<string, any> = (list && list.byId) || {}
  const out: SearchCandidate[] = []
  for (const id of ids) {
    const summary = byId[id]
    if (!summary || summary.blank === true) continue
    out.push({
      id: String(id),
      title: String(summary.displayTitle || summary.title || '') || String(id),
      workspace: workspaceLabelOf(String(id)),
      updatedAt: Number(summary.updatedAt) || 0,
    })
  }
  return out
}

/** Title and workspace-label substring matches, newest first ('' query matches none). */
export function localSearch(candidates: ReadonlyArray<SearchCandidate>, query: string): SearchCandidate[] {
  const needle = normalizeQuery(query).toLowerCase()
  if (needle === '') return []
  return candidates
    .filter(candidate => candidate.title.toLowerCase().includes(needle) || candidate.workspace.toLowerCase().includes(needle))
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Newest-first candidates, for the overlay's initial (empty-query) list. */
export function recentSearchRows(candidates: ReadonlyArray<SearchCandidate>, limit: number): SearchCandidate[] {
  const max = Math.max(0, Math.trunc(limit))
  return candidates.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, max)
}

/**
 * Merge local matches (leading, newest first) with the Host's ranked content
 * page (backend order, deduplicated by session). A session present in both keeps
 * its local position and receives the content snippet in place.
 */
export function mergeSearchResults(
  local: ReadonlyArray<SearchCandidate>,
  content: ReadonlyArray<SearchContentItem> | null | undefined,
  byId: (id: string) => SearchCandidate | undefined,
  limit: number,
): { items: SearchResultRow[]; hasMore: boolean } {
  const max = Math.max(0, Math.trunc(limit))
  const items: SearchResultRow[] = []
  const indexOf = new Map<string, number>()
  const include = (row: SearchCandidate, snippet?: string): void => {
    const existing = indexOf.get(row.id)
    if (existing !== undefined) {
      if (snippet && items[existing].snippet === undefined) items[existing].snippet = snippet
      return
    }
    indexOf.set(row.id, items.length)
    items.push(snippet === undefined ? { ...row } : { ...row, snippet })
  }
  for (const row of local) include(row)
  for (const hit of content || []) {
    if (!hit || typeof hit.sessionId !== 'string') continue
    const row = byId(hit.sessionId)
    if (row) include(row, typeof hit.snippet === 'string' && hit.snippet !== '' ? hit.snippet : undefined)
  }
  const hasMore = items.length > max
  return { items: items.slice(0, max), hasMore }
}


/* ---------------------- content-search gates and helpers ------------------- */

/** Minimum code points a query needs before the Host content index is asked. */
export const CONTENT_QUERY_MIN_CODE_POINTS = 2

/**
 * True when a query is long enough for a content search. One letter or one CJK
 * character matches too much and would cost a Host round trip per keystroke, so
 * the panel keeps those to local title matches.
 */
export function isContentQueryReady(query: string): boolean {
  const normalized = normalizeQuery(query)
  if (normalized === '') return false
  return Array.from(normalized).length >= CONTENT_QUERY_MIN_CODE_POINTS
}

/** One cached Host content page. */
export interface SearchPage {
  items: SearchContentItem[]
  hasMore: boolean
}

/** Small LRU + TTL cache for Host content pages (backspace/repeat are free). */
export interface SearchPageCache {
  get(query: string): SearchPage | undefined
  set(query: string, page: SearchPage): void
  clear(): void
  readonly size: number
}

/** Cache knobs; the clock is injected so tests can advance it. */
export interface SearchPageCacheOptions {
  max?: number
  ttlMs?: number
  now?: () => number
}

/** Build an LRU cache; a non-positive TTL disables caching entirely. */
export function createSearchPageCache(options: SearchPageCacheOptions = {}): SearchPageCache {
  const max = Math.max(1, Math.trunc(options.max ?? 32))
  const ttlMs = Math.trunc(options.ttlMs ?? 60_000)
  const now = options.now ?? Date.now
  const entries = new Map<string, { page: SearchPage; at: number }>()
  const keyOf = (query: string): string => normalizeQuery(query)
  return {
    get(query: string): SearchPage | undefined {
      if (ttlMs <= 0) return undefined
      const key = keyOf(query)
      if (key === '') return undefined
      const entry = entries.get(key)
      if (!entry) return undefined
      if (now() - entry.at > ttlMs) {
        entries.delete(key)
        return undefined
      }
      // Touch: Map insertion order is the LRU order.
      entries.delete(key)
      entries.set(key, entry)
      return entry.page
    },
    set(query: string, page: SearchPage): void {
      if (ttlMs <= 0) return
      const key = keyOf(query)
      if (key === '') return
      entries.delete(key)
      entries.set(key, { page, at: now() })
      while (entries.size > max) {
        const oldest = entries.keys().next()
        if (oldest.done === true) break
        entries.delete(oldest.value)
      }
    },
    clear(): void {
      entries.clear()
    },
    get size(): number {
      return entries.size
    },
  }
}

/** Markers the Host uses when the session index is switched off / not mounted. */
const CONTENT_UNAVAILABLE = /SESSION_QUERY_SEARCH_DISABLED|session search is disabled|session search is unavailable/i

/**
 * True when a Host search rejection means "no content index in this
 * deployment" (as opposed to a transient failure). The panel then stops asking
 * for the rest of the open instead of failing once per keystroke.
 */
export function isContentSearchUnavailable(reason: unknown): boolean {
  if (reason === null || reason === undefined) return false
  const code = (reason as { code?: unknown }).code
  if (typeof code === 'string' && CONTENT_UNAVAILABLE.test(code)) return true
  const message = reason instanceof Error
    ? reason.message
    : typeof reason === 'string'
      ? reason
      : typeof (reason as { message?: unknown }).message === 'string'
        ? String((reason as { message?: string }).message)
        : ''
  return CONTENT_UNAVAILABLE.test(message)
}

/** The Host failure envelope the browser service returns for a rejected search. */
interface SearchFailureEnvelope {
  error?: string | { code?: string; message?: string }
  message?: string
  [key: string]: unknown
}

/**
 * Turn the Host failure envelope into an Error that keeps the stable code, so
 * the overlay can tell "index disabled" from a transient error.
 */
export function searchFailure(result: unknown): Error {
  const envelope = (result || {}) as SearchFailureEnvelope
  const error = envelope.error
  const message = (typeof error === 'object' && error !== null && typeof error.message === 'string' && error.message !== '' ? error.message : undefined)
    || (typeof error === 'string' && error !== '' ? error : undefined)
    || (typeof envelope.message === 'string' && envelope.message !== '' ? envelope.message : undefined)
    || 'session search failed'
  const failure = new Error(message) as Error & { code?: string }
  if (typeof error === 'object' && error !== null && typeof error.code === 'string' && error.code !== '') failure.code = error.code
  return failure
}
