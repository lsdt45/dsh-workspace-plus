/**
 * Per-directory git branch cache for the hover bubbles.
 *
 * The bubble's meta line is derived at render time, so its second segment must
 * be readable synchronously: this module keeps the last known answer per
 * directory and lets the UI subscribe for changes (the fetch happens from an
 * effect or from the bubble opening, never from the resolver).
 *
 * Requests are shaped for a hover burst, not a single row: every ensure() call
 * in the same microtask lands in ONE batch (hovering through a list must not
 * fire a request per row), paths already answered inside the TTL and paths
 * already in flight are skipped, and a host that fails gets a short cooldown
 * instead of a request on every hover. A host half that does not serve the
 * route at all is remembered forever — retrying a route that is not mounted
 * cannot succeed.
 */

import { GitBranchRouteUnavailable, requestGitBranches } from './host.ts'

/**
 * A branch value as the cache keeps it: trimmed, and never the detached
 * placeholder. `git rev-parse --abbrev-ref HEAD` answers HEAD on a detached
 * work tree; that is not a branch name and must not be shown as one.
 */
export const normalizeGitBranch = (value: unknown): string => {
  const branch = String(value === null || value === undefined ? '' : value).trim()
  return branch === 'HEAD' ? '' : branch
}

/**
 * How long a stored answer is reused before a hover may refresh it.
 *
 * The point is only to keep a hover burst from re-asking: half a minute keeps a
 * fresh checkout showing up quickly (the host half resolves through its own
 * short-lived cache) while a long hover session costs almost nothing.
 */
export const BRANCH_TTL_MS = 30_000

/** How long the cache stays quiet after a failed request. */
export const BRANCH_FAIL_COOLDOWN_MS = 30_000

/** One remembered answer; `at` is the clock reading when it landed. */
interface BranchEntry {
  branch: string
  at: number
}

/** Options accepted by {@link createBranchCache}. */
export interface BranchCacheOptions {
  /** Fetch branches for one batch of absolute directories. */
  fetchBranches: (paths: string[]) => Promise<Record<string, string>>
  /** Clock override (tests drive the TTL and the cooldown with it). */
  now?: () => number
  ttlMs?: number
  failCooldownMs?: number
}

/** The cache face the UI uses. */
export interface BranchCache {
  /** Last known branch of a directory, '' while unknown (or when it has none). */
  branchOf(path: string | null | undefined): string
  /** Ask for the branches of these directories (batched, throttled, never throws). */
  ensure(paths: ReadonlyArray<string | null | undefined>): void
  /** Re-render hook: called after an answer lands. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void
}

/**
 * Only absolute paths are sent: the host resolves them on its own filesystem,
 * so a relative path would resolve against the host's working directory instead
 * of the project. Both POSIX and Windows forms count (the browser and the host
 * are the same machine).
 */
const isAbsolutePath = (path: string): boolean =>
  path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\')

/**
 * Create a branch cache.
 *
 * Only one request is in flight per flush, and the map records every requested
 * path: a directory that is not a git work tree is remembered as "no branch" so
 * hovering it again (or another row in it) does not re-ask within the TTL.
 */
export function createBranchCache(options: BranchCacheOptions): BranchCache {
  const fetchBranches = options.fetchBranches
  const now = typeof options.now === 'function' ? options.now : () => Date.now()
  const ttlMs = typeof options.ttlMs === 'number' ? options.ttlMs : BRANCH_TTL_MS
  const failCooldownMs = typeof options.failCooldownMs === 'number' ? options.failCooldownMs : BRANCH_FAIL_COOLDOWN_MS
  const entries = new Map<string, BranchEntry>()
  const inFlight = new Set<string>()
  const listeners = new Set<() => void>()
  /** Paths collected for the next microtask batch. */
  const queued = new Set<string>()
  let flushScheduled = false
  /** The route is not mounted: permanent, so no request is ever attempted again. */
  let disabled = false
  /** Epoch until which a failed request suppresses new ones. */
  let cooldownUntil = 0

  const notify = (): void => {
    for (const listener of Array.from(listeners)) listener()
  }

  /** Fold one batch's answer into the cache and wake every subscriber. */
  const applyBatch = (batch: string[], branches: Record<string, string> | null | undefined): void => {
    const at = now()
    for (const path of batch) {
      // A path the host omitted is not a git work tree (or it refused the
      // lookup): remembering it as empty keeps it quiet for the TTL instead of
      // re-requesting it on every hover.
      const branch = branches && typeof branches === 'object' ? normalizeGitBranch(branches[path]) : ''
      entries.set(path, { branch, at })
    }
    cooldownUntil = 0
    notify()
  }

  /** Send the queued batch; failures only move the cooldown, they never throw. */
  const flush = (): void => {
    flushScheduled = false
    if (queued.size === 0) return
    const batch = Array.from(queued)
    queued.clear()
    for (const path of batch) inFlight.add(path)
    fetchBranches(batch).then(
      (branches) => {
        for (const path of batch) inFlight.delete(path)
        applyBatch(batch, branches)
      },
      (reason) => {
        for (const path of batch) inFlight.delete(path)
        if (reason instanceof GitBranchRouteUnavailable) disabled = true
        else cooldownUntil = now() + failCooldownMs
      },
    )
  }

  const ensure = (paths: ReadonlyArray<string | null | undefined>): void => {
    if (disabled) return
    const at = now()
    // A failed request quiets the cache: hovering must not hammer a host that
    // is already failing. An answer that lands after the cooldown expires
    // triggers a fresh attempt.
    if (at < cooldownUntil) return
    for (const value of paths) {
      const path = typeof value === 'string' ? value.trim() : ''
      if (path === '' || !isAbsolutePath(path)) continue
      if (inFlight.has(path) || queued.has(path)) continue
      const entry = entries.get(path)
      if (entry && at - entry.at < ttlMs) continue
      queued.add(path)
    }
    if (queued.size === 0 || flushScheduled) return
    flushScheduled = true
    // One microtask hop is the whole batching window: a hover burst across rows
    // (and the per-row mount effects) reaches the host as a single request.
    queueMicrotask(flush)
  }

  const branchOf = (path: string | null | undefined): string => {
    const key = typeof path === 'string' ? path.trim() : ''
    if (key === '') return ''
    const entry = entries.get(key)
    return entry ? entry.branch : ''
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  return { branchOf, ensure, subscribe }
}

/** The page-wide cache every row and chip shares (one batch per hover burst). */
export const branchCache = createBranchCache({ fetchBranches: requestGitBranches })
