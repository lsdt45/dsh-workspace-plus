/* GENERATED FILE — do not edit.
 * Source: src/index.ts (host half)  ·  Rebuild: npm run build  ·  Verify: npm run check
 * dist/ ships committed so git/tarball installs stay build-free. */

// src/index.ts
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
var name = "dsh-workspace-plus";
var SESSION_DELETE_ROUTE = "/dsh-workspace-plus/delete-session";
var MAX_BODY_BYTES = 64 * 1024;
var SESSION_ID_RE = /^[A-Za-z0-9_-]+$/;
var REMOVE_ATTEMPTS = 3;
var AGENT_IDLE_TIMEOUT_MS = 15e3;
function messageOf(reason) {
  return reason instanceof Error ? reason.message : String(reason);
}
function readJsonBody(request) {
  return new Promise((resolve2, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY_BYTES) {
        request.destroy();
        reject(new Error("request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve2(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}
function respond(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}
function isSameOriginJsonRequest(request) {
  const contentType = request.headers?.["content-type"] || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return { ok: false, status: 415, error: "unsupported-media-type" };
  const origin = request.headers?.origin;
  const host = request.headers?.host;
  if (origin && host) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
    }
    if (!sameOrigin) return { ok: false, status: 403, error: "cross-origin-request" };
  }
  return { ok: true };
}
function findSessionHeader(snapshots, sessionId) {
  const snapshot = (snapshots || []).find((item) => (item?.header?.id ?? item?.id) === sessionId);
  return snapshot?.header ?? snapshot;
}
function safeSessionDirectory(ctx, location, sessionId) {
  const configuredRoot = ctx?.sessionPersistence?.root;
  const dshHome = process.env.DSH_HOME;
  if (configuredRoot === void 0 && !dshHome) throw new Error("session persistence root is unavailable");
  const sessionsRoot = resolve(configuredRoot ?? resolve(dshHome, "sessions"));
  const sessionDir = resolve(dirname(location.path));
  const fromRoot = relative(sessionsRoot, sessionDir);
  const outsideRoot = !fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot);
  if (outsideRoot || basename(sessionDir) !== sessionId) {
    throw new Error(`refusing unsafe session directory: ${sessionDir}`);
  }
  return sessionDir;
}
async function stopAgent(agent) {
  if (!agent) return;
  if (typeof agent.cancel === "function") {
    try {
      agent.cancel({ kind: "user" }, { keepInbox: true });
    } catch {
    }
  }
  if (typeof agent.whenIdle === "function") {
    await new Promise((resolve2) => {
      const timer = setTimeout(resolve2, AGENT_IDLE_TIMEOUT_MS);
      Promise.resolve(agent.whenIdle()).then(
        () => {
          clearTimeout(timer);
          resolve2();
        },
        () => {
          clearTimeout(timer);
          resolve2();
        }
      );
    });
  }
}
async function detachLiveSession(ctx, sessionId) {
  const sessions = ctx.get("sessions");
  const session = sessions?.get?.(sessionId);
  if (!session) return false;
  if (typeof sessions.flush === "function") {
    try {
      await sessions.flush(session);
    } catch {
    }
  }
  const entry = sessions.store?.get?.(sessionId);
  if (!entry) return false;
  if (typeof sessions.detachEntered === "function") sessions.detachEntered(entry);
  else sessions.store.delete(sessionId);
  return true;
}
async function removeProjection(ctx, sessionId) {
  const domain = ctx.get("storageDomain")?.get?.("session_projcache");
  const table = domain?.table?.("sessions");
  if (table?.get(sessionId) !== void 0) await table.delete(sessionId);
}
async function archiveForTransition(ctx, sessionId) {
  const registry = ctx.get("workspaceRegistry");
  if (!registry) return;
  try {
    await registry.archiveSession(sessionId);
    return;
  } catch (error) {
    const domain = ctx.get("storageDomain")?.get?.("workspace");
    const state = domain?.global?.get?.();
    if (!state || state.archivedSessionIds.includes(sessionId)) throw error;
    const next = { ...state, archivedSessionIds: [...state.archivedSessionIds, sessionId] };
    if (typeof registry.setState === "function") await registry.setState(next);
    else if (domain) {
      await domain.global.set(next);
      if ("state" in registry) registry.state = next;
    }
  }
}
async function removeWorkspaceAccounting(ctx, sessionId) {
  const registry = ctx.get("workspaceRegistry");
  if (!registry) return;
  const domain = ctx.get("storageDomain")?.get?.("workspace");
  for (const workspace of registry.list()) {
    if (workspace.sessionIds.includes(sessionId)) await workspace.detachSession(sessionId);
  }
  const state = domain?.global?.get?.();
  if (state?.archivedSessionIds?.includes(sessionId)) {
    const next = { ...state, archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId) };
    if (typeof registry.setState === "function") await registry.setState(next);
    else if (domain) {
      await domain.global.set(next);
      if ("state" in registry) registry.state = next;
    }
  }
}
async function removeAndVerify(sessionDir) {
  for (let attempt = 0; attempt < REMOVE_ATTEMPTS; attempt += 1) {
    await rm(sessionDir, { recursive: true, force: true });
    await new Promise((resolve2) => setImmediate(resolve2));
  }
  if (existsSync(sessionDir)) throw new Error(`session directory still exists: ${sessionDir}`);
}
async function deleteSession(ctx, sessionId) {
  let phase = "list";
  try {
    const header = findSessionHeader(await ctx.sessionPersistence.list(), sessionId);
    if (!header || typeof header.id !== "string") throw new Error(`session not found: ${sessionId}`);
    phase = "origin";
    if (header.origin === "subagent") throw new Error("subagent session cannot be deleted directly");
    phase = "locate";
    const location = ctx.sessionPersistence.locate(header);
    if (location?.kind !== "jsonl" || typeof location.path !== "string") {
      throw new Error("session does not use deletable JSONL persistence");
    }
    phase = "guard";
    const sessionDir = safeSessionDirectory(ctx, location, sessionId);
    phase = "stop-agent";
    await stopAgent(ctx.get("agents")?.get?.(sessionId));
    phase = "detach";
    const detached = await detachLiveSession(ctx, sessionId);
    phase = "remove";
    await removeAndVerify(sessionDir);
    const warnings = [];
    phase = "projection";
    try {
      await removeProjection(ctx, sessionId);
    } catch (error) {
      warnings.push("projection-cleanup-failed");
      ctx.logger.warn(`[dsh-workspace-plus] failed to clean projection ${sessionId}:`, error);
    }
    phase = "remove-verify";
    await removeAndVerify(sessionDir);
    phase = "archive-transition";
    try {
      await archiveForTransition(ctx, sessionId);
    } catch (error) {
      warnings.push("archive-transition-failed");
      ctx.logger.warn(`[dsh-workspace-plus] failed to transition deleted session ${sessionId}:`, error);
    }
    phase = "workspace-accounting";
    try {
      await removeWorkspaceAccounting(ctx, sessionId);
    } catch (error) {
      warnings.push("workspace-cleanup-failed");
      ctx.logger.warn(`[dsh-workspace-plus] failed to clean workspace accounting ${sessionId}:`, error);
    }
    return { ok: true, removed: true, detached, warnings };
  } catch (error) {
    try {
      if (error && typeof error === "object") error.phase = phase;
    } catch {
    }
    throw error;
  }
}
function registerSessionDeleteRoute(ctx) {
  let mutationTail = Promise.resolve();
  const withMutationLock = (operation) => {
    const result = mutationTail.then(operation, operation);
    mutationTail = result.then(() => void 0, () => void 0);
    return result;
  };
  return ctx.webServer.register({
    kind: "exact",
    path: SESSION_DELETE_ROUTE,
    handler: async (request, response) => {
      if (request.method !== "POST") return respond(response, 405, { ok: false, error: "method-not-allowed" });
      const validation = isSameOriginJsonRequest(request);
      if (!validation.ok) return respond(response, validation.status, { ok: false, error: validation.error });
      let body;
      try {
        body = await readJsonBody(request);
      } catch {
        return respond(response, 400, { ok: false, error: "bad-request" });
      }
      const sessionId = body?.sessionId;
      if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
        return respond(response, 400, { ok: false, error: "invalid-session-id" });
      }
      return withMutationLock(async () => {
        try {
          respond(response, 200, await deleteSession(ctx, sessionId));
        } catch (error) {
          ctx.logger.warn(`[dsh-workspace-plus] failed to delete session ${sessionId}:`, error);
          respond(response, 500, {
            ok: false,
            error: "delete-failed",
            detail: messageOf(error),
            phase: error?.phase ?? null
          });
        }
      });
    }
  });
}
function apply(ctx) {
  const log = ctx && ctx.logger && typeof ctx.logger.info === "function" ? (msg) => {
    ctx.logger.info(msg);
  } : (msg) => {
    console.log(msg);
  };
  log("[dsh-workspace-plus] host half loaded; UI runs in the browser (client half)");
  if (!ctx || typeof ctx.inject !== "function") return;
  ctx.inject(["webServer", "sessionPersistence"], (sctx) => {
    const dispose = registerSessionDeleteRoute(sctx);
    if (typeof sctx.effect === "function") sctx.effect(() => dispose, "dsh-workspace-plus session delete route");
    log("[dsh-workspace-plus] session delete route registered: " + SESSION_DELETE_ROUTE);
  });
}
export {
  apply,
  name
};
