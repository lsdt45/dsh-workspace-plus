#!/usr/bin/env node
/**
 * Build the plugin's runtime artifacts into dist/.
 *
 *   src/client/index.ts (+ its siblings under src/client/)  -> dist/client.js
 *                                                           -> dist/client.js.map
 *   src/index.ts (the host half)                            -> dist/index.js
 *
 * Both halves are TypeScript sources. dist/ is COMMITTED because git/tarball
 * installs must stay build-free: the host loads package.json main
 * (dist/index.js) and the browser loads exports["./client"] (dist/client.js)
 * without running a build. Never edit dist by hand — edit src/ and run
 * `npm run build`; `npm run check` fails when a committed artifact is stale.
 *
 * Why a bundle for the browser half: the DSH client module table accepts exactly
 * one client bundle per package (flat module graph — see
 * @deepseek-ai/dsh-client-modules), so server-side file serving is not an option
 * and the split sources have to be concatenated at build time.
 *
 * Modes:
 *   (default)   build and publish the artifacts atomically
 *   --watch     same, on every change (pairs with the host's bundle poll)
 *   --check     rebuild in memory and fail when a committed artifact is stale
 *
 * Publishing is atomic (write temp + rename) because the host's HMR watch
 * stat-polls the artifact every 500ms and must never read a half-written file.
 */
import { build } from 'esbuild'
import type { BuildOptions, OutputFile } from 'esbuild'
import { mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CLIENT_DIR = join(ROOT, 'src/client')
const CLIENT_ENTRY = join(CLIENT_DIR, 'index.ts')
const HOST_ENTRY = join(ROOT, 'src/index.ts')
const DIST = join(ROOT, 'dist')
const CLIENT_BUNDLE = join(DIST, 'client.js')
const CLIENT_MAP = CLIENT_BUNDLE + '.map'
const HOST_BUNDLE = join(DIST, 'index.js')

const CLIENT_BANNER = [
  '/* GENERATED FILE — do not edit.',
  ' * Source: src/client/**  ·  Rebuild: npm run build  ·  Verify: npm run check',
  ' * The DSH client module table takes exactly one bundle per package',
  ' * (exports["./client"]), so the split sources are bundled here. */',
].join('\n')

const HOST_BANNER = [
  '/* GENERATED FILE — do not edit.',
  ' * Source: src/index.ts (host half)  ·  Rebuild: npm run build  ·  Verify: npm run check',
  ' * dist/ ships committed so git/tarball installs stay build-free. */',
].join('\n')

const mode = process.argv.includes('--watch') ? 'watch'
  : process.argv.includes('--check') ? 'check'
    : 'build'

/** Shared esbuild options; `write:false` keeps the output in memory for the publisher. */
const clientOptions: BuildOptions = {
  absWorkingDir: ROOT,
  entryPoints: [CLIENT_ENTRY],
  outfile: CLIENT_BUNDLE,
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110'],
  sourcemap: 'external',
  legalComments: 'none',
  banner: { js: CLIENT_BANNER },
  logLevel: mode === 'build' ? 'info' : 'warning',
}

/** The host half is plain ESM for Node: node: builtins stay external imports. */
const hostOptions: BuildOptions = {
  absWorkingDir: ROOT,
  entryPoints: [HOST_ENTRY],
  outfile: HOST_BUNDLE,
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  target: ['node18'],
  legalComments: 'none',
  banner: { js: HOST_BANNER },
  logLevel: mode === 'build' ? 'info' : 'warning',
}

const rel = (path: string): string => relative(ROOT, path)

/** One output file named by esbuild after `outfile`. */
function outputFor(files: OutputFile[], path: string): OutputFile | undefined {
  return files.find((file) => file.path === path)
}

function writeAtomic(path: string, text: string): void {
  const temp = path + '.tmp-' + process.pid
  writeFileSync(temp, text)
  renameSync(temp, path)
}

interface Artifacts {
  clientJs?: OutputFile
  clientMap?: OutputFile
  hostJs?: OutputFile
}

/** Map first: the polled bundle must never advertise a map that is not there yet. */
function publish({ clientJs, clientMap, hostJs }: Artifacts): void {
  mkdirSync(DIST, { recursive: true })
  if (clientMap) writeAtomic(CLIENT_MAP, clientMap.text)
  if (clientJs) {
    writeAtomic(CLIENT_BUNDLE, clientJs.text)
    const lines = clientJs.text.split('\n').length
    console.log('[build] published ' + rel(CLIENT_BUNDLE) + ' (' + lines + ' lines, ' + clientJs.text.length + ' bytes)')
  }
  if (hostJs) {
    writeAtomic(HOST_BUNDLE, hostJs.text)
    console.log('[build] published ' + rel(HOST_BUNDLE) + ' (' + hostJs.text.length + ' bytes)')
  }
}

/** Fail when any committed artifact differs from a fresh in-memory build. */
function check(artifacts: Artifacts): void {
  const committed: Array<[string, OutputFile | undefined]> = [
    [CLIENT_BUNDLE, artifacts.clientJs],
    [CLIENT_MAP, artifacts.clientMap],
    [HOST_BUNDLE, artifacts.hostJs],
  ]
  const stale: string[] = []
  for (const [path, generated] of committed) {
    if (generated === undefined) continue
    let text: string
    try {
      text = readFileSync(path, 'utf8')
    } catch {
      stale.push(rel(path) + ' is missing (run npm run build)')
      continue
    }
    if (text !== generated.text) {
      stale.push(rel(path) + ' is stale: committed ' + text.length + ' bytes, rebuilt ' + generated.text.length + ' bytes')
    }
  }
  if (stale.length > 0) {
    console.error('[build] FAIL — the committed dist/ does not match the TypeScript sources:')
    for (const line of stale) console.error('  - ' + line)
    process.exit(1)
  }
  console.log('[build] ok — dist/ matches src/**.')
}

/** The browser sources whose mtimes drive watch mode. */
function sourceFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(path))
    else if (entry.name.endsWith('.ts')) files.push(path)
  }
  return files
}

