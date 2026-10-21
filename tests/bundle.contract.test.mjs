/**
 * Bundle contract test — the guard that the shipped src/client.js is a loadable
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

const BUNDLE = new URL('../src/client.js', import.meta.url)

/** Registration captured from the artifact, since the loader facade is a stub here. */
let registration = null
globalThis.window = {
  __ModuleLoader__: {
    load: (value) => { registration = value },
  },
}

/** Minimal platform stubs: the factory only needs these shapes at load time. */
const react = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Component: class Component { constructor(props) { this.props = props } },
  useState: (value) => [value, () => {}],
  useRef: (value) => ({ current: value }),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (factory) => factory(),
}
const storeKit = {
  defineStore: (definition) => {
    const state = definition.init()
    const actions = {}
    for (const [name, action] of Object.entries(definition.actions || {})) {
      actions[name] = (...args) => action(state, ...args)
    }
    return { definition, state, actions }
  },
}
const ui = {}
const platformModules = {
  react,
  '@deepseek-ai/dsh-client-store': storeKit,
  '@deepseek-ai/dsh-client-ui-primitives': ui,
}
const hostRequire = (name) => {
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

/** Capture what apply() registers against a stub client context. */
function applyAgainstStubContext() {
  const injected = []
  const dictionaries = []
  const slots = {
    register: () => () => {},
    inject: (hole, factory) => { injected.push([hole, factory]) },
    entries: () => [],
    subscribe: () => () => {},
  }
  const services = {
    slots,
    sessions: { search: async () => ({ ok: true, value: [] }), binding: () => null, fork: async () => 'child' },
    workspaces: { rename: async () => {}, delete: async () => {}, create: async () => {} },
    uiWorkspace: { openSession: () => {}, startSession: () => {}, archiveSession: () => {}, pickDirectory: () => {} },
  }
  const ctx = {
    get: (name) => services[name],
    effect: (factory) => { factory() },
    locale: { register: (namespace, value) => { dictionaries.push([namespace, value]); return () => {} } },
    logger: { info: () => {}, warn: () => {}, error: () => {} },
  }
  const plugin = registration.factory(hostRequire)
  plugin.apply(ctx)
  return { injected, dictionaries }
}

test('apply() occupies the five seats and registers the dictionary', () => {
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
    'sidebar.workspaces',
    'sidebar.workspaces.directoryFlow',
  ])
  assert.equal(dictionaries.length, 1)
  assert.equal(dictionaries[0][0], 'betterWorkspace')
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
