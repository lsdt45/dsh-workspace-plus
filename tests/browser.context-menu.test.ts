/**
 * Context-menu regression test — the sidebar must survive opening the group
 * submenu of a session / workspace right-click menu.
 *
 * Why a separate file: the render smoke test (tests/browser.render.test.ts) uses a
 * stateless React stub, so it can only ever see the FIRST render of a seat — it
 * cannot click, cannot open a menu and cannot re-render. The 0.2.1 layout
 * refactor dropped one factory input (workspaceGroups), which no initial render
 * touches: the ReferenceError only fires when the submenu is evaluated. This
 * test drives the component the way a mouse does (right-click a row, then hover
 * the "group" item) through a hook-capable React stub, and emulates React error
 * boundaries so a swallowed render error cannot pass as "rendered fine".
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

/* ------------------------------- React stub ------------------------------ *
 * Hooks are keyed per component instance (type + position path) so a state
 * update actually re-renders the component that owns it, exactly like React.
 */
const frames = new Map<string, any>()
let currentFrame: any = null
let dirty = false
const effectQueue: Array<() => void> = []
const boundaryErrors: Array<{ boundary: string; message: string }> = []

function frameFor(path: string): any {
  let frame = frames.get(path)
  if (!frame) { frame = { hooks: Object.create(null), cursor: 0 }; frames.set(path, frame) }
  return frame
}
function slot(kind: string, init: () => any): any {
  const frame = currentFrame
  const key = kind + ':' + frame.cursor++
  if (!(key in frame.hooks)) frame.hooks[key] = init()
  return frame.hooks[key]
}
function depsChanged(previous: any, deps: any): boolean {
  if (previous === undefined || !deps || previous === null || previous.length !== deps.length) return true
  for (let i = 0; i < deps.length; i += 1) if (!Object.is(previous[i], deps[i])) return true
  return false
}

const React = {
  createElement: (type: any, props: any, ...children: any[]) => {
    const base = props || {}
    const merged = children.length === 0
      ? base
      : Object.assign({}, base, { children: children.length === 1 ? children[0] : children })
    return { type, props: merged, children }
  },
  Component: class Component {
    props: any
    state: any
    constructor(props: any) { this.props = props; this.state = {} }
  },
  useState(initial: any): [any, (next: any) => void] {
    const cell = slot('state', () => ({ v: typeof initial === 'function' ? initial() : initial }))
    return [cell.v, (next) => {
      const value = typeof next === 'function' ? next(cell.v) : next
      if (!Object.is(value, cell.v)) { cell.v = value; dirty = true }
    }]
  },
  useRef(initial: any) { return slot('ref', () => ({ current: initial })) },
  useEffect(fn: () => any, deps: any) {
    const cell = slot('effect', () => ({ deps: undefined, cleanup: undefined }))
    if (!depsChanged(cell.deps, deps)) return
    cell.deps = deps ? deps.slice() : null
    effectQueue.push(() => {
      if (typeof cell.cleanup === 'function') cell.cleanup()
      cell.cleanup = fn()
    })
  },
  useLayoutEffect(fn: () => any, deps: any) { React.useEffect(fn, deps) },
  useMemo(factory: () => any, deps: any) {
    const cell = slot('memo', () => ({ deps: undefined, value: undefined }))
    if (depsChanged(cell.deps, deps)) { cell.value = factory(); cell.deps = deps ? deps.slice() : null }
    return cell.value
  },
  useCallback(fn: () => any, deps: any) { return React.useMemo(() => fn, deps) },
}