/** Newest source mtime (client tree + host entry); -1 when the source tree is empty. */
function sourceStamp(): number {
  const files = sourceFiles(CLIENT_DIR).concat(HOST_ENTRY)
  return files.reduce((latest, file) => Math.max(latest, statSync(file).mtimeMs), -1)
}

/** One full build of both halves; throws on a compile error so callers keep the last artifact. */
async function buildOnce(): Promise<Artifacts> {
  const [client, host] = await Promise.all([build(clientOptions), build(hostOptions)])
  if (client.errors.length > 0 || host.errors.length > 0) throw new Error('build failed')
  const artifacts: Artifacts = {
    clientJs: outputFor(client.outputFiles || [], CLIENT_BUNDLE),
    clientMap: outputFor(client.outputFiles || [], CLIENT_MAP),
    hostJs: outputFor(host.outputFiles || [], HOST_BUNDLE),
  }
  if (!artifacts.clientJs) throw new Error('esbuild produced no client bundle')
  if (!artifacts.hostJs) throw new Error('esbuild produced no host bundle')
  return artifacts
}

if (mode === 'check') {
  check(await buildOnce())
} else if (mode === 'watch') {
  // Poll source mtimes rather than esbuild's watch API: the artifacts must be
  // republished atomically on every change (the host stat-polls the bundle), and
  // polling a handful of files is both simpler to reason about and editor-agnostic.
  let stamp = -1
  let running = false
  const tick = async (): Promise<void> => {
    const current = sourceStamp()
    if (running || current === stamp) return
    stamp = current
    running = true
    try {
      publish(await buildOnce())
    } catch (error) {
      // A broken edit keeps the previous artifacts: the host must never serve half a build.
      console.error('[build] rebuild failed — keeping the previous artifacts:', (error as Error).message)
    } finally {
      running = false
    }
  }
  await tick()
  console.log('[build] watching src/client/** and src/index.ts (Ctrl-C to stop)')
  setInterval(() => { void tick() }, 700)
} else {
  publish(await buildOnce())
}
