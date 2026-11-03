/**
 * Host-side git branch lookup — the read-only answer behind the client half's
 * project badges.
 *
 * The browser cannot run git, so this module owns the one question the client
 * asks per project directory: which branch is checked out there? The shape is
 * driven by the fact that the question arrives over the plugin's HTTP route:
 *
 *  - {@link readGitBranch} never throws and never touches a shell. "Not a
 *    repository" is the normal no-answer case, not an error, so it collapses to
 *    the same empty string as a broken git binary, a detached HEAD or a timeout.
 *  - {@link createBranchResolver} owns caching and input validation. Hover
 *    badges ask repeatedly for the same handful of directories while a checkout
 *    is a rare event, so a short TTL keeps git children rare without hiding a
 *    checkout for long.
 *  - Every path is independent: one unreadable directory is omitted from the
 *    map instead of failing the other 199.
 */
import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { isAbsolute } from 'node:path'

/** Exact route the client half probes and calls. */
export const GIT_BRANCH_ROUTE = '/dsh-workspace-plus/git-branch'

/** Hard ceiling on paths per request: the client only asks about its workspaces. */
const MAX_PATHS = 200
/** Longer strings are not plausible directory paths and are dropped unread. */
const MAX_PATH_LENGTH = 4096
/** git must answer inside this window, or the path counts as "no branch". */
const GIT_TIMEOUT_MS = 3_000
/** Concurrent git children per request: enough to hide latency, bounded on purpose. */
const DEFAULT_CONCURRENCY = 4
/**
 * How long one answer (including "not a repository") is reused. The client asks
 * on hover, so this keeps repeated hovers from spawning git while a checkout
 * still becomes visible within half a minute.
 */
const DEFAULT_TTL_MS = 20_000
/** Cache ceiling so a long-lived host with many workspaces stays bounded. */
const DEFAULT_MAX_ENTRIES = 256

/**
 * Reduce `git symbolic-ref --short HEAD` output to a branch name.
 *
 * Only the first non-empty line is a branch name — any extra output must never
 * be mistaken for one. A detached checkout has no branch name; git plumbing such
 * as `rev-parse --abbrev-ref` reports it as the literal `HEAD`, so that
 * placeholder must never come back as a branch called HEAD.
 */
export function parseBranchName(stdout: string): string {
  for (const line of stdout.split(/\r?\n/)) {
    const name = line.trim()
    if (name === '') continue
    return name === 'HEAD' ? '' : name
  }
  return ''
}

/**
 * The branch checked out in `directory`, or '' when it has none.
 *
 * Never rejects. A directory outside any repository, a detached HEAD, a broken
 * git installation, a timeout and an invalid argument are all the same answer to
 * the client: omit this path. `-q` turns the detached-HEAD failure into a silent
 * exit; GIT_OPTIONAL_LOCKS keeps a read from taking the index lock, and
 * GIT_TERMINAL_PROMPT guarantees git can never block waiting for credentials.
 * The `-C` flag carries the directory as one argv entry, so no shell quoting is
 * involved anywhere.
 */
export async function readGitBranch(directory: string): Promise<string> {
  return new Promise<string>((resolve) => {
    try {
      execFile(
        'git',
        ['-C', directory, 'symbolic-ref', '--short', '-q', 'HEAD'],
        {
          timeout: GIT_TIMEOUT_MS,
          windowsHide: true,
          // A branch name is tiny; cap the buffer so a misbehaving git cannot
          // grow it without keeping the route waiting.
          maxBuffer: 64 * 1024,
          env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
        },
        (error, stdout) => {
          resolve(error ? '' : parseBranchName(stdout))
        },
      )
    } catch {
      // execFile can throw synchronously for an invalid argument shape; that is
      // still just "no branch", never a rejected route.
      resolve('')
    }
  })
}

/** Knobs for {@link createBranchResolver}; every one is optional and injected in tests. */
export interface BranchResolverOptions {
  /** How long one answer is reused. 0 disables caching (every call probes). */
  ttlMs?: number
  /** Cache entry ceiling; the oldest insertion is evicted first. */
  maxEntries?: number
  /** Concurrent git children per request. */
  concurrency?: number
  /** Directory probe, defaulting to `stat().isDirectory()`. */
  isDirectory?: (directory: string) => boolean | Promise<boolean>
  /** Branch probe, defaulting to {@link readGitBranch}. */
  readBranch?: (directory: string) => Promise<string>
}

