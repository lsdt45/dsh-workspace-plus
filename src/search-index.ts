/**
 * Host-side session content index for the floating search panel.
 *
 * DSH's own session-query provider reconciles through the persistence
 * migration pipeline: one stored log that cannot be migrated (older v0
 * artifacts carrying newer event types, a log whose writer crashed mid-turn)
 * aborts the whole index build, so every content search fails. Real profiles
 * accumulate such logs. This module owns a small derived index instead:
 *
 *  - reads the stored logs directly (decompress + JSON lines, no format
 *    validation, no migration), so a newer event inside an old artifact is
 *    harmless;
 *  - skips an unreadable file per session instead of failing the build;
 *  - indexes user/assistant message text into SQLite FTS5 with one token per
 *    CJK ideograph, which makes Chinese substring queries match (the upstream
 *    `unicode61` tokenizer sees a whole CJK run as one token);
 *  - is incremental: unchanged files (path + mtime + size) are skipped, so a
 *    refresh after new messages only re-reads the sessions that changed.
 *
 * The build runs in the background behind a route; queries return immediately
 * with a building status and the browser polls until the index is ready.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import * as zlib from 'node:zlib'

/** Chars kept per message document (CJK spacing can triple the stored size). */
const MAX_DOCUMENT_CHARS = 20_000
/** How often a ready index re-scans file metadata for changes. */
const REFRESH_INTERVAL_MS = 30_000
/** Sessions indexed between event-loop yields so the host stays responsive. */
const YIELD_EVERY = 4

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/

/** File names a stored log can use, newest format first. */
const LOG_NAME_PREFERENCE = [
  'session.v4.jsonl.zstd',
  'session.v4.jsonl',
  'session.v3.jsonl.zstd',
  'session.v3.jsonl',
  'session.v2.jsonl.zstd',
  'session.v2.jsonl',
  'session.v1.jsonl.zstd',
  'session.v1.jsonl',
  'session.jsonl.zstd',
  'session.jsonl',
]



/* ---------------------------- zstd container ------------------------------ */

/** Zstandard frame magic (little endian 0xFD2FB528). */
const ZSTD_MAGIC = 0xfd2fb528
/** Skippable-frame magic range (0x184D2A50..0x184D2A5F). */
const ZSTD_SKIPPABLE_MIN = 0x184d2a50
const ZSTD_SKIPPABLE_MAX = 0x184d2a5f

/**
 * Byte ranges of the complete frames in a concatenated Zstandard container.
 *
 * The JSONL persistence appends one frame per write batch, so a stored log is a
 * sequence of frames, not one stream. Node's zstdDecompressSync decodes only
 * the first frame of such a buffer, which would silently index nothing but the
 * session header; walking the frame headers lets every batch be decoded. A torn
 * final frame (a writer still appending) ends the list instead of throwing.
 */
export function zstdFrameRanges(buffer: Buffer): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  let offset = 0
  while (offset + 4 <= buffer.length) {
    const magic = buffer.readUInt32LE(offset)
    if (magic >= ZSTD_SKIPPABLE_MIN && magic <= ZSTD_SKIPPABLE_MAX) {
      if (offset + 8 > buffer.length) break
      const end = offset + 8 + buffer.readUInt32LE(offset + 4)
      if (end > buffer.length) break
      offset = end
      continue
    }
    if (magic !== ZSTD_MAGIC) break
    const end = zstdFrameEnd(buffer, offset)
    if (end === null) break
    ranges.push({ start: offset, end })
    offset = end
  }
  return ranges
}

/** End offset of one complete frame, or null when the buffer is torn. */
function zstdFrameEnd(buffer: Buffer, start: number): number | null {
  let cursor = start + 4
  if (cursor >= buffer.length) return null
  const descriptor = buffer[cursor]
  cursor += 1
  const contentSizeFlag = descriptor >> 6
  const singleSegment = (descriptor >> 5) & 1
  const checksum = (descriptor >> 2) & 1
  const dictionaryFlag = descriptor & 3
  if (singleSegment === 0) cursor += 1
  cursor += [0, 1, 2, 4][dictionaryFlag]
  cursor += contentSizeFlag === 0 ? (singleSegment === 1 ? 1 : 0) : [0, 2, 4, 8][contentSizeFlag]
  for (;;) {
    if (cursor + 3 > buffer.length) return null
    const header = buffer[cursor] | (buffer[cursor + 1] << 8) | (buffer[cursor + 2] << 16)
    cursor += 3
    const last = (header & 1) === 1
    const blockType = (header >> 1) & 3
    const blockSize = header >>> 3
    if (blockType === 3) return null
    cursor += blockType === 1 ? 1 : blockSize
    if (cursor > buffer.length) return null
    if (last) break
  }
  if (checksum === 1) cursor += 4
  return cursor <= buffer.length ? cursor : null
}

