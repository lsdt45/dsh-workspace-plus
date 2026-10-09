/**
 * dsh-workspace-plus — host half (plain JavaScript, no build step).
 *
 * The feature lives in the client half (src/client.js): the hierarchy tree,
 * the add-workspace parent-group popup, and view state (persisted in the
 * browser through the dsh client store). This host half carries the one
 * operation the browser cannot perform, plus the settings namespace.
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
 *  - Settings → Plugins card (namespace `better-workspace`).
 */
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export const name = 'dsh-workspace-plus'

/** Exact route the client half probes and calls. */
const SESSION_DELETE_ROUTE = '/dsh-workspace-plus/delete-session'
/** Request-body ceiling for the JSON POST. */
const MAX_BODY_BYTES = 64 * 1024
/** Session ids double as directory names; anything else is refused up front. */
const SESSION_ID_RE = /^[A-Za-z0-9_-]+$/
/** rm passes before a surviving directory counts as failure. */
const REMOVE_ATTEMPTS = 3
/** How long a cancelled agent may take to reach idle before removal proceeds. */
const AGENT_IDLE_TIMEOUT_MS = 15_000

/* ======================= session delete route ======================= */

function messageOf(reason) {
  return reason instanceof Error ? reason.message : String(reason)
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = ''
    request.on('data', (chunk) => {
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

function respond(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/** The route is same-origin JSON only: a cross-origin page must not delete. */
function isSameOriginJsonRequest(request) {
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
function findSessionHeader(snapshots, sessionId) {
  const snapshot = (snapshots || []).find((item) => (item?.header?.id ?? item?.id) === sessionId)
  return snapshot?.header ?? snapshot
}

/**
 * The only directory a delete may touch: inside the persistence root and named
 * exactly after the session. `DSH_HOME` is a fallback only — the Desktop Host
 * process does not receive it.
 */
function safeSessionDirectory(ctx, location, sessionId) {
  const configuredRoot = ctx?.sessionPersistence?.root
  const dshHome = process.env.DSH_HOME
  if (configuredRoot === undefined && !dshHome) throw new Error('session persistence root is unavailable')
  const sessionsRoot = resolve(configuredRoot ?? resolve(dshHome, 'sessions'))
  const sessionDir = resolve(dirname(location.path))
  const fromRoot = relative(sessionsRoot, sessionDir)
  const outsideRoot = !fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)
  if (outsideRoot || basename(sessionDir) !== sessionId) {
    throw new Error(`refusing unsafe session directory: ${sessionDir}`)
  }
  return sessionDir
}

/** Cancel the live agent and give it a bounded chance to stop writing. */
async function stopAgent(agent) {
  if (!agent) return
  if (typeof agent.cancel === 'function') {
    try { agent.cancel({ kind: 'user' }, { keepInbox: true }) } catch {}
  }
  if (typeof agent.whenIdle === 'function') {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, AGENT_IDLE_TIMEOUT_MS)
      Promise.resolve(agent.whenIdle()).then(
        () => { clearTimeout(timer); resolve() },
        () => { clearTimeout(timer); resolve() },
      )
    })
  }
}

/** Detach a live session so the write path cannot recreate the log. */
async function detachLiveSession(ctx, sessionId) {
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
async function removeProjection(ctx, sessionId) {
  const domain = ctx.get('storageDomain')?.get?.('session_projcache')
  const table = domain?.table?.('sessions')
  if (table?.get(sessionId) !== undefined) await table.delete(sessionId)
}

/**
 * Preserve the official UI transition after the durable delete: archiving the
 * id makes the sidebar drop the row — another selected session stays open, and
 * deleting the current one clears into the default New Session view.
 */
async function archiveForTransition(ctx, sessionId) {
  const registry = ctx.get('workspaceRegistry')
  if (!registry) return
  try {
    await registry.archiveSession(sessionId)
    return
  } catch (error) {
    const domain = ctx.get('storageDomain')?.get?.('workspace')
    const state = domain?.global?.get?.()
    if (!state || state.archivedSessionIds.includes(sessionId)) throw error
    const next = { ...state, archivedSessionIds: [...state.archivedSessionIds, sessionId] }
    if (typeof registry.setState === 'function') await registry.setState(next)
    else if (domain) {
      await domain.global.set(next)
      if ('state' in registry) registry.state = next
    }
  }
}

/** Detach the session from every workspace and drop its archive/accounting ids. */
async function removeWorkspaceAccounting(ctx, sessionId) {
  const registry = ctx.get('workspaceRegistry')
  if (!registry) return
  const domain = ctx.get('storageDomain')?.get?.('workspace')
  for (const workspace of registry.list()) {
    if (workspace.sessionIds.includes(sessionId)) await workspace.detachSession(sessionId)
  }
  const state = domain?.global?.get?.()
  if (state?.archivedSessionIds?.includes(sessionId)) {
    const next = { ...state, archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId) }
    if (typeof registry.setState === 'function') await registry.setState(next)
    else if (domain) {
      await domain.global.set(next)
      if ('state' in registry) registry.state = next
    }
  }
}

/** Remove the directory and refuse to report success while it survives. */
async function removeAndVerify(sessionDir) {
  for (let attempt = 0; attempt < REMOVE_ATTEMPTS; attempt += 1) {
    await rm(sessionDir, { recursive: true, force: true })
    await new Promise((resolve) => setImmediate(resolve))
  }
  if (existsSync(sessionDir)) throw new Error(`session directory still exists: ${sessionDir}`)
}

/**
 * Delete one session's durable record and files.
 *
 * Every step before `remove` only reads, so a refusal (unknown id, subagent
 * session, unsafe path) never touches data. The failing step travels on the
 * error as `phase` for the client-facing message.
 */
async function deleteSession(ctx, sessionId) {
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
    await stopAgent(ctx.get('agents')?.get?.(sessionId))
    phase = 'detach'
    const detached = await detachLiveSession(ctx, sessionId)
    phase = 'remove'
    await removeAndVerify(sessionDir)
    const warnings = []
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
    try { if (error && typeof error === 'object') error.phase = phase } catch {}
    throw error
  }
}

