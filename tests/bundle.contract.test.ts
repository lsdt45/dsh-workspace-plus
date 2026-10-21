/**
 * Bundle contract test — the guard that the shipped dist/client.js is a loadable
 * DSH client bundle.
 *
 * The platform loads the artifact as a classic script that calls
 * window.__ModuleLoader__.load({ id, factory }) exactly once; the host answers
 * the factory's require() from the module table. This test reproduces that
 * contract in Node with stubs, so a broken build (or a source file that no
 * longer reaches the entry) fails here instead of in the browser.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const BUNDLE = new URL('../dist/client.js', import.meta.url)

/** Registration captured from the artifact, since the loader facade is a stub here. */
let registration: any = null
;(globalThis as any).window = {
  __ModuleLoader__: {
    load: (value: any) => { registration = value },
  },
}

/** Minimal platform stubs: the factory only needs these shapes at load time. */
const react = {
  createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }),
  Component: class Component {
    props: any
    constructor(props: any) { this.props = props }
  },
  useState: (value: any) => [value, () => {}],
  useRef: (value: any) => ({ current: value }),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (factory: () => any) => factory(),
}
const storeKit = {
  defineStore: (definition: any) => {
    const state = definition.init()
    const actions: Record<string, (...args: any[]) => any> = {}
    for (const [name, action] of Object.entries(definition.actions || {}) as Array<[string, (...args: any[]) => any]>) {
      actions[name] = (...args: any[]) => action(state, ...args)
    }
    return { definition, state, actions }
  },
}
const ui: any = {}
const platformModules: Record<string, any> = {
  react,
  '@deepseek-ai/dsh-client-store': storeKit,
  '@deepseek-ai/dsh-client-ui-primitives': ui,
}
const hostRequire = (name: string): any => {
  if (!(name in platformModules)) throw new Error('unexpected platform request: ' + name)
  return platformModules[name]
}

await import(BUNDLE.href)

test('the artifact registers exactly one loader factory under the plugin id', () => {
  assert.ok(registration, 'window.__ModuleLoader__.load() was never called')
  assert.equal(registration.id, 'dsh-workspace-plus')
  assert.equal(typeof registration.factory, 'function')
})

test('the factory returns the cordis plugin face and answers only platform modules', () => {
  const plugin = registration.factory(hostRequire)
  assert.equal(plugin.name, 'dsh-workspace-plus')
  assert.deepEqual(plugin.inject, ['slots', 'sessions', 'workspaces', 'locale', 'uiWorkspace'])
  assert.equal(typeof plugin.apply, 'function')
})

/**
 * Slot kinds the frame declares for the seats this plugin occupies. The real
 * slot core validates every registration against its declaration and THROWS on
 * a mismatch (a LIST slot without an id, a KEYED slot without a key); the
 * plugin's own guard swallows such a throw, so an omitted option would drop the
 * seat silently. Mirroring the kinds here makes that failure visible.
 */
const SLOT_KINDS: Record<string, 'single' | 'keyed' | 'list'> = {
  'conversation.header.leading': 'single',
  'conversation.hero.workspace.directoryFlow': 'single',
  'plugins.bundle.config': 'keyed',
  'shell.overlay': 'list',
  'sidebar.workspaces': 'single',
  'sidebar.workspaces.directoryFlow': 'single',
}

/** Capture what apply() registers against a stub client context. */
function applyAgainstStubContext() {
  const injected: Array<[string, any]> = []
  const dictionaries: Array<[string, any]> = []
  /** Every registration options object the injected factories produced. */
  const registered: Array<Record<string, any>> = []
  const slots = {
    register: (options: Record<string, any>) => {
      const kind = SLOT_KINDS[options.name]
      if (kind === 'list' && (typeof options.id !== 'string' || options.id === '')) {
        throw new Error('list slot "' + options.name + '" requires options.id')
      }
      if (kind === 'keyed' && options.key === undefined) {
        throw new Error('keyed slot "' + options.name + '" requires options.key')
      }
      registered.push(options)
      return () => {}
    },
    // The frame calls the injected factory once the hole is declared. Running it
    // here is what exposes per-kind registration requirements (a LIST slot
    // rejects a registration without an id) to the contract tests below.
    inject: (hole: string, factory: any) => { injected.push([hole, factory]); factory() },
    entries: () => [],
    subscribe: () => () => {},
  }
  const services: Record<string, any> = {
    slots,
    sessions: { search: async () => ({ ok: true, value: [] }), binding: () => null, fork: async () => 'child' },
    workspaces: { rename: async () => {}, delete: async () => {}, create: async () => {} },
    uiWorkspace: { openSession: () => {}, startSession: () => {}, archiveSession: () => {}, pickDirectory: () => {} },
  }
  const ctx = {
    get: (name: string) => services[name],
    effect: (factory: () => void) => { factory() },
    locale: { register: (namespace: string, value: any) => { dictionaries.push([namespace, value]); return () => {} } },
    logger: { info: () => {}, warn: () => {}, error: () => {} },
  }
  const plugin = registration.factory(hostRequire)
  plugin.apply(ctx)
  return { injected, dictionaries, registered }
}