/* -------------------------------- renderer ------------------------------- */
function renderElement(node: any, path: string): any {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map((child, index) => renderElement(child, path + '.' + index))
  const { type, props, children } = node
  const keyed = props && props.key !== undefined ? '#' + props.key : ''
  if (typeof type === 'function') {
    const isClass = type.prototype && typeof type.prototype.render === 'function'
    const childPath = path + '/' + (type.name || 'anon') + keyed
    if (isClass) {
      const instance = new type(props)
      if (typeof type.getDerivedStateFromError !== 'function') return renderElement(instance.render(), childPath)
      // React's boundary semantics: the error is swallowed and this subtree
      // renders the fallback (null), which is how a thrown render blanks the
      // whole sidebar region instead of showing an error.
      try {
        return renderElement(instance.render(), childPath)
      } catch (error) {
        boundaryErrors.push({ boundary: type.name || 'anon', message: String(error && (error as Error).message) })
        instance.state = Object.assign({}, instance.state, type.getDerivedStateFromError(error))
        return renderElement(instance.render(), childPath)
      }
    }
    const frame = frameFor(childPath)
    const previous = currentFrame
    currentFrame = frame
    frame.cursor = 0
    let out
    try { out = type(props) } finally { currentFrame = previous }
    return renderElement(out, childPath)
  }
  return { type, props, children: (children || []).map((child: any, index: number) => renderElement(child, path + '.' + index)) }
}

/* --------------------------------- stubs --------------------------------- */
/** Primitives stub: passthrough wrappers, enough for the rows to render. */
const primitives = {
  Tooltip: ({ children }: any) => children,
  StateDot: () => React.createElement('span', { className: 'stub-dot' }),
  Button: (props: any) => React.createElement('button', { type: 'button', className: props.className, onClick: props.onClick }, props.children),
  Modal: ({ open, children }: any) => (open ? children : null),
  relativeTime: () => 'now',
  writeClipboard: async () => true,
}
const platformModules: Record<string, any> = {
  react: React,
  '@deepseek-ai/dsh-client-store': { defineStore: (definition: any) => ({ definition }) },
  '@deepseek-ai/dsh-client-ui-primitives': primitives,
}
const hostRequire = (name: string): any => {
  if (!(name in platformModules)) throw new Error('unexpected platform request: ' + name)
  return platformModules[name]
}

/* ------------------------------- bundle load ----------------------------- */
let registration: any = null
;(globalThis as any).window = {
  __ModuleLoader__: { load: (value: any) => { registration = value } },
  addEventListener: () => {}, removeEventListener: () => {},
  location: { reload: () => {} },
  innerWidth: 1440, innerHeight: 900,
}
;(globalThis as any).document = { addEventListener: () => {}, removeEventListener: () => {} }
await import(new URL('../dist/client.js', import.meta.url).href)
const plugin = registration.factory(hostRequire)

const registered = new Map<string, any>()
const services: any = {
  slots: {
    register: (options: any, render: any) => { registered.set(options.name, render); return () => {} },
    inject: (_hole: string, factory: () => void) => { factory() },
    entries: () => [],
    subscribe: () => () => {},
  },
  sessions: { search: async () => ({ ok: true, value: [] }), binding: () => null, fork: async () => 'child', searchResultLimit: 20, refresh: async () => {} },
  workspaces: { rename: async () => {}, delete: async () => {}, create: async () => {}, insertBefore: async () => {}, insertSessionBefore: async () => {} },
  uiWorkspace: { openSession: () => {}, startSession: () => {}, archiveSession: async () => {}, unarchiveSession: async () => {}, pickDirectory: async () => {} },
}
plugin.apply({
  get: (name: string) => services[name],
  effect: (factory: () => void) => { factory() },
  locale: { register: () => () => {} },
  logger: { info: () => {}, warn: () => {}, error: () => {} },
})
const sidebarSeat = registered.get('sidebar.workspaces')
assert.ok(sidebarSeat, 'the sidebar seat was not registered')

/* ------------------------------ test harness ----------------------------- */
const NOW = Date.now()

