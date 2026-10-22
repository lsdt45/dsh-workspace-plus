/**
 * Tab strip overflow — the "all tabs" panel and the stylesheet contract that
 * keeps a hidden chip reachable.
 *
 * The panel is rendered with a minimal hook runtime (same shape as
 * ui.search.test.ts) because its contract is interactive: hover moves the
 * keyboard cursor, Enter switches, Esc closes, the per-row cross closes a tab
 * without also switching to it. The overflow detection itself needs real
 * layout, so it is covered by the live-browser check instead of this file; the
 * CSS assertions here pin the rules that check depends on.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { installPlatform } from '../src/client/platform.ts'
import { StatusDot } from '../src/client/rows.ts'
import { CSS_TEXT } from '../src/client/styles.ts'
import { TabsOverflowMenu } from '../src/client/tabs-strip.ts'

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

  useEffect(fn: () => any, deps?: any[]): void {
    const index = this.hookIndex++
    const previous = this.effects[index]
    if (previous && deps && previous.deps && sameDeps(deps, previous.deps)) return
    this.effects[index] = { deps: deps ? deps.slice() : undefined, cleanup: previous ? previous.cleanup : undefined }
    this.pendingEffects.push({ index, fn })
  }

  render(props: any): any {
    this.props = props
    for (let pass = 0; pass < 20; pass++) {
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
}

const sameDeps = (left: any[], right: any[]): boolean => left.length === right.length && left.every((value, index) => Object.is(value, right[index]))

let activeRuntime: Runtime | null = null

/** React facade: the component reads the platform handles, which route here. */
const reactFacade = {
  createElement: (type: any, props: any, ...children: any[]) => ({ type, props: props || {}, children }),
  Component: class Component { props: any; constructor(props: any) { this.props = props } },
  useState: (value: any) => activeRuntime!.useState(value),
  useRef: (value: any) => activeRuntime!.useRef(value),
  useEffect: (fn: () => any, deps?: any[]) => activeRuntime!.useEffect(fn, deps),
  useLayoutEffect: (fn: () => any, deps?: any[]) => activeRuntime!.useEffect(fn, deps),
}

