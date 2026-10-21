/**
 * Render smoke test — the safety net for the browser-half split.
 *
 * The bundle contract test proves the artifact loads and applies; this one goes
 * further and actually RENDERS the sidebar component against stub state, so a
 * module that lost an input (a free identifier inside a render path) fails here
 * instead of blanking the sidebar in the browser. React itself is stubbed: the
 * component tree is plain element objects, and hooks are inert.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { CSS_TEXT } from '../src/client/styles.ts'

// ---------------------------------------------------------------- platform stubs
const React = {
  createElement: (type: any, props: any, ...children: any[]) => ({ type, props: props || {}, children }),
  Component: class Component {
    props: any
    constructor(props: any) { this.props = props }
  },
  useState: (value: any) => [typeof value === 'function' ? value() : value, () => {}],
  useRef: (value: any) => ({ current: value }),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (factory: () => any) => factory(),
}
function defineStore(definition: any) {
  const state = definition.init()
  const actions: Record<string, any> = {}
  for (const [name, action] of Object.entries(definition.actions || {}) as Array<[string, (...args: any[]) => any]>) {
    actions[name] = (...args: any[]) => action(state, ...args)
  }
  return { definition, state, actions }
}
// The real primitives module ships StateDot; stubbing it here keeps a row that
// reaches for the official dot distinguishable from one that draws no dot.
const ui = {
  StateDot: (props: any) => ({ type: 'span', props: { className: 'bw-test-statedot', 'data-state': props.state, 'data-size': props.size }, children: [] }),
}
/** The shell hand the plugin stubs; the loader contract is what this file checks. */
const platformModules: Record<string, any> = {
  react: React,
  '@deepseek-ai/dsh-client-store': { defineStore },
  '@deepseek-ai/dsh-client-ui-primitives': ui,
}
const hostRequire = (name: string): any => {
  if (!(name in platformModules)) throw new Error('unexpected platform request: ' + name)
  return platformModules[name]
}

// ---------------------------------------------------------------- bundle load
let registration: any = null
;(globalThis as any).window = { __ModuleLoader__: { load: (value: any) => { registration = value } } }
await import(new URL('../dist/client.js', import.meta.url).href)
const plugin = registration.factory(hostRequire)

/** Apply against a stub context and capture the rendered seat components. */
const registered = new Map<string, any>()
plugin.apply({
  get: (name: string) => ({
    slots: {
      // The real renderer calls inject(hole, factory) and keeps whatever the
      // factory registers, keyed by the seat's `name`.
      register: (options: any, render: any) => { registered.set(options.name, render); return () => {} },
      inject: (_hole: string, factory: () => void) => { factory() },
      entries: () => [],
      subscribe: () => () => {},
    },
    sessions: { search: async () => ({ ok: true, value: [] }), binding: () => null, fork: async () => 'child', searchResultLimit: 20 },
    workspaces: { rename: async () => {}, delete: async () => {}, create: async () => {}, insertBefore: async () => {}, insertSessionBefore: async () => {} },
    uiWorkspace: { openSession: () => {}, startSession: () => {}, archiveSession: () => {}, unarchiveSession: () => {}, pickDirectory: () => {} },
  })[name],
  effect: (factory: () => void) => { factory() },
  locale: { register: () => () => {} },
  logger: { info: () => {}, warn: () => {}, error: () => {} },
})

const sidebarSeat = registered.get('sidebar.workspaces')
assert.ok(sidebarSeat, 'the sidebar seat was not registered')

function makeStoreState(prefs: Record<string, unknown> | undefined, overrides: Record<string, unknown> | undefined, pinned: string[] | undefined): any {
  return {
    folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {},
    expanded: {}, sessionsExpanded: {}, sessionGroups: {},
    prefs: { compactChains: true, viewMode: 'projects', timeDirection: 'latest', sortOrder: 'manual', archivedFilter: 'hide', ...prefs },
    styling: {}, pinned,
    ...overrides,
  }
}

/** Everything a render can vary; every field is optional (tests set only what they assert). */
interface RenderOptions {
  prefs?: Record<string, unknown>
  store?: Record<string, unknown>
  items?: Array<Record<string, any>>
  sessions?: any
  pinned?: string[]
  statuses?: Map<string, any>
}

