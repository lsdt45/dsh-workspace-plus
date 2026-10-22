/**
 * Search overlay — the Codex-style floating panel behind the sidebar's search
 * button (ui/search-overlay.ts + ui/search-host.ts) and the layout wiring that
 * opens it (browser/layout.ts).
 *
 * The component is rendered with a minimal hook runtime rather than the inert
 * stubs used by the side-effect-free render tests: the panel's whole contract
 * is interactive (open → type → local + Host content results → keyboard), so
 * state updates, effects and the debounce have to actually run.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { installPlatform } from '../src/client/platform.ts'
import { createLayout } from '../src/client/browser/layout.ts'
import { CSS_TEXT } from '../src/client/styles.ts'
import { SearchOverlay } from '../src/client/ui/search-overlay.ts'

// ------------------------------------------------------------- hook runtime
interface EffectRecord { deps?: any[]; cleanup?: (() => void) | undefined }

class Runtime {
  records: any[] = []
  effects: EffectRecord[] = []
  hookIndex = 0
  pendingEffects: Array<{ index: number; fn: () => any }> = []
  dirty = false
  component: (props: any) => any = () => null
  props: any = null
  tree: any = null

  useState(initial: any): any[] {
    const index = this.hookIndex++
    if (this.records[index] === undefined) {
      this.records[index] = { value: typeof initial === 'function' ? initial() : initial }
    }
    const record = this.records[index]
    const setter = (next: any): void => {
      const value = typeof next === 'function' ? next(record.value) : next
      if (Object.is(value, record.value)) return
      record.value = value
      this.dirty = true
    }
    return [record.value, setter]
  }

  useRef(initial: any): { current: any } {
    const index = this.hookIndex++
    if (this.records[index] === undefined) this.records[index] = { current: initial }
    return this.records[index]
  }

  useMemo(factory: () => any, deps?: any[]): any {
    const index = this.hookIndex++
    const previous = this.records[index]
    if (previous && deps && previous.deps && sameDeps(deps, previous.deps)) return previous.value
    const value = factory()
    this.records[index] = { deps: deps ? deps.slice() : undefined, value }
    return value
  }

  useEffect(fn: () => any, deps?: any[]): void {
    const index = this.hookIndex++
    const previous = this.effects[index]
    if (previous && deps && previous.deps && sameDeps(deps, previous.deps)) return
    this.effects[index] = { deps: deps ? deps.slice() : undefined, cleanup: previous ? previous.cleanup : undefined }
    this.pendingEffects.push({ index, fn })
  }

  render(props: any): any {
    this.props = props
    for (let pass = 0; pass < 30; pass++) {
      this.hookIndex = 0
      this.pendingEffects = []
      this.tree = this.component(props)
      for (const pending of this.pendingEffects) {
        const record = this.effects[pending.index]
        if (record.cleanup) {
          try { record.cleanup() } catch { /* cleanup is best-effort */ }
        }
        const cleanup = pending.fn()
        record.cleanup = typeof cleanup === 'function' ? cleanup : undefined
      }
      if (!this.dirty) return this.tree
      this.dirty = false
    }
    throw new Error('render did not settle')
  }

  /** Let promise callbacks run, then repaint if a resolved request changed state. */
  async settle(): Promise<void> {
    for (let round = 0; round < 12; round++) {
      while (this.dirty) this.render(this.props)
      await Promise.resolve()
      if (!this.dirty) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (!this.dirty) return
      }
    }
    throw new Error('async state never settled')
  }

  unmount(): void {
    for (const record of this.effects) {
      if (record.cleanup) { try { record.cleanup() } catch { /* ignore */ } }
    }
    this.effects = []
    this.records = []
  }
}

const sameDeps = (left: any[], right: any[]): boolean => left.length === right.length && left.every((value, index) => Object.is(value, right[index]))

let activeRuntime: Runtime | null = null

