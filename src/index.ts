/**
 * dsh-workspace-plus — host half.
 *
 * The feature lives in the client half (src/client/**): the hierarchy tree,
 * the add-workspace parent-group popup, and view state (persisted in the
 * browser through the dsh client store). This host half carries the one
 * operation the browser cannot perform.
 *
 *  - `POST /dsh-workspace-plus/delete-session` — permanent session deletion.
 *    DSH ships archive but no delete RPC, so the plugin owns one: the pipeline
 *    stops the agent, detaches the live session, verifies the target directory,
 *    removes it, then cleans up the projection cache and workspace accounting.
 *
 *    Adapted from @baihejiangnan/dsh-session-context-menu (MIT), the reference
 *    implementation of that pipeline, with two corrections its shipped build
 *    does not carry:
 *      1. `sessionPersistence.list()` returns one snapshot per session
 *         ({ header, revision, sizeBytes }), not a header array — matching on
 *         `item.id` never hits, so every delete fails "session not found".
 *      2. The Desktop Host process is spawned without `DSH_HOME` in its
 *         environment (DSH injects it into tool subprocesses only), so the
 *         sessions root is read from the persistence service itself.
 *
 * The configuration page lives in the client half (`plugins.bundle.config`);
 * this host half exposes no settings service.
 */
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createSessionSearchIndex } from './search-index.ts'

export const name = 'dsh-workspace-plus'

/* ------------------------- host context surface ------------------------- */

/** The plugin logger the host injects. */
interface HostLogger {
  info(message: string): void
  warn(message: string, ...args: unknown[]): void
}

/** A stored session header (only the fields this route reads). */
interface SessionHeader {
  id?: string
  origin?: string
  [key: string]: unknown
}

/** One entry of `sessionPersistence.list()` (the newer snapshot shape or a bare header). */
interface SessionSnapshot {
  header?: SessionHeader
  id?: string
  [key: string]: unknown
}

/** Where a session is persisted (`locate()` result). */
interface SessionLocation {
  kind?: string
  path?: string
  [key: string]: unknown
}

/** A live agent handle (subset used by {@link stopAgent}). */
interface LiveAgent {
  cancel?: (reason: Record<string, unknown>, options?: { keepInbox?: boolean }) => unknown
  whenIdle?: () => unknown
  [key: string]: unknown
}

/** A workspace entry as the workspace registry lists it. */
interface WorkspaceEntry {
  sessionIds: string[]
  detachSession(sessionId: string): Promise<void>
}

/** The workspace registry the host exposes (only what cleanup needs). */
interface WorkspaceRegistry {
  archiveSession(sessionId: string): Promise<void>
  setState?: (state: unknown) => Promise<void> | void
  state?: unknown
  list(): WorkspaceEntry[]
  [key: string]: unknown
}

/** A storage domain (`storageDomain.get(name)`) as used by cleanup. */
interface StorageDomain {
  /** Domain lookup (storageDomain.get(name)). */
  get?: (name: string) => StorageDomain | undefined
  global?: { get?: () => any; set?: (value: unknown) => Promise<void> | void }
  table?: (name: string) => { get(key: string): unknown; delete(key: string): Promise<void> | void }
  [key: string]: unknown
}

/** The DSH host context this plugin uses (structural: the shell owns the real type). */
interface HostContext {
  logger: HostLogger
  inject(names: string[], callback: (ctx: HostContext) => void): void
  effect?(callback: () => (() => void) | void, label: string): void
  /** Service locator: every other service is probed per request. */
  get(name: string): any
  sessionPersistence: {
    /** One snapshot per session (newer) or the header itself (older backends). */
    list(): Promise<SessionSnapshot[]>
    locate(header: SessionHeader): SessionLocation
    root?: string
  }
  webServer: {
    register(route: { kind: 'exact'; path: string; handler: (request: IncomingMessage, response: ServerResponse) => unknown }): () => void
  }
  [key: string]: any
}

/* ======================= session delete route ======================= */

