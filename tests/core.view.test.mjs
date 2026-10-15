/** core/view.js — persisted-preference migration, visibility and ordering rules. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { viewStateOf, sessionVisible, orderRows, pendingKindOf, sessionTitleOf, hasActiveScheduleOf, subagentRunningCounts } from '../src/client/core/view.js'

const t = (key) => key

test('viewStateOf fills defaults when nothing is persisted', () => {
  assert.deepEqual(viewStateOf({}), { mode: 'projects', dir: 'latest', sortOrder: 'manual', archivedFilter: 'hide' })
  assert.deepEqual(viewStateOf(undefined), { mode: 'projects', dir: 'latest', sortOrder: 'manual', archivedFilter: 'hide' })
})

test('viewStateOf migrates the legacy sortMode into the time view', () => {
  assert.deepEqual(viewStateOf({ sortMode: 'latest' }), { mode: 'time', dir: 'latest', sortOrder: 'manual', archivedFilter: 'hide' })
  assert.deepEqual(viewStateOf({ sortMode: 'oldest' }), { mode: 'time', dir: 'oldest', sortOrder: 'manual', archivedFilter: 'hide' })
})

test('viewStateOf rejects unknown values instead of trusting them', () => {
  assert.deepEqual(
    viewStateOf({ viewMode: 'nope', timeDirection: 'sideways', sortOrder: 'nope', archivedFilter: 'nope' }),
    { mode: 'projects', dir: 'latest', sortOrder: 'manual', archivedFilter: 'hide' },
  )
  assert.deepEqual(
    viewStateOf({ viewMode: 'flat', timeDirection: 'oldest', sortOrder: 'latest', archivedFilter: 'only' }),
    { mode: 'flat', dir: 'oldest', sortOrder: 'latest', archivedFilter: 'only' },
  )
})

test('sessionVisible hides subagents and other blanks, and follows the archive filter', () => {
  const archived = new Set(['arch'])
  const blank = { id: 'blank', blank: true }
  assert.equal(sessionVisible(undefined, 'x', archived), false)
  assert.equal(sessionVisible({ id: 'sub', origin: 'subagent' }, 'x', archived), false)
  assert.equal(sessionVisible(blank, 'other', archived), false)
  assert.equal(sessionVisible(blank, 'blank', archived), true)
  assert.equal(sessionVisible({ id: 'arch' }, 'x', archived), false)
  assert.equal(sessionVisible({ id: 'arch' }, 'x', archived, 'show'), true)
  assert.equal(sessionVisible({ id: 'arch' }, 'x', archived, 'only'), true)
  assert.equal(sessionVisible({ id: 'live' }, 'x', archived, 'only'), false)
})

test('orderRows only reorders in the recency mode', () => {
  const rows = [{ id: 'a', updatedAt: 1 }, { id: 'b', updatedAt: 3 }, { id: 'c', updatedAt: 2 }]
  assert.deepEqual(orderRows(rows, 'manual').map((row) => row.id), ['a', 'b', 'c'])
  assert.deepEqual(orderRows(rows, 'latest').map((row) => row.id), ['b', 'c', 'a'])
  assert.deepEqual(rows.map((row) => row.id), ['a', 'b', 'c'], 'orderRows must not mutate its input')
})

test('pendingKindOf accepts both a Map and a plain object', () => {
  assert.equal(pendingKindOf(new Map([['a', { kind: 'approval' }]]), 'a'), 'approval')
  assert.equal(pendingKindOf({ a: { status: 'planReview' } }, 'a'), 'planReview')
  assert.equal(pendingKindOf({ a: { type: 'question' } }, 'a'), 'question')
  assert.equal(pendingKindOf({ a: {} }, 'a'), 'pending')
  assert.equal(pendingKindOf(null, 'a'), undefined)
  assert.equal(pendingKindOf(new Map(), 'a'), undefined)
})

test('sessionTitleOf prefers displayTitle and localizes the blank row', () => {
  assert.equal(sessionTitleOf({ blank: true }, t), 'session.new')
  assert.equal(sessionTitleOf({ title: 'plain' }, t), 'plain')
  assert.equal(sessionTitleOf({ title: 'plain', displayTitle: '顯示' }, t), '顯示')
  assert.equal(sessionTitleOf(undefined, t), '')
})

test('hasActiveScheduleOf only trusts a non-empty schedule projection', () => {
  assert.equal(hasActiveScheduleOf({ projectionValues: { schedule: [{}] } }), true)
  assert.equal(hasActiveScheduleOf({ projectionValues: { schedule: [] } }), false)
  assert.equal(hasActiveScheduleOf({ projectionValues: {} }), false)
  assert.equal(hasActiveScheduleOf(undefined), false)
})

test('subagentRunningCounts walks the parent lineage', () => {
  const byId = {
    root: { id: 'root' },
    a: { id: 'a', parentId: 'root', running: true },
    b: { id: 'b', parentSessionId: 'root', running: false },
    c: { id: 'c', parentId: 'a', running: true },
  }
  const counts = subagentRunningCounts(byId)
  assert.equal(counts.get('root'), 2, 'only running descendants count')
  assert.equal(counts.get('a'), 1)
  assert.equal(counts.get('b'), 0)
})
