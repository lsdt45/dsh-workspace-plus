#!/usr/bin/env node
/**
 * Build the browser half into the single platform bundle.
 *
 *   src/client/index.js (+ its siblings under src/client/)  ->  src/client.js
 *                                                           ->  src/client.js.map
 *
 * Why a bundle at all: the DSH client module table accepts exactly one client
 * bundle per package (\`exports["./client"]\`, flat module graph — see
 * @deepseek-ai/dsh-client-modules), so server-side file serving is not an option
 * and the split sources have to be concatenated at build time.
 *
 * Modes:
 *   (default)   build and publish the artifact atomically
 *   --watch     same, on every change (pairs with the host's bundle poll)
 *   --check     rebuild in memory and fail when the committed artifact is stale
 *
 * Publishing is atomic (write temp + rename) because the host's HMR watch
 * stat-polls the artifact every 500ms and must never read a half-written file.
 */
import { build } from 'esbuild'
import { readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CLIENT_DIR = join(ROOT, 'src/client')
const ENTRY = join(CLIENT_DIR, 'index.js')
const BUNDLE = join(ROOT, 'src/client.js')
const MAP = BUNDLE + '.map'

const GENERATED_BANNER = [
  '/* GENERATED FILE — do not edit.',
  ' * Source: src/client/**  ·  Rebuild: npm run build  ·  Verify: npm run check',
  ' * The DSH client module table takes exactly one bundle per package',
  ' * (exports["./client"]), so the split sources are bundled here. */',
].join('\n')

const mode = process.argv.includes('--watch') ? 'watch'
  : process.argv.includes('--check') ? 'check'
    : 'build'

/** Shared esbuild options; \`write:false\` keeps the output in memory for the publisher. */
const options = {
  absWorkingDir: ROOT,
  entryPoints: [ENTRY],
  outfile: BUNDLE,
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110'],
  sourcemap: 'external',
  legalComments: 'none',
  banner: { js: GENERATED_BANNER },
  logLevel: mode === 'build' ? 'info' : 'warning',
}

const rel = (path) => relative(ROOT, path)

/** The generated js/map pair, named by esbuild after \`outfile\`. */
function outputsOf(result) {
  const files = result.outputFiles || []
  return {
    js: files.find((file) => file.path === BUNDLE),
    map: files.find((file) => file.path === MAP),
  }
}

function writeAtomic(path, text) {
  const temp = path + '.tmp-' + process.pid
  writeFileSync(temp, text)
  renameSync(temp, path)
}

/** Map first: the polled bundle must never advertise a map that is not there yet. */
function publish(js, map) {
  if (map) writeAtomic(MAP, map.text)
  writeAtomic(BUNDLE, js.text)
  const lines = js.text.split('\n').length
  console.log('[build-client] published ' + rel(BUNDLE) + ' (' + lines + ' lines, ' + js.text.length + ' bytes)')
}

function check(js, map) {
  const stale = []
  for (const [path, generated] of [[BUNDLE, js && js.text], [MAP, map && map.text]]) {
    if (generated === undefined) continue
    let committed
    try {
      committed = readFileSync(path, 'utf8')
    } catch {
      stale.push(rel(path) + ' is missing (run npm run build)')
      continue
    }
    if (committed !== generated) {
      stale.push(rel(path) + ' is stale: committed ' + committed.length + ' bytes, rebuilt ' + generated.length + ' bytes')
    }
  }
  if (stale.length > 0) {
    console.error('[build-client] FAIL — the committed bundle does not match src/client/**:')
    for (const line of stale) console.error('  - ' + line)
    process.exit(1)
  }
  console.log('[build-client] ok — ' + rel(BUNDLE) + ' matches src/client/**')
}

/** The browser sources whose mtimes drive watch mode. */
function sourceFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(path))
    else if (entry.name.endsWith('.js')) files.push(path)
  }
  return files
}

/** Newest source mtime; -1 when the source tree is empty. */
function sourceStamp() {
  return sourceFiles(CLIENT_DIR).reduce((latest, file) => Math.max(latest, statSync(file).mtimeMs), -1)
}

/** One full build; throws on a compile error so callers can keep the last artifact. */
async function buildOnce() {
  const result = await build(options)
  if (result.errors.length > 0) throw new Error('build failed')
  const { js, map } = outputsOf(result)
  if (!js) throw new Error('esbuild produced no bundle')
  return { js, map }
}

if (mode === 'check') {
  const { js, map } = await buildOnce()
  check(js, map)
} else if (mode === 'watch') {
  // Poll source mtimes rather than esbuild's watch API: the artifact must be
  // republished atomically on every change (the host stat-polls it), and polling
  // a handful of files is both simpler to reason about and editor-agnostic.
  let stamp = -1
  let running = false
  const tick = async () => {
    const current = sourceStamp()
    if (running || current === stamp) return
    stamp = current
    running = true
    try {
      const { js, map } = await buildOnce()
      publish(js, map)
    } catch (error) {
      // A broken edit keeps the previous artifact: the host must never serve half a build.
      console.error('[build-client] rebuild failed — keeping the previous artifact:', error.message)
    } finally {
      running = false
    }
  }
  await tick()
  console.log('[build-client] watching src/client/** (Ctrl-C to stop)')
  setInterval(tick, 700)
} else {
  const { js, map } = await buildOnce()
  publish(js, map)
}
