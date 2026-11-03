/**
 * Host-side git branch lookup (src/git-branch.ts).
 *
 * The client half cannot run git, so the host answers one read-only question per
 * project directory. These tests pin the three promises that make that safe:
 * parsing never invents a branch, the resolver never fails a request over one
 * unreadable path, and the real git path reports the actual checkout.
 */
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { createBranchResolver, parseBranchName, readGitBranch } from '../src/git-branch.ts'

/* ------------------------------ parseBranchName ------------------------------ */

test('parseBranchName keeps the first non-empty line', () => {
  assert.equal(parseBranchName('feat/junyu/git_branch/261103\n'), 'feat/junyu/git_branch/261103')
  assert.equal(parseBranchName('\n  main  \r\n'), 'main', 'blank leading lines and padding are ignored')
  assert.equal(parseBranchName('release/1.2\nwarning: something\n'), 'release/1.2', 'only the first line is a branch name')
})

test('parseBranchName reports "no branch" for empty and detached output', () => {
  assert.equal(parseBranchName(''), '')
  assert.equal(parseBranchName('  \n\t\n'), '', 'whitespace-only output has no first line')
  assert.equal(parseBranchName('HEAD\n'), '', 'a detached checkout is not a branch called HEAD')
})

/* ------------------------------- fake resolver ------------------------------- */

interface ResolverFixture {
  resolver: ReturnType<typeof createBranchResolver>
  calls: Map<string, number>
}

/**
 * A resolver whose "filesystem" is `branches`: every key is an existing
 * directory, a non-empty value is its branch and '' means "not a repository".
 * Paths absent from the map are not directories. `fail` makes named probes
 * throw, and `calls` counts how often each path really reached the git probe.
 */
function fixtureResolver(options: {
  branches?: Record<string, string>
  fail?: string[]
  ttlMs?: number
  maxEntries?: number
  concurrency?: number
} = {}): ResolverFixture {
  const directories = new Set(Object.keys(options.branches ?? {}))
  const failures = new Set(options.fail ?? [])
  const calls = new Map<string, number>()
  const resolver = createBranchResolver({
    ttlMs: options.ttlMs,
    maxEntries: options.maxEntries,
    concurrency: options.concurrency,
    isDirectory: (directory) => directories.has(directory),
    readBranch: async (directory) => {
      calls.set(directory, (calls.get(directory) ?? 0) + 1)
      if (failures.has(directory)) throw new Error('probe failed: ' + directory)
      return options.branches?.[directory] ?? ''
    },
  })
  return { resolver, calls }
}

test('resolve only probes absolute directory strings', async () => {
  const { resolver, calls } = fixtureResolver({ branches: { '/work/a': 'main' } })
  assert.deepEqual(await resolver.resolve(undefined), {})
  assert.deepEqual(await resolver.resolve({ paths: ['/work/a'] }), {}, 'unwrapping the request envelope is the route\'s job')
  assert.deepEqual(await resolver.resolve('nope'), {})
  const branches = await resolver.resolve([1, null, {}, '', 'relative/dir', '/x'.repeat(4096) + '/y', '/work/a'])
  assert.deepEqual(branches, { '/work/a': 'main' }, 'only the one plausible absolute path is probed')
  assert.deepEqual([...calls.keys()], ['/work/a'])
})

test('resolve probes a duplicated path once', async () => {
  const { resolver, calls } = fixtureResolver({ branches: { '/work/a': 'main' } })
  assert.deepEqual(await resolver.resolve(['/work/a', '/work/a', '/work/a']), { '/work/a': 'main' })
  assert.equal(calls.get('/work/a'), 1)
})

test('a branch is cached within the TTL and re-probed after it expires', async () => {
  const cached = fixtureResolver({ branches: { '/work/a': 'main' } })
  await cached.resolver.resolve(['/work/a'])
  await cached.resolver.resolve(['/work/a'])
  assert.equal(cached.calls.get('/work/a'), 1, 'the second request within the TTL is served from the cache')

  // ttlMs: 0 makes every entry stale immediately, which pins the expiry rule
  // without making the test wait on the clock.
  const expired = fixtureResolver({ branches: { '/work/a': 'main' }, ttlMs: 0 })
  await expired.resolver.resolve(['/work/a'])
  await expired.resolver.resolve(['/work/a'])
  assert.equal(expired.calls.get('/work/a'), 2)
})

