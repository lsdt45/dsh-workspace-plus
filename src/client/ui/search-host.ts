/**
 * Module-level bridge between the sidebar (which owns the session snapshot and
 * the click behaviour) and the shell.overlay seat (which renders the search
 * panel above the whole app, outside the sidebar's fixed-position container).
 *
 * The seat is registered once at plugin start; the browser publishes its current
 * candidates and callbacks on every change, and a tiny subscriber set keeps both
 * sides in sync without a React context crossing the slot boundary.
 */

import { React } from '../platform.ts'
import type { SearchCandidate } from '../core/search.ts'
import type { Translate } from '../core/time.ts'

/** One Host content-search page the overlay understands. */
export interface SearchHostPage {
  items: Array<{ sessionId: string; snippet?: string }>
  hasMore?: boolean
}

/** Everything the overlay seat needs from the browser. */
export interface SearchHostState {
  open: boolean
  candidates: ReadonlyArray<SearchCandidate>
  limit: number
  searchSessions: ((query: string, signal?: any) => Promise<SearchHostPage>) | null
  openSession: ((sessionId: string) => void) | null
  t: Translate | null
}

const initial: SearchHostState = {
  open: false,
  candidates: [],
  limit: 20,
  searchSessions: null,
  openSession: null,
  t: null,
}
let state: SearchHostState = initial
const listeners = new Set<() => void>()

const emit = (): void => {
  for (const listener of [...listeners]) {
    try {
      listener()
    } catch {
      // One broken subscriber must not silence the rest.
    }
  }
}

/** The browser publishes into this; the overlay seat subscribes. */
export const searchHost = {
  state: (): SearchHostState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  publish(patch: Partial<SearchHostState>): void {
    const next = { ...state, ...patch }
    const changed = (Object.keys(patch) as Array<keyof SearchHostState>).some(key => next[key] !== state[key])
    if (!changed) return
    state = next
    emit()
  },
  show(): void { searchHost.publish({ open: true }) },
  hide(): void { searchHost.publish({ open: false }) },
}

/** Subscribe a component to the bridge (returns the current snapshot). */
export function useSearchHost(): SearchHostState {
  const [snapshot, setSnapshot] = React.useState(state)
  React.useEffect(() => searchHost.subscribe(() => setSnapshot(state)), [])
  return snapshot
}
