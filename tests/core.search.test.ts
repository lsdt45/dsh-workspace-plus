/**
 * core/search.ts — pure projections behind the search overlay: candidate rows,
 * local title/workspace matches, recent rows, and the merge with the Host's
 * full-text content page.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { localSearch, mergeSearchResults, normalizeQuery, recentSearchRows, searchCandidates } from '../src/client/core/search.ts'

const list = {
  ids: ['a', 'b', 'c', 'd'],
  byId: {
    a: { id: 'a', title: 'Git commit and push', updatedAt: 300 },
    b: { id: 'b', displayTitle: 'Plan review', updatedAt: 500 },
    c: { id: 'c', blank: true, title: 'New session', updatedAt: 100 },
    d: { id: 'd', title: 'Ordinary chat', updatedAt: 400 },
  },
}
const labelOf = (id: string): string => ({ a: 'promo-dev', b: 'h5-member-grade', c: 'promo-dev', d: '' } as Record<string, string>)[id] || ''

test('searchCandidates skips blank rows and keeps the list order with workspace labels', () => {
  const rows = searchCandidates(list, labelOf)
  assert.deepEqual(rows.map((row) => row.id), ['a', 'b', 'd'])
  assert.deepEqual(rows[0], { id: 'a', title: 'Git commit and push', workspace: 'promo-dev', updatedAt: 300 })
  assert.equal(rows[1].title, 'Plan review', 'displayTitle wins over title')
})

test('searchCandidates tolerates a missing list or byId lookup', () => {
  assert.deepEqual(searchCandidates(null, labelOf), [])
  assert.deepEqual(searchCandidates({ ids: ['missing'] } as any, labelOf), [])
})

test('normalizeQuery trims and stringifies', () => {
  assert.equal(normalizeQuery('  git  '), 'git')
  assert.equal(normalizeQuery(null), '')
  assert.equal(normalizeQuery(undefined), '')
})

test('localSearch matches the title case-insensitively, newest first', () => {
  const rows = searchCandidates(list, labelOf)
  assert.deepEqual(localSearch(rows, 'GIT').map((row) => row.id), ['a'])
  assert.deepEqual(localSearch(rows, 'plan').map((row) => row.id), ['b'])
  assert.deepEqual(localSearch(rows, 'chat').map((row) => row.id), ['d'])
})

test('localSearch matches the workspace label and rejects an empty query', () => {
  const rows = searchCandidates(list, labelOf)
  assert.deepEqual(localSearch(rows, 'h5-member').map((row) => row.id), ['b'])
  assert.deepEqual(localSearch(rows, 'promo').map((row) => row.id), ['a'])
  assert.deepEqual(localSearch(rows, ''), [])
  assert.deepEqual(localSearch(rows, '   '), [])
})

test('localSearch keeps one row per session when both title and workspace match', () => {
  const rows = [{ id: 'x', title: 'promo-dev notes', workspace: 'promo-dev', updatedAt: 1 }]
  assert.deepEqual(localSearch(rows, 'promo').map((row) => row.id), ['x'])
})

test('recentSearchRows sorts newest first and caps the count', () => {
  const rows = searchCandidates(list, labelOf)
  assert.deepEqual(recentSearchRows(rows, 2).map((row) => row.id), ['b', 'd'])
  assert.deepEqual(recentSearchRows(rows, 0), [])
})

test('mergeSearchResults leads with local matches and appends content-only hits in backend order', () => {
  const rows = searchCandidates(list, labelOf)
  const byId = (id: string) => rows.find((row) => row.id === id)
  const local = localSearch(rows, 'git')
  const merged = mergeSearchResults(local, [
    { sessionId: 'd', snippet: '…ordinary chat…' },
    { sessionId: 'b', snippet: '…plan review…' },
  ], byId, 20)
  assert.deepEqual(merged.items.map((row) => row.id), ['a', 'd', 'b'])
  assert.equal(merged.items[0].snippet, undefined, 'title-only matches carry no snippet')
  assert.equal(merged.items[1].snippet, '…ordinary chat…')
  assert.equal(merged.hasMore, false)
})

test('mergeSearchResults attaches the snippet to a session already matched locally', () => {
  const rows = searchCandidates(list, labelOf)
  const byId = (id: string) => rows.find((row) => row.id === id)
  const merged = mergeSearchResults(localSearch(rows, 'git'), [
    { sessionId: 'a', snippet: 'git commit and push workflow' },
    { sessionId: 'a', snippet: 'duplicate hit' },
  ], byId, 20)
  assert.deepEqual(merged.items.map((row) => row.id), ['a'])
  assert.equal(merged.items[0].snippet, 'git commit and push workflow')
})

test('mergeSearchResults skips content hits for sessions outside the candidates', () => {
  const rows = searchCandidates(list, labelOf)
  const byId = (id: string) => rows.find((row) => row.id === id)
  const merged = mergeSearchResults([], [{ sessionId: 'vanished', snippet: 'x' }], byId, 20)
  assert.deepEqual(merged.items, [])
})

test('mergeSearchResults reports hasMore when the merged list exceeds the limit', () => {
  const rows = searchCandidates(list, labelOf)
  const byId = (id: string) => rows.find((row) => row.id === id)
  const merged = mergeSearchResults(localSearch(rows, 'plan'), [
    { sessionId: 'd', snippet: 'x' },
  ], byId, 1)
  assert.deepEqual(merged.items.map((row) => row.id), ['b'])
  assert.equal(merged.hasMore, true)
})

test('mergeSearchResults ignores malformed content items', () => {
  const rows = searchCandidates(list, labelOf)
  const byId = (id: string) => rows.find((row) => row.id === id)
  const merged = mergeSearchResults([], [{ sessionId: '' } as any, null as any], byId, 20)
  assert.deepEqual(merged.items, [])
})