function renderWith({ prefs, store: storeOverrides, items, sessions, pinned, statuses }: RenderOptions = {}) {
  const state = makeStoreState(prefs, storeOverrides, pinned)
  const actions: Record<string, () => void> = {}
  for (const name of ['setExpanded', 'setSessionsExpanded', 'setSessionGroupExpanded', 'setPref', 'setStyling', 'togglePin', 'addFolder', 'removeFolder', 'renameFolder', 'assignWorkspaceGroup', 'assignSessionSection', 'createWorkspaceGroup', 'renameWorkspaceGroup', 'deleteWorkspaceGroup']) {
    actions[name] = () => {}
  }
  const workspacesState = { items: items || [], phase: 'ready', archivedSessionIds: [] }
  const sessionsState = sessions || { byId: {}, ids: [], current: undefined }
  const props = {
    wide: true,
    expandSidebar: () => {},
    useWorkspaces: (selector: (s: any) => any) => selector(workspacesState),
    useSessions: (selector: (s: any) => any) => selector(sessionsState),
    useSessionPendingInteraction: (selector: (s: any) => any) => selector(new Map()),
    // Live status store (running / completion-unread / pending interaction):
    // empty by default, so the summary-field fallback stays covered.
    useSessionStatus: (selector: (s: any) => any) => selector(statuses || new Map()),
    useStore: (selector: (s: any) => any) => selector(state),
    actions,
    store: { state, actions },
    startSession: () => {}, open: () => {}, renameSession: async () => {}, forkSession: async () => {},
    renameWorkspace: async () => {}, deleteWorkspace: async () => {}, archiveSession: async () => {},
    unarchiveSession: async () => {}, createWorkspace: async () => {}, pickDirectory: async () => {},
    insertWorkspaceBefore: async () => {}, insertSessionBefore: async () => {},
    deleteSession: async () => {}, checkSessionDelete: async () => false,
    openDirectory: async () => {}, refreshSessions: async () => {}, refreshPage: () => {},
    t: (key: string) => key,
  }
  const wrapper = sidebarSeat(props)
  const inner = wrapper && wrapper.children && wrapper.children[0]
  assert.ok(inner && typeof inner.type === 'function', 'the seat did not produce a component element')
  return inner.type(inner.props)
}

/**
 * Minimal renderer: expand function/class elements until only host elements
 * remain, so the assertions see the FULL tree (rows are components too).
 */
function deepRender(node: any): any {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map(deepRender)
  if (typeof node !== 'object') return node
  if (typeof node.type === 'function') {
    const isClass = typeof node.type.prototype === 'object' && node.type.prototype !== null && typeof node.type.prototype.render === 'function'
    // React hands children to a component inside props; the stub keeps them in
    // a sibling array, so they are folded back in here — otherwise a component
    // that renders `children` (PulseGlow) silently loses its whole subtree.
    const props = { ...node.props, children: node.children.length === 1 ? node.children[0] : node.children }
    const rendered = isClass ? new node.type(props).render() : node.type(props)
    return deepRender(rendered)
  }
  return { ...node, children: (node.children || []).map(deepRender) }
}

/** Count rendered elements whose className matches a pattern. */
function countByClass(element: any, pattern: RegExp): number {
  let total = 0
  const walk = (node: any): void => {
    if (node === null || node === undefined || typeof node !== 'object') return
    if (Array.isArray(node)) { for (const child of node) walk(child); return }
    const className = node.props && node.props.className
    if (typeof className === 'string' && pattern.test(className)) total += 1
    walk(node.children)
    return
  }
  walk(deepRender(element))
  return total
}

/** Every rendered element whose className matches a pattern. */
function findByClass(element: any, pattern: RegExp): any[] {
  const hits: any[] = []
  const walk = (node: any): void => {
    if (node === null || node === undefined || typeof node !== 'object') return
    if (Array.isArray(node)) { for (const child of node) walk(child); return }
    const className = node.props && node.props.className
    if (typeof className === 'string' && pattern.test(className)) hits.push(node)
    walk(node.children)
    return
  }
  walk(deepRender(element))
  return hits
}

const ITEMS = [
  { workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['s1', 's2'] },
  { workspaceId: 'w2', title: 'plain', path: '/repos/plain', sessionIds: [] },
]
const BY_ID = {
  s1: { id: 's1', title: 'code the thing', updatedAt: Date.now(), cwd: '/repos/app' },
  s2: { id: 's2', title: 'archived chat', updatedAt: Date.now() - 1000, cwd: '/repos/app' },
  s3: { id: 's3', title: 'loose session', updatedAt: Date.now() - 2000, cwd: '/tmp' },
}
const SESSIONS = { byId: { ...BY_ID, s1: { ...BY_ID.s1, retainedBy: { mainView: 1 } } }, ids: ['s1', 's2', 's3'] }