/** React facade: the component reads the platform handles, which route here. */
const reactFacade = {
  createElement: (type: any, props: any, ...children: any[]) => ({ type, props: props || {}, children }),
  Component: class Component { props: any; constructor(props: any) { this.props = props } },
  useState: (value: any) => activeRuntime!.useState(value),
  useRef: (value: any) => activeRuntime!.useRef(value),
  useMemo: (factory: () => any, deps?: any[]) => activeRuntime!.useMemo(factory, deps),
  useEffect: (fn: () => any, deps?: any[]) => activeRuntime!.useEffect(fn, deps),
  useLayoutEffect: (fn: () => any, deps?: any[]) => activeRuntime!.useEffect(fn, deps),
}

const uiStub = {
  IconSearchOutline16: (props: any) => reactFacade.createElement('svg', { width: props && props.size, className: 'test-icon' }),
  Modal: (props: any) => reactFacade.createElement('div', { className: 'test-modal' }, props.children),
}

installPlatform((name: string) => {
  const modules: Record<string, any> = {
    react: reactFacade,
    '@deepseek-ai/dsh-client-store': {
      defineStore: (definition: any) => {
        const state = definition.init()
        const actions: Record<string, any> = {}
        for (const [actionName, action] of Object.entries(definition.actions || {}) as Array<[string, any]>) {
          actions[actionName] = (...args: any[]) => action(state, ...args)
        }
        return { definition, state, actions }
      },
    },
    '@deepseek-ai/dsh-client-ui-primitives': uiStub,
  }
  if (!(name in modules)) throw new Error('unexpected platform module: ' + name)
  return modules[name]
})

// ------------------------------------------------------------- DOM helpers
const walk = (node: any, visit: (element: any) => void): void => {
  if (node === null || node === undefined || typeof node !== 'object') return
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return }
  visit(node)
  for (const child of node.children || []) walk(child, visit)
}

const findAll = (tree: any, predicate: (element: any) => boolean): any[] => {
  const hits: any[] = []
  walk(tree, (element) => { if (predicate(element)) hits.push(element) })
  return hits
}

const byClass = (tree: any, name: string): any[] => findAll(tree, (element) => {
  const className = element.props && element.props.className
  return typeof className === 'string' && className.split(/\s+/).includes(name)
})

const textOf = (node: any): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return textOf(node.children)
}

const renderOverlay = (props: Record<string, any>) => {
  const runtime = new Runtime()
  runtime.component = SearchOverlay
  activeRuntime = runtime
  const tree = runtime.render({
    open: true,
    candidates: CANDIDATES,
    limit: 20,
    onOpen: () => {},
    onClose: () => {},
    t: (key: string, vars?: any) => (vars && vars.n !== undefined ? key + ':' + vars.n : key),
    ...props,
  })
  return { runtime, tree }
}

const CANDIDATES = [
  { id: 'a', title: 'Git commit and push', workspace: 'promo-dev', updatedAt: 300 },
  { id: 'b', title: 'Plan review', workspace: 'h5-member-grade', updatedAt: 500 },
  { id: 'c', title: 'Ordinary chat', workspace: '', updatedAt: 400 },
]

const typeQuery = (runtime: Runtime, tree: any, query: string) => {
  const input = byClass(tree, 'bw-search-input')[0]
  assert.ok(input, 'the search field is missing')
  input.props.onChange({ target: { value: query } })
  return runtime.render(runtime.props)
}

const pressKey = (tree: any, key: string) => {
  const root = byClass(tree, 'bw-search-overlay')[0]
  assert.ok(root, 'the overlay root is missing')
  let defaultPrevented = false
  let propagationStopped = false
  root.props.onKeyDown({ key, preventDefault: () => { defaultPrevented = true }, stopPropagation: () => { propagationStopped = true } })
  return { defaultPrevented, propagationStopped }
}