/** Decode a (possibly multi-frame) Zstandard container into text. */
export function decodeZstdContainer(buffer: Buffer): string {
  const ranges = zstdFrameRanges(buffer)
  const decompress = (zlib as any).zstdDecompressSync
  if (typeof decompress !== 'function') throw new Error('zstd decompression is unavailable in this Node runtime')
  if (ranges.length === 0) throw new Error('not a Zstandard container')
  const chunks: string[] = []
  for (const range of ranges) chunks.push(String(decompress(buffer.subarray(range.start, range.end))))
  return chunks.join('')
}

export type SessionSearchIndexState = 'idle' | 'building' | 'ready' | 'failed'

/** Observable progress of one build. */
export interface SessionSearchIndexProgress {
  state: SessionSearchIndexState
  done: number
  total: number
  /** Sessions the reader could not decode; their content is simply absent. */
  skipped: number
  builtAt: number | null
  error?: string
}

/** One content hit, already reduced to the session and a display snippet. */
export interface SessionSearchIndexHit {
  sessionId: string
  snippet: string
}

/** Query result vocabulary the route forwards to the browser. */
export type SessionSearchIndexResult =
  | { state: 'ready'; items: SessionSearchIndexHit[]; hasMore: boolean }
  | { state: 'building'; progress: SessionSearchIndexProgress }
  | { state: 'failed'; message: string }

/** Options for {@link createSessionSearchIndex}. */
export interface SessionSearchIndexOptions {
  /** Directory that holds one subdirectory per workspace and one per session. */
  sessionsRoot: string
  /** SQLite file for the derived index (created on first use). */
  dbPath: string
  /** Optional warning sink; one bad session is a warning, not a build failure. */
  logger?: { warn: (message: string, ...args: unknown[]) => void }
  /** Injected clock for tests. */
  now?: () => number
}

/** The host-side index handle. */
export interface SessionSearchIndex {
  status(): SessionSearchIndexProgress
  /** Start (or join) a build; safe to call on every request. */
  kick(): void
  /** Run one build to completion (tests and the route's background job). */
  build(): Promise<void>
  search(query: string, limit: number): SessionSearchIndexResult
  close(): void
}

/** One stored log discovered on disk. */
interface StoredLog {
  sessionId: string
  path: string
  mtimeMs: number
  size: number
}

/** One message document extracted from a log. */
interface ExtractedDocument {
  seq: number
  time: number
  text: string
}

/** A session read back from disk. */
interface ExtractedSession {
  sessionId: string
  documents: ExtractedDocument[]
}

/* ------------------------------ text helpers ------------------------------ */

/** Space each CJK code point so FTS5 gives it its own token (substring search). */
export function spaceCjk(text: string): string {
  let out = ''
  for (const ch of text) out += CJK.test(ch) ? ' ' + ch + ' ' : ch
  return out.replace(/\s+/g, ' ').trim()
}

/** Turn a user query into one FTS5 phrase over the CJK-spaced document text. */
export function queryExpression(query: string): string {
  const spaced = spaceCjk(query)
  if (spaced === '') return ''
  return '"' + spaced.replaceAll('"', '""') + '"'
}