test('the projects view renders folders, workspaces and their sessions', () => {
  const tree = renderWith({ prefs: {}, items: ITEMS, sessions: SESSIONS, pinned: [] })
  assert.ok(tree, 'render returned nothing')
  assert.ok(countByClass(tree, /bw-row/) >= 3, 'expected at least three rows')
  assert.equal(countByClass(tree, /bw-folder|bw-group/), 0, 'no explicit folders configured')
})

test('every view mode renders without throwing', () => {
  for (const viewMode of ['projects', 'workspaces', 'flat', 'time']) {
    const tree = renderWith({ prefs: { viewMode }, items: ITEMS, sessions: SESSIONS, pinned: [] })
    assert.ok(tree, viewMode + ' rendered nothing')
    assert.ok(countByClass(tree, /bw-row/) >= 3, viewMode + ' lost its rows')
  }
})

test('the archive filter and the pinned tray both render', () => {
  const archived = renderWith({ prefs: { archivedFilter: 'show' }, items: ITEMS, sessions: SESSIONS, pinned: [] })
  assert.ok(countByClass(archived, /bw-row/) >= 4, 'show-archived should add the archived row')
  const pinnedTree = renderWith({ prefs: {}, items: ITEMS, sessions: SESSIONS, pinned: ['s1'] })
  assert.ok(countByClass(pinnedTree, /bw-pinned/), 'the pinned tray did not render')
})

test('explicit folders, sections and custom styling render', () => {
  const tree = renderWith({
    prefs: {},
    items: ITEMS,
    sessions: SESSIONS,
    pinned: [],
    store: {
      folders: ['web'],
      workspaceGroups: [{ id: 'g1', name: 'group one' }],
      workspaceGroupById: { w1: 'g1' },
      styling: { 'workspace:w1': { color: '#5b8def', glow: 4 } },
      sessionsExpanded: { w1: false },
    },
  })
  assert.ok(countByClass(tree, /bw-workspace-group/) >= 1, 'the section group did not render')
  assert.ok(countByClass(tree, /bw-folder/) >= 1 || countByClass(tree, /bw-row/) >= 2, 'sections kept the workspace rows')
})

// ------------------------------------------------------------- status dots
// Frozen spec: running = plugin-drawn orange + breathing (follows the status
// breathing light), completed = official green, pending = official amber,
// read = no dot, and the session on screen never shows the green reminder.
const DOT_ITEMS = [
  { workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['s1', 's2'] },
]
// The shell marks the session on screen with a mainView RETENTION on its
// summary (ui-workspace replaceMain); the list has no `current` field.
const dotSessions = (current: string | undefined) => ({
  byId: {
    s1: { id: 's1', title: 'running chat', updatedAt: Date.now(), cwd: '/repos/app', running: true, retainedBy: current === 's1' ? { mainView: 1 } : {} },
    s2: { id: 's2', title: 'finished chat', updatedAt: Date.now() - 1000, cwd: '/repos/app', completed: true, retainedBy: current === 's2' ? { mainView: 1 } : {} },
  },
  ids: ['s1', 's2'],
})

test('a running session draws the plugin orange dot and breathes by default', () => {
  const tree = renderWith({ prefs: {}, items: DOT_ITEMS, sessions: dotSessions(undefined), pinned: [] })
  const dots = findByClass(tree, /bw-state-dot/)
  assert.equal(dots.length, 2, 'the running and the unread session each draw one dot')
  const running = dots.find((el) => el.props.style.background === '#ff9f45')
  assert.ok(running, 'the running dot must be the frozen orange')
  assert.equal(running.props.style.width, 6, 'every dot uses the shared status-dot size')
  assert.equal(dots.filter((el) => el.props.style.width !== 6).length, 0, 'no state may draw a different diameter')
  assert.ok(dots.some((el) => el.props.style.background === '#3fb950'), 'the finished session draws the completed green')
  assert.equal(countByClass(tree, /bw-pulse/), 1, 'the running dot breathes by default')
})