test('the cache is bounded: the oldest entry is evicted at maxEntries', async () => {
  const { resolver, calls } = fixtureResolver({
    branches: { '/work/a': 'main', '/work/b': 'main', '/work/c': 'main' },
    maxEntries: 2,
  })
  // Sequential resolves make the insertion order deterministic.
  await resolver.resolve(['/work/a'])
  await resolver.resolve(['/work/b'])
  await resolver.resolve(['/work/c'])
  assert.equal(calls.get('/work/a'), 1)
  await resolver.resolve(['/work/a'])
  assert.equal(calls.get('/work/a'), 2, 'the oldest entry was evicted and is probed again')
})

test('resolve omits paths that have no branch', async () => {
  const { resolver, calls } = fixtureResolver({ branches: { '/work/repo': 'feat/x', '/plain/dir': '' } })
  const branches = await resolver.resolve(['/work/repo', '/plain/dir', '/missing/dir'])
  assert.deepEqual(branches, { '/work/repo': 'feat/x' })
  assert.equal(calls.has('/missing/dir'), false, 'a path that is not a directory never reaches git')
})

test('a failing probe omits only its own path', async () => {
  const { resolver } = fixtureResolver({ branches: { '/work/ok': 'main', '/work/boom': 'main' }, fail: ['/work/boom'] })
  assert.deepEqual(await resolver.resolve(['/work/ok', '/work/boom']), { '/work/ok': 'main' })
})

test('resolve caps one request at 200 paths', async () => {
  const calls: string[] = []
  const resolver = createBranchResolver({
    isDirectory: () => true,
    readBranch: async (directory) => { calls.push(directory); return 'main' },
  })
  const paths = Array.from({ length: 250 }, (_, index) => '/work/' + index)
  const branches = await resolver.resolve(paths)
  assert.equal(Object.keys(branches).length, 200)
  assert.equal(calls.length, 200, 'git is never spawned for the excess paths')
  assert.equal(branches['/work/199'], 'main')
  assert.equal(branches['/work/200'], undefined)
})

test('resolve runs probes concurrently but never past its worker pool', async () => {
  let inFlight = 0
  let peak = 0
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => { release = resolve })
  const resolver = createBranchResolver({
    concurrency: 4,
    isDirectory: () => true,
    readBranch: async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await gate
      inFlight -= 1
      return 'main'
    },
  })
  const paths = Array.from({ length: 10 }, (_, index) => '/work/' + index)
  const pending = resolver.resolve(paths)
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.equal(peak, 4, 'exactly the pool size runs at once, so probes do overlap')
  release()
  const branches = await pending
  assert.deepEqual(branches, Object.fromEntries(paths.map((path) => [path, 'main'])))
  assert.equal(peak, 4, 'the pool never grows past its size')
})

/* --------------------------------- real git --------------------------------- */

/** Run git and reject on failure; doubles as the "is git installed?" probe. */
function git(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('git', args, (error) => (error ? reject(error) : resolve()))
  })
}

test('readGitBranch treats a missing directory as "no branch"', async () => {
  assert.equal(await readGitBranch(join(tmpdir(), 'wsp-no-such-dir-' + process.pid)), '')
})

test('readGitBranch and the resolver read a real checkout', async (t) => {
  try {
    await git(['--version'])
  } catch {
    t.skip('git is not installed in this environment')
    return
  }
  const root = await mkdtemp(join(tmpdir(), 'wsp-git-branch-'))
  try {
    const repo = join(root, 'repo')
    const plain = join(root, 'plain')
    await mkdir(repo)
    await mkdir(plain)
    await git(['init', '-q', repo])
    await git(['-C', repo, 'checkout', '-b', 'feat/junyu/git_branch/261103'])
    assert.equal(await readGitBranch(repo), 'feat/junyu/git_branch/261103')
    assert.equal(await readGitBranch(plain), '', 'a directory outside any repository has no branch')

    const resolver = createBranchResolver()
    assert.deepEqual(
      await resolver.resolve([repo, plain, 'relative/dir', repo]),
      { [repo]: 'feat/junyu/git_branch/261103' },
      'the real resolver reads the checkout and drops the non-repository/relative/duplicate paths',
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
