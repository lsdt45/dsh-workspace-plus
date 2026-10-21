/**
 * Plugin-owned hover tooltip for the session rows.
 *
 * Why the plugin does not use the host primitives Tooltip here: that bubble is
 * withdrawn from the anchor's mouseleave (plus anchor click, disable and
 * unmount) and from nothing else. Every hover exit the browser cannot attribute
 * to a connected anchor therefore strands it until the very same row is hovered
 * and left again — the reported "tooltip sticks after the mouse left". A real
 * Chrome probe over a fixture of this row shape reproduced exactly that: a
 * keyed reorder moves the hovered row with insertBefore, the browser hands
 * hover to the row now under the cursor, dispatches NO boundary event to the
 * moved anchor (no mouseout, no mouseleave) and never back-fills one — the
 * bubble then outlives every later pointer move, because there is no event left
 * to clear it. Removing the hovered node behaves the same way.
 *
 * This module derives visibility from the pointer's REAL position against the
 * anchor rect, so the bubble drops whenever the row moves away, the tree
 * scrolls, the window loses focus, the pointer is pressed elsewhere or Escape
 * is hit. While open it re-fits the bubble to the anchor, so the bubble follows
 * the row instead of freezing at stale coordinates.
 *
 * The bubble copies the official bubble's metrics and design tokens, so a row
 * tooltip still reads exactly like every other dsh surface.
 */

import { E, React } from '../platform.ts'

/** Viewport margin the bubble keeps on every edge (matches the host Tooltip). */
export const TIP_EDGE = 12

/** How often an open bubble re-checks the pointer against its anchor. */
const TIP_TICK_MS = 120

/** A pointer position in viewport coordinates. */
interface TipPoint {
  x: number
  y: number
}

/** An axis-aligned rectangle in viewport coordinates. */
interface TipRect {
  left: number
  right: number
  top: number
  bottom: number
}

/** A measured box in CSS pixels. */
interface TipSize {
  width: number
  height: number
}

/** A rectangle that also carries its measured size. */
interface TipRectSize extends TipRect, TipSize {}

/** Where the bubble lands and which side of the anchor it sits on. */
interface TipPlacement {
  left: number
  top: number
  side: 'top' | 'bottom'
}

/** Inclusive containment test: a pointer exactly on an edge still counts as inside. */
export const pointInRect = (rect: TipRect | null | undefined, point: TipPoint | null | undefined): boolean => !!rect && !!point
  && point.x >= rect.left && point.x <= rect.right
  && point.y >= rect.top && point.y <= rect.bottom

/**
 * Clamp the bubble inside the viewport and flip it above the anchor only when
 * the requested side cannot fit. `anchor` and `size` are border-box rects;
 * `left` is the bubble's centered x (the CSS transform does the centering).
 * A bubble wider than the viewport lands on the left margin (the clamp floor).
 */
export const placeTip = (anchor: TipRectSize, size: TipSize, viewport: TipSize, gap = 8): TipPlacement => {
  const lo = TIP_EDGE + size.width / 2
  const hi = viewport.width - TIP_EDGE - size.width / 2
  const left = Math.max(lo, Math.min(anchor.left + anchor.width / 2, hi))
  const below = anchor.bottom + gap
  const above = anchor.top - gap - size.height
  const fitsBelow = below + size.height <= viewport.height - TIP_EDGE
  const fitsAbove = above >= TIP_EDGE
  const flipped = !fitsBelow && fitsAbove
  return { left, top: flipped ? above : below, side: flipped ? 'top' : 'bottom' }
}

/** Bubble text, or a resolver evaluated only while the bubble is visible. */
type TipLabel = string | (() => string) | null | undefined

/** Options accepted by {@link useHoverTip}. */
interface HoverTipOptions {
  label?: TipLabel
  delayMs?: number
  gap?: number
  maxWidth?: number
}

/**
 * Hover tooltip state for one anchor element.
 *
 * @param options.label - bubble text, or a resolver evaluated only while the bubble is visible; null/undefined disables the tip.
 * @param options.delayMs - hover delay in milliseconds; 0 shows immediately. Rows are not focusable, so focus is not a trigger.
 * @param options.gap - anchor-to-bubble distance in pixels.
 * @param options.maxWidth - bubble width cap in pixels.
 * @returns attach (spread onto the anchor element) and bubble (element or null).
 */
