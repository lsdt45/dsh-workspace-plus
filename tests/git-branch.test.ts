/** client/git-branch.ts — the per-directory branch cache the hover bubbles read from. */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { GitBranchRouteUnavailable } from '../src/client/host.ts'
import { createBranchCache, normalizeGitBranch } from '../src/client/git-branch.ts'

/** Let the queued microtask batch (and its fetch answer) run to completion. */
const settle = async (): Promise<void> => { await new Promise<void>((resolve) => { setTimeout(resolve, 0) }) }

/** A fetch stub that records every batch it is asked for. */
function recorder(result: Record<string, string> = {}) {
  const calls: string[][] = []
  const fetchBranches = async (paths: string[]): Promise<Record<string, string>> => {
    calls.push(paths.slice())
    return result
  }
  return { calls, fetchBranches }
}

test('normalizeGitBranch trims and drops blanks and the detached placeholder', () => {
  assert.equal(normalizeGitBranch('  feat/git-branch  '), 'feat/git-branch')
  assert.equal(normalizeGitBranch('main'), 'main')
  assert.equal(normalizeGitBranch(''), '')
  assert.equal(normalizeGitBranch('   '), '')
  // `git rev-parse --abbrev-ref HEAD` answers HEAD on a detached work tree.
  assert.equal(normalizeGitBranch('HEAD'), '')
  assert.equal(normalizeGitBranch(null), '')
  assert.equal(normalizeGitBranch(undefined), '')
})

test('branchOf answers "" before anything was fetched', () => {
  const { fetchBranches } = recorder()
  const cache = createBranchCache({ fetchBranches })
  assert.equal(cache.branchOf('/a'), '')
  assert.equal(cache.branchOf(''), '')
  assert.equal(cache.branchOf(null), '')
  assert.equal(cache.branchOf(undefined), '')
})

test('ensure merges every call of one microtask into a single batch', async () => {
  const { calls, fetchBranches } = recorder({ '/a': 'main', '/b': 'dev' })
  const cache = createBranchCache({ fetchBranches })
  cache.ensure(['/a'])
  cache.ensure(['/b', '/a'])
  await settle()
  assert.deepEqual(calls, [['/a', '/b']], 'one request carries both directories')
  assert.equal(cache.branchOf('/a'), 'main')
  assert.equal(cache.branchOf('/b'), 'dev')
})

test('ensure filters blanks, relative paths and duplicates', async () => {
  const { calls, fetchBranches } = recorder()
  const cache = createBranchCache({ fetchBranches })
  cache.ensure(['', '   ', 'relative/path', 'a/b', null, undefined, '/abs', '  /abs  '])
  await settle()
  assert.deepEqual(calls, [['/abs']])
})

test('ensure accepts a Windows drive path as absolute', async () => {
  const { calls, fetchBranches } = recorder()
  const cache = createBranchCache({ fetchBranches })
  cache.ensure(['C:/proj'])
  await settle()
  assert.deepEqual(calls, [['C:/proj']])
})

test('a fresh answer is not requested again until the TTL lapses', async () => {
  let clock = 1000
  const { calls, fetchBranches } = recorder({ '/a': 'main' })
  const cache = createBranchCache({ fetchBranches, now: () => clock, ttlMs: 100 })
  cache.ensure(['/a'])
  await settle()
  clock += 99
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 1, 'inside the TTL the cached branch is reused')
  clock += 2
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 2, 'past the TTL the next hover refreshes it')
})

test('a directory the host says nothing about stays quiet inside the TTL', async () => {
  let clock = 0
  const { calls, fetchBranches } = recorder({ '/a': 'main' })
  const cache = createBranchCache({ fetchBranches, now: () => clock, ttlMs: 100 })
  cache.ensure(['/a', '/outside-a-work-tree'])
  await settle()
  assert.equal(cache.branchOf('/outside-a-work-tree'), '', 'no entry means no branch')
  clock += 10
  cache.ensure(['/outside-a-work-tree'])
  await settle()
  assert.equal(calls.length, 1, 'the empty answer is remembered, not re-asked')
})

test('the cache stores HEAD and blank answers as "no branch"', async () => {
  const { fetchBranches } = recorder({ '/a': 'HEAD', '/b': '  dev  ', '/c': '' })
  const cache = createBranchCache({ fetchBranches })
  cache.ensure(['/a', '/b', '/c'])
  await settle()
  assert.equal(cache.branchOf('/a'), '')
  assert.equal(cache.branchOf('/b'), 'dev')
  assert.equal(cache.branchOf('/c'), '')
})

test('subscribers are woken when an answer lands, and unsubscribe stops them', async () => {
  const { fetchBranches } = recorder({ '/a': 'main' })
  const cache = createBranchCache({ fetchBranches })
  let wakes = 0
  const unsubscribe = cache.subscribe(() => { wakes += 1 })
  cache.ensure(['/a'])
  await settle()
  assert.equal(wakes, 1)
  unsubscribe()
  cache.ensure(['/b'])
  await settle()
  assert.equal(wakes, 1)
})

test('a path already in flight is never requested twice', async () => {
  const calls: string[][] = []
  let resolveFetch: (value: Record<string, string>) => void = () => {}
  const cache = createBranchCache({
    fetchBranches: (paths: string[]) => {
      calls.push(paths)
      return new Promise((resolve) => { resolveFetch = resolve })
    },
  })
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 1)
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 1, 'the second hover reuses the pending request')
  resolveFetch({ '/a': 'main' })
  await settle()
  assert.equal(cache.branchOf('/a'), 'main')
})

test('a failed request never throws and buys a cooldown', async () => {
  let clock = 0
  const calls: string[][] = []
  const cache = createBranchCache({
    fetchBranches: async (paths: string[]) => { calls.push(paths.slice()); throw new Error('boom') },
    now: () => clock,
    failCooldownMs: 50,
  })
  assert.doesNotThrow(() => { cache.ensure(['/a']) })
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(cache.branchOf('/a'), '')
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 1, 'inside the cooldown no new request is made')
  clock = 50
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 2, 'after the cooldown the cache may try again')
})

test('a failure keeps branches that already landed', async () => {
  let fail = false
  const cache = createBranchCache({
    fetchBranches: async (paths: string[]) => {
      if (fail) throw new Error('boom')
      return { '/a': 'main' }
    },
  })
  cache.ensure(['/a'])
  await settle()
  fail = true
  cache.ensure(['/b'])
  await settle()
  assert.equal(cache.branchOf('/a'), 'main')
  assert.equal(cache.branchOf('/b'), '')
})

test('a missing host route disables the cache permanently', async () => {
  let clock = 0
  const calls: string[][] = []
  const cache = createBranchCache({
    fetchBranches: async (paths: string[]) => { calls.push(paths.slice()); throw new GitBranchRouteUnavailable('HTTP 404') },
    now: () => clock,
    failCooldownMs: 1,
  })
  cache.ensure(['/a'])
  await settle()
  assert.equal(calls.length, 1)
  clock += 1_000_000
  cache.ensure(['/a'])
  cache.ensure(['/b'])
  await settle()
  assert.equal(calls.length, 1, 'a route that is not mounted is never asked again')
})