// ------------------------------------------------- layout wiring (openers)
const layoutInput = (overrides: Record<string, any>): any => ({
  actions: {}, bodyRows: null, createWorkspace: () => {}, ctx: null, ctxItems: () => [], ctxSubmenu: null,
  customize: null, deleting: false, deletingRef: { current: false }, dialog: null, errorText: null,
  expandSidebar: () => {}, fail: () => {}, flowOpen: false, flowParent: '', handleCtxPick: () => {},
  items: [], notice: null, ownMenuRoot: { current: null }, openSearch: () => {}, pickDirectory: () => {},
  renameWorkspace: () => {}, sessionSectionOf: () => null, setCtx: () => {}, setCtxSubmenu: () => {},
  setCustomize: () => {}, setDialog: () => {}, setErrorText: () => {}, setFlowOpen: () => {},
  setFlowParent: () => {}, styleEntry: () => null, submitFolderDelete: () => {}, submitFolderNew: () => {},
  submitFolderRename: () => {}, submitSessionDelete: () => {}, submitSessionGroupRename: () => {},
  submitSessionRename: () => {}, submitWorkspaceDelete: () => {}, submitWorkspaceGroup: () => {},
  submitWorkspaceRename: () => {}, t: (key: string) => key, useStore: (selector: any) => selector({}),
  useWorkspaces: (selector: any) => selector({ items: [] }), viewMode: 'projects', wide: true,
  workspaceGroupOf: () => '', workspaceGroups: [], workspaceIndexOf: new Map(),
  ...overrides,
})

test('the sidebar header search button opens the overlay', () => {
  let opened = 0
  const { render } = createLayout(layoutInput({ openSearch: () => { opened += 1 } }))
  const tree = render()
  const button = findAll(tree, (el) => el.props && el.props.className === 'bw-icon-btn' && el.props['aria-label'] === 'search.label')[0]
  assert.ok(button, 'the header search button is missing')
  assert.equal(button.props.title, 'search.label')
  button.props.onClick()
  assert.equal(opened, 1)
})

test('the collapsed rail magnifier expands the sidebar and opens the overlay', () => {
  const calls: string[] = []
  const { render } = createLayout(layoutInput({
    wide: false,
    expandSidebar: () => { calls.push('expand') },
    openSearch: () => { calls.push('search') },
  }))
  const tree = render()
  const button = findAll(tree, (el) => el.props && el.props.className === 'bw-rail-btn' && el.props['aria-label'] === 'rail.search')[0]
  assert.ok(button, 'the rail search button is missing')
  button.props.onClick()
  assert.deepEqual(calls, ['expand', 'search'])
})

// ----------------------------------------------------------- overlay panel
test('the overlay backdrop centres the panel in the viewport', () => {
  const overlay = /\.bw-search-overlay\{([^}]*)\}/.exec(CSS_TEXT)
  assert.ok(overlay, 'no .bw-search-overlay rule in the stylesheet')
  assert.match(overlay[1], /display:flex/, 'the backdrop lays the panel out')
  assert.match(overlay[1], /align-items:center/, 'the panel is vertically centred')
  assert.match(overlay[1], /justify-content:center/, 'the panel is horizontally centred')
  const panel = /\.bw-search-panel\{([^}]*)\}/.exec(CSS_TEXT)
  assert.ok(panel, 'no .bw-search-panel rule in the stylesheet')
  assert.doesNotMatch(panel[1], /left:\d/, 'no absolute corner anchor: the backdrop centres it')
  assert.doesNotMatch(panel[1], /top:\d/, 'the panel carries no fixed top offset')
  assert.doesNotMatch(panel[1], /backdrop-filter/, 'a blurred full-size surface would recompose on every hover repaint')
})

