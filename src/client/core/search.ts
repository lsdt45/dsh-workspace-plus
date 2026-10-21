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
