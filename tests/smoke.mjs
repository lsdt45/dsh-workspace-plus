// Smoke tests: pure helper/file-level, no Cordis runtime, no network.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

test('package.json declares a dual-face dsh web plugin', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.name, 'dsh-workspace-plus')
  assert.equal(pkg.main, 'src/index.js')
  assert.equal(pkg.exports['./client'], './src/client.js')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(pkg.files.includes('src/client.js'), 'client entry must ship')
  assert.ok(pkg.files.includes('src/index.js'), 'host entry must ship')
})

test('dsh.plugin.json version matches package.json', () => {
  const pkg = JSON.parse(read('package.json'))
  const manifest = JSON.parse(read('dsh.plugin.json'))
  assert.equal(manifest.id, 'dsh-external/dsh-workspace-plus')
  assert.equal(manifest.version, pkg.version)
  assert.equal(manifest.main, './src/index.js')
})

test('cordis.patch.yml inserts exactly one plugin row', () => {
  const text = read('cordis.patch.yml')
  assert.match(text, /^- insert:/m)
  assert.match(text, /id: workspace-plus/)
  assert.match(text, /name: 'dsh-workspace-plus'/)
  const insertRows = text.match(/name: 'dsh-workspace-plus'/g) || []
  assert.equal(insertRows.length, 2) // comment example + real row
})

test('client half is a __ModuleLoader__ bundle with baseline requires only', () => {
  const text = read('src/client.js')
  assert.match(text, /window\.__ModuleLoader__\.load\(/)
  assert.match(text, /id: 'dsh-workspace-plus'/)
  const requires = [...text.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1])
  const baseline = new Set([
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-client-store',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-primitives',
  ])
  for (const specifier of requires) {
    assert.ok(baseline.has(specifier), 'non-baseline require: ' + specifier)
  }
  assert.ok(requires.length > 0, 'expected at least one require')
})