test('row hover is CSS-driven, never a React update', () => {
  const { tree } = renderOverlay({})
  const rows = byClass(tree, 'bw-search-row')
  assert.ok(rows.length > 0, 'the recent list rendered no rows')
  for (const row of rows) {
    assert.equal(row.props.onMouseEnter, undefined, 'a hover handler would run a render per row crossing')
    assert.equal(typeof row.props['data-session-id'], 'string', 'rows expose their session id for the hovered-Enter lookup')
  }
  assert.match(CSS_TEXT, /\.bw-search-row\{[^}]*transition:none/, 'no transition may delay the hover tint')
  assert.match(CSS_TEXT, /\.bw-search-list \.bw-search-row:hover\{background:/, 'the hovered row lights up in CSS')
  assert.match(CSS_TEXT, /\.bw-search-list:hover \.bw-search-row-active\{background:transparent\}/, 'the keyboard tint yields to the pointer')
})

test('Enter opens the row under the pointer when one is hovered', () => {
  const opened: string[] = []
  let closed = 0
  const { tree } = renderOverlay({
    onOpen: (sessionId: string) => { opened.push(sessionId) },
    onClose: () => { closed += 1 },
  })
  const previous = (globalThis as any).document
  ;(globalThis as any).document = {
    querySelector: () => ({ getAttribute: (name: string) => (name === 'data-session-id' ? 'c' : null) }),
  }
  try {
    pressKey(tree, 'Enter')
  } finally {
    ;(globalThis as any).document = previous
  }
  assert.deepEqual(opened, ['c'], 'Enter follows the pointer, not the stale keyboard index')
  assert.equal(closed, 1)
})

test('the overlay renders nothing while closed', () => {
  const runtime = new Runtime()
  runtime.component = SearchOverlay
  activeRuntime = runtime
  const tree = runtime.render({
    open: false, candidates: CANDIDATES, limit: 20,
    onOpen: () => {}, onClose: () => {}, t: (key: string) => key,
  })
  assert.equal(tree, null)
})

test('an empty query lists the most recent sessions with workspace labels and ⌃N hints', () => {
  const { tree } = renderOverlay({})
  const rows = byClass(tree, 'bw-search-row')
  assert.deepEqual(rows.map((row) => textOf(byClass(row, 'bw-search-row-title'))), ['Plan review', 'Ordinary chat', 'Git commit and push'])
  assert.equal(textOf(byClass(rows[0], 'bw-search-row-ws')), 'h5-member-grade')
  assert.equal(textOf(byClass(rows[1], 'bw-search-row-ws')), '', 'a session without a workspace carries no label')
  assert.equal(textOf(byClass(rows[2], 'bw-search-row-ws')), 'promo-dev')
  assert.equal(textOf(byClass(rows[1], 'bw-search-row-idx')), '⌃2')
  assert.equal(textOf(byClass(rows[2], 'bw-search-row-idx')), '⌃3')
  assert.equal(textOf(byClass(tree, 'bw-search-section')), 'search.section.chats')
  assert.equal(byClass(tree, 'bw-search-empty').length, 0)
  assert.equal(rows[0].props['aria-selected'], true, 'the first row starts active')
})

test('typing filters titles and workspace labels instantly', () => {
  const { runtime, tree } = renderOverlay({})
  const typed = typeQuery(runtime, tree, 'PLAN')
  const rows = byClass(typed, 'bw-search-row')
  assert.equal(rows.length, 1)
  assert.equal(textOf(byClass(rows[0], 'bw-search-row-title')), 'Plan review')
  assert.equal(byClass(typed, 'bw-search-row-snippet').length, 0, 'title-only matches carry no snippet')
})

test('a workspace label match also returns the session', () => {
  const { runtime, tree } = renderOverlay({})
  const typed = typeQuery(runtime, tree, 'h5-member')
  const rows = byClass(typed, 'bw-search-row')
  assert.equal(rows.length, 1)
  assert.equal(textOf(byClass(rows[0], 'bw-search-row-title')), 'Plan review')
})

test('the Host content page is merged behind local matches, snippets included', async () => {
  const calls: Array<{ query: string; signal: any }> = []
  const { runtime, tree } = renderOverlay({
    searchSessions: async (query: string, signal: any) => {
      calls.push({ query, signal })
      return {
        items: [
          { sessionId: 'b', snippet: '…plan review…' },
          { sessionId: 'a', snippet: '…git commit…' },
        ],
        hasMore: false,
      }
    },
  })
  const typed = typeQuery(runtime, tree, 'plan')
  assert.equal(textOf(byClass(typed, 'bw-search-status')), 'search.pending', 'the debounce shows a searching state')
  await new Promise((resolve) => setTimeout(resolve, 260))
  await runtime.settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].query, 'plan')
  const rows = byClass(runtime.tree, 'bw-search-row')
  assert.deepEqual(rows.map((row) => textOf(byClass(row, 'bw-search-row-title'))), ['Plan review', 'Git commit and push'])
  assert.equal(textOf(byClass(rows[0], 'bw-search-row-snippet')), '…plan review…', 'a local match receives the content snippet in place')
  assert.equal(textOf(byClass(rows[1], 'bw-search-row-snippet')), '…git commit…')
})

