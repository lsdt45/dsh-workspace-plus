/**
 * Floating search overlay (Codex-style): one fixed panel over the sidebar with
 * an input, the Host's full-text content hits merged behind the local
 * title/workspace matches, and keyboard navigation.
 *
 * The panel is plugin-owned: the shell's own search seat belongs to the shipped
 * workspace browser this plugin shadows, so nothing upstream renders for us.
 */

import { E, React } from '../platform.ts'
import { icon } from '../icons.ts'
import { cls } from '../core/text.ts'
import { localSearch, mergeSearchResults, normalizeQuery, recentSearchRows } from '../core/search.ts'
import type { SearchCandidate, SearchContentItem, SearchResultRow } from '../core/search.ts'
import type { Translate } from '../core/time.ts'
import { searchHost, useSearchHost } from './search-host.ts'

/** Debounce before asking the Host's content index (local matches are instant). */
const SEARCH_DEBOUNCE_MS = 180

/** How many rows the panel shows at most. */
const DEFAULT_LIMIT = 20

/** One Host search page. */
interface ContentPage {
  items: SearchContentItem[]
  hasMore?: boolean
}

/** Props the browser passes into the overlay. */
export interface SearchOverlayProps {
  open: boolean
  candidates: ReadonlyArray<SearchCandidate>
  limit?: number
  /** Host full-text search; absent on hosts without the content index. */
  searchSessions?: ((query: string, signal?: any) => Promise<ContentPage>) | null
  onOpen: (sessionId: string) => void
  onClose: () => void
  t: Translate
}

/** Content-search state for one query. */
interface RemoteState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: SearchContentItem[]
  hasMore: boolean
}

/** The floating search panel. Renders nothing while closed. */
export function SearchOverlay({ open, candidates, limit = DEFAULT_LIMIT, searchSessions, onOpen, onClose, t }: SearchOverlayProps) {
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const [remote, setRemote] = React.useState({ status: 'idle', items: [], hasMore: false } as RemoteState)
  const inputRef = React.useRef(null)
  const requestRef = React.useRef(0)
  const cappedLimit = Math.max(1, Math.trunc(Number(limit) || DEFAULT_LIMIT))

  // A fresh open always starts from an empty query and the first row, then
  // hands focus back to whatever opened the panel when it closes.
  React.useEffect(() => {
    if (!open) return undefined
    const previous = typeof document !== 'undefined' ? document.activeElement : null
    setQuery('')
    setActive(0)
    setRemote({ status: 'idle', items: [], hasMore: false })
    const timer = setTimeout(() => {
      const input = inputRef.current
      if (input && typeof input.focus === 'function') input.focus({ preventScroll: true })
    }, 0)
    return () => {
      clearTimeout(timer)
      if (previous && typeof (previous as any).focus === 'function') {
        try { (previous as any).focus({ preventScroll: true }) } catch { /* the opener may be gone */ }
      }
    }
  }, [open])

  // Content search: debounced, aborted on change/unmount, last response wins.
  React.useEffect(() => {
    if (!open) return undefined
    const trimmed = normalizeQuery(query)
    if (trimmed === '' || typeof searchSessions !== 'function') {
      requestRef.current += 1
      setRemote({ status: 'idle', items: [], hasMore: false })
      return undefined
    }
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    const controller = typeof AbortController === 'function' ? new AbortController() : null
    setRemote((previous: RemoteState) => ({ status: 'loading', items: previous.items, hasMore: false }))
    const timer = setTimeout(() => {
      searchSessions(trimmed, controller ? controller.signal : undefined).then((page) => {
        if (requestRef.current !== requestId) return
        setRemote({
          status: 'ready',
          items: Array.isArray(page && page.items) ? page.items : [],
          hasMore: !!(page && page.hasMore),
        })
      }).catch(() => {
        if (requestRef.current !== requestId) return
        setRemote({ status: 'error', items: [], hasMore: false })
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      if (controller) controller.abort()
    }
  }, [open, query, searchSessions])

  const byId = React.useMemo(() => {
    const map = new Map<string, SearchCandidate>()
    for (const candidate of candidates) if (!map.has(candidate.id)) map.set(candidate.id, candidate)
    return map
  }, [candidates])

  const merged = React.useMemo(() => {
    const local = localSearch(candidates, query)
    return mergeSearchResults(local, remote.items, (id) => byId.get(id), cappedLimit)
  }, [candidates, query, remote.items, byId, cappedLimit])

  const display: SearchResultRow[] = React.useMemo(() => {
    if (normalizeQuery(query) === '') return recentSearchRows(candidates, cappedLimit).map(candidate => ({ ...candidate }))
    return merged.items
  }, [candidates, query, merged, cappedLimit])

  React.useEffect(() => { setActive(0) }, [query])

  const openAt = (index: number): void => {
    const row = display[index]
    if (!row) return
    onOpen(row.id)
    onClose()
  }

  const onKeyDown = (event: any): void => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index: number) => display.length === 0 ? 0 : (index + 1) % display.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index: number) => display.length === 0 ? 0 : (index - 1 + display.length) % display.length)
      return
    }
    if (event.key === 'Enter') { event.preventDefault(); openAt(active); return }
    if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) { event.preventDefault(); openAt(Number(event.key) - 1) }
  }

  if (!open) return null
  const trimmed = normalizeQuery(query)
  const pending = remote.status === 'loading'
  const rows = display.map((row, index) => E('button', {
    key: row.id,
    type: 'button',
    role: 'option',
    'aria-selected': index === active,
    className: cls('bw-search-row', index === active && 'bw-search-row-active'),
    onMouseEnter: () => setActive(index),
    onClick: () => { onOpen(row.id); onClose() },
  },
    E('span', { className: 'bw-search-row-main' },
      E('span', { className: 'bw-search-row-title', title: row.title }, row.title),
      row.snippet ? E('span', { className: 'bw-search-row-snippet' }, row.snippet) : null,
    ),
    row.workspace ? E('span', { className: 'bw-search-row-ws', title: row.workspace }, row.workspace) : null,
    index < 9 ? E('span', { className: 'bw-search-row-idx', 'aria-hidden': 'true' }, '\u2303' + (index + 1)) : null,
  ))

  const empty = display.length === 0
  const statusText = trimmed === ''
    ? ''
    : pending
      ? t('search.pending')
      : remote.hasMore || merged.hasMore
        ? t('search.hasMore', { n: cappedLimit })
        : ''

  return E('div', {
    className: 'bw-search-overlay',
    onMouseDown: () => onClose(),
    onKeyDown,
  },
    E('div', {
      className: 'bw-search-panel',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': t('search.label'),
      onMouseDown: (event: any) => event.stopPropagation(),
    },
      E('div', { className: 'bw-search-field' },
        icon('IconSearchOutline16', 16),
        E('input', {
          ref: inputRef,
          className: 'bw-search-input',
          type: 'text',
          value: query,
          placeholder: t('search.placeholder'),
          'aria-label': t('search.label'),
          autoComplete: 'off',
          spellCheck: false,
          onChange: (event: any) => setQuery(event.target.value),
        }),
      ),
      E('div', { className: 'bw-search-list', role: 'listbox', 'aria-label': t('search.results') },
        E('div', { className: 'bw-search-section' },
          E('span', null, t('search.section.chats')),
          statusText !== '' ? E('span', { className: 'bw-search-status', role: 'status' }, statusText) : null,
        ),
        empty
          // While the content index is still answering, the header already says
          // "searching"; an empty body must not claim there are no matches yet.
          ? (pending ? null : E('div', { className: 'bw-search-empty' }, trimmed === '' ? t('search.emptyRecent') : t('search.empty')))
          : rows,
      ),
    ),
  )
}

/**
 * The `shell.overlay` seat: renders the panel above the whole app from the
 * bridge state. Registered once at plugin start; the sidebar publishes into it.
 */
export function SearchOverlaySeat() {
  const host = useSearchHost()
  if (!host.open || host.t === null) return null
  const t = host.t
  return E(SearchOverlay, {
    open: true,
    candidates: host.candidates,
    limit: host.limit,
    searchSessions: host.searchSessions,
    onOpen: (sessionId: string) => { if (host.openSession) host.openSession(sessionId) },
    onClose: () => searchHost.hide(),
    t,
  })
}