test('turning the status breathing light off leaves the running dot static', () => {
  const tree = renderWith({ prefs: { statusPulse: false }, items: DOT_ITEMS, sessions: dotSessions(undefined), pinned: [] })
  assert.equal(findByClass(tree, /bw-state-dot/).filter((el) => el.props.style.background === '#ff9f45').length, 1, 'the running dot must stay')
  assert.equal(countByClass(tree, /bw-pulse/), 0, 'breathing off means no pulse wrapper')
})

test('turning the status dots off restores the host status light', () => {
  const tree = renderWith({ prefs: { statusDots: false }, items: DOT_ITEMS, sessions: dotSessions(undefined), pinned: [] })
  assert.equal(findByClass(tree, /bw-state-dot/).length, 0, 'no plugin-drawn dots')
  assert.equal(findByClass(tree, /bw-test-statedot/).length, 2, 'running and unread fall back to the host primitive')
  assert.equal(countByClass(tree, /bw-pulse/), 1, 'the breathing-light switch stays independent')
})

test('the session on screen never shows the completion reminder', () => {
  const tree = renderWith({ prefs: {}, items: DOT_ITEMS, sessions: dotSessions('s2'), pinned: [] })
  assert.equal(findByClass(tree, /bw-state-dot/).filter((el) => el.props.style.background === '#3fb950').length, 0, 'the viewed session must not draw the green dot')
  assert.equal(findByClass(tree, /bw-row-icon/).some((icon) => icon.props.title === 'status.completed'), false, 'and must not claim the completed label')
  assert.equal(findByClass(tree, /bw-state-dot/).length, 1, 'the other running session keeps its dot')
})

test('the on-screen flag survives an id-type mismatch, and the relay agrees', () => {
  // The host may hand the current id over as a number while row ids stay
  // strings (or the reverse); the row flag and the collapse relay must still
  // pick the same session.
  const items = [{ workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: [2] }]
  const sessions = { byId: { 2: { id: 2, title: 'finished chat', updatedAt: Date.now(), cwd: '/repos/app', completed: true, retainedBy: { mainView: 1 } } }, ids: [2] }
  const tree = renderWith({ prefs: {}, items, sessions, pinned: [] })
  assert.equal(findByClass(tree, /bw-state-dot/).length, 0, 'a numeric row id must still match the string current')
  const collapsed = renderWith({ prefs: {}, items, sessions, pinned: [], store: { sessionsExpanded: { w1: false } } })
  assert.equal(countByClass(collapsed, /bw-pulse/), 0, 'the relay must suppress the same session')
})

// The host keeps live status (running / completion-unread / pending
// interaction) in its own store, NOT on the session list snapshot — these are
// the values the shipped sidebar actually receives.
const STATUS_ITEMS = [{ workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['r1', 'c1', 'p1'] }]
const STATUS_SESSIONS = {
  byId: {
    r1: { id: 'r1', title: 'live running', updatedAt: Date.now(), cwd: '/repos/app' },
    c1: { id: 'c1', title: 'finished unread', updatedAt: Date.now() - 1, cwd: '/repos/app' },
    p1: { id: 'p1', title: 'waiting for you', updatedAt: Date.now() - 2, cwd: '/repos/app' },
  },
  ids: ['r1', 'c1', 'p1'],
  current: undefined,
}
const STATUS_STORE = new Map([
  ['r1', { running: true }],
  ['c1', { completionUnread: true }],
  ['p1', { pendingInteraction: { kind: 'approval' } }],
])

test('live status comes from the host status store, not the list snapshot', () => {
  const tree = renderWith({ prefs: {}, items: STATUS_ITEMS, sessions: STATUS_SESSIONS, pinned: [], statuses: STATUS_STORE })
  assert.equal(findByClass(tree, /bw-state-dot/).filter((el) => el.props.style.background === '#ff9f45').length, 1, 'the running session must draw the orange dot')
  assert.equal(countByClass(tree, /bw-pulse/), 1, 'only the running dot breathes')
  const colors = findByClass(tree, /bw-state-dot/).map((el) => el.props.style.background).sort()
  assert.deepEqual(colors, ['#3fb950', '#d29922', '#ff9f45'], 'unread -> green, pending -> amber, running -> orange')
  assert.deepEqual(findByClass(tree, /bw-state-dot/).map((el) => el.props.style.width), [6, 6, 6], 'every state draws the same diameter')
})