test('apply() occupies the six seats and registers the dictionary', () => {
  const { injected, dictionaries } = applyAgainstStubContext()
  const holes = injected.map(([hole]) => hole).sort()
  assert.deepEqual(holes, [
    // Session tabs: the chip row rides the free leading seat of the conversation
    // header (the band's far left), before the session title.
    'conversation.header.leading',
    'conversation.hero.workspace.directoryFlow',
    // The plugin page in Settings → Plugins dispatches this keyed slot by the
    // bundle's package name; the older settings.plugin.item card slot is not
    // dispatched by this shell.
    'plugins.bundle.config',
    // Search panel: a root-scoped overlay seat, so the floating panel is not
    // clipped by the sidebar's own container.
    'shell.overlay',
    'sidebar.workspaces',
    'sidebar.workspaces.directoryFlow',
  ])
  assert.equal(dictionaries.length, 1)
  assert.equal(dictionaries[0][0], 'betterWorkspace')
})

test('every seat registration satisfies its slot kind', () => {
  const { registered } = applyAgainstStubContext()
  const byName = new Map(registered.map((options) => [options.name, options]))
  assert.deepEqual(registered.map((options) => options.name).sort(), [
    'conversation.header.leading',
    'conversation.hero.workspace.directoryFlow',
    'plugins.bundle.config',
    'shell.overlay',
    'sidebar.workspaces',
    'sidebar.workspaces.directoryFlow',
  ])
  // The frame declares shell.overlay as a LIST slot and the slot core throws
  // "list slot requires options.id" on a registration without one; the thrown
  // register is swallowed by the guard, which would silently drop the panel.
  assert.equal(typeof byName.get('shell.overlay')!.id, 'string')
  assert.ok(byName.get('shell.overlay')!.id.length > 0, 'list slots need a non-empty id')
  // plugins.bundle.config is a KEYED slot: the shell renders the entry whose
  // key equals the bundle's package name.
  assert.equal(byName.get('plugins.bundle.config')!.key, 'dsh-workspace-plus')
  // Every other seat is a SINGLE slot: no key/id may be passed (single slots
  // throw when two entries share one priority).
  for (const name of ['conversation.header.leading', 'conversation.hero.workspace.directoryFlow', 'sidebar.workspaces', 'sidebar.workspaces.directoryFlow']) {
    assert.equal(byName.get(name)!.id, undefined, name + ' is single and must not carry an id')
    assert.equal(byName.get(name)!.key, undefined, name + ' is single and must not carry a key')
  }
})

test('the zh and en dictionaries carry the same keys', () => {
  const { dictionaries } = applyAgainstStubContext()
  const [, value] = dictionaries[0]
  const zh = Object.keys(value.zh).sort()
  const en = Object.keys(value.en).sort()
  assert.deepEqual(zh, en)
  assert.ok(zh.length > 100, 'dictionary looks truncated: ' + zh.length + ' keys')
})

test('apply() stays inert when the slots service is missing', () => {
  const plugin = registration.factory(hostRequire)
  const ctx = { get: () => undefined, effect: () => {}, logger: { warn: () => {}, error: () => {} } }
  assert.doesNotThrow(() => plugin.apply(ctx))
})

test('the committed artifact carries the generated banner', () => {
  const text = readFileSync(BUNDLE, 'utf8')
  assert.match(text, /^\/\* GENERATED FILE — do not edit\./)
  assert.match(text, /window\.__ModuleLoader__\.load\(/)
})