/** Register the exact delete route; returns its disposer. */
function registerSessionDeleteRoute(ctx) {
  // One delete at a time: concurrent requests would race the same directory.
  let mutationTail = Promise.resolve()
  const withMutationLock = (operation) => {
    const result = mutationTail.then(operation, operation)
    mutationTail = result.then(() => undefined, () => undefined)
    return result
  }
  return ctx.webServer.register({
    kind: 'exact',
    path: SESSION_DELETE_ROUTE,
    handler: async (request, response) => {
      // The client probes availability with GET and expects exactly this 405.
      if (request.method !== 'POST') return respond(response, 405, { ok: false, error: 'method-not-allowed' })
      const validation = isSameOriginJsonRequest(request)
      if (!validation.ok) return respond(response, validation.status, { ok: false, error: validation.error })
      let body
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
            phase: error?.phase ?? null,
          })
        }
      })
    },
  })
}

/* =============================== plugin =============================== */

export function apply(ctx) {
  const log = ctx && ctx.logger && typeof ctx.logger.info === 'function'
    ? (msg) => ctx.logger.info(msg)
    : (msg) => console.log(msg)
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

  // Register the settings namespace so the browser card appears in
  // Settings → Plugins. The tab dispatches the intersection of served
  // namespaces and settings.plugin.item cards, and `settings` is a
  // cross-cutting service that may appear after this plugin's apply — so the
  // registration waits for its injection (the same pattern dsh-context uses).
  // The dsh-settings and zod modules resolve only through the dsh Loader; a
  // plain-Node import (logger-only ctx) never reaches this path.
  ctx.inject(['settings'], (sctx) => {
    log('[dsh-workspace-plus] settings inject fired')
    // The settings service calls the schema AS A FUNCTION to resolve a value
    // (schema(mergeLayers(...))) — that is @deepseek-ai/schemastery's contract:
    // its schemas are callable and fill defaults on undefined. zod objects are
    // NOT callable, so a zod schema throws "TypeError: ... is not a function"
    // at register(); the namespace is then never served and the Settings →
    // Plugins tab (served namespaces ∩ settings.plugin.item cards) never
    // dispatches our card. Both modules resolve at runtime through normal Node
    // resolution from the plugin's own node_modules (the same static-import
    // pattern dsh-context uses).
    Promise.all([import('@deepseek-ai/dsh-settings'), import('@deepseek-ai/schemastery')])
      .then(([ds, sm]) => {
        const settings = sctx && sctx.settings
        if (!settings || typeof settings.register !== 'function') return
        const Schema = sm.default
        // dsh >= 0.1.2-alpha.2 removed the settingsNamespace() helper from
        // @deepseek-ai/dsh-settings: register() now takes a plain string and
        // validates it at runtime (parseSettingsNamespace). The helper's old
        // signature was compile-time branding only, so a plain string is also
        // accepted by the older register() — one call, both eras. Only use the
        // helper when the installed package still ships it.
        const ns = typeof ds.settingsNamespace === 'function'
          ? ds.settingsNamespace('better-workspace')
          : 'better-workspace'
        settings.register(ns, Schema.object({ compactChains: Schema.boolean().default(true) }))
        log('[dsh-workspace-plus] settings namespace registered: better-workspace')
      })
      .catch((error) => {
        log('[dsh-workspace-plus] settings namespace registration FAILED: ' + (error && error.stack || String(error)))
      })
  })
}