test('a running subagent keeps its parent row on the running dot', () => {
  const items = [{ workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['parent', 'kid'] }]
  const sessions = {
    byId: {
      parent: { id: 'parent', title: 'parent', updatedAt: Date.now(), cwd: '/repos/app' },
      kid: { id: 'kid', title: 'kid', updatedAt: Date.now(), cwd: '/repos/app', parentId: 'parent', origin: 'subagent' },
    },
    ids: ['parent', 'kid'],
    current: undefined,
  }
  const tree = renderWith({ prefs: {}, items, sessions, pinned: [], statuses: new Map([['kid', { running: true }]]) })
  assert.equal(findByClass(tree, /bw-state-dot/).length, 1, 'the parent row shows the running dot for its subagent')
})

test('a subagent running only in the list snapshot still lights the parent row', () => {
  const items = [{ workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['parent', 'kid'] }]
  const sessions = {
    byId: {
      parent: { id: 'parent', title: 'parent', updatedAt: Date.now(), cwd: '/repos/app' },
      kid: { id: 'kid', title: 'kid', updatedAt: Date.now(), cwd: '/repos/app', parentId: 'parent', origin: 'subagent', running: true },
    },
    ids: ['parent', 'kid'],
    current: undefined,
  }
  // The status store knows the child but reports no running flag yet: the list
  // snapshot is the only place its running state exists (official fallback).
  const tree = renderWith({ prefs: {}, items, sessions, pinned: [], statuses: new Map([['kid', {}]]) })
  assert.equal(findByClass(tree, /bw-state-dot/).length, 1, 'the list-snapshot running flag still counts for a subagent child')
})

test('the running dot is a real box, not a collapsed inline span', () => {
  // The dot lives inside the .bw-pulse wrapper, so it is NOT a grid item of the
  // row icon: without an explicit display an inline span ignores width/height
  // and the dot renders invisible (this shipped once — the row shifted instead).
  const rule = CSS_TEXT.match(/\.bw-state-dot\{[^}]*\}/)
  assert.ok(rule, 'the .bw-state-dot rule is missing')
  assert.match(rule[0], /display:(inline-block|block|inline-flex)/, 'the running dot must establish a box')
  const pulse = CSS_TEXT.match(/\.bw-pulse\{[^}]*\}/)
  assert.ok(pulse, 'the .bw-pulse rule is missing')
  assert.match(pulse[0], /display:(inline-flex|inline-block|block)/, 'the pulse wrapper must not collapse to zero width')
})

test('a collapse relay does not bubble the completion of the session on screen', () => {
  const collapsed = { sessionsExpanded: { w1: false } }
  const hidden = renderWith({ prefs: {}, items: DOT_ITEMS, sessions: dotSessions(undefined), pinned: [], store: collapsed })
  assert.ok(countByClass(hidden, /bw-pulse/) >= 1, 'a hidden completion still bubbles outward')
  const viewed = renderWith({ prefs: {}, items: DOT_ITEMS, sessions: dotSessions('s2'), pinned: [], store: collapsed })
  assert.equal(countByClass(viewed, /bw-pulse/), 0, 'the viewed session must not bubble a completion outward')
})

// -------------------------------------------------------------- tab strip
const stripSeat = registered.get('conversation.header.leading')
assert.ok(stripSeat, 'the tab strip seat was not registered')

/** Render the strip with the standard-kit pieces it reads: sessions + prefs. */
function renderStrip(sessionsState: any, workspacesState?: any, prefs?: Record<string, unknown>): any {
  const wrapper = stripSeat({
    useSessions: (selector: (s: any) => any) => selector(sessionsState),
    useSessionStatus: (selector: (s: any) => any) => selector(new Map()),
    useWorkspaces: (selector: (s: any) => any) => selector(workspacesState || { items: [], phase: 'ready', archivedSessionIds: [] }),
    useStore: (selector: (s: any) => any) => selector({ prefs: prefs || {} }),
    t: (key: string) => key,
    open: () => {},
  })
  const inner = wrapper && wrapper.children && wrapper.children[0]
  assert.ok(inner && typeof inner.type === 'function', 'the strip seat did not produce a component element')
  return deepRender(inner.type(inner.props))
}

/** The strip's chips are hosts of class "bw-tab" (never "bw-tab-close" et al). */
const CHIP = /^bw-tab(?:$|\s)/