test('content-only hits appear in Host order and unknown sessions are dropped', async () => {
  const { runtime, tree } = renderOverlay({
    searchSessions: async () => ({
      items: [
        { sessionId: 'vanished', snippet: 'gone' },
        { sessionId: 'c', snippet: '…deploy notes…' },
        { sessionId: 'a', snippet: '…deploy script…' },
      ],
      hasMore: false,
    }),
  })
  typeQuery(runtime, tree, 'deploy')
  await new Promise((resolve) => setTimeout(resolve, 260))
  await runtime.settle()
  const rows = byClass(runtime.tree, 'bw-search-row')
  assert.deepEqual(rows.map((row) => row.props.key), ['c', 'a'])
  assert.equal(textOf(byClass(rows[0], 'bw-search-row-snippet')), '…deploy notes…')
})

test('a Host search failure keeps the local title matches', async () => {
  const { runtime, tree } = renderOverlay({
    searchSessions: async () => { throw new Error('no content index') },
  })
  const typed = typeQuery(runtime, tree, 'plan')
  await new Promise((resolve) => setTimeout(resolve, 260))
  await runtime.settle()
  const rows = byClass(runtime.tree, 'bw-search-row')
  assert.deepEqual(rows.map((row) => textOf(byClass(row, 'bw-search-row-title'))), ['Plan review'])
  assert.equal(byClass(runtime.tree, 'bw-search-status').length, 0, 'a failed content search shows no status line')
  assert.equal(typed && true, true)
})

test('an older Host without content search degrades to title matching', () => {
  const { runtime, tree } = renderOverlay({})
  const typed = typeQuery(runtime, tree, 'chat')
  const rows = byClass(typed, 'bw-search-row')
  assert.deepEqual(rows.map((row) => textOf(byClass(row, 'bw-search-row-title'))), ['Ordinary chat'])
  assert.equal(byClass(typed, 'bw-search-status').length, 0, 'no searching state without a content backend')
})

test('query keeps updating the local matches when the content backend answers late', async () => {
  let resolvers: Array<(page: any) => void> = []
  const { runtime, tree } = renderOverlay({
    searchSessions: () => new Promise((resolve) => { resolvers.push(resolve) }),
  })
  typeQuery(runtime, tree, 'plan')
  await new Promise((resolve) => setTimeout(resolve, 220))
  typeQuery(runtime, runtime.tree, 'git')
  await new Promise((resolve) => setTimeout(resolve, 220))
  assert.equal(resolvers.length, 2, 'each settled query asked the Host once')
  // The first (stale) answer must not paint over the newer query.
  resolvers[0]({ items: [{ sessionId: 'b', snippet: 'stale plan' }], hasMore: false })
  await runtime.settle()
  resolvers[1]({ items: [{ sessionId: 'a', snippet: 'fresh git' }], hasMore: false })
  await runtime.settle()
  const rows = byClass(runtime.tree, 'bw-search-row')
  assert.deepEqual(rows.map((row) => row.props.key), ['a'])
})

test('keyboard: ArrowDown/ArrowUp wrap the highlight, Enter opens the active row', () => {
  const opened: string[] = []
  let closed = 0
  const { runtime, tree } = renderOverlay({
    onOpen: (sessionId: string) => { opened.push(sessionId) },
    onClose: () => { closed += 1 },
  })
  let current = tree
  pressKey(current, 'ArrowDown')
  current = runtime.render(runtime.props)
  assert.equal(byClass(current, 'bw-search-row-active')[0].props['aria-selected'], true)
  assert.equal(textOf(byClass(byClass(current, 'bw-search-row-active')[0], 'bw-search-row-title')), 'Ordinary chat')
  pressKey(current, 'ArrowDown')
  current = runtime.render(runtime.props)
  assert.equal(textOf(byClass(byClass(current, 'bw-search-row-active')[0], 'bw-search-row-title')), 'Git commit and push')
  pressKey(current, 'ArrowDown')
  current = runtime.render(runtime.props)
  assert.equal(textOf(byClass(byClass(current, 'bw-search-row-active')[0], 'bw-search-row-title')), 'Plan review', 'wraps to the first row')
  pressKey(current, 'ArrowUp')
  current = runtime.render(runtime.props)
  assert.equal(textOf(byClass(byClass(current, 'bw-search-row-active')[0], 'bw-search-row-title')), 'Git commit and push')
  const enter = pressKey(current, 'Enter')
  assert.equal(enter.defaultPrevented, true)
  assert.deepEqual(opened, ['a'])
  assert.equal(closed, 1, 'opening a result closes the panel')
})