test('client half registers the three expected slots', () => {
  const text = read('src/client.js')
  assert.match(text, /slots\.inject\('sidebar\.workspaces'/)
  assert.match(text, /priority: -1/, 'browser shadowing needs the lowest rank')
  assert.match(text, /slots\.inject\('conversation\.hero\.workspace\.directoryFlow'/)
  assert.match(text, /slots\.inject\('sidebar\.workspaces\.directoryFlow'/)
})

test('client plugin exports the cordis plugin triple', () => {
  const text = read('src/client.js')
  assert.match(text, /name: 'dsh-workspace-plus'/)
  assert.match(text, /inject: \['slots', 'sessions', 'workspaces', 'locale', 'uiWorkspace'\]/)
  assert.match(text, /function apply\(ctx\)/)
})

test('client half stays plain JavaScript (no import/JSX/TS syntax)', () => {
  const text = read('src/client.js')
  assert.doesNotMatch(text, /(^|\n)\s*import\s/)
  assert.doesNotMatch(text, /(^|\n)\s*export\s/)
  assert.doesNotMatch(text, /=> </, 'JSX arrow syntax is forbidden')
  assert.doesNotMatch(text, /:\s*(string|number|boolean)\b/, 'TypeScript annotations are forbidden')
  // Compiles as a function body (never executed — window is absent in Node).
  new Function(text)
})

/**
 * Extract the pure title-splitting helpers from the client bundle and run
 * them for real. Everything between splitPlainSegs and normPath is plain,
 * dependency-free JavaScript, so evaluating the slice in one Function scope
 * executes exactly what ships.
 */
const loadTitleSegs = () => {
  const text = read('src/client.js')
  const start = text.indexOf('const splitPlainSegs = (text) => {')
  const end = text.indexOf('const normPath =')
  assert.ok(start !== -1 && end !== -1 && start < end, 'splitting helpers not found')
  const scope = new Function(text.slice(start, end) + '\nreturn { splitTitleSegs }')
  return scope()
}

test('splitTitleSegs: paired quotes verbatim, lone quotes are plain text', () => {
  const { splitTitleSegs } = loadTitleSegs()
  // Unquoted slashes split (deliberate user grouping).
  assert.deepEqual(splitTitleSegs('插件开发/更好的左侧边栏'), ['插件开发', '更好的左侧边栏'])
  // Paired quotes: one verbatim leaf including the quote characters.
  assert.deepEqual(splitTitleSegs('“插件开发/更好的左侧边栏”'), ['“插件开发/更好的左侧边栏”'])
  assert.deepEqual(splitTitleSegs('"a/b" and c/d'), ['"a/b"', 'and c', 'd'])
  // A lone opener (no matching closer) is an ORDINARY character — 0.9.1
  // swallowed the rest of the title instead.
  assert.deepEqual(splitTitleSegs('插件开发/"abc'), ['插件开发', '"abc'])
  assert.deepEqual(splitTitleSegs('say “hello'), ['say “hello'])
  // A closer without an opener never started a span.
  assert.deepEqual(splitTitleSegs('a/b”c'), ['a', 'b”c'])
  // URL tail stays opaque from the first :// onward.
  assert.deepEqual(splitTitleSegs('see https://x.dev/a/b'), ['see https://x.dev/a/b'])
})

test('quote-on-land effect: blank-born only, user renames pinned, stability window', () => {
  const text = read('src/client.js')
  // Eligibility is keyed off an observed BLANK snapshot, not "first time seen".
  assert.match(text, /blankSeen\.add\(id\)/, 'blank birth mark must be recorded')
  assert.match(text, /!blankSeen\.has\(id\) \|\| touched\.has\(id\)/, 'untouched blankSeen/human guard')
  assert.doesNotMatch(text, /titledSeenRef/, '0.9.1 first-snapshot heuristic must be gone')
  // User renames route through the pinning wrapper; the automatic path alone
  // keeps the raw injected renameSession.
  assert.match(text, /const renameByUser = \(sessionId, title\) => \{/)
  assert.equal((text.match(/renameByUser\(/g) || []).length, 3, 'exactly 3 user call sites')
  // The automatic quote waits out a stabilization window instead of racing
  // the async LLM name.
  assert.match(text, /TITLE_STABLE_MS = 20000/)
  assert.match(text, /prev\.title === text/, 'title change resets the window')
  assert.match(text, /\[list, stableTick\]/, 'stability tick re-runs the effect')
})

test('host half imports cleanly and applies without side effects', async () => {
  const plugin = await import('../src/index.js')
  assert.equal(plugin.name, 'dsh-workspace-plus')
  assert.equal(typeof plugin.apply, 'function')
  let logged = ''
  plugin.apply({ logger: { info: (m) => { logged = String(m) } } })
  assert.match(logged, /dsh-workspace-plus/)
  plugin.apply(undefined) // must not throw without a logger
})

test('view modes and bucket views are wired as display-layer projections', () => {
  const text = read('src/client.js')
  // Store declaration carries the new keys with hydration tolerance.
  assert.match(text, /pinned: \[\]/, 'store init defaults pinned')
  assert.match(text, /viewMode: 'projects', timeDirection: 'latest'/, 'store init defaults the view model')
  assert.match(text, /togglePin: \(d, id\) => \{/, 'togglePin action declared')
  assert.match(text, /setViewMode: \(d, mode\) => \{/, 'setViewMode action declared')
  assert.match(text, /setTimeDirection: \(d, dir\) => \{/, 'setTimeDirection action declared')
  // Legacy sortMode maps onto the view model when read.
  assert.match(text, /const legacy = p\.sortMode/, 'legacy sortMode migration read')
  // Buckets derive from updatedAt against local calendar days.
  assert.match(text, /const bucketOf = \(updatedAt, now\) => \{/)
  assert.match(text, /BUCKET_ORDER = \['today', 'yesterday', 'week', 'month', 'earlier'\]/)
  // The time view is ONE global timeline across projects (assembled at the
  // bodyRows level), not per-workspace buckets; rows carry workspace tags.
  assert.match(text, /\} else if \(timeSorted\) \{/, 'timeline replaces the workspace scaffolding')
  assert.match(text, /const timelineRows = \[\]/, 'global timeline row collection')
  assert.match(text, /for \(const row of renderTimeBuckets\(timelineRows, null, 0\)\) bodyRows\.push\(row\)/, 'single timeline render')
  assert.match(text, /for \(const s of sorted\) out\.push\(renderSessionRow\(s, depth, null, \{ workspaceTag: s\.workspaceTag, tagOnHover: true, tooltip: true \}\)\)/, 'timeline rows: time by default, tag+tooltip on hover')
  // The hover card uses the official primitives Tooltip (baseline module),
  // anchored UNDER the session row; native title stays only as the degraded
  // fallback. The bubble is re-surfaced with menu tokens (scoped, opaque) —
  // the token default washes out over theme wallpapers.
  assert.match(text, /if \(hasHoverLabel && typeof ui\.Tooltip === 'function'\) \{\s*return E\(ui\.Tooltip, \{ label: hoverLabel, side: 'bottom', delayMs: 300, maxWidth: 320 \}, row\)/, 'primitives Tooltip wraps the row under it')
  assert.match(text, /const nativeTitle = hasHoverLabel && typeof ui\.Tooltip !== 'function'/, 'native title only as fallback')
  assert.match(text, /\.bw-tree > span\[data-side\], \.bw-pinned-section > span\[data-side\]/, 'scoped bubble resurfacing rule')
  assert.match(text, /hoverLabel = hasHoverLabel\s*\n\s*\? \(\) => \{/, 'label resolver evaluates on visibility')
  // Every opt MUST survive the renderSessionRow → SessionRow forwarding — a
  // dropped forwarder silently reverts rows to the always-visible tag.
  assert.match(text, /workspaceTag: o\.workspaceTag,\s*\n\s*tagOnHover: o\.tagOnHover === true,\s*\n\s*tooltip: o\.tooltip === true,/, 'opts forwarded into SessionRow props')
  assert.match(text, /if \(!dragMatches\('session'\) \|\| timeSorted\) return null/, 'time mode never anchors reorders')
  assert.match(text, /!canReorderSessions \|\| timeSorted/, 'drop commit guards the time mode')
  // Pinned rows are not drag surfaces in any mode.
  assert.match(text, /!searching && !timeSorted && !pinnedSet\.has\(session\.id\)/, 'pinned rows not draggable')
})

test('pinning is display-layer only: no host mutations, tray-only + badge', () => {
  const text = read('src/client.js')
  // The tray ordering comes from the store projection...
  assert.match(text, /const pinnedSet = React\.useMemo\(\(\) => new Set\(pinnedList\.map\(String\)\)/)
  // ...rendered as a global tray with workspace provenance; pinned rows are
  // hidden inside their workspace and return on unpin.
  assert.match(text, /const renderPinnedSection = \(rows\) => E\('div'/, 'tray renderer exists')
  assert.match(text, /key: 'pinned-section'/, 'pinned tray section key')
  assert.match(text, /\+ \(inTray \? '-tray' : ''\)/, 'tray rows key apart from tree rows')
  assert.match(text, /const unpinned = rows\.filter\(r => !pinnedSet\.has\(r\.id\)\)/, 'workspace tree excludes pinned rows (tray-only display)')
  assert.match(text, /const plainUn = ungrouped\.filter\(s => !pinnedSet\.has\(s\.id\)\)/, 'ungrouped area excludes pinned rows too')
  assert.match(text, /pinCount > 0 \? E\('span', \{ className: 'bw-pin-ind'/, 'collapsed workspace pin badge')
  // Context menu + row hover both toggle through the store action.
  assert.match(text, /\{ id: 'pin', label: isPinned \? t\('menu\.unpin'\) : t\('menu\.pin'\)/)
  assert.match(text, /actions\.togglePin\(payload\.id\)/, 'menu toggles the pin')
  // Stale pins self-heal only for previously-seen-and-vanished ids.
  assert.match(text, /if \(!current\.has\(id\) && pinnedNow\.has\(id\)\) actions\.togglePin\(id\)/)
  // Pin never rewrites titles or host ordering: no rename/pin coupling.
  assert.doesNotMatch(text, /renameByUser\(.*pin/i, 'pin must not route through renames')
})

test('view control surfaces: header menu and settings segments', () => {
  const text = read('src/client.js')
  assert.match(text, /kind: 'view', payload: \{\}/, 'view menu opens through the ctx overlay')
  assert.match(text, /role: 'menuitemradio'/, 'view menu items announce selection')
  assert.match(text, /actions\.setViewMode\('projects'\)/, 'menu commits the projects view')
  assert.match(text, /actions\.setViewMode\('time'\)/, 'menu commits the time view')
  assert.match(text, /actions\.setTimeDirection\(id\.slice\('view-dir-'\.length\)\)/, 'direction submenu commits via setTimeDirection')
  assert.match(text, /role: 'radiogroup'/, 'settings segments group the radios')
  assert.match(text, /actions\.setTimeDirection\(dir\)/, 'settings direction segments commit')
  // Time view shows the indented direction pair; projects view hides it.
  assert.match(text, /if \(timeSorted\) \{\s*items\.push\(\{ sep: true \}\)/, 'direction pair only in the time view')
  // View glyphs ship embedded (Lucide ISC): the button previews the active view.
  assert.match(text, /const ListTreeIcon16 = \(\{ size = 14, className \}\)/, 'projects-view glyph')
  assert.match(text, /const CalendarDaysIcon16 = \(\{ size = 14, className \}\)/, 'time-view glyph')
  assert.match(text, /timeSorted \? E\(CalendarDaysIcon16, \{ size: 15 \}\) : E\(ListTreeIcon16, \{ size: 15 \}\)/, 'button previews the active view')
  // Pin icon ships embedded (Lucide ISC) because primitives lack a pin.
  assert.match(text, /const PinIcon16 = \(\{ size = 14/, 'embedded pin icon component')
  assert.match(text, /viewBox: '0 0 24 24'/, 'pin icon svg viewport')
})

test('locale dictionaries cover every static t() key in both languages', () => {
  const text = read('src/client.js')
  const slice = (startMarker, endMarker) => {
    const start = text.indexOf(startMarker)
    assert.ok(start !== -1, 'missing block: ' + startMarker)
    const end = text.indexOf(endMarker, start)
    assert.ok(end !== -1, 'missing end marker for ' + startMarker)
    return text.slice(start, end)
  }
  const keysOf = (block) => new Set([...block.matchAll(/'([a-zA-Z][^']*)':/g)].map((m) => m[1]))
  const zhBlock = slice('const zh = {', 'const en = {')
  const enBlock = slice('const en = {', '/* ============================= helpers')
  const zhKeys = keysOf(zhBlock)
  const enKeys = keysOf(enBlock)
  assert.ok(zhKeys.size > 20, 'zh dictionary looks too small')
  assert.deepEqual([...enKeys].sort(), [...zhKeys].sort(), 'zh/en dictionaries must be key-aligned')
  const used = new Set([...text.matchAll(/\bt\('([^']+)'\)/g)].map((m) => m[1]))
  for (const key of used) {
    assert.ok(zhKeys.has(key), 't("' + key + '") missing from zh dictionary')
    assert.ok(enKeys.has(key), 't("' + key + '") missing from en dictionary')
  }
  // dynamic time keys
  for (const unit of ['minutes', 'hours', 'days', 'months', 'years']) {
    assert.ok(zhKeys.has('time.' + unit) && enKeys.has('time.' + unit), 'missing time.' + unit)
  }
})