test('the strip draws one chip for the session on screen and marks it active', () => {
  const sessions = { byId: { a: { id: 'a', displayTitle: 'chat a', retainedBy: { mainView: 1 } } }, ids: ['a'] }
  const tree = renderStrip(sessions)
  const chips = findByClass(tree, CHIP)
  assert.equal(chips.length, 1, 'the session on screen must own exactly one chip')
  assert.equal(chips[0].props['data-bw-active'], '1', 'the chip of the session on screen is the active one')
  const label = findByClass(tree, /bw-tab-label/)[0]
  assert.deepEqual(label.children, ['chat a'], 'the chip is labelled with the session title')
})

test('a provisional New Session chip uses the localized blank title', () => {
  // A newly created session is blank until the first prompt: the chip must not
  // leak the raw session id as its label.
  const sessions = { byId: { n: { id: 'n', blank: true, retainedBy: { mainView: 1 } } }, ids: ['n'] }
  const tree = renderStrip(sessions)
  assert.equal(findByClass(tree, CHIP).length, 1, 'the new session still gets a chip')
  assert.deepEqual(findByClass(tree, /bw-tab-label/)[0].children, ['session.new'])
})


test('the strip can be switched off from the plugin settings', () => {
  const sessions = { byId: { a: { id: 'a', displayTitle: 'chat a', retainedBy: { mainView: 1 } } }, ids: ['a'] }
  assert.equal(renderStrip(sessions, undefined, { showTabs: false }), null, 'tabs off renders no strip at all')
  assert.ok(renderStrip(sessions, undefined, { showTabs: true }), 'tabs on still renders')
  assert.ok(renderStrip(sessions, undefined, {}), 'a missing preference defaults to on')
})

test('the strip drops its dots when status dots are switched off', () => {
  const sessions = { byId: { a: { id: 'a', displayTitle: 'chat a', running: true, retainedBy: { mainView: 1 } } }, ids: ['a'] }
  const on = renderStrip(sessions)
  assert.equal(findByClass(on, /bw-state-dot/).length, 1, 'the running chip draws the plugin dot by default')
  const off = renderStrip(sessions, undefined, { statusDots: false })
  assert.equal(findByClass(off, /bw-state-dot/).length, 0, 'dots off: no plugin dots in the strip')
  assert.equal(findByClass(off, /bw-tab-dot/).length, 0, 'and no placeholder dots either')
  assert.equal(findByClass(off, CHIP).length, 1, 'the chip itself stays')
})

// ------------------------------------------------------- plugin settings page
const settingsSeat = registered.get('plugins.bundle.config')
assert.ok(settingsSeat, 'the plugin settings page was not registered')

/** Render the plugin page with a stub store + recording actions. */
function renderSettings(prefs: Record<string, unknown>, calls: Array<[string, unknown]>): any {
  const actions = {
    setPref: (key: string, value: unknown) => { calls.push([key, value]) },
    setViewMode: () => {},
    setTimeDirection: () => {},
    setSortOrder: () => {},
    setArchivedFilter: () => {},
  }
  const wrapper = settingsSeat({ view: 'page', useStore: (selector: (s: any) => any) => selector({ prefs }), actions, t: (key: string) => key })
  const inner = wrapper && wrapper.children && wrapper.children[0]
  assert.ok(inner && typeof inner.type === 'function', 'the settings seat did not produce a component element')
  return deepRender(inner.type(inner.props))
}

test('the plugin settings page exposes the native-fallback switches', () => {
  const calls: Array<[string, unknown]> = []
  const tree = renderSettings({}, calls)
  const switches = findByClass(tree, /^bw-switch(?:$|\s)/)
  assert.equal(switches.length, 4, 'four toggles: tabs, dots, chains, breathing light')
  assert.deepEqual(switches.map((node) => node.props['aria-checked']), [true, true, true, true], 'all default to on')
  switches[0].props.onClick()
  switches[1].props.onClick()
  assert.deepEqual(calls, [['showTabs', false], ['statusDots', false]], 'the new switches write their prefs')
})

test('header overrides only apply while tabs are shown', () => {
  // CSS_TEXT is one joined stylesheet string: every header override must sit
  // under the html:not([data-bw-tabs-off]) scope, so turning tabs off restores
  // the shell's own header layout.
  const occurrences = CSS_TEXT.split('header[data-window-drag]').length - 1
  const scoped = (CSS_TEXT.match(/html:not\(\[data-bw-tabs-off\]\) header\[data-window-drag\]/g) || []).length
  assert.equal(occurrences, 3, 'three header overrides exist')
  assert.equal(scoped, occurrences, 'every header override is scoped to tabs-on')
})