function makeProps(overrides: any = {}) {
  const state = Object.assign({
    folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {},
    expanded: {}, sessionsExpanded: {}, sessionGroups: {},
    prefs: { compactChains: true, viewMode: 'projects', timeDirection: 'latest', sortOrder: 'manual', archivedFilter: 'hide' },
    styling: {}, pinned: [],
  }, overrides.store)
  const actions: Record<string, () => void> = {}
  for (const name of ['setExpanded', 'setSessionsExpanded', 'setSessionGroupExpanded', 'setPref', 'setStyling', 'togglePin', 'addFolder', 'removeFolder', 'renameFolder', 'assignWorkspaceGroup', 'assignSessionSection', 'createWorkspaceGroup', 'renameWorkspaceGroup', 'deleteWorkspaceGroup']) actions[name] = () => {}
  const items = overrides.items || [
    { workspaceId: 'w1', title: 'web/app', path: '/repos/app', sessionIds: ['s1', 's2'] },
    { workspaceId: 'w2', title: 'plain', path: '/repos/plain', sessionIds: [] },
  ]
  const byId = {
    s1: { id: 's1', title: 'code the thing', updatedAt: NOW, cwd: '/repos/app' },
    s2: { id: 's2', title: 'archived chat', updatedAt: NOW - 1000, cwd: '/repos/app' },
    s3: { id: 's3', title: 'loose session', updatedAt: NOW - 2000, cwd: '/tmp' },
  }
  const sessionsState = { byId, ids: Object.keys(byId), current: 's1' }
  const workspacesState = { items, phase: 'ready', archivedSessionIds: [] }
  return {
    wide: true,
    expandSidebar: () => {},
    useWorkspaces: (selector: (s: any) => any) => selector(workspacesState),
    useSessions: (selector: (s: any) => any) => selector(sessionsState),
    useSessionPendingInteraction: (selector: (s: any) => any) => selector(new Map()),
    useStore: (selector: (s: any) => any) => selector(state),
    actions,
    store: { state, actions },
    startSession: () => {}, open: () => {}, renameSession: async () => {}, forkSession: async () => {},
    renameWorkspace: async () => {}, deleteWorkspace: async () => {}, archiveSession: async () => {},
    unarchiveSession: async () => {}, createWorkspace: async () => {}, pickDirectory: async () => {},
    insertWorkspaceBefore: async () => {}, insertSessionBefore: async () => {},
    deleteSession: async () => ({ warnings: [] }), checkSessionDelete: async () => true,
    openDirectory: async () => {}, refreshSessions: async () => {}, refreshPage: () => {},
    t: (key: string) => key,
  }
}

let root: any = null
function mount(overrides?: any): void {
  frames.clear()
  boundaryErrors.length = 0
  root = React.createElement(sidebarSeat, makeProps(overrides))
}
function renderRoot(): any {
  for (let pass = 0; pass < 30; pass += 1) {
    dirty = false
    effectQueue.length = 0
    const out = renderElement(root, 'root')
    while (effectQueue.length > 0) (effectQueue.shift() as () => void)()
    if (!dirty) return out
  }
  throw new Error('render did not settle')
}
function collect(node: any, predicate: (node: any) => boolean, out: any[] = []): any[] {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) { for (const child of node) collect(child, predicate, out); return out }
  if (predicate(node)) out.push(node)
  for (const child of node.children || []) collect(child, predicate, out)
  return out
}
const byClassName = (tree: any, name: string): any[] => collect(tree, (node) => node.props && typeof node.props.className === 'string' && node.props.className.includes(name))
const rowsOfKind = (tree: any, kind: string): any[] => collect(tree, (node) => node.props && node.props['data-bw-context'] === kind)
const hostCount = (tree: any): number => collect(tree, (node) => typeof node.type === 'string').length
const flush = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0) })
const mouseEvent = () => ({
  clientX: 140, clientY: 320, preventDefault: () => {}, stopPropagation: () => {},
  currentTarget: { getBoundingClientRect: () => ({ left: 100, right: 260, top: 300, bottom: 328 }) },
})