/** Exact route the client half probes and calls. */
const SESSION_DELETE_ROUTE = '/dsh-workspace-plus/delete-session'
/** Exact route the search panel polls for content hits. */
const SESSION_SEARCH_ROUTE = '/dsh-workspace-plus/search'
/** Content results per page (the panel caps its merged list at the same value). */
const SEARCH_DEFAULT_LIMIT = 20
/** Hard ceiling accepted from the browser. */
const SEARCH_MAX_LIMIT = 50
/** Request-body ceiling for the JSON POST. */
const MAX_BODY_BYTES = 64 * 1024
/** Session ids double as directory names; anything else is refused up front. */
const SESSION_ID_RE = /^[A-Za-z0-9_-]+$/
/** rm passes before a surviving directory counts as failure. */
const REMOVE_ATTEMPTS = 3
/** How long a cancelled agent may take to reach idle before removal proceeds. */
const AGENT_IDLE_TIMEOUT_MS = 15_000
/* ======================= session delete route ======================= */

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}

function readJsonBody(request: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    request.on('data', (chunk: Buffer | string) => {
      data += chunk
      if (data.length > MAX_BODY_BYTES) {
        request.destroy()
        reject(new Error('request body too large'))
      }
    })
    request.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { reject(new Error('invalid JSON body')) }
    })
    request.on('error', reject)
  })
}

function respond(response: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/** The route is same-origin JSON only: a cross-origin page must not delete. */
function isSameOriginJsonRequest(request: IncomingMessage): { ok: true } | { ok: false; status: number; error: string } {
  const contentType = request.headers?.['content-type'] || ''
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return { ok: false, status: 415, error: 'unsupported-media-type' }
  const origin = request.headers?.origin
  const host = request.headers?.host
  if (origin && host) {
    let sameOrigin = false
    try { sameOrigin = new URL(origin).host === host } catch {}
    if (!sameOrigin) return { ok: false, status: 403, error: 'cross-origin-request' }
  }
  return { ok: true }
}

/**
 * Resolve one stored session header by id.
 *
 * `list()` returns snapshots ({ header, revision, sizeBytes }); older backends
 * returned the header itself, so both shapes are accepted. `locate()` takes a
 * header, which is why the unwrap happens here rather than at the call site.
 */
function findSessionHeader(snapshots: SessionSnapshot[] | null | undefined, sessionId: string): SessionHeader | undefined {
  const snapshot = (snapshots || []).find((item) => (item?.header?.id ?? item?.id) === sessionId)
  return snapshot?.header ?? snapshot
}

/**
 * The only directory a delete may touch: inside the persistence root and named
 * exactly after the session. `DSH_HOME` is a fallback only — the Desktop Host
 * process does not receive it.
 */
function safeSessionDirectory(ctx: HostContext, location: SessionLocation, sessionId: string): string {
  const configuredRoot = ctx?.sessionPersistence?.root
  const dshHome = process.env.DSH_HOME
  if (configuredRoot === undefined && !dshHome) throw new Error('session persistence root is unavailable')
  const sessionsRoot = resolve(configuredRoot ?? resolve(dshHome as string, 'sessions'))
  const sessionDir = resolve(dirname(location.path as string))
  const fromRoot = relative(sessionsRoot, sessionDir)
  const outsideRoot = !fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)
  if (outsideRoot || basename(sessionDir) !== sessionId) {
    throw new Error(`refusing unsafe session directory: ${sessionDir}`)
  }
  return sessionDir
}

/** Cancel the live agent and give it a bounded chance to stop writing. */
async function stopAgent(agent: LiveAgent | null | undefined): Promise<void> {
  if (!agent) return
  if (typeof agent.cancel === 'function') {
    try { agent.cancel({ kind: 'user' }, { keepInbox: true }) } catch {}
  }
  if (typeof agent.whenIdle === 'function') {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, AGENT_IDLE_TIMEOUT_MS)
      Promise.resolve(agent.whenIdle!()).then(
        () => { clearTimeout(timer); resolve() },
        () => { clearTimeout(timer); resolve() },
      )
    })
  }
}

