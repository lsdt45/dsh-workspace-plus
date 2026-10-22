/* GENERATED FILE — do not edit.
 * Source: src/index.ts (host half)  ·  Rebuild: npm run build  ·  Verify: npm run check
 * dist/ ships committed so git/tarball installs stay build-free. */

// src/index.ts
import { existsSync as existsSync2 } from "node:fs";
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { basename as basename2, dirname as dirname2, isAbsolute, join as join2, relative, resolve, sep } from "node:path";

// src/search-index.ts
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import * as zlib from "node:zlib";
var MAX_DOCUMENT_CHARS = 2e4;
var REFRESH_INTERVAL_MS = 3e4;
var YIELD_EVERY = 4;
var CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
var LOG_NAME_PREFERENCE = [
  "session.v4.jsonl.zstd",
  "session.v4.jsonl",
  "session.v3.jsonl.zstd",
  "session.v3.jsonl",
  "session.v2.jsonl.zstd",
  "session.v2.jsonl",
  "session.v1.jsonl.zstd",
  "session.v1.jsonl",
  "session.jsonl.zstd",
  "session.jsonl"
];
var ZSTD_MAGIC = 4247762216;
var ZSTD_SKIPPABLE_MIN = 407710288;
var ZSTD_SKIPPABLE_MAX = 407710303;
function zstdFrameRanges(buffer) {
  const ranges = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const magic = buffer.readUInt32LE(offset);
    if (magic >= ZSTD_SKIPPABLE_MIN && magic <= ZSTD_SKIPPABLE_MAX) {
      if (offset + 8 > buffer.length) break;
      const end2 = offset + 8 + buffer.readUInt32LE(offset + 4);
      if (end2 > buffer.length) break;
      offset = end2;
      continue;
    }
    if (magic !== ZSTD_MAGIC) break;
    const end = zstdFrameEnd(buffer, offset);
    if (end === null) break;
    ranges.push({ start: offset, end });
    offset = end;
  }
  return ranges;
}
function zstdFrameEnd(buffer, start) {
  let cursor = start + 4;
  if (cursor >= buffer.length) return null;
  const descriptor = buffer[cursor];
  cursor += 1;
  const contentSizeFlag = descriptor >> 6;
  const singleSegment = descriptor >> 5 & 1;
  const checksum = descriptor >> 2 & 1;
  const dictionaryFlag = descriptor & 3;
  if (singleSegment === 0) cursor += 1;
  cursor += [0, 1, 2, 4][dictionaryFlag];
  cursor += contentSizeFlag === 0 ? singleSegment === 1 ? 1 : 0 : [0, 2, 4, 8][contentSizeFlag];
  for (; ; ) {
    if (cursor + 3 > buffer.length) return null;
    const header = buffer[cursor] | buffer[cursor + 1] << 8 | buffer[cursor + 2] << 16;
    cursor += 3;
    const last = (header & 1) === 1;
    const blockType = header >> 1 & 3;
    const blockSize = header >>> 3;
    if (blockType === 3) return null;
    cursor += blockType === 1 ? 1 : blockSize;
    if (cursor > buffer.length) return null;
    if (last) break;
  }
  if (checksum === 1) cursor += 4;
  return cursor <= buffer.length ? cursor : null;
}
function decodeZstdContainer(buffer) {
  const ranges = zstdFrameRanges(buffer);
  const decompress = zlib.zstdDecompressSync;
  if (typeof decompress !== "function") throw new Error("zstd decompression is unavailable in this Node runtime");
  if (ranges.length === 0) throw new Error("not a Zstandard container");
  const chunks = [];
  for (const range of ranges) chunks.push(String(decompress(buffer.subarray(range.start, range.end))));
  return chunks.join("");
}
function spaceCjk(text) {
  let out = "";
  for (const ch of text) out += CJK.test(ch) ? " " + ch + " " : ch;
  return out.replace(/\s+/g, " ").trim();
}
function queryExpression(query) {
  const spaced = spaceCjk(query);
  if (spaced === "") return "";
  return '"' + spaced.replaceAll('"', '""') + '"';
}
var CJK_SNIPPET_CHAR = /[\u2018\u2019\u201c\u201d\u2014\u2026\u3000-\u303f\uff00-\uffef\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af"'\[\](){},;:!?]/;
function collapseSnippet(snippet) {
  let out = "";
  for (let index = 0; index < snippet.length; index += 1) {
    const ch = snippet[index];
    if (ch === " " && index > 0 && index + 1 < snippet.length && CJK_SNIPPET_CHAR.test(snippet[index - 1]) && CJK_SNIPPET_CHAR.test(snippet[index + 1])) continue;
    out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}
function contentText(parts) {
  if (!Array.isArray(parts)) return "";
  const chunks = [];
  for (const part of parts) {
    if (part === null || typeof part !== "object") continue;
    const typed = part;
    if (typeof typed.text === "string" && typed.text !== "" && (typed.type === "text" || typed.type === "input-text")) chunks.push(typed.text);
  }
  return chunks.join("\n");
}
function documentOfRecord(record) {
  if (record === null || typeof record !== "object") return null;
  const typed = record;
  const seq = Number.isInteger(typed.seq) ? Number(typed.seq) : 0;
  const time = Number.isFinite(typed.time) ? Number(typed.time) : 0;
  if (typed.type === "user/message") {
    const text = contentText(typed.data && typed.data.content);
    return text === "" ? null : { role: "user", text, seq, time };
  }
  if (typed.type === "assistant/message") {
    const text = contentText(typed.data && typed.data.message && typed.data.message.content);
    return text === "" ? null : { role: "assistant", text, seq, time };
  }
  return null;
}
function extractSession(path) {
  const raw = readFileSync(path);
  const text = path.endsWith(".zstd") ? decodeZstdContainer(raw) : raw.toString("utf8");
  let sessionId = "";
  const documents = [];
  for (const line of text.split("\n")) {
    if (line === "") continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (sessionId === "" && record !== null && typeof record === "object") {
      const header = record;
      if (header.type === "session" && typeof header.id === "string" && header.id !== "") sessionId = header.id;
    }
    const document = documentOfRecord(record);
    if (document === null) continue;
    const body = document.text.length > MAX_DOCUMENT_CHARS ? document.text.slice(0, MAX_DOCUMENT_CHARS) : document.text;
    documents.push({ seq: document.seq, time: document.time, text: spaceCjk(body) });
    if (documents.length >= 2e4) break;
  }
  if (sessionId === "") sessionId = basename(dirname(path));
  return { sessionId, documents };
}
function findLog(sessionDir) {
  let names;
  try {
    names = readdirSync(sessionDir);
  } catch {
    return null;
  }
  for (const candidate of LOG_NAME_PREFERENCE) {
    if (names.includes(candidate)) return join(sessionDir, candidate);
  }
  const fallback = names.filter((name2) => /^session\.v\d+\.jsonl(\.zstd)?$/.test(name2)).sort().pop();
  return fallback === void 0 ? null : join(sessionDir, fallback);
}
function collectStoredLogs(sessionsRoot) {
  const logs = [];
  let workspaces;
  try {
    workspaces = readdirSync(sessionsRoot);
  } catch {
    return logs;
  }
  for (const workspace of workspaces) {
    if (workspace.startsWith(".")) continue;
    const workspaceDir = join(sessionsRoot, workspace);
    let sessionDirs;
    try {
      if (!statSync(workspaceDir).isDirectory()) continue;
      sessionDirs = readdirSync(workspaceDir);
    } catch {
      continue;
    }
    for (const sessionDirName of sessionDirs) {
      const sessionDir = join(workspaceDir, sessionDirName);
      try {
        if (!statSync(sessionDir).isDirectory()) continue;
      } catch {
        continue;
      }
      const path = findLog(sessionDir);
      if (path === null) continue;
      let info;
      try {
        info = statSync(path);
      } catch {
        continue;
      }
      logs.push({ sessionId: "", path, mtimeMs: Math.trunc(info.mtimeMs), size: info.size });
    }
  }
  logs.sort((left, right) => left.path.localeCompare(right.path));
  return logs;
}
function openDatabase(path) {
  const require2 = createRequire(import.meta.url);
  const sqlite = require2("node:sqlite");
  const db = new sqlite.DatabaseSync(path);
  db.exec([
    "CREATE TABLE IF NOT EXISTS session_files (path TEXT PRIMARY KEY, session_id TEXT NOT NULL, mtime_ms INTEGER NOT NULL, size INTEGER NOT NULL, indexed_at INTEGER NOT NULL)",
    "CREATE VIRTUAL TABLE IF NOT EXISTS docs USING fts5(session_id UNINDEXED, seq UNINDEXED, time UNINDEXED, text, tokenize = 'unicode61')"
  ].join("; "));
  return db;
}
function createSessionSearchIndex(options) {
  const now = options.now ?? Date.now;
  const logger = options.logger;
  let db = null;
  let opening = null;
  let buildPromise = null;
  let runPromise = null;
  let closed = false;
  let state = "idle";
  let done = 0;
  let total = 0;
  let skipped = 0;
  let builtAt = null;
  let error;
  const progress = () => {
    const snapshot = { state, done, total, skipped, builtAt };
    if (error !== void 0) snapshot.error = error;
    return snapshot;
  };
  const ensureDb = async () => {
    if (db !== null) return db;
    opening = opening ?? (async () => {
      mkdirSync(dirname(options.dbPath), { recursive: true });
      db = openDatabase(options.dbPath);
    })();
    try {
      await opening;
    } finally {
      opening = null;
    }
    if (db === null) throw new Error("search index database did not open");
    return db;
  };
  const indexLog = (database, log, session) => {
    const insertDoc = database.prepare("INSERT INTO docs (session_id, seq, time, text) VALUES (?, ?, ?, ?)");
    const upsert = database.prepare("INSERT INTO session_files (path, session_id, mtime_ms, size, indexed_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET session_id = excluded.session_id, mtime_ms = excluded.mtime_ms, size = excluded.size, indexed_at = excluded.indexed_at");
    database.exec("BEGIN");
    try {
      database.prepare("DELETE FROM docs WHERE session_id = ?").run(session.sessionId);
      for (const document of session.documents) insertDoc.run(session.sessionId, document.seq, document.time, document.text);
      upsert.run(log.path, session.sessionId, log.mtimeMs, log.size, now());
      database.exec("COMMIT");
    } catch (failure) {
      try {
        database.exec("ROLLBACK");
      } catch {
      }
      throw failure;
    }
  };
  const runBuild = async () => {
    if (closed) return;
    if (state !== "ready") state = "building";
    done = 0;
    total = 0;
    skipped = 0;
    error = void 0;
    let database;
    try {
      database = await ensureDb();
    } catch (failure) {
      state = "failed";
      error = failure instanceof Error ? failure.message : String(failure);
      if (logger) logger.warn("[dsh-workspace-plus] content index unavailable:", failure);
      return;
    }
    const logs = collectStoredLogs(options.sessionsRoot);
    if (logs.length === 0 && !existsSync(options.sessionsRoot)) {
      state = "failed";
      error = "sessions directory is unavailable";
      return;
    }
    const indexed = /* @__PURE__ */ new Map();
    for (const row of database.prepare("SELECT path, session_id, mtime_ms, size FROM session_files").all()) {
      indexed.set(row.path, { session_id: row.session_id, mtime_ms: Number(row.mtime_ms), size: Number(row.size) });
    }
    total = logs.length;
    const seen = /* @__PURE__ */ new Set();
    try {
      for (const log of logs) {
        if (closed) return;
        seen.add(log.path);
        const previous = indexed.get(log.path);
        if (previous !== void 0 && previous.mtime_ms === log.mtimeMs && previous.size === log.size) {
          done += 1;
          if (done % YIELD_EVERY === 0) await new Promise((resolve2) => setImmediate(resolve2));
          continue;
        }
        let session;
        try {
          session = extractSession(log.path);
        } catch (failure) {
          skipped += 1;
          if (logger) logger.warn("[dsh-workspace-plus] skipped unreadable session log:", log.path, failure instanceof Error ? failure.message : String(failure));
          done += 1;
          if (done % YIELD_EVERY === 0) await new Promise((resolve2) => setImmediate(resolve2));
          continue;
        }
        try {
          indexLog(database, log, session);
        } catch (failure) {
          skipped += 1;
          if (logger) logger.warn("[dsh-workspace-plus] skipped session that failed to index:", log.path, failure instanceof Error ? failure.message : String(failure));
        }
        done += 1;
        if (done % YIELD_EVERY === 0) await new Promise((resolve2) => setImmediate(resolve2));
      }
      for (const [path, previous] of indexed) {
        if (seen.has(path)) continue;
        database.prepare("DELETE FROM docs WHERE session_id = ?").run(previous.session_id);
        database.prepare("DELETE FROM session_files WHERE path = ?").run(path);
      }
      builtAt = now();
      state = "ready";
    } catch (failure) {
      state = "failed";
      error = failure instanceof Error ? failure.message : String(failure);
      if (logger) logger.warn("[dsh-workspace-plus] content index build failed:", failure);
    }
  };
  const kick = () => {
    if (closed || buildPromise !== null) return;
    runPromise = runBuild();
    buildPromise = runPromise;
    const settled = () => {
      buildPromise = null;
      runPromise = null;
    };
    runPromise.then(settled, settled);
  };
  const build = async () => {
    kick();
    const pending = buildPromise;
    if (pending !== null) await pending;
  };
  const search = (query, limit) => {
    const capped = Math.max(1, Math.min(50, Math.trunc(limit) || 20));
    if (state === "failed") return { state: "failed", message: error ?? "content index failed" };
    if (state !== "ready" || db === null) {
      kick();
      return { state: "building", progress: progress() };
    }
    if (builtAt !== null && now() - builtAt > REFRESH_INTERVAL_MS && buildPromise === null) kick();
    const expression = queryExpression(query);
    if (expression === "") return { state: "ready", items: [], hasMore: false };
    try {
      const rows = db.prepare("SELECT session_id, snippet(docs, 3, '', '', '\u2026', 18) AS snippet, bm25(docs) AS rank, time FROM docs WHERE docs MATCH ? ORDER BY rank, time DESC LIMIT ?").all(expression, capped * 12);
      const items = [];
      const seen = /* @__PURE__ */ new Set();
      let hasMore = false;
      for (const row of rows) {
        if (seen.has(row.session_id)) continue;
        if (items.length >= capped) {
          hasMore = true;
          break;
        }
        seen.add(row.session_id);
        items.push({ sessionId: String(row.session_id), snippet: collapseSnippet(String(row.snippet)) });
      }
      return { state: "ready", items, hasMore };
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
      if (logger) logger.warn("[dsh-workspace-plus] content search failed:", failure);
      return { state: "failed", message: error };
    }
  };
  const close = () => {
    closed = true;
    buildPromise = null;
    runPromise = null;
    try {
      db?.close();
    } catch {
    }
    db = null;
    state = "idle";
  };
  return { status: progress, kick, build, search, close };
}

// src/index.ts
var name = "dsh-workspace-plus";
var SESSION_DELETE_ROUTE = "/dsh-workspace-plus/delete-session";
var SESSION_SEARCH_ROUTE = "/dsh-workspace-plus/search";
var SEARCH_DEFAULT_LIMIT = 20;
var SEARCH_MAX_LIMIT = 50;
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
  const sessionDir = resolve(dirname2(location.path));
  const fromRoot = relative(sessionsRoot, sessionDir);
  const outsideRoot = !fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot);
  if (outsideRoot || basename2(sessionDir) !== sessionId) {
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
  if (existsSync2(sessionDir)) throw new Error(`session directory still exists: ${sessionDir}`);
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
function resolveSessionsRoot(ctx) {
  const configured = ctx.get("sessionPersistence")?.root;
  if (typeof configured === "string" && configured !== "") return configured;
  const home = process.env.DSH_HOME && process.env.DSH_HOME !== "" ? process.env.DSH_HOME : join2(homedir(), ".dsh");
  return resolve(home, "sessions");
}
function registerSessionSearchRoute(ctx) {
  let index = null;
  let indexRoot = "";
  const ensureIndex = () => {
    const root = resolveSessionsRoot(ctx);
    if (root === null) return null;
    if (index !== null && indexRoot === root) return index;
    try {
      index?.close();
    } catch {
    }
    index = createSessionSearchIndex({
      sessionsRoot: root,
      dbPath: join2(dirname2(root), "storages", "workspace-plus-search.db"),
      logger: { warn: (message, ...args) => {
        ctx.logger.warn(message, ...args);
      } }
    });
    indexRoot = root;
    return index;
  };
  const dispose = ctx.webServer.register({
    kind: "exact",
    path: SESSION_SEARCH_ROUTE,
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
      const query = typeof body?.query === "string" ? body.query.trim() : "";
      if (query === "") return respond(response, 400, { ok: false, error: "invalid-query" });
      const requested = Number(body?.limit);
      const limit = Number.isFinite(requested) ? Math.max(1, Math.min(SEARCH_MAX_LIMIT, Math.trunc(requested))) : SEARCH_DEFAULT_LIMIT;
      const content = ensureIndex();
      if (content === null) return respond(response, 503, { ok: false, status: "failed", error: "sessions-root-unavailable" });
      content.kick();
      const result = content.search(query, limit);
      if (result.state === "building") return respond(response, 200, { ok: true, status: "building", progress: result.progress });
      if (result.state === "failed") return respond(response, 200, { ok: false, status: "failed", error: result.message });
      return respond(response, 200, { ok: true, status: "ready", items: result.items, hasMore: result.hasMore });
    }
  });
  return () => {
    try {
      index?.close();
    } catch {
    }
    dispose();
  };
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
  ctx.inject(["webServer"], (sctx) => {
    const dispose = registerSessionSearchRoute(sctx);
    if (typeof sctx.effect === "function") sctx.effect(() => dispose, "dsh-workspace-plus session search route");
    log("[dsh-workspace-plus] session search route registered: " + SESSION_SEARCH_ROUTE);
  });
}
export {
  apply,
  name
};