const uiStub = {
  StateDot: (props: any) => reactFacade.createElement('span', { className: 'test-state-dot', 'data-state': props.state }),
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

// ------------------------------------------------------------- tree helpers
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

// --------------------------------------------------------------- fixtures
const TABS = ['a', 'b', 'c', 'd', 'e']
const TITLES: Record<string, string> = {
  a: 'Alpha chat',
  b: 'Beta chat',
  c: 'Gamma chat',
  d: 'Delta chat',
  e: 'Epsilon chat',
}
const STATES: Record<string, string> = { c: 'ongoing' }

interface Calls {
  select: string[]
  close: number
  closeTab: string[]
  context: string[]
}

function renderMenu(overrides: Record<string, any> = {}) {
  const calls: Calls = { select: [], close: 0, closeTab: [], context: [] }
  const runtime = new Runtime()
  runtime.component = TabsOverflowMenu
  activeRuntime = runtime
  const props = {
    tabs: TABS,
    activeId: 'b',
    titleOf: (id: string) => TITLES[id] || id,
    stateOf: (id: string) => STATES[id] || null,
    statusDots: true,
    t: (key: string, vars?: any) => (vars && vars.n !== undefined ? key + ':' + vars.n : key),
    anchor: { left: 100, right: 140, top: 8, bottom: 32 },
    onSelect: (id: string) => { calls.select.push(id) },
    onClose: () => { calls.close += 1 },
    onCloseTab: (_event: any, id: string) => { calls.closeTab.push(id) },
    onContextMenu: (id: string) => { calls.context.push(id) },
    ...overrides,
  }
  const tree = runtime.render(props)
  return { runtime, tree, calls, props }
}

const menuRoot = (tree: any): any => {
  const root = byClass(tree, 'bw-tabs-menu')[0]
  assert.ok(root, 'the overflow panel is missing')
  return root
}

const rows = (tree: any): any[] => byClass(tree, 'bw-tabs-menu-row')

const press = (tree: any, key: string) => {
  const root = menuRoot(tree)
  let prevented = false
  root.props.onKeyDown({ key, preventDefault: () => { prevented = true }, stopPropagation: () => {} })
  return prevented
}

// ------------------------------------------------------------------ tests
test('the panel lists every open tab, marks the active one and labels the count', () => {
  const { tree } = renderMenu()
  assert.equal(rows(tree).length, TABS.length, 'every tab gets a row, visible or not')
  assert.deepEqual(rows(tree).map((row) => textOf(byClass(row, 'bw-tabs-menu-label')[0])), TABS.map((id) => TITLES[id]))
  assert.equal(textOf(byClass(tree, 'bw-tabs-menu-head')[0]), 'tabs.menuCount:5')
  assert.equal(textOf(byClass(tree, 'bw-tabs-menu-hint')[0]), 'tabs.menuHint')
  const active = rows(tree).filter((row) => row.props['aria-current'] === 'true')
  assert.equal(active.length, 1, 'exactly one row is the session on screen')
  assert.equal(byClass(active[0], 'bw-tabs-menu-check').length, 1, 'the active row carries the check glyph')
  // The menu reuses rows.ts' StatusDot (a component element — its class is drawn
  // inside), so match on the element type instead of a class name.
  const withDot = rows(tree).filter((row) => (row.children || []).some((child: any) => child && child.type === StatusDot))
  assert.equal(withDot.length, 1, 'only the running tab draws a status dot')
  assert.equal(byClass(tree, 'bw-tabs-menu-label').length, TABS.length)
})

test('clicking a row switches to that tab; the per-row cross closes it instead', () => {
  const { tree, calls } = renderMenu()
  rows(tree)[3].props.onClick()
  assert.deepEqual(calls.select, ['d'], 'the row click asks the strip to switch')

  // Closing must not also switch: the cross stops the row's click.
  let stopped = false
  const closeButton = byClass(rows(tree)[4], 'bw-tabs-menu-close')[0]
  assert.ok(closeButton, 'the row has a close cross')
  closeButton.props.onClick({ stopPropagation: () => { stopped = true } })
  assert.deepEqual(calls.closeTab, ['e'])
  assert.equal(stopped, true, 'the cross consumes the click before it reaches the row')
  assert.deepEqual(calls.select, ['d'], 'closing never switches tabs')
})

test('the panel closes on Escape and on a backdrop click', () => {
  const { tree, calls } = renderMenu()
  assert.equal(press(tree, 'Escape'), true, 'Escape is consumed')
  assert.equal(calls.close, 1)
  byClass(tree, 'bw-tabs-menu-overlay')[0].props.onClick()
  assert.equal(calls.close, 2, 'the backdrop closes the panel too')
})

test('arrow keys move the keyboard cursor, Enter opens the cursor row', () => {
  const { tree, runtime, calls } = renderMenu()
  assert.equal(rows(tree)[1].props.className.includes('bw-tabs-menu-row-cursor'), true, 'the cursor starts on the active tab')
  press(tree, 'ArrowDown')
  let next = runtime.render(runtime.props)
  assert.equal(rows(next)[2].props.className.includes('bw-tabs-menu-row-cursor'), true, 'ArrowDown moves one row')
  press(next, 'ArrowUp')
  next = runtime.render(runtime.props)
  assert.equal(rows(next)[1].props.className.includes('bw-tabs-menu-row-cursor'), true)
  press(next, 'ArrowUp')
  next = runtime.render(runtime.props)
  assert.equal(rows(next)[0].props.className.includes('bw-tabs-menu-row-cursor'), true, 'ArrowUp walks to the first row')
  // Wrap around both ends.
  press(next, 'ArrowUp')
  next = runtime.render(runtime.props)
  assert.equal(rows(next)[TABS.length - 1].props.className.includes('bw-tabs-menu-row-cursor'), true, 'ArrowUp wraps to the last row')
  press(next, 'ArrowDown')
  next = runtime.render(runtime.props)
  assert.equal(rows(next)[0].props.className.includes('bw-tabs-menu-row-cursor'), true, 'ArrowDown wraps to the first row')
  // Home/End, then Enter opens the cursor row.
  press(next, 'End')
  next = runtime.render(runtime.props)
  press(next, 'Enter')
  assert.deepEqual(calls.select, ['e'], 'Enter switches to the cursor row')
})

test('hovering a row moves the keyboard cursor with the pointer', () => {
  const { tree, runtime } = renderMenu()
  rows(tree)[3].props.onMouseEnter()
  const next = runtime.render(runtime.props)
  assert.equal(rows(next)[3].props.className.includes('bw-tabs-menu-row-cursor'), true)
})

test('right-clicking a row hands the session menu back to the sidebar', () => {
  const { tree, calls } = renderMenu()
  let prevented = false
  let stopped = false
  rows(tree)[2].props.onContextMenu({ preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true } })
  assert.deepEqual(calls.context, ['c'], 'the sidebar menu opener receives the session id')
  assert.equal(prevented, true, 'the browser menu is suppressed')
  assert.equal(stopped, true, 'the event does not bubble to the overlay')
})