/** Detach a live session so the write path cannot recreate the log. */
async function detachLiveSession(ctx: HostContext, sessionId: string): Promise<boolean> {
  const sessions = ctx.get('sessions')
  const session = sessions?.get?.(sessionId)
  if (!session) return false
  if (typeof sessions.flush === 'function') {
    try { await sessions.flush(session) } catch {}
  }
  const entry = sessions.store?.get?.(sessionId)
  if (!entry) return false
  if (typeof sessions.detachEntered === 'function') sessions.detachEntered(entry)
  else sessions.store.delete(sessionId)
  return true
}

/** Drop the browser projection cache entry (advisory cleanup). */
async function removeProjection(ctx: HostContext, sessionId: string): Promise<void> {
  const domain = (ctx.get('storageDomain') as StorageDomain | undefined)?.get?.('session_projcache') as StorageDomain | undefined
  const table = domain?.table?.('sessions')
  if (table?.get(sessionId) !== undefined) await table.delete(sessionId)
}

/**
 * Preserve the official UI transition after the durable delete: archiving the
 * id makes the sidebar drop the row — another selected session stays open, and
 * deleting the current one clears into the default New Session view.
 */
async function archiveForTransition(ctx: HostContext, sessionId: string): Promise<void> {
  const registry = ctx.get('workspaceRegistry') as WorkspaceRegistry | undefined
  if (!registry) return
  try {
    await registry.archiveSession(sessionId)
    return
  } catch (error) {
    const domain = (ctx.get('storageDomain') as StorageDomain | undefined)?.get?.('workspace') as StorageDomain | undefined
    const state = domain?.global?.get?.()
    if (!state || state.archivedSessionIds.includes(sessionId)) throw error
    const next = { ...state, archivedSessionIds: [...state.archivedSessionIds, sessionId] }
    if (typeof registry.setState === 'function') await registry.setState(next)
    else if (domain) {
      await domain.global!.set!(next)
      if ('state' in registry) registry.state = next
    }
  }
}

/** Detach the session from every workspace and drop its archive/accounting ids. */
async function removeWorkspaceAccounting(ctx: HostContext, sessionId: string): Promise<void> {
  const registry = ctx.get('workspaceRegistry') as WorkspaceRegistry | undefined
  if (!registry) return
  const domain = (ctx.get('storageDomain') as StorageDomain | undefined)?.get?.('workspace') as StorageDomain | undefined
  for (const workspace of registry.list()) {
    if (workspace.sessionIds.includes(sessionId)) await workspace.detachSession(sessionId)
  }
  const state = domain?.global?.get?.()
  if (state?.archivedSessionIds?.includes(sessionId)) {
    const next = { ...state, archivedSessionIds: state.archivedSessionIds.filter((id: string) => id !== sessionId) }
    if (typeof registry.setState === 'function') await registry.setState(next)
    else if (domain) {
      await domain.global!.set!(next)
      if ('state' in registry) registry.state = next
    }
  }
}