export function useHoverTip(options?: HoverTipOptions) {
  const opts = options || {}
  const label = opts.label === undefined ? null : opts.label
  const delayMs = opts.delayMs === undefined ? 300 : opts.delayMs
  const gap = opts.gap === undefined ? 8 : opts.gap
  const maxWidth = opts.maxWidth === undefined ? 320 : opts.maxWidth
  const anchorRef = React.useRef(null)
  const pointerRef = React.useRef(null)
  const timerRef = React.useRef(null)
  const bubbleRef = React.useRef(null)
  // Arms the browser-hover predicate below on the first tick that sees it true.
  const hoverAwareRef = React.useRef(false)
  const [anchor, setAnchor] = React.useState(null)
  const [size, setSize] = React.useState(null)
  const open = anchor !== null

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
  const hide = () => {
    clearTimer()
    pointerRef.current = null
    setAnchor(null)
    setSize(null)
  }
  const measure = (): TipRectSize | null => {
    const el = anchorRef.current
    if (!el || el.isConnected === false) return null
    const rect = el.getBoundingClientRect()
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }
  }
  const show = () => {
    clearTimer()
    const rect = measure()
    if (rect) setAnchor(rect)
  }
  const attach = {
    ref: anchorRef,
    onMouseEnter: (event: any) => {
      if (label === null) return
      pointerRef.current = { x: event.clientX, y: event.clientY }
      clearTimer()
      if (delayMs > 0) timerRef.current = setTimeout(() => { timerRef.current = null; show() }, delayMs)
      else show()
    },
    onMouseLeave: () => hide(),
  }

  // While open, the pointer's real position decides — never an exit event.
  // The reproduced failure (real-Chrome probe, case a2): React reorders keyed
  // rows with insertBefore, Chrome silently hands hover to the row now under
  // the cursor and dispatches NO boundary event to the moved anchor, and it
  // never back-fills one later. So a row that re-sorted away keeps a bubble
  // that no event can ever clear. Two independent predicates run on every tick
  // and on every pointer move: the browser's own hover state (authoritative,
  // false the moment the row is no longer under the cursor) and the recorded
  // pointer position against the re-measured rect (works even where :hover is
  // stale). The same pass re-fits a row that merely moved, so the bubble never
  // freezes at stale coordinates.
  React.useEffect(() => {
    if (!open) return undefined
    const step = () => {
      const el = anchorRef.current
      if (!el || el.isConnected === false) { hide(); return }
      if (typeof el.matches === 'function') {
        if (el.matches(':hover')) hoverAwareRef.current = true
        else if (hoverAwareRef.current) { hide(); return }
      }
      // An open bubble always has a pointer record (mouseenter seeds it); a
      // missing one means hide() already ran — and a second step() in the same
      // task (a scroll burst) must not re-open what the first one collapsed.
      const point = pointerRef.current
      if (!point) { hide(); return }
      const rect = el.getBoundingClientRect()
      if (!pointInRect({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, point)) { hide(); return }
      setAnchor((prev: TipRectSize | null) => (prev && prev.left === rect.left && prev.top === rect.top && prev.right === rect.right && prev.bottom === rect.bottom)
        ? prev
        : { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height })
    }
    const onMove = (event: any) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      step()
    }
    const onKey = (event: any) => { if (event.key === 'Escape') hide() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') hide() }
    // A pointer that leaves the window (relatedTarget null) or the document
    // itself must not leave the bubble behind: native menus, app switches and
    // fast window exits are exactly where an anchor never sees a mouseleave.
    const onWindowOut = (event: any) => { if (!event.relatedTarget) hide() }
    // Pointer/scroll observation must never hold up the tree's own scrolling.
    const passive = { capture: true, passive: true }
    const tick = setInterval(step, TIP_TICK_MS)
    document.addEventListener('pointermove', onMove, passive)
    document.addEventListener('mousemove', onMove, passive)
    document.addEventListener('scroll', step, passive)
    document.addEventListener('mouseout', onWindowOut, passive)
    document.addEventListener('pointerdown', hide, true)
    document.addEventListener('pointercancel', hide, true)
    document.addEventListener('dragstart', hide, true)
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('mouseleave', hide, true)
    window.addEventListener('blur', hide)
    return () => {
      clearInterval(tick)
      document.removeEventListener('pointermove', onMove, passive)
      document.removeEventListener('mousemove', onMove, passive)
      document.removeEventListener('scroll', step, passive)
      document.removeEventListener('mouseout', onWindowOut, passive)
      document.removeEventListener('pointerdown', hide, true)
      document.removeEventListener('pointercancel', hide, true)
      document.removeEventListener('dragstart', hide, true)
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('mouseleave', hide, true)
      window.removeEventListener('blur', hide)
    }
  }, [open])

  // Measure the bubble once it is in the DOM, then place it: its width drives
  // the horizontal clamp and its height decides the flip above the anchor.
  React.useEffect(() => {
    if (!open) { setSize(null); return }
    const el = bubbleRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSize((prev: TipSize | null) => (prev && prev.width === rect.width && prev.height === rect.height) ? prev : { width: rect.width, height: rect.height })
  }, [open, anchor, label])

  const text = open && label !== null
    ? (typeof label === 'function' ? label() : String(label))
    : null
  let bubble = null
  if (text) {
    const placement = anchor && size
      ? placeTip(anchor, size, { width: window.innerWidth, height: window.innerHeight }, gap)
      : { left: 0, top: 0, side: 'bottom' }
    bubble = E('span', {
      ref: bubbleRef,
      className: 'bw-tip',
      'data-side': placement.side,
      role: 'tooltip',
      style: { left: placement.left, top: placement.top, visibility: size ? 'visible' : 'hidden', maxWidth },
    }, text)
  }
  return { attach, bubble }
}