/** The reusable probe behind the route. */
export interface BranchResolver {
  /** Requested path -> branch name; every path without a branch is omitted. */
  resolve(paths: unknown): Promise<Record<string, string>>
}

/** The default directory probe: anything unreadable is simply not a directory. */
async function defaultIsDirectory(directory: string): Promise<boolean> {
  try {
    return (await stat(directory)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Keep only plausible directory paths, deduplicated, in request order.
 *
 * The input is untrusted (a web page POSTs it): a non-array, non-string entries,
 * relative paths, empty/oversized strings and duplicates are all noise that must
 * not reach git. Absolute paths are the only ones the host can be asked about,
 * and they are also used verbatim as response keys, so the client finds exactly
 * what it sent.
 */
function normalizePaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return []
  const seen = new Set<string>()
  const directories: string[] = []
  for (const candidate of paths) {
    if (directories.length >= MAX_PATHS) break
    if (typeof candidate !== 'string') continue
    if (candidate.length === 0 || candidate.length > MAX_PATH_LENGTH) continue
    if (!isAbsolute(candidate)) continue
    if (seen.has(candidate)) continue
    seen.add(candidate)
    directories.push(candidate)
  }
  return directories
}

/** One cached answer; `branch` is '' for "no branch" too, so negatives are cached. */
interface CacheEntry {
  branch: string
  expiresAt: number
}

/**
 * Build the resolver the route uses (and the unit tests exercise with fakes).
 *
 * Concurrent requests share one resolver, so the cache is the only state and it
 * is bounded both in size and in time: repeated hovers cost no git children,
 * while a checkout becomes visible within `ttlMs` at the latest.
 */
export function createBranchResolver(options: BranchResolverOptions = {}): BranchResolver {
  const ttlMs = Math.max(0, options.ttlMs ?? DEFAULT_TTL_MS)
  const maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY)
  const readBranch = options.readBranch ?? readGitBranch
  const isDirectory = options.isDirectory ?? defaultIsDirectory

  /** Insertion order doubles as the eviction queue (oldest first). */
  const cache = new Map<string, CacheEntry>()

  const cachedBranch = (directory: string): string | undefined => {
    const entry = cache.get(directory)
    if (entry === undefined) return undefined
    if (Date.now() >= entry.expiresAt) {
      cache.delete(directory)
      return undefined
    }
    return entry.branch
  }

  const remember = (directory: string, branch: string): void => {
    while (cache.size >= maxEntries) {
      const oldest = cache.keys().next()
      if (oldest.done === true) break
      cache.delete(oldest.value)
    }
    cache.set(directory, { branch, expiresAt: Date.now() + ttlMs })
  }

  /** Resolve one path, turning every failure into "no branch" for that path. */
  const probe = async (directory: string): Promise<string> => {
    const hit = cachedBranch(directory)
    if (hit !== undefined) return hit
    let branch = ''
    try {
      if (await isDirectory(directory)) branch = await readBranch(directory)
    } catch {
      // A probe that throws is exactly the "no answer" case; it must not fail
      // the other paths in the same request.
      branch = ''
    }
    remember(directory, branch)
    return branch
  }

  return {
    async resolve(paths: unknown): Promise<Record<string, string>> {
      const directories = normalizePaths(paths)
      const branches: Record<string, string> = {}
      // A fixed worker pool rather than Promise.all: 200 paths must not spawn
      // 200 git children at once on the Host.
      let next = 0
      const worker = async (): Promise<void> => {
        while (next < directories.length) {
          const directory = directories[next]
          next += 1
          const branch = await probe(directory)
          if (branch !== '') branches[directory] = branch
        }
      }
      const workers: Promise<void>[] = []
      for (let index = 0; index < Math.min(concurrency, directories.length); index += 1) {
        workers.push(worker())
      }
      await Promise.all(workers)
      return branches
    },
  }
}