/** Remove the directory and refuse to report success while it survives. */
async function removeAndVerify(sessionDir: string): Promise<void> {
  for (let attempt = 0; attempt < REMOVE_ATTEMPTS; attempt += 1) {
    await rm(sessionDir, { recursive: true, force: true })
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
  if (existsSync(sessionDir)) throw new Error(`session directory still exists: ${sessionDir}`)
}

/** The client-facing delete envelope (the trailing `phase` rides on failures). */
interface DeleteSessionResult {
  ok: true
  removed: true
  detached: boolean
  warnings: string[]
}

/** A failure carrying the pipeline step that threw (client-facing `phase`). */
interface PhaseError extends Error {
  phase?: string
}

/**
 * Delete one session's durable record and files.
 *
 * Every step before `remove` only reads, so a refusal (unknown id, subagent
 * session, unsafe path) never touches data. The failing step travels on the
 * error as `phase` for the client-facing message.
 */
async function deleteSession(ctx: HostContext, sessionId: string): Promise<DeleteSessionResult> {
  let phase = 'list'
  try {
    const header = findSessionHeader(await ctx.sessionPersistence.list(), sessionId)
    if (!header || typeof header.id !== 'string') throw new Error(`session not found: ${sessionId}`)
    phase = 'origin'
    if (header.origin === 'subagent') throw new Error('subagent session cannot be deleted directly')
    phase = 'locate'
    const location = ctx.sessionPersistence.locate(header)
    if (location?.kind !== 'jsonl' || typeof location.path !== 'string') {
      throw new Error('session does not use deletable JSONL persistence')
    }
    phase = 'guard'
    const sessionDir = safeSessionDirectory(ctx, location, sessionId)
    phase = 'stop-agent'
    await stopAgent(ctx.get('agents')?.get?.(sessionId) as LiveAgent | undefined)
    phase = 'detach'
    const detached = await detachLiveSession(ctx, sessionId)
    phase = 'remove'
    await removeAndVerify(sessionDir)
    const warnings: string[] = []
    phase = 'projection'
    try { await removeProjection(ctx, sessionId) } catch (error) {
      warnings.push('projection-cleanup-failed')
      ctx.logger.warn(`[dsh-workspace-plus] failed to clean projection ${sessionId}:`, error)
    }
    phase = 'remove-verify'
    await removeAndVerify(sessionDir)
    phase = 'archive-transition'
    try { await archiveForTransition(ctx, sessionId) } catch (error) {
      warnings.push('archive-transition-failed')
      ctx.logger.warn(`[dsh-workspace-plus] failed to transition deleted session ${sessionId}:`, error)
    }
    phase = 'workspace-accounting'
    try { await removeWorkspaceAccounting(ctx, sessionId) } catch (error) {
      warnings.push('workspace-cleanup-failed')
      ctx.logger.warn(`[dsh-workspace-plus] failed to clean workspace accounting ${sessionId}:`, error)
    }
    return { ok: true, removed: true, detached, warnings }
  } catch (error) {
    try { if (error && typeof error === 'object') (error as PhaseError).phase = phase } catch {}
    throw error
  }
}

/** Register the exact delete route; returns its disposer. */
function registerSessionDeleteRoute(ctx: HostContext): () => void {
  // One delete at a time: concurrent requests would race the same directory.
  let mutationTail: Promise<unknown> = Promise.resolve()
  const withMutationLock = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = mutationTail.then(operation, operation)
    mutationTail = result.then(() => undefined, () => undefined)
    return result
  }
  return ctx.webServer.register({
    kind: 'exact',
    path: SESSION_DELETE_ROUTE,
    handler: async (request: IncomingMessage, response: ServerResponse) => {
      // The client probes availability with GET and expects exactly this 405.
      if (request.method !== 'POST') return respond(response, 405, { ok: false, error: 'method-not-allowed' })
      const validation = isSameOriginJsonRequest(request)
      if (!validation.ok) return respond(response, validation.status, { ok: false, error: validation.error })
      let body: any
      try { body = await readJsonBody(request) } catch { return respond(response, 400, { ok: false, error: 'bad-request' }) }
      const sessionId = body?.sessionId
      if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
        return respond(response, 400, { ok: false, error: 'invalid-session-id' })
      }
      return withMutationLock(async () => {
        try {
          respond(response, 200, await deleteSession(ctx, sessionId))
        } catch (error) {
          ctx.logger.warn(`[dsh-workspace-plus] failed to delete session ${sessionId}:`, error)
          respond(response, 500, {
            ok: false,
            error: 'delete-failed',
            detail: messageOf(error),
            phase: (error as PhaseError)?.phase ?? null,
          })
        }
      })
    },
  })
}

/* ============================ content search ============================ */

/** Stored-session root: the persistence service when mounted, else DSH_HOME. */
function resolveSessionsRoot(ctx: HostContext): string | null {
  const configured = ctx.get('sessionPersistence')?.root
  if (typeof configured === 'string' && configured !== '') return configured
  const home = process.env.DSH_HOME && process.env.DSH_HOME !== '' ? process.env.DSH_HOME : join(homedir(), '.dsh')
  return resolve(home, 'sessions')
}

/**
 * Register the exact search route; returns its disposer.
 *
 * The index is created lazily on the first query (a profile without a sessions
 * root simply refuses) and closed with the plugin. It reads stored logs
 * directly instead of going through the persistence migration pipeline, so a
 * damaged or legacy log degrades that one session instead of the whole search.
 */
