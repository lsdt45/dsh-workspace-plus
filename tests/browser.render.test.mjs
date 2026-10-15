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

// ---------------------------------------------------------------- platform stubs
const React = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Component: class Component { constructor(props) { this.props = props } },
  useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
  useRef: (value) => ({ current: value }),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (factory) => factory(),
}
function defineStore(definition) {
  const state = definition.init()
  const actions = {}
  for (const [name, action] of Object.entries(definition.actions || {})) {
    actions[name] = (...args) => action(state, ...args)
  }
  return { definition, state, actions }
}
const ui = {}
const platformModules = {
  react: React,
  '@deepseek-ai/dsh-client-store': { defineStore },
  '@deepseek-ai/dsh-client-ui-primitives': ui,
}
const hostRequire = (name) => {
  if (!(name in platformModules)) throw new Error('unexpected platform request: ' + name)
  return platformModules[name]
}

// ---------------------------------------------------------------- bundle load
let registration = null
globalThis.window = { __ModuleLoader__: { load: (value) => { registration = value } } }
await import(new URL('../src/client.js', import.meta.url).href)
const plugin = registration.factory(hostRequire)

/** Apply against a stub context and capture the rendered seat components. */
const registered = new Map()
plugin.apply({
  get: (name) => ({
    slots: {
      // The real renderer calls inject(hole, factory) and keeps whatever the
      // factory registers, keyed by the seat's `name`.
      register: (options, render) => { registered.set(options.name, render); return () => {} },
      inject: (hole, factory) => { factory() },
      entries: () => [],
      subscribe: () => () => {},
    },
    sessions: { search: async () => ({ ok: true, value: [] }), binding: () => null, fork: async () => 'child', searchResultLimit: 20 },
    workspaces: { rename: async () => {}, delete: async () => {}, create: async () => {}, insertBefore: async () => {}, insertSessionBefore: async () => {} },
    uiWorkspace: { openSession: () => {}, startSession: () => {}, archiveSession: () => {}, unarchiveSession: () => {}, pickDirectory: () => {} },
  })[name],
  effect: (factory) => { factory() },
  locale: { register: () => () => {} },
  logger: { info: () => {}, warn: () => {}, error: () => {} },
})

const sidebarSeat = registered.get('sidebar.workspaces')
assert.ok(sidebarSeat, 'the sidebar seat was not registered')

function makeStoreState(prefs, overrides, pinned) {
  return {
    folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {},
    expanded: {}, sessionsExpanded: {}, sessionGroups: {},
    prefs: { compactChains: true, viewMode: 'projects', timeDirection: 'latest', sortOrder: 'manual', archivedFilter: 'hide', ...prefs },
    styling: {}, pinned,
    ...overrides,
  }
}

function renderWith({ prefs, store: storeOverrides, items, sessions, pinned }) {
  const state = makeStoreState(prefs, storeOverrides, pinned)
  const actions = {}
  for (const name of ['setExpanded', 'setSessionsExpanded', 'setSessionGroupExpanded', 'setPref', 'setStyling', 'togglePin', 'addFolder', 'removeFolder', 'renameFolder', 'assignWorkspaceGroup', 'assignSessionSection', 'createWorkspaceGroup', 'renameWorkspaceGroup', 'deleteWorkspaceGroup']) {
    actions[name] = () => {}
  }
  const workspacesState = { items: items || [], phase: 'ready', archivedSessionIds: [] }
  const sessionsState = sessions || { byId: {}, ids: [], current: undefined }
  const props = {
    wide: true,
    expandSidebar: () => {},
    useWorkspaces: (selector) => selector(workspacesState),
    useSessions: (selector) => selector(sessionsState),
    useSessionPendingInteraction: (selector) => selector(new Map()),
    useStore: (selector) => selector(state),
    actions,
    store: { state, actions },
    startSession: () => {}, open: () => {}, renameSession: async () => {}, forkSession: async () => {},
    renameWorkspace: async () => {}, deleteWorkspace: async () => {}, archiveSession: async () => {},
    unarchiveSession: async () => {}, createWorkspace: async () => {}, pickDirectory: async () => {},
    insertWorkspaceBefore: async () => {}, insertSessionBefore: async () => {},
    deleteSession: async () => {}, checkSessionDelete: async () => false,
    openDirectory: async () => {}, refreshSessions: async () => {}, refreshPage: () => {},
    t: (key) => key,
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
function deepRender(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map(deepRender)
  if (typeof node !== 'object') return node
  if (typeof node.type === 'function') {
    const isClass = typeof node.type.prototype === 'object' && node.type.prototype !== null && typeof node.type.prototype.render === 'function'
    const rendered = isClass ? new node.type(node.props).render() : node.type(node.props)
    return deepRender(rendered)
  }
  return { ...node, children: (node.children || []).map(deepRender) }
}

/** Count rendered elements whose className matches a pattern. */
function countByClass(element, pattern) {
  let total = 0
  const walk = (node) => {
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

const ITEMS = [
  { workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['s1', 's2'] },
  { workspaceId: 'w2', title: 'plain', path: '/repos/plain', sessionIds: [] },
]
const BY_ID = {
  s1: { id: 's1', title: 'code the thing', updatedAt: Date.now(), cwd: '/repos/app' },
  s2: { id: 's2', title: 'archived chat', updatedAt: Date.now() - 1000, cwd: '/repos/app' },
  s3: { id: 's3', title: 'loose session', updatedAt: Date.now() - 2000, cwd: '/tmp' },
}
const SESSIONS = { byId: BY_ID, ids: ['s1', 's2', 's3'], current: 's1' }

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
