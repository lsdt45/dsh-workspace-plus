/**
 * Host-side session content index (src/search-index.ts).
 *
 * The index deliberately bypasses the persistence migration pipeline: real
 * profiles contain logs a strict reader refuses (old artifacts with newer event
 * types, crash-truncated v4 logs), and the Host's own provider aborts the whole
 * build on the first one. These tests pin the two promises that replace it:
 * a broken log is skipped instead of failing the build, and CJK substrings are
 * searchable because each ideograph gets its own FTS token.
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { zstdCompressSync } from 'node:zlib'

import { collapseSnippet, createSessionSearchIndex, decodeZstdContainer, queryExpression, spaceCjk, zstdFrameRanges } from '../src/search-index.ts'

const HEADER = (id: string): unknown => ({ type: 'session', version: 4, id, createdAt: 1, cwd: '/tmp/project' })
const USER = (text: string, seq: number, time = 1_000): unknown => ({ type: 'user/message', seq, time, data: { content: [{ type: 'text', text }] } })
const ASSISTANT = (text: string, seq: number, time = 1_001): unknown => ({ type: 'assistant/message', seq, time, data: { message: { role: 'assistant', content: [{ type: 'text', text }] } } })

interface Fixture {
  root: string
  dbPath: string
  write(workspace: string, sessionId: string, records: unknown[], options?: { logName?: string; zstd?: boolean }): string
  cleanup(): void
}

const fixture = (): Fixture => {
  const root = mkdtempSync(join(tmpdir(), 'wsp-search-index-'))
  return {
    root,
    dbPath: join(root, 'index.db'),
    write(workspace, sessionId, records, options = {}) {
      const dir = join(root, 'sessions', workspace, sessionId)
      mkdirSync(dir, { recursive: true })
      const logName = options.logName ?? 'session.v4.jsonl'
      const path = join(dir, logName)
      const body = records.map((record) => JSON.stringify(record)).join('\n') + '\n'
      writeFileSync(path, options.zstd === true ? zstdCompressSync(Buffer.from(body, 'utf8')) : body)
      return path
    },
    cleanup() { rmSync(root, { recursive: true, force: true }) },
  }
}

const indexFor = (f: Fixture) => createSessionSearchIndex({
  sessionsRoot: join(f.root, 'sessions'),
  dbPath: f.dbPath,
  logger: { warn: () => {} },
})

test('spaceCjk gives each ideograph its own token and leaves latin words alone', () => {
  assert.equal(spaceCjk('这个模型很好'), '这 个 模 型 很 好')
  assert.equal(spaceCjk('model 测试'), 'model 测 试')
  assert.equal(queryExpression('模型'), '"模 型"')
  assert.equal(queryExpression('say "hi"'), '"say ""hi"""')
  assert.equal(collapseSnippet('这 个 模 型 很 好 model ok'), '这个模型很好 model ok')
  assert.equal(collapseSnippet('我 试 了 下 ， 会 话'), '我试了下，会话', 'CJK punctuation keeps no artificial spaces')
  assert.equal(collapseSnippet('会 话 [ x ] 模 型'), '会话[ x ]模型', 'latin words inside brackets keep their real spaces')
})

test('a stored log is a concatenation of frames; every frame is decoded', () => {
  const first = zstdCompressSync(Buffer.from('{"type":"session","id":"session-a"}\n', 'utf8'))
  const second = zstdCompressSync(Buffer.from('{"type":"user/message","seq":1,"data":{"content":[{"type":"text","text":"模型"}]}}\n', 'utf8'))
  // The JSONL writer appends one frame per batch: a whole-file one-shot decoder
  // would return only the header and silently index nothing.
  const container = Buffer.concat([first, second])
  assert.equal(zstdFrameRanges(container).length, 2)
  const text = decodeZstdContainer(container)
  assert.match(text, /user\/message/)
  assert.match(text, /模型/)
  // A torn final frame (a writer still appending) is ignored, not fatal.
  const torn = Buffer.concat([container, Buffer.from([0x28, 0xb5, 0x2f])])
  assert.equal(zstdFrameRanges(torn).length, 2)
  assert.equal(decodeZstdContainer(torn).includes('模型'), true)
})

test('build indexes message text and answers CJK substrings', async () => {
  const f = fixture()
  try {
    f.write('obsidian', 'session-a', [HEADER('session-a'), USER('补充：飞猪出行页怎么没有写进去', 1), ASSISTANT('The model works fine', 2)])
    f.write('work', 'session-b', [HEADER('session-b'), USER('这个模型很好', 1)], { logName: 'session.jsonl.zstd', zstd: true })
    // A .zstd artifact whose bytes are not a zstd stream: reading it throws, and
    // the build must skip that one session instead of failing the whole pass.
    f.write('broken', 'session-c', [HEADER('session-c')], { logName: 'session.v4.jsonl.zstd', zstd: true })
    writeFileSync(join(f.root, 'sessions', 'broken', 'session-c', 'session.v4.jsonl.zstd'), Buffer.from([0, 1, 2, 3]))

    const index = indexFor(f)
    await index.build()
    assert.equal(index.status().state, 'ready')
    assert.ok(index.status().skipped >= 1, 'the malformed log is skipped, not fatal')

    const cjk = index.search('飞猪出行页', 20)
    assert.equal(cjk.state, 'ready')
    if (cjk.state !== 'ready') return
    assert.deepEqual(cjk.items.map((hit) => hit.sessionId), ['session-a'])
    assert.match(cjk.items[0].snippet, /飞猪出行页/)

    const substring = index.search('模型', 20)
    assert.equal(substring.state, 'ready')
    if (substring.state !== 'ready') return
    assert.deepEqual(substring.items.map((hit) => hit.sessionId), ['session-b'], 'a CJK substring inside a longer run matches')
    assert.equal(substring.items[0].snippet, '这个模型很好')

    const latin = index.search('model', 20)
    assert.equal(latin.state, 'ready')
    if (latin.state !== 'ready') return
    assert.deepEqual(latin.items.map((hit) => hit.sessionId), ['session-a'])

    index.close()
  } finally {
    f.cleanup()
  }
})

test('a rebuild only re-reads changed sessions and drops removed ones', async () => {
  const f = fixture()
  try {
    const first = f.write('ws', 'session-a', [HEADER('session-a'), USER('alpha 第一版', 1)])
    f.write('ws', 'session-b', [HEADER('session-b'), USER('beta 第二版', 1)])
    const index = indexFor(f)
    await index.build()
    const initial = index.search('第一版', 20)
    assert.equal(initial.state, 'ready')
    if (initial.state !== 'ready') return
    assert.deepEqual(initial.items.map((hit) => hit.sessionId), ['session-a'])

    // Append a new message with an empty extra line so mtime/size both move.
    writeFileSync(first, [HEADER('session-a'), USER('alpha 第一版', 1), USER('gamma 新增内容', 2)].map((record) => JSON.stringify(record)).join('\n') + '\n')
    rmSync(join(f.root, 'sessions', 'ws', 'session-b'), { recursive: true, force: true })
    await index.build()

    const added = index.search('新增内容', 20)
    assert.equal(added.state, 'ready')
    if (added.state !== 'ready') return
    assert.deepEqual(added.items.map((hit) => hit.sessionId), ['session-a'], 'appended messages become searchable')

    const removed = index.search('第二版', 20)
    assert.equal(removed.state, 'ready')
    if (removed.state !== 'ready') return
    assert.deepEqual(removed.items, [], 'deleted sessions disappear from the index')

    const old = index.search('第一版', 20)
    assert.equal(old.state, 'ready')
    if (old.state !== 'ready') return
    assert.deepEqual(old.items.map((hit) => hit.sessionId), ['session-a'], 'unchanged session content stays indexed')
    index.close()
  } finally {
    f.cleanup()
  }
})

test('the first query reports building, then polls until the index is ready', async () => {
  const f = fixture()
  try {
    f.write('ws', 'session-a', [HEADER('session-a'), USER('ready 内容', 1)])
    const index = indexFor(f)
    const first = index.search('内容', 20)
    assert.equal(first.state, 'building', 'an idle index kicks a background build')
    await index.build()
    const second = index.search('内容', 20)
    assert.equal(second.state, 'ready')
    if (second.state !== 'ready') return
    assert.deepEqual(second.items.map((hit) => hit.sessionId), ['session-a'])
    index.close()
  } finally {
    f.cleanup()
  }
})
