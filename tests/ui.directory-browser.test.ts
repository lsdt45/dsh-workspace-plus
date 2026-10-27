/**
 * Browse fallback — the in-app directory picker used when the Host only serves
 * the `browse` capability. It must be usable without a native chooser:
 * navigate levels, reveal hidden folders, create a folder, and pick the
 * current directory.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { installPlatform } from '../src/client/platform.ts'
import { DirectoryBrowser } from '../src/client/ui/directory-browser.ts'
import { BetterFlow } from '../src/client/ui/flow.ts'

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

const sameDeps = (left: any[], right: any[]): boolean => (
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]))
)

let activeRuntime: Runtime | null = null

const reactFacade = {
  createElement: (type: any, props: any, ...children: any[]) => {
    const base = props || {}
    const merged = children.length === 0
      ? base
      : Object.assign({}, base, { children: children.length === 1 ? children[0] : children })
    return { type, props: merged, children }
  },
  Component: class Component { props: any; constructor(props: any) { this.props = props } },
  useState: (value: any) => activeRuntime!.useState(value),
  useRef: (value: any) => activeRuntime!.useRef(value),
  useMemo: (factory: () => any, deps?: any[]) => activeRuntime!.useMemo(factory, deps),
  useEffect: (fn: () => any, deps?: any[]) => activeRuntime!.useEffect(fn, deps),
}

const uiStub = {
  Modal: (props: any) => reactFacade.createElement('div', { className: 'test-modal' }, props.children, props.footer),
  IconFolderClose16: () => reactFacade.createElement('svg', { className: 'test-folder-icon' }),
  IconChevronRightOutline14: () => reactFacade.createElement('svg', { className: 'test-chevron-icon' }),
}

installPlatform((name: string) => {
  const modules: Record<string, any> = {
    react: reactFacade,
    '@deepseek-ai/dsh-client-store': { defineStore: () => ({}) },
    '@deepseek-ai/dsh-client-ui-primitives': uiStub,
  }
  if (!(name in modules)) throw new Error('unexpected platform module: ' + name)
  return modules[name]
})

// BetterFlow installs one document-level pointerdown listener while open.
// The hook runtime runs effects, so the DOM stub has to exist even though no
// pointer event is dispatched here.
;(globalThis as any).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
}

// ------------------------------------------------------------- tree helpers
function deepRender(node: any): any {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map(deepRender)
  if (typeof node.type === 'function') return deepRender(node.type(node.props || {}))
  const props = node.props || {}
  const children = props.children
  return {
    type: node.type,
    props,
    children: children === undefined
      ? []
      : (Array.isArray(children) ? children.map(deepRender) : [deepRender(children)]),
  }
}

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

const buttonByText = (tree: any, text: string): any => {
  const hits = findAll(tree, (element) => element.type === 'button' && textOf(element).includes(text))
  assert.ok(hits.length > 0, 'button "' + text + '" did not render')
  return hits[0]
}

// ------------------------------------------------------------- fixtures
const crumb = (name: string, path: string) => ({ name, path, hidden: false })

const home = {
  path: '/home', home: '/home',
  entries: [
    { name: 'alpha', path: '/home/alpha', hidden: false },
    { name: 'beta', path: '/home/beta', hidden: false },
    { name: '.config', path: '/home/.config', hidden: true },
  ],
  crumbs: [crumb('/', '/'), crumb('home', '/home')],
  truncated: false,
}

const alpha = {
  path: '/home/alpha', home: '/home',
  entries: [{ name: 'child', path: '/home/alpha/child', hidden: false }],
  crumbs: [crumb('/', '/'), crumb('home', '/home'), crumb('alpha', '/home/alpha')],
  truncated: false,
}

const created = {
  path: '/home/fresh', home: '/home',
  entries: [],
  crumbs: [crumb('/', '/'), crumb('home', '/home'), crumb('fresh', '/home/fresh')],
  truncated: false,
}

function renderBrowser(overrides: Record<string, any> = {}) {
  const runtime = new Runtime()
  runtime.component = DirectoryBrowser
  activeRuntime = runtime
  const props = {
    listDirectory: async (path?: string) => {
      if (path === undefined || path === '/home') return home
      if (path === '/home/alpha') return alpha
      if (path === '/home/fresh') return created
      throw new Error('unexpected path: ' + path)
    },
    createDirectory: async () => '/home/fresh',
    onPicked: () => {},
    onCancel: () => {},
    t: (key: string) => key,
    ...overrides,
  }
  const tree = runtime.render(props)
  return { runtime, props, tree: deepRender(tree) }
}

test('the fallback lists the home directory and hides dot folders by default', async () => {
  const calls: Array<string | undefined> = []
  const { runtime } = renderBrowser({
    listDirectory: async (path?: string) => {
      calls.push(path)
      return home
    },
  })
  await runtime.settle()
  const tree = deepRender(runtime.tree)
  assert.deepEqual(calls, [undefined], 'the first scan asks for the Host home')
  assert.equal(byClass(tree, 'bw-browse-row').length, 2, 'two visible folders')
  assert.equal(byClass(tree, 'bw-browse-crumb').length, 1, 'the home level collapses to the Home crumb')

  byClass(tree, 'bw-browse-hidden')[0].props.onClick()
  const shown = deepRender(runtime.render(runtime.props))
  assert.equal(byClass(shown, 'bw-browse-row').length, 3, 'the hidden toggle reveals dot folders')
})

test('entering a folder and picking the current level reports its path', async () => {
  const calls: Array<string | undefined> = []
  const picked: string[] = []
  const { runtime } = renderBrowser({
    listDirectory: async (path?: string) => {
      calls.push(path)
      if (path === undefined) return home
      if (path === '/home/alpha') return alpha
      throw new Error('unexpected path: ' + path)
    },
    onPicked: (path: string) => { picked.push(path) },
  })
  await runtime.settle()
  let tree = deepRender(runtime.tree)

  const row = byClass(tree, 'bw-browse-row').find((button) => textOf(button) === 'alpha')
  assert.ok(row, 'the alpha folder row is missing')
  row.props.onClick()
  await runtime.settle()
  tree = deepRender(runtime.tree)

  assert.deepEqual(calls, [undefined, '/home/alpha'], 'a row click lists that level')
  assert.ok(byClass(tree, 'bw-browse-crumb').some((crumbButton) => textOf(crumbButton) === 'alpha'), 'the crumb follows the level')

  buttonByText(tree, 'browse.open').props.onClick()
  assert.deepEqual(picked, ['/home/alpha'], 'the pick action reports the listed path')
})

test('the fallback can create a folder and enter it', async () => {
  const createdCalls: Array<[string, string]> = []
  const listings: Array<string | undefined> = []
  const { runtime } = renderBrowser({
    listDirectory: async (path?: string) => {
      listings.push(path)
      if (path === undefined) return home
      if (path === '/home/fresh') return created
      throw new Error('unexpected path: ' + path)
    },
    createDirectory: async (path: string, name: string) => {
      createdCalls.push([path, name])
      return '/home/fresh'
    },
  })
  await runtime.settle()
  let tree = deepRender(runtime.tree)

  buttonByText(tree, 'browse.newFolder').props.onClick()
  tree = deepRender(runtime.render(runtime.props))
  const input = byClass(tree, 'bw-input')[0]
  assert.ok(input, 'the new-folder field is missing')
  input.props.onChange({ target: { value: 'fresh' } })
  tree = deepRender(runtime.render(runtime.props))

  buttonByText(tree, 'browse.create').props.onClick()
  await runtime.settle()

  assert.deepEqual(createdCalls, [['/home', 'fresh']], 'the child directory is created under the listed level')
  assert.deepEqual(listings, [undefined, '/home/fresh'], 'the flow enters the created directory')
  assert.equal(byClass(deepRender(runtime.tree), 'bw-browse-row').length, 0, 'the created empty level renders no rows')
})

test('retry re-requests the failed level, not the still-rendered previous one', async () => {
  const calls: Array<string | undefined> = []
  let failOnce = true
  const { runtime } = renderBrowser({
    listDirectory: async (path?: string) => {
      calls.push(path)
      if (path === undefined) return home
      if (path === '/home/alpha') {
        if (failOnce) {
          failOnce = false
          throw Object.assign(new Error('directory browse failed'), {
            rpcError: { code: 'directory-picker/unreadable', message: 'permission denied' },
          })
        }
        return alpha
      }
      throw new Error('unexpected path: ' + path)
    },
  })
  await runtime.settle()
  let tree = deepRender(runtime.tree)
  const row = byClass(tree, 'bw-browse-row').find((button) => textOf(button) === 'alpha')
  assert.ok(row, 'the alpha folder row is missing')
  row.props.onClick()
  await runtime.settle()
  tree = deepRender(runtime.tree)
  assert.match(textOf(byClass(tree, 'bw-browse-error')[0]), /permission denied/)

  buttonByText(tree, 'browse.retry').props.onClick()
  await runtime.settle()
  assert.deepEqual(calls, [undefined, '/home/alpha', '/home/alpha'], 'retry targets the failed level')
  assert.equal(byClass(deepRender(runtime.tree), 'bw-browse-row').length, 1, 'the retried level renders')
})

test('a listing failure stays inside the dialog and offers a retry', async () => {
  let calls = 0
  const { runtime } = renderBrowser({
    listDirectory: async () => {
      calls += 1
      throw Object.assign(new Error('directory browse failed'), {
        rpcError: { code: 'directory-picker/unreadable', message: 'permission denied' },
      })
    },
  })
  await runtime.settle()
  const tree = deepRender(runtime.tree)

  const alerts = byClass(tree, 'bw-browse-error')
  assert.equal(alerts.length, 1, 'the failure renders in the dialog')
  assert.match(textOf(alerts[0]), /permission denied/)
  buttonByText(tree, 'browse.retry').props.onClick()
  await runtime.settle()
  assert.equal(calls, 2, 'retry re-runs the listing')
})

test('BetterFlow switches to the in-app browser only for a browse-only Host', async () => {
  const errors: string[] = []
  const browseOnly = new Error(
    'directory picker failed: directoryPicker.pick needs the native capability; the composed picker serves "browse"',
  )
  const runtime = new Runtime()
  runtime.component = BetterFlow
  activeRuntime = runtime
  const props = {
    open: true,
    onCancel: () => {},
    onError: (message: string) => { errors.push(message) },
    createWorkspace: async () => ({ workspaceId: 'w1' }),
    renameWorkspace: async () => {},
    pickDirectory: async () => { throw browseOnly },
    listDirectory: async () => home,
    createDirectory: async () => '/home/fresh',
    t: (key: string) => key,
  }
  runtime.render(props)
  await runtime.settle()

  assert.equal(runtime.tree && runtime.tree.type, DirectoryBrowser, 'the flow renders the in-app browser')
  assert.deepEqual(errors, [], 'the browse-only refusal is recovered, not surfaced')
})

test('BetterFlow still surfaces a genuine native-chooser failure', async () => {
  const errors: string[] = []
  const runtime = new Runtime()
  runtime.component = BetterFlow
  activeRuntime = runtime
  const props = {
    open: true,
    onCancel: () => {},
    onError: (message: string) => { errors.push(message) },
    createWorkspace: async () => ({ workspaceId: 'w1' }),
    renameWorkspace: async () => {},
    pickDirectory: async () => { throw new Error('directory picker failed: spawn zenity ENOENT') },
    listDirectory: async () => home,
    createDirectory: async () => '/home/fresh',
    t: (key: string) => key,
  }
  runtime.render(props)
  await runtime.settle()

  assert.equal(errors.length, 1, 'the native failure reaches the owner error surface')
  assert.match(errors[0], /zenity ENOENT/)
  assert.equal(runtime.tree, null, 'no browse fallback is invented for a native host')
})

test('closing the fallback dialog cancels the add-workspace flow', () => {
  let cancelled = 0
  const { runtime } = renderBrowser({ onCancel: () => { cancelled += 1 } })
  const modal = runtime.tree
  assert.equal(typeof modal.props.onClose, 'function')
  modal.props.onClose()
  assert.equal(cancelled, 1)
})