test('keyboard navigation owns the highlight until the pointer moves again', () => {
  const { runtime, tree } = renderOverlay({})
  pressKey(tree, 'ArrowDown')
  let current = runtime.render(runtime.props)
  assert.equal(byClass(current, 'bw-search-list-keys').length, 1, 'arrow keys switch the list into keyboard-highlight mode')
  const list = byClass(current, 'bw-search-list')[0]
  list.props.onMouseMove()
  current = runtime.render(runtime.props)
  assert.equal(byClass(current, 'bw-search-list-keys').length, 0, 'pointer movement hands the highlight back to CSS :hover')
  assert.match(CSS_TEXT, /\.bw-search-list-keys:hover \.bw-search-row-active\{background:/, 'the keyboard tint beats the pointer in keyboard mode')
  assert.match(CSS_TEXT, /\.bw-search-list-keys \.bw-search-row:hover\{background:transparent\}/, 'the hover tint is suppressed in keyboard mode')
})

test('keyboard: Ctrl/Meta + 1-9 opens that row directly, Escape closes', () => {
  const opened: string[] = []
  let closed = 0
  const { runtime, tree } = renderOverlay({
    onOpen: (sessionId: string) => { opened.push(sessionId) },
    onClose: () => { closed += 1 },
  })
  const root = byClass(tree, 'bw-search-overlay')[0]
  root.props.onKeyDown({ key: '3', ctrlKey: true, preventDefault: () => {}, stopPropagation: () => {} })
  assert.deepEqual(opened, ['a'])
  assert.equal(closed, 1)
  const escape = pressKey(tree, 'Escape')
  assert.equal(escape.defaultPrevented, true)
  assert.equal(escape.propagationStopped, true)
  assert.equal(closed, 2)
})

test('clicking the backdrop closes the panel, clicking the card does not', () => {
  let closed = 0
  const { tree } = renderOverlay({ onClose: () => { closed += 1 } })
  const root = byClass(tree, 'bw-search-overlay')[0]
  const panel = byClass(tree, 'bw-search-panel')[0]
  let propagationStopped = false
  panel.props.onMouseDown({ stopPropagation: () => { propagationStopped = true } })
  assert.equal(propagationStopped, true)
  assert.equal(closed, 0)
  root.props.onMouseDown()
  assert.equal(closed, 1)
})

test('the result cap reports hasMore and the panel states its role', async () => {
  const { runtime, tree } = renderOverlay({ limit: 1, searchSessions: async () => ({ items: [], hasMore: false }) })
  typeQuery(runtime, tree, 'a')
  await new Promise((resolve) => setTimeout(resolve, 260))
  await runtime.settle()
  const settled = runtime.tree
  assert.equal(byClass(settled, 'bw-search-row').length, 1)
  assert.equal(textOf(byClass(settled, 'bw-search-status')), 'search.hasMore:1')
  assert.equal(byClass(settled, 'bw-search-panel')[0].props.role, 'dialog')
  assert.equal(byClass(settled, 'bw-search-list')[0].props.role, 'listbox')
})

test('an empty result set explains itself only once the search has settled', async () => {
  const { runtime, tree } = renderOverlay({ searchSessions: async () => ({ items: [], hasMore: false }) })
  const typed = typeQuery(runtime, tree, 'nothing-matches')
  assert.equal(byClass(typed, 'bw-search-empty').length, 0, 'a pending search must not claim "no matches"')
  await new Promise((resolve) => setTimeout(resolve, 260))
  await runtime.settle()
  assert.equal(textOf(byClass(runtime.tree, 'bw-search-empty')), 'search.empty')
})