/** Right-click a row, then hover the menu item that opens the group submenu. */
async function openGroupSubmenu(kind: string, overrides?: any): Promise<any> {
  mount(overrides)
  const tree = renderRoot()
  const rows = rowsOfKind(tree, kind)
  assert.ok(rows.length > 0, 'no ' + kind + ' row rendered')
  rows[0].props.onContextMenu(mouseEvent())
  let menu = renderRoot()
  await flush()
  menu = renderRoot()
  const items = byClassName(menu, 'bw-ctx-item')
  assert.ok(items.length > 0, 'the context menu rendered no items')
  const groupItem = items.find((item) => item.props['aria-haspopup'] === 'menu')
  assert.ok(groupItem, 'the context menu has no group submenu entry')
  groupItem.props.onMouseEnter(mouseEvent())
  let opened = renderRoot()
  await flush()
  opened = renderRoot()
  return opened
}

/* --------------------------------- tests --------------------------------- */
test('the group submenu opens without blanking the sidebar (session row)', async () => {
  const tree = await openGroupSubmenu('session')
  assert.deepEqual(boundaryErrors, [], 'a render error was swallowed by the sidebar error boundary: ' + JSON.stringify(boundaryErrors))
  assert.ok(hostCount(tree) > 0, 'the sidebar rendered nothing after opening the submenu')
  assert.equal(byClassName(tree, 'bw-ctx-submenu').length, 1, 'the group submenu panel did not render')
  assert.equal(byClassName(tree, 'bw-root').length, 1, 'the sidebar frame is gone')
})

test('the group submenu opens without blanking the sidebar (workspace row)', async () => {
  const tree = await openGroupSubmenu('workspace')
  assert.deepEqual(boundaryErrors, [], 'a render error was swallowed by the sidebar error boundary: ' + JSON.stringify(boundaryErrors))
  assert.equal(byClassName(tree, 'bw-ctx-submenu').length, 1, 'the group submenu panel did not render')
  assert.equal(byClassName(tree, 'bw-root').length, 1, 'the sidebar frame is gone')
})

test('the group submenu lists the configured workspace groups', async () => {
  const tree = await openGroupSubmenu('session', {
    store: {
      workspaceGroups: [{ id: 'g1', name: 'group one' }, { id: 'g2', name: 'group two' }],
      workspaceGroupById: { w1: 'g1' },
      sessionSectionById: {},
    },
  })
  const labels = collect(byClassName(tree, 'bw-ctx-submenu')[0], (node) => node.props && node.props.className === 'bw-menu-label')
    .map((node) => node.props.children)
  assert.deepEqual(labels.slice(0, 2), ['group one', 'group two'], 'the submenu did not list the groups: ' + JSON.stringify(labels))
})

test('a later right-click still renders after a submenu was opened', async () => {
  mount()
  const tree = renderRoot()
  rowsOfKind(tree, 'session')[0].props.onContextMenu(mouseEvent())
  renderRoot()
  const items = byClassName(renderRoot(), 'bw-ctx-item')
  items.find((item) => item.props['aria-haspopup'] === 'menu').props.onMouseEnter(mouseEvent())
  renderRoot()
  // Dismiss, then open the workspace menu: the boundary must not be stuck.
  const overlay = byClassName(renderRoot(), 'bw-ctx-overlay')[0]
  overlay.props.onMouseDown()
  const dismissed = renderRoot()
  assert.equal(byClassName(dismissed, 'bw-ctx-menu').length, 0, 'the menu did not close')
  rowsOfKind(dismissed, 'workspace')[0].props.onContextMenu(mouseEvent())
  const reopened = renderRoot()
  assert.deepEqual(boundaryErrors, [], 'a render error was swallowed: ' + JSON.stringify(boundaryErrors))
  assert.equal(byClassName(reopened, 'bw-ctx-menu').length, 1, 'the second menu did not render')
})
