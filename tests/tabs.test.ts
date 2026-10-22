/**
 * Session tabs — the pure rules behind the strip and the sidebar clicks.
 *
 * The tab list is what survives a restart, so these cases pin the three shapes
 * a click can take: open (new session), replace (plain click) and close
 * (neighbour takes over), plus the bound that keeps the list from growing.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { MAX_TABS, closeTab, moveTab, normalizeTabs, openTab, reconcileTabs, replaceTab, saveTabs, scrollDeltaFor, stripCapacity, stripFillWidth, subscribeTabs, tabsSnapshot } from '../src/client/tabs.ts'

test('normalizeTabs keeps unique string ids and drops junk', () => {
  assert.deepEqual(normalizeTabs(undefined), [])
  assert.deepEqual(normalizeTabs(['a', 'a', 2, null, '', 'b']), ['a', '2', 'b'])
  assert.equal(normalizeTabs(Array.from({ length: MAX_TABS + 5 }, (_, i) => 's' + i)).length, MAX_TABS)
})

test('openTab appends a new session and never duplicates one', () => {
  assert.deepEqual(openTab([], 'a'), ['a'])
  assert.deepEqual(openTab(['a'], 'b'), ['a', 'b'])
  assert.deepEqual(openTab(['a', 'b'], 'a'), ['a', 'b'])
  const full = Array.from({ length: MAX_TABS }, (_, i) => 's' + i)
  const next = openTab(full, 'new')
  assert.equal(next.length, MAX_TABS)
  assert.equal(next[next.length - 1], 'new', 'the newest tab stays')
  assert.equal(next[0], 's1', 'the oldest tab drops')
})

test('replaceTab swaps the session inside the current tab', () => {
  assert.deepEqual(replaceTab(['a', 'b'], 'a', 'c'), ['c', 'b'])
  assert.deepEqual(replaceTab(['a', 'b'], 'b', 'c'), ['a', 'c'])
  // A session already open elsewhere never occupies two tabs: the tab being
  // replaced is dropped and the already-open tab takes over.
  assert.deepEqual(replaceTab(['a', 'b'], 'a', 'b'), ['b'])
  // No current tab (fresh state) simply opens one.
  assert.deepEqual(replaceTab([], undefined, 'c'), ['c'])
  assert.deepEqual(replaceTab(['a'], 'missing', 'c'), ['a', 'c'])
})

test('closeTab picks the neighbour only when the closed tab was active', () => {
  assert.deepEqual(closeTab(['a', 'b', 'c'], 'b', 'b'), { tabs: ['a', 'c'], next: 'c' })
  assert.deepEqual(closeTab(['a', 'b'], 'b', 'b'), { tabs: ['a'], next: 'a' })
  assert.deepEqual(closeTab(['a', 'b'], 'a', 'b'), { tabs: ['b'], next: null })
  assert.deepEqual(closeTab(['a'], 'a', 'a'), { tabs: [], next: null })
  assert.deepEqual(closeTab(['a'], 'missing', 'a'), { tabs: ['a'], next: null })
})

test('reconcileTabs gives a new session its own tab and swaps it for navigation', () => {
  const isBlank = (id: string): boolean => id === 'blank'
  // "New session" moves the main view to a provisional blank page: the user is
  // on a new page, so the strip grows instead of replacing the page they left.
  assert.deepEqual(reconcileTabs(['a'], 'blank', 'a', { isBlank }), ['a', 'blank'])
  assert.deepEqual(reconcileTabs([], 'blank', null, { isBlank }), ['blank'])
  // Any other session reached outside a row click (fork, palette, shortcut)
  // replaces the session inside the previous tab.
  assert.deepEqual(reconcileTabs(['a', 'b'], 'c', 'a'), ['c', 'b'])
  assert.deepEqual(reconcileTabs([], 'a', null), ['a'])
  // Already open: the tab keeps its position, only the selection moves.
  assert.deepEqual(reconcileTabs(['a', 'b'], 'b', 'a'), ['a', 'b'])
  assert.deepEqual(reconcileTabs(['a', 'b'], null, 'a'), ['a', 'b'], 'no current session leaves the list alone')
})

test('reconcileTabs drops abandoned provisional and archived tabs', () => {
  const isBlank = (id: string): boolean => id === 'blank'
  // The shell hides every blank session except the current one, so a blank tab
  // left behind can never be switched back to: drop it.
  assert.deepEqual(reconcileTabs(['a', 'blank'], 'b', 'blank', { isBlank }), ['a', 'b'])
  assert.deepEqual(reconcileTabs(['blank'], 'other', 'blank', { isBlank }), ['other'])
  // Archived sessions are refused by the shell; their chips are dead too.
  assert.deepEqual(reconcileTabs(['a', 'arch'], 'a', 'a', { isArchived: (id) => id === 'arch' }), ['a'])
  // Unknown ids stay put: a partial session snapshot must never lose a tab.
  assert.deepEqual(reconcileTabs(['a', 'zzz'], 'a', 'a'), ['a', 'zzz'])
})

test('scrollDeltaFor reveals an edge chip with a small breathing pad', () => {
  const strip = { left: 300, right: 900 }
  // Already fully visible: nothing to scroll.
  assert.equal(scrollDeltaFor(strip, { left: 320, right: 500 }), 0)
  // Right overhang scrolls right by exactly (right edge - container right + pad).
  assert.equal(scrollDeltaFor(strip, { left: 850, right: 1090 }), 196)
  assert.equal(scrollDeltaFor(strip, { left: 900, right: 940 }), 46, 'a chip starting at the edge still scrolls into view')
  // Left overhang scrolls left by exactly (container left - left edge + pad), negated.
  assert.equal(scrollDeltaFor(strip, { left: 100, right: 240 }), -206)
  assert.equal(scrollDeltaFor(strip, { left: 300, right: 340 }), -6, 'flush-left chip gets the pad')
  // Custom pad.
  assert.equal(scrollDeltaFor(strip, { left: 850, right: 1090 }, 0), 190)
  assert.equal(scrollDeltaFor(strip, { left: 850, right: 1090 }, 12), 202)
  // Degenerate rects (detached/hidden nodes) never produce NaN scroll writes.
  assert.equal(scrollDeltaFor({ left: 300, right: 900 }, { left: NaN as unknown as number, right: undefined as unknown as number }), 0, 'missing geometry never scrolls')
  assert.equal(scrollDeltaFor({ left: NaN as unknown as number, right: 900 }, { left: 320, right: 500 }), 0)
})

test('stripFillWidth stretches the row to the first control on its right', () => {
  // Room from the strip's left edge to the utilities, minus the 12px breathing gap.
  assert.equal(stripFillWidth(1361, 300, 1280), 1049)
  assert.equal(stripFillWidth(1901, 300, 1820), 1589)
  // Never past the header edge (a stray full-width node cannot push it).
  assert.equal(stripFillWidth(1901, 300, 1000), 960)
  // No control found yet, or one sitting right next to the chips: leave the CSS
  // fallback in charge rather than collapsing the row.
  assert.equal(stripFillWidth(0, 300, 1820), 0)
  assert.equal(stripFillWidth(310, 300, 1820), 0)
  assert.equal(stripFillWidth(500, 300, 1820), 0, 'room below the minimum falls back')
  assert.equal(stripFillWidth(600, 300, 1820), 288, 'just past the minimum the measured room wins')
  // Degenerate geometry never yields a width.
  assert.equal(stripFillWidth(NaN as unknown as number, 300, 1820), 0)
  assert.equal(stripFillWidth(1901, NaN as unknown as number, 1820), 0)
  assert.equal(stripFillWidth(1901, 300, 0), 1589)
  // The reserve keeps a minimum slice of the header for the host's own controls.
  assert.equal(stripFillWidth(1901, 300, 1820, 220, 100), 1589, 'reserve above the limit does not bind')
  assert.equal(stripFillWidth(1901, 300, 1000, 220, 100), 900, 'reserve clamps the row before the header edge')
  assert.equal(stripFillWidth(1500, 300, 1000, 220, 100), 900, 'reserve clamp wins over the measured limit')
})

test('stripCapacity bounds the row to the space the chips can fill', () => {
  assert.equal(stripCapacity(0), 0)
  assert.equal(stripCapacity(1), 212)
  assert.equal(stripCapacity(3), 640)
  assert.equal(stripCapacity(8), 1710)
  // A couple of tabs must never stretch the strip into the host controls.
  assert.equal(stripCapacity(2) < stripFillWidth(1901, 300, 1820, 220, 100), true)
})

test('the tab list persists and notifies subscribers', () => {
  const seen: string[][] = []
  const off = subscribeTabs(() => seen.push(tabsSnapshot()))
  saveTabs(['b', 'a', 'b'])
  assert.deepEqual(tabsSnapshot(), ['b', 'a'], 'duplicates collapse before persisting')
  assert.equal(seen.length, 1, 'one change, one notification')
  saveTabs(['b', 'a'])
  assert.equal(seen.length, 1, 'an unchanged list does not notify')
  saveTabs([])
  assert.equal(seen.length, 2)
  off()
  saveTabs(['c'])
  assert.equal(seen.length, 2, 'unsubscribed listeners stay quiet')
  assert.deepEqual(tabsSnapshot(), ['c'])
})

test('moveTab reorders a dragged tab into the target slot', () => {
  // A one-step move must actually move: this is the case that regressed.
  assert.deepEqual(moveTab(['a', 'b'], 'a', 'b'), ['b', 'a'])
  assert.deepEqual(moveTab(['a', 'b', 'c'], 'a', 'c'), ['b', 'c', 'a'], 'dragged right lands in the target slot')
  assert.deepEqual(moveTab(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b'], 'dragged left lands in the target slot')
  assert.deepEqual(moveTab(['a', 'b', 'c'], 'b', 'c'), ['a', 'c', 'b'])
  assert.deepEqual(moveTab(['a', 'b'], 'a', 'b').length, 2, 'nothing is ever lost')
  assert.deepEqual(moveTab(['a'], 'x', 'a'), ['a'], 'unknown ids leave the list untouched')
})