/** A character that reads as CJK text when deciding which artificial spaces to drop. */
const CJK_SNIPPET_CHAR = /[\u2018\u2019\u201c\u201d\u2014\u2026\u3000-\u303f\uff00-\uffef\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af"'\[\](){},;:!?]/

/**
 * Collapse the artificial spaces between CJK text in an FTS5 snippet.
 *
 * spaceCjk() surrounds every ideograph with spaces, so a snippet reads
 * "我 试 了 下 ， 会 话". Remove a space only when both neighbours read as CJK
 * text (ideographs plus the punctuation that sits inside Chinese sentences), so
 * a real space before or after a latin word survives.
 */
export function collapseSnippet(snippet: string): string {
  let out = ''
  for (let index = 0; index < snippet.length; index += 1) {
    const ch = snippet[index]
    if (ch === ' ' && index > 0 && index + 1 < snippet.length && CJK_SNIPPET_CHAR.test(snippet[index - 1]) && CJK_SNIPPET_CHAR.test(snippet[index + 1])) continue
    out += ch
  }
  return out.replace(/\s+/g, ' ').trim()
}

/** Concatenate the text parts of one model content array. */
function contentText(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  const chunks: string[] = []
  for (const part of parts) {
    if (part === null || typeof part !== 'object') continue
    const typed = part as { type?: unknown; text?: unknown }
    if (typeof typed.text === 'string' && typed.text !== '' && (typed.type === 'text' || typed.type === 'input-text')) chunks.push(typed.text)
  }
  return chunks.join('\n')
}

/**
 * Extract one searchable message from a log record. Only user and assistant
 * message bodies are indexed; reasoning, tool calls/results and bookkeeping
 * events stay out of the index (matching what the panel should search).
 */
export function documentOfRecord(record: unknown): { role: 'user' | 'assistant'; text: string; seq: number; time: number } | null {
  if (record === null || typeof record !== 'object') return null
  const typed = record as { type?: unknown; seq?: unknown; time?: unknown; data?: any }
  const seq = Number.isInteger(typed.seq) ? Number(typed.seq) : 0
  const time = Number.isFinite(typed.time) ? Number(typed.time) : 0
  if (typed.type === 'user/message') {
    const text = contentText(typed.data && typed.data.content)
    return text === '' ? null : { role: 'user', text, seq, time }
  }
  if (typed.type === 'assistant/message') {
    const text = contentText(typed.data && typed.data.message && typed.data.message.content)
    return text === '' ? null : { role: 'assistant', text, seq, time }
  }
  return null
}

/** Decode one stored log file into its session id and message documents. */
export function extractSession(path: string): ExtractedSession {
  const raw = readFileSync(path)
  const text = path.endsWith('.zstd') ? decodeZstdContainer(raw) : raw.toString('utf8')
  let sessionId = ''
  const documents: ExtractedDocument[] = []
  for (const line of text.split('\n')) {
    if (line === '') continue
    let record: unknown
    try { record = JSON.parse(line) } catch { continue }
    if (sessionId === '' && record !== null && typeof record === 'object') {
      const header = record as { type?: unknown; id?: unknown }
      if (header.type === 'session' && typeof header.id === 'string' && header.id !== '') sessionId = header.id
    }
    const document = documentOfRecord(record)
    if (document === null) continue
    const body = document.text.length > MAX_DOCUMENT_CHARS ? document.text.slice(0, MAX_DOCUMENT_CHARS) : document.text
    documents.push({ seq: document.seq, time: document.time, text: spaceCjk(body) })
    if (documents.length >= 20_000) break
  }
  if (sessionId === '') sessionId = basename(dirname(path))
  return { sessionId, documents }
}

/* ------------------------------- discovery -------------------------------- */

/** Pick the stored log inside one session directory (newest format wins). */
function findLog(sessionDir: string): string | null {
  let names: string[]
  try { names = readdirSync(sessionDir) } catch { return null }
  for (const candidate of LOG_NAME_PREFERENCE) {
    if (names.includes(candidate)) return join(sessionDir, candidate)
  }
  const fallback = names.filter((name) => /^session\.v\d+\.jsonl(\.zstd)?$/.test(name)).sort().pop()
  return fallback === undefined ? null : join(sessionDir, fallback)
}

/** Walk the sessions root and stat every stored log. */
export function collectStoredLogs(sessionsRoot: string): StoredLog[] {
  const logs: StoredLog[] = []
  let workspaces: string[]
  try { workspaces = readdirSync(sessionsRoot) } catch { return logs }
  for (const workspace of workspaces) {
    if (workspace.startsWith('.')) continue
    const workspaceDir = join(sessionsRoot, workspace)
    let sessionDirs: string[]
    try {
      if (!statSync(workspaceDir).isDirectory()) continue
      sessionDirs = readdirSync(workspaceDir)
    } catch { continue }
    for (const sessionDirName of sessionDirs) {
      const sessionDir = join(workspaceDir, sessionDirName)
      try { if (!statSync(sessionDir).isDirectory()) continue } catch { continue }
      const path = findLog(sessionDir)
      if (path === null) continue
      let info
      try { info = statSync(path) } catch { continue }
      logs.push({ sessionId: '', path, mtimeMs: Math.trunc(info.mtimeMs), size: info.size })
    }
  }
  logs.sort((left, right) => left.path.localeCompare(right.path))
  return logs
}

/* --------------------------------- index ---------------------------------- */

interface SqliteStatement {
  run(...params: unknown[]): unknown
  all(...params: unknown[]): unknown[]
  get(...params: unknown[]): unknown
}

interface SqliteDatabase {
  exec(sql: string): void
  prepare(sql: string): SqliteStatement
  close(): void
}

/** Load node:sqlite without breaking the plugin on runtimes that lack it. */
function openDatabase(path: string): SqliteDatabase {
  const require = createRequire(import.meta.url)
  const sqlite = require('node:sqlite') as { DatabaseSync: new (file: string) => SqliteDatabase }
  const db = new sqlite.DatabaseSync(path)
  db.exec([
    'CREATE TABLE IF NOT EXISTS session_files (path TEXT PRIMARY KEY, session_id TEXT NOT NULL, mtime_ms INTEGER NOT NULL, size INTEGER NOT NULL, indexed_at INTEGER NOT NULL)',
    'CREATE VIRTUAL TABLE IF NOT EXISTS docs USING fts5(session_id UNINDEXED, seq UNINDEXED, time UNINDEXED, text, tokenize = \'unicode61\')',
  ].join('; '))
  return db
}

/** Build a derived, resilient message index over the stored session logs. */
export function createSessionSearchIndex(options: SessionSearchIndexOptions): SessionSearchIndex {
  const now = options.now ?? Date.now
  const logger = options.logger
  let db: SqliteDatabase | null = null
  let opening: Promise<void> | null = null
  let buildPromise: Promise<void> | null = null
  let runPromise: Promise<void> | null = null
  let closed = false
  let state: SessionSearchIndexState = 'idle'
  let done = 0
  let total = 0
  let skipped = 0
  let builtAt: number | null = null
  let error: string | undefined

  const progress = (): SessionSearchIndexProgress => {
    const snapshot: SessionSearchIndexProgress = { state, done, total, skipped, builtAt }
    if (error !== undefined) snapshot.error = error
    return snapshot
  }

  const ensureDb = async (): Promise<SqliteDatabase> => {
    if (db !== null) return db
    opening = opening ?? (async () => {
      mkdirSync(dirname(options.dbPath), { recursive: true })
      db = openDatabase(options.dbPath)
    })()
    try {
      await opening
    } finally {
      opening = null
    }
    if (db === null) throw new Error('search index database did not open')
    return db
  }

  const indexLog = (database: SqliteDatabase, log: StoredLog, session: ExtractedSession): void => {
    const insertDoc = database.prepare('INSERT INTO docs (session_id, seq, time, text) VALUES (?, ?, ?, ?)')
    const upsert = database.prepare('INSERT INTO session_files (path, session_id, mtime_ms, size, indexed_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET session_id = excluded.session_id, mtime_ms = excluded.mtime_ms, size = excluded.size, indexed_at = excluded.indexed_at')
    database.exec('BEGIN')
    try {
      database.prepare('DELETE FROM docs WHERE session_id = ?').run(session.sessionId)
      for (const document of session.documents) insertDoc.run(session.sessionId, document.seq, document.time, document.text)
      upsert.run(log.path, session.sessionId, log.mtimeMs, log.size, now())
      database.exec('COMMIT')
    } catch (failure) {
      try { database.exec('ROLLBACK') } catch { /* the transaction may not have started */ }
      throw failure
    }
  }

  const runBuild = async (): Promise<void> => {
    if (closed) return
    // A refresh keeps the previous state so queries keep answering from the
    // ready index; only the first build flips the panel into "building".
    if (state !== 'ready') state = 'building'
    done = 0
    total = 0
    skipped = 0
    error = undefined
    let database: SqliteDatabase
    try {
      database = await ensureDb()
    } catch (failure) {
      state = 'failed'
      error = failure instanceof Error ? failure.message : String(failure)
      if (logger) logger.warn('[dsh-workspace-plus] content index unavailable:', failure)
      return
    }
    const logs = collectStoredLogs(options.sessionsRoot)
    if (logs.length === 0 && !existsSync(options.sessionsRoot)) {
      state = 'failed'
      error = 'sessions directory is unavailable'
      return
    }
    const indexed = new Map<string, { session_id: string; mtime_ms: number; size: number }>()
    for (const row of database.prepare('SELECT path, session_id, mtime_ms, size FROM session_files').all() as Array<{ path: string; session_id: string; mtime_ms: number; size: number }>) {
      indexed.set(row.path, { session_id: row.session_id, mtime_ms: Number(row.mtime_ms), size: Number(row.size) })
    }
    total = logs.length
    const seen = new Set<string>()
    try {
      for (const log of logs) {
        if (closed) return
        seen.add(log.path)
        // Unchanged files are skipped before decompression: this is what keeps a
        // refresh cheap (stat only) even when a search arrives every few seconds.
        const previous = indexed.get(log.path)
        if (previous !== undefined && previous.mtime_ms === log.mtimeMs && previous.size === log.size) {
          done += 1
          if (done % YIELD_EVERY === 0) await new Promise<void>((resolve) => setImmediate(resolve))
          continue
        }
        let session: ExtractedSession
        try {
          session = extractSession(log.path)
        } catch (failure) {
          skipped += 1
          if (logger) logger.warn('[dsh-workspace-plus] skipped unreadable session log:', log.path, failure instanceof Error ? failure.message : String(failure))
          done += 1
          if (done % YIELD_EVERY === 0) await new Promise<void>((resolve) => setImmediate(resolve))
          continue
        }
        try {
          indexLog(database, log, session)
        } catch (failure) {
          skipped += 1
          if (logger) logger.warn('[dsh-workspace-plus] skipped session that failed to index:', log.path, failure instanceof Error ? failure.message : String(failure))
        }
        done += 1
        if (done % YIELD_EVERY === 0) await new Promise<void>((resolve) => setImmediate(resolve))
      }
      // Drop documents whose logs disappeared since the last build.
      for (const [path, previous] of indexed) {
        if (seen.has(path)) continue
        database.prepare('DELETE FROM docs WHERE session_id = ?').run(previous.session_id)
        database.prepare('DELETE FROM session_files WHERE path = ?').run(path)
      }
      builtAt = now()
      state = 'ready'
    } catch (failure) {
      state = 'failed'
      error = failure instanceof Error ? failure.message : String(failure)
      if (logger) logger.warn('[dsh-workspace-plus] content index build failed:', failure)
    }
  }

  const kick = (): void => {
    if (closed || buildPromise !== null) return
    runPromise = runBuild()
    buildPromise = runPromise
    const settled = (): void => { buildPromise = null; runPromise = null }
    runPromise.then(settled, settled)
  }

  const build = async (): Promise<void> => {
    kick()
    const pending = buildPromise
    if (pending !== null) await pending
  }

  const search = (query: string, limit: number): SessionSearchIndexResult => {
    const capped = Math.max(1, Math.min(50, Math.trunc(limit) || 20))
    if (state === 'failed') return { state: 'failed', message: error ?? 'content index failed' }
    if (state !== 'ready' || db === null) {
      kick()
      return { state: 'building', progress: progress() }
    }
    // The index is usable: answer from it even while a background refresh scans
    // for changed logs (a refresh never blocks the query).
    if (builtAt !== null && now() - builtAt > REFRESH_INTERVAL_MS && buildPromise === null) kick()
    const expression = queryExpression(query)
    if (expression === '') return { state: 'ready', items: [], hasMore: false }
    try {
      const rows = db.prepare('SELECT session_id, snippet(docs, 3, \'\', \'\', \'…\', 18) AS snippet, bm25(docs) AS rank, time FROM docs WHERE docs MATCH ? ORDER BY rank, time DESC LIMIT ?').all(expression, capped * 12) as Array<{ session_id: string; snippet: string }>
      const items: SessionSearchIndexHit[] = []
      const seen = new Set<string>()
      let hasMore = false
      for (const row of rows) {
        if (seen.has(row.session_id)) continue
        if (items.length >= capped) { hasMore = true; break }
        seen.add(row.session_id)
        items.push({ sessionId: String(row.session_id), snippet: collapseSnippet(String(row.snippet)) })
      }
      return { state: 'ready', items, hasMore }
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure)
      if (logger) logger.warn('[dsh-workspace-plus] content search failed:', failure)
      return { state: 'failed', message: error }
    }
  }

  const close = (): void => {
    closed = true
    buildPromise = null
    runPromise = null
    try { db?.close() } catch { /* already closed */ }
    db = null
    state = 'idle'
  }

  return { status: progress, kick, build, search, close }
}