function registerSessionSearchRoute(ctx: HostContext): () => void {
  let index: ReturnType<typeof createSessionSearchIndex> | null = null
  let indexRoot = ''
  const ensureIndex = (): ReturnType<typeof createSessionSearchIndex> | null => {
    const root = resolveSessionsRoot(ctx)
    if (root === null) return null
    if (index !== null && indexRoot === root) return index
    try { index?.close() } catch { /* replacing a stale root */ }
    index = createSessionSearchIndex({
      sessionsRoot: root,
      dbPath: join(dirname(root), 'storages', 'workspace-plus-search.db'),
      logger: { warn: (message: string, ...args: unknown[]) => { ctx.logger.warn(message, ...args) } },
    })
    indexRoot = root
    return index
  }
  const dispose = ctx.webServer.register({
    kind: 'exact',
    path: SESSION_SEARCH_ROUTE,
    handler: async (request: IncomingMessage, response: ServerResponse) => {
      // The client probes availability with GET and expects exactly this 405.
      if (request.method !== 'POST') return respond(response, 405, { ok: false, error: 'method-not-allowed' })
      const validation = isSameOriginJsonRequest(request)
      if (!validation.ok) return respond(response, validation.status, { ok: false, error: validation.error })
      let body: any
      try { body = await readJsonBody(request) } catch { return respond(response, 400, { ok: false, error: 'bad-request' }) }
      const query = typeof body?.query === 'string' ? body.query.trim() : ''
      if (query === '') return respond(response, 400, { ok: false, error: 'invalid-query' })
      const requested = Number(body?.limit)
      const limit = Number.isFinite(requested) ? Math.max(1, Math.min(SEARCH_MAX_LIMIT, Math.trunc(requested))) : SEARCH_DEFAULT_LIMIT
      const content = ensureIndex()
      if (content === null) return respond(response, 503, { ok: false, status: 'failed', error: 'sessions-root-unavailable' })
      content.kick()
      const result = content.search(query, limit)
      if (result.state === 'building') return respond(response, 200, { ok: true, status: 'building', progress: result.progress })
      if (result.state === 'failed') return respond(response, 200, { ok: false, status: 'failed', error: result.message })
      return respond(response, 200, { ok: true, status: 'ready', items: result.items, hasMore: result.hasMore })
    },
  })
  return () => {
    try { index?.close() } catch { /* already closed */ }
    dispose()
  }
}

/* =============================== plugin =============================== */

export function apply(ctx: HostContext | null | undefined): void {
  const log = ctx && ctx.logger && typeof ctx.logger.info === 'function'
    ? (msg: string) => { ctx.logger.info(msg) }
    : (msg: string) => { console.log(msg) }
  log('[dsh-workspace-plus] host half loaded; UI runs in the browser (client half)')
  if (!ctx || typeof ctx.inject !== 'function') return

  // The delete route needs the web server and a session backend to exist at
  // all. Everything else it touches (agents, sessions, workspace registry,
  // storage domains) is probed through ctx.get per request, so a profile
  // without them still loads this plugin and simply refuses what it cannot do.
  ctx.inject(['webServer', 'sessionPersistence'], (sctx) => {
    const dispose = registerSessionDeleteRoute(sctx)
    if (typeof sctx.effect === 'function') sctx.effect(() => dispose, 'dsh-workspace-plus session delete route')
    log('[dsh-workspace-plus] session delete route registered: ' + SESSION_DELETE_ROUTE)
  })

  // Content search for the floating panel: searched through this plugin's own
  // resilient index, so the route only needs the web server; the sessions root
  // is resolved per request (a profile without persistence simply refuses).
  ctx.inject(['webServer'], (sctx) => {
    const dispose = registerSessionSearchRoute(sctx)
    if (typeof sctx.effect === 'function') sctx.effect(() => dispose, 'dsh-workspace-plus session search route')
    log('[dsh-workspace-plus] session search route registered: ' + SESSION_SEARCH_ROUTE)
  })

}