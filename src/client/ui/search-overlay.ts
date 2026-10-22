/**
 * Floating search overlay (Codex-style): one fixed panel over the sidebar with
 * an input, the Host's full-text content hits merged behind the local
 * title/workspace matches, and keyboard navigation.
 *
 * The panel is plugin-owned: the shell's own search seat belongs to the shipped
 * workspace browser this plugin shadows, so nothing upstream renders for us.
 *
 * Content search rides the Host's SQLite FTS5 index through sessions.search:
 * debounced, aborted on change, cached per open, and skipped for queries too
 * short to be useful. The content switch persists in the plugin store; when the
 * deployment has no index the panel says so once and keeps title matching.
 */

import { E, React } from '../platform.ts'
import { icon } from '../icons.ts'
import { cls } from '../core/text.ts'
import {
  createSearchPageCache,
  isContentQueryReady,
  isContentSearchUnavailable,
  localSearch,
  mergeSearchResults,
  normalizeQuery,
  recentSearchRows,
} from '../core/search.ts'
import type { SearchCandidate, SearchContentItem, SearchResultRow } from '../core/search.ts'
import type { Translate } from '../core/time.ts'
import { searchHost, useSearchHost } from './search-host.ts'

/** Debounce before asking the Host's content index (local matches are instant). */
const SEARCH_DEBOUNCE_MS = 180

/** A search slower than this is (almost always) the first index build. */
const SEARCH_SLOW_MS = 600

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
  /** Whether the content switch is on; defaults to on. */
  contentEnabled?: boolean
  /** Persist the content switch. Without it the panel renders no switch. */
  onContentToggle?: ((next: boolean) => void) | null
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
export function SearchOverlay({
  open,
  candidates,
  limit = DEFAULT_LIMIT,
  searchSessions,
  contentEnabled = true,
  onContentToggle,
  onOpen,
  onClose,
  t,
}: SearchOverlayProps) {
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  // True while arrow keys own the highlight: the CSS hover tint must not hide
  // the keyboard-selected row. Cleared by the next pointer move over the list.
  const [keyboardNav, setKeyboardNav] = React.useState(false)
  const [remote, setRemote] = React.useState({ status: 'idle', items: [], hasMore: false } as RemoteState)
  // The Host index is absent/disabled: stop asking for the rest of this open.
  const [unavailable, setUnavailable] = React.useState(false)
  // The current request has been pending long enough to be an index build.
  const [slow, setSlow] = React.useState(false)
  // An IME composition owns the input; searching partial pinyin is wasteful.
  const [composing, setComposing] = React.useState(false)
  const inputRef = React.useRef(null)
  const requestRef = React.useRef(0)
  const cappedLimit = Math.max(1, Math.trunc(Number(limit) || DEFAULT_LIMIT))
  // One cache per Host search function: a new host (or a stub in tests) starts
  // clean, and the cache only lives as long as this mounted panel.
  const cache = React.useMemo(() => createSearchPageCache(), [searchSessions])
  // The backend decides whether content search runs; the callback only decides
  // whether the panel can render its switch (a host may publish one without the
  // other, and tests exercise search without a persistence hook).
  const showContentSwitch = typeof searchSessions === 'function' && typeof onContentToggle === 'function'
  const contentOn = contentEnabled === true && !unavailable

  // A fresh open always starts from an empty query and the first row, then
  // hands focus back to whatever opened the panel when it closes.
  React.useEffect(() => {
    if (!open) return undefined
    const previous = typeof document !== 'undefined' ? document.activeElement : null
    setQuery('')
    setActive(0)
    setKeyboardNav(false)
    setRemote({ status: 'idle', items: [], hasMore: false })
    setUnavailable(false)
    setSlow(false)
    setComposing(false)
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

  // Content search: cached -> ready immediately; otherwise debounced, aborted
  // on change/unmount, last response wins. Skipped while the switch is off, the
  // query is too short, the IME is composing, or the index is known missing.
  React.useEffect(() => {
    if (!open) return undefined
    const trimmed = normalizeQuery(query)
    if (typeof searchSessions !== 'function' || !contentEnabled || unavailable || composing || !isContentQueryReady(trimmed)) {
      requestRef.current += 1
      setRemote({ status: 'idle', items: [], hasMore: false })
      return undefined
    }
    const cached = cache.get(trimmed)
    if (cached) {
      requestRef.current += 1
      setRemote({ status: 'ready', items: cached.items, hasMore: cached.hasMore })
      return undefined
    }
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    const controller = typeof AbortController === 'function' ? new AbortController() : null
    setRemote({ status: 'loading', items: [], hasMore: false })
    const timer = setTimeout(() => {
      searchSessions(trimmed, controller ? controller.signal : undefined).then((page) => {
        if (requestRef.current !== requestId) return
        if (controller !== null && controller.signal.aborted) return
        const items = Array.isArray(page && page.items) ? page.items : []
        const hasMore = !!(page && page.hasMore)
        cache.set(trimmed, { items, hasMore })
        setRemote({ status: 'ready', items, hasMore })
      }).catch((reason: unknown) => {
        if (requestRef.current !== requestId) return
        if (controller !== null && controller.signal.aborted) return
        if (isContentSearchUnavailable(reason)) {
          setUnavailable(true)
          setRemote({ status: 'idle', items: [], hasMore: false })
          return
        }
        setRemote({ status: 'error', items: [], hasMore: false })
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      if (controller !== null) controller.abort()
    }
  }, [open, query, contentEnabled, unavailable, composing, searchSessions, cache])

  // Long wait -> the first content search is building the index. A timer in the
  // renderer keeps the message visible even though the Host is busy in SQLite.
  React.useEffect(() => {
    if (remote.status !== 'loading') {
      setSlow(false)
      return undefined
    }
    const timer = setTimeout(() => setSlow(true), SEARCH_SLOW_MS)
    return () => clearTimeout(timer)
  }, [remote.status])

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

  // Toggling the scope must not steal focus from the query: after the click the
  // caret goes back to the input so typing continues where it left off.
  const toggleContent = (): void => {
    if (unavailable || typeof onContentToggle !== 'function') return
    onContentToggle(!contentEnabled)
    const input = inputRef.current
    if (input && typeof input.focus === 'function') {
      try { input.focus({ preventScroll: true }) } catch { /* the panel is closing */ }
    }
  }

  const openAt = (index: number): void => {
    const row = display[index]
    if (!row) return
    onOpen(row.id)
    onClose()
  }

  // Pointer hover is styled by CSS (:hover), so moving the mouse never runs a
  // React update — the highlight tracks the cursor on the next paint and the
  // continuous mouse events cannot be coalesced behind other render work.
  // Enter therefore opens the row under the pointer when there is one, and
  // falls back to the keyboard-active row otherwise.
  const openHovered = (): boolean => {
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return false
    let hovered: Element | null = null
    try { hovered = document.querySelector('.bw-search-row:hover') } catch { hovered = null }
    const id = hovered === null ? null : hovered.getAttribute('data-session-id')
    if (id === null) return false
    onOpen(id)
    onClose()
    return true
  }

  const onKeyDown = (event: any): void => {
    // The content switch is a native button: let it handle its own Enter/Space
    // (otherwise the panel's Enter handler would open the active result).
    const target = event && event.target
    if (target && typeof target.getAttribute === 'function' && target.getAttribute('data-search-control') === 'true' && event.key !== 'Escape') return
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setKeyboardNav(true)
      setActive((index: number) => display.length === 0 ? 0 : (index + 1) % display.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setKeyboardNav(true)
      setActive((index: number) => display.length === 0 ? 0 : (index - 1 + display.length) % display.length)
      return
    }
    if (event.key === 'Enter') { event.preventDefault(); if (!openHovered()) openAt(active); return }
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
    'data-session-id': row.id,
    className: cls('bw-search-row', index === active && 'bw-search-row-active'),
    onClick: () => { onOpen(row.id); onClose() },
  },
    E('span', { className: 'bw-search-row-main' },
      E('span', { className: 'bw-search-row-title', title: row.title }, row.title),
      row.snippet ? E('span', { className: 'bw-search-row-snippet' }, row.snippet) : null,
    ),
    row.workspace ? E('span', { className: 'bw-search-row-ws', title: row.workspace }, row.workspace) : null,
    index < 9 ? E('span', { className: 'bw-search-row-idx', 'aria-hidden': 'true' }, '⌃' + (index + 1)) : null,
  ))

  const empty = display.length === 0
  const statusText = trimmed === ''
    ? ''
    : pending
      ? (slow ? t('search.indexing') : t('search.pending'))
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
          onCompositionStart: () => setComposing(true),
          onCompositionEnd: (event: any) => { setComposing(false); setQuery(event.target.value) },
        }),
        showContentSwitch
          ? E('button', {
            type: 'button',
            role: 'switch',
            'aria-checked': contentOn,
            'aria-label': t('search.scope.title'),
            title: unavailable ? t('search.scope.unavailable') : t('search.scope.title'),
            disabled: unavailable,
            'data-search-control': 'true',
            className: cls('bw-search-scope', contentOn && 'bw-search-scope-on'),
            onClick: toggleContent,
          },
            E('span', { className: 'bw-search-scope-label' }, t('search.scope')),
            E('span', { className: 'bw-search-scope-track', 'aria-hidden': 'true' },
              E('span', { className: 'bw-search-scope-thumb' }),
            ),
          )
          : null,
      ),
      E('div', {
        className: cls('bw-search-list', keyboardNav && 'bw-search-list-keys'),
        role: 'listbox',
        'aria-label': t('search.results'),
        // One guarded state clear after keyboard navigation; while keyboardNav is
        // false the handler is a no-op, so pointer movement stays render-free.
        onMouseMove: () => { if (keyboardNav) setKeyboardNav(false) },
      },
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
      contentEnabled && unavailable && typeof searchSessions === 'function'
        ? E('div', { className: 'bw-search-hint', role: 'note' }, t('search.scope.offlineHint'))
        : null,
    ),
  )
}

/**
 * The shell.overlay seat: renders the panel above the whole app from the
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
    contentEnabled: host.contentEnabled,
    onContentToggle: host.setContentEnabled,
    onOpen: (sessionId: string) => { if (host.openSession) host.openSession(sessionId) },
    onClose: () => searchHost.hide(),
    t,
  })
}
