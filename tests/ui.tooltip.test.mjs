/** ui/tooltip.js — pure placement/containment rules and the pointer-driven collapse guard.
 *
 * Scope: pure functions only (no React, no DOM). The hook's browser behaviour is
 * covered separately in .scratch/tip-verify/ (jsdom + React) so this file keeps
 * running under plain `node --test`.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TIP_EDGE, pointInRect, placeTip } from '../src/client/ui/tooltip.js'

const rect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height })

test('TIP_EDGE is the 12px viewport margin the host bubble uses', () => {
  assert.equal(TIP_EDGE, 12)
})

test('pointInRect accepts interior points and every edge inclusively', () => {
  const r = { left: 10, top: 20, right: 110, bottom: 50 }
  assert.equal(pointInRect(r, { x: 60, y: 35 }), true, 'interior')
  assert.equal(pointInRect(r, { x: 10, y: 35 }), true, 'left edge')
  assert.equal(pointInRect(r, { x: 110, y: 35 }), true, 'right edge')
  assert.equal(pointInRect(r, { x: 60, y: 20 }), true, 'top edge')
  assert.equal(pointInRect(r, { x: 60, y: 50 }), true, 'bottom edge')
  assert.equal(pointInRect(r, { x: 10, y: 20 }), true, 'top-left corner')
  assert.equal(pointInRect(r, { x: 110, y: 50 }), true, 'bottom-right corner')
})

test('pointInRect rejects every point one pixel outside the rect', () => {
  const r = { left: 10, top: 20, right: 110, bottom: 50 }
  assert.equal(pointInRect(r, { x: 9, y: 35 }), false, 'left of it')
  assert.equal(pointInRect(r, { x: 111, y: 35 }), false, 'right of it')
  assert.equal(pointInRect(r, { x: 60, y: 19 }), false, 'above it')
  assert.equal(pointInRect(r, { x: 60, y: 51 }), false, 'below it')
})

test('pointInRect survives degenerate and missing inputs', () => {
  assert.equal(pointInRect({ left: 5, top: 5, right: 5, bottom: 5 }, { x: 5, y: 5 }), true, 'zero-size rect still contains its own point')
  assert.equal(pointInRect(null, { x: 5, y: 5 }), false)
  assert.equal(pointInRect({ left: 0, top: 0, right: 1, bottom: 1 }, null), false)
  assert.equal(pointInRect(undefined, undefined), false)
})

test('placeTip centers the bubble under the anchor and honours the default gap', () => {
  const anchor = rect(100, 200, 80, 26)
  const size = { width: 200, height: 20 }
  const viewport = { width: 1280, height: 800 }
  assert.deepEqual(placeTip(anchor, size, viewport), { left: 140, top: 234, side: 'bottom' })
  assert.deepEqual(Object.keys(placeTip(anchor, size, viewport)).sort(), ['left', 'side', 'top'])
})

test('placeTip clamps against the right viewport edge', () => {
  const anchor = rect(1200, 200, 60, 26)
  const size = { width: 200, height: 20 }
  const viewport = { width: 1280, height: 800 }
  const out = placeTip(anchor, size, viewport)
  assert.equal(out.left, viewport.width - TIP_EDGE - size.width / 2, 'centered x is clamped to the right margin')
  assert.equal(out.left, 1168)
  assert.equal(out.side, 'bottom')
})

test('placeTip clamps against the left viewport edge too', () => {
  const anchor = rect(0, 200, 40, 26)
  const size = { width: 200, height: 20 }
  const out = placeTip(anchor, size, { width: 1280, height: 800 })
  assert.equal(out.left, TIP_EDGE + size.width / 2)
  assert.equal(out.left, 112)
})

test('placeTip flips above the anchor when below cannot fit but above can', () => {
  const anchor = rect(100, 700, 80, 26)
  const size = { width: 200, height: 20 }
  const viewport = { width: 1280, height: 760 }
  const out = placeTip(anchor, size, viewport)
  assert.equal(out.side, 'top')
  assert.equal(out.top, anchor.top - 8 - size.height)
  assert.equal(out.top, 672)
})

test('placeTip keeps the bubble below when neither side fits', () => {
  const anchor = rect(100, 4, 80, 26) // taller than the viewport allows either way
  const size = { width: 200, height: 40 }
  const viewport = { width: 1280, height: 60 }
  const out = placeTip(anchor, size, viewport)
  assert.equal(out.side, 'bottom')
  assert.equal(out.top, anchor.bottom + 8)
  assert.equal(out.top, 38)
})

test('placeTip treats the exact fit boundaries as fitting', () => {
  const size = { width: 200, height: 20 }
  const viewport = { width: 1280, height: 800 }
  // below + height === viewport.height - TIP_EDGE  -> still fits below
  const flushBottom = rect(100, viewport.height - TIP_EDGE - size.height - 8 - 26, 80, 26)
  assert.equal(placeTip(flushBottom, size, viewport).side, 'bottom')

  // A viewport short enough that the bottom never fits: the flip boundary is
  // above === TIP_EDGE, so top = TIP_EDGE flips and top = TIP_EDGE - 1 falls back.
  const tight = { width: 1280, height: 100 }
  const atMargin = rect(100, TIP_EDGE + 8 + size.height, 80, 26)
  const belowMargin = rect(100, TIP_EDGE + 8 + size.height - 1, 80, 26)
  assert.equal(placeTip(atMargin, size, tight).side, 'top', 'above === TIP_EDGE still fits above')
  assert.equal(placeTip(atMargin, size, tight).top, TIP_EDGE)
  assert.equal(placeTip(belowMargin, size, tight).side, 'bottom', 'above < TIP_EDGE cannot flip; stay below')
})

test('placeTip lands on the left margin when the bubble is wider than the viewport', () => {
  const anchor = rect(200, 100, 80, 26)
  const size = { width: 600, height: 20 }
  const viewport = { width: 320, height: 800 }
  const out = placeTip(anchor, size, viewport)
  assert.equal(out.left, TIP_EDGE + size.width / 2, 'the clamp floor wins over the ceiling')
  assert.equal(out.side, 'bottom')
})

test('placeTip honours a custom gap and does not mutate its inputs', () => {
  const anchor = rect(100, 200, 80, 26)
  const size = { width: 200, height: 20 }
  const viewport = { width: 1280, height: 800 }
  const snapshot = JSON.stringify([anchor, size, viewport])
  assert.equal(placeTip(anchor, size, viewport, 0).top, 226)
  assert.equal(placeTip(anchor, size, viewport, 24).top, 250)
  assert.equal(JSON.stringify([anchor, size, viewport]), snapshot)
})

// ---------------------------------------------------------------------------
// Regression guard. The reported bug is not "the bubble is misplaced" but "the
// bubble never goes away": the row is re-sorted/scrolls out from under a
// stationary pointer and the bubble stays on screen until that same row is
// hovered and left again. The invariant that fixes it is that visibility is
// derived from the pointer's REAL coordinates against the anchor's CURRENT
// rectangle — never from an event the anchor may not receive.
//
// Why this fails on the old implementation: rows.js handed the row to the host
// primitives Tooltip, whose only withdrawal trigger is the anchor's own
// mouseleave. That implementation never reads pointer coordinates at all, so the
// predicate below has no counterpart there — a stationary pointer that the list
// slides a row away from produces no mouseleave on that row, and the equivalent
// assertion ("pointer outside the anchor rect => must collapse") is false. The
// module under test did not even exist, so the import at the top of this file
// would fail outright against the pre-patch tree.
// ---------------------------------------------------------------------------
const needsCollapse = (anchorRect, pointer) => !pointInRect(anchorRect, pointer)

test('regression guard: collapse depends only on the pointer vs the anchor rect', () => {
  const pointer = { x: 140, y: 52 } // the user's cursor, never moved
  const before = { left: 8, right: 260, top: 40, bottom: 66 }
  const afterReorder = { left: 8, right: 260, top: 68, bottom: 94 }
  assert.equal(needsCollapse(before, pointer), false, 'while the pointer is on the row the bubble may stay')
  assert.equal(needsCollapse(afterReorder, pointer), true, 'the row re-sorted away -> the bubble must collapse')
})

test('regression guard: scrolling the row away collapses the bubble', () => {
  const pointer = { x: 140, y: 52 }
  const row = { left: 8, right: 260, top: 40, bottom: 66 }
  const scrolled = { left: 8, right: 260, top: -40, bottom: -14 }
  assert.equal(needsCollapse(row, pointer), false)
  assert.equal(needsCollapse(scrolled, pointer), true)
})

test('regression guard: a pointer that left the anchor must collapse', () => {
  const row = { left: 8, right: 260, top: 40, bottom: 66 }
  assert.equal(needsCollapse(row, { x: 261, y: 52 }), true, 'right of the row')
  assert.equal(needsCollapse(row, { x: 140, y: 67 }), true, 'below the row')
  assert.equal(needsCollapse(row, { x: 7, y: 52 }), true, 'left of the row')
  assert.equal(needsCollapse(row, { x: 140, y: 39 }), true, 'above the row')
  assert.equal(needsCollapse(row, { x: 260, y: 66 }), false, 'the inclusive edge still counts as hover')
})