test('status dots can be switched off without losing the rows', () => {
  const { tree } = renderMenu({ statusDots: false })
  assert.equal(rows(tree).length, TABS.length)
  assert.equal(byClass(tree, 'bw-state-dot').length, 0, 'no plugin dots when the native status lights are on')
  assert.equal(byClass(tree, 'bw-tabs-menu-dot').length, 0, 'and no placeholder dots either')
})

// --------------------------------------------------------------- stylesheet
test('the strip stylesheet carries the overflow contract', () => {
  const strip = CSS_TEXT.match(/\.bw-tabs\{[^}]*\}/)
  assert.ok(strip, 'the .bw-tabs rule is missing')
  assert.match(strip[0], /overflow-x:auto/, 'the row scrolls once the chip floor is reached')
  const bar = CSS_TEXT.match(/\.bw-tabbar\{[^}]*\}/)
  assert.ok(bar, 'the .bw-tabbar rule is missing')
  assert.match(bar[0], /max-width:52vw/, 'the strip stays bounded so it never crowds the header controls')
  const chip = CSS_TEXT.match(/\.bw-tab\{[^}]*\}/)
  assert.ok(chip, 'the .bw-tab rule is missing')
  assert.match(chip[0], /flex:1 1 auto/, 'chips grow into the measured row and shrink at the floor')
  assert.match(chip[0], /min-width:\d+px/, 'chips keep a readable floor when shrinking')
  // Edge fades: all three scroll positions (none/left/right/both) are covered.
  assert.match(CSS_TEXT, /\.bw-tabs\[data-bw-fade-right="1"\]:not\(\[data-bw-fade-left="1"\]\)\{[^}]*mask-image:linear-gradient\(to left/, 'right fade')
  assert.match(CSS_TEXT, /\.bw-tabs\[data-bw-fade-left="1"\]:not\(\[data-bw-fade-right="1"\]\)\{[^}]*mask-image:linear-gradient\(to right/, 'left fade')
  assert.match(CSS_TEXT, /\.bw-tabs\[data-bw-fade-left="1"\]\[data-bw-fade-right="1"\]\{[^}]*mask-image:linear-gradient\(to right/, 'both fades')
  // The trigger and its panel.
  assert.match(CSS_TEXT, /\.bw-tabs-more\{[^}]*cursor:pointer/, 'the chevron trigger exists')
  const menu = CSS_TEXT.match(/\.bw-tabs-menu\{[^}]*\}/)
  assert.ok(menu, 'the overflow panel rule is missing')
  assert.match(menu[0], /position:fixed/, 'the panel is fixed so the header cannot crop it')
  assert.match(menu[0], /z-index:120/, 'the panel floats above the header')
  assert.match(CSS_TEXT, /\.bw-tabs-menu-list\{[^}]*overflow-y:auto/, 'a long tab list scrolls inside the panel')
  assert.match(CSS_TEXT, /\.bw-tabs-menu-row\{[^}]*height:28px/, 'rows are compact list items')
})
