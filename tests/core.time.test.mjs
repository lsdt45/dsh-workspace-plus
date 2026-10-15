/** core/time.js — local-calendar buckets and the relative-label fallback. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bucketOf, BUCKET_ORDER, timeLabel } from '../src/client/core/time.js'

const at = (year, month, day, hour = 12) => new Date(year, month, day, hour).getTime()
const now = at(2026, 0, 15)

test('bucketOf follows local-calendar day boundaries', () => {
  assert.equal(bucketOf(now, now), 'today')
  assert.equal(bucketOf(at(2026, 0, 14), now), 'yesterday')
  assert.equal(bucketOf(at(2026, 0, 10), now), 'week')
  assert.equal(bucketOf(at(2025, 11, 25), now), 'month')
  assert.equal(bucketOf(at(2025, 10, 1), now), 'earlier')
})

test('bucketOf degrades to "earlier" for unknown timestamps', () => {
  assert.equal(bucketOf(0, now), 'earlier')
  assert.equal(bucketOf(undefined, now), 'earlier')
  assert.equal(bucketOf(-5, now), 'earlier')
})

test('BUCKET_ORDER is the time-view render order', () => {
  assert.deepEqual(BUCKET_ORDER, ['today', 'yesterday', 'week', 'month', 'earlier'])
})

test('timeLabel uses the injected relativeTime and the translated unit', () => {
  const t = (key, params) => (key === 'time.now' ? '刚刚' : key + ':' + params.n)
  const relativeTime = (updatedAt, reference) => (reference === now && updatedAt === now ? { unit: 'now' } : { unit: 'minutes', n: 5 })
  assert.equal(timeLabel(now, now, t, relativeTime), '刚刚')
  assert.equal(timeLabel(1, now, t, relativeTime), 'time.minutes:5')
})

test('timeLabel falls back to a numeric suffix when the dictionary misses the key', () => {
  const t = (key) => key
  const relativeTime = () => ({ unit: 'hours', n: 3 })
  assert.equal(timeLabel(1, now, t, relativeTime), '3h')
})

test('timeLabel stays inert without a relativeTime implementation', () => {
  assert.equal(timeLabel(1, now, (key) => key, undefined), '')
})
