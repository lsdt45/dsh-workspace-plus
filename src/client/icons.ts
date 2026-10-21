/** Icon bridge to the dsh primitives (0.1.7 size-neutral glyph names) plus the plugin own 16px glyphs. */

import { E, ui } from './platform.ts'

    /* ---- primitives icon bridge (size suffix → weight suffix) ---------- *
     * 0.1.7 "size-neutral product icon weights" dropped the size suffix from
     * every shared glyph: IconFolderClose16 became IconFolderCloseRegular /
     * IconFolderCloseMedium and the old export is gone. A plain ui[name]
     * lookup then resolves nothing and the slot renders blank — silently,
     * because an unknown name degrades to null by design. This bridge speaks
     * both vocabularies, caches per name, and warns once about a name that
     * resolves nowhere so a future rename cannot blank the sidebar unseen.
     *
     * Order: exact export → size suffix rewritten to a weight (…16 →
     * …Regular → …Medium) → weight rewritten back to the historical size
     * (older harness) → any export sharing the base name (future suffixes).
     */
    const iconCache = new Map<string, any>()
    const ICON_SIZE_SUFFIX = /^(.*?)(\d+)$/
    const ICON_WEIGHT_SUFFIX = /^(.*?)(Regular|Medium)$/
    /** Own export only (never Object.prototype), and only something React can render. */
export const iconExport = (key: string): any => {
  if (!Object.prototype.hasOwnProperty.call(ui, key)) return null
  const C = ui[key]
  if (typeof C === 'function') return C
  return C !== null && typeof C === 'object' && C.$$typeof !== undefined ? C : null
}

export const resolveIcon = (name: string | null | undefined): any => {
  const key = String(name == null ? '' : name)
  if (key === '') return null
  if (iconCache.has(key)) return iconCache.get(key)
  let C = iconExport(key)
  const sized = ICON_SIZE_SUFFIX.exec(key)
  if (!C && sized) C = iconExport(sized[1] + 'Regular') || iconExport(sized[1] + 'Medium')
  const weighted = ICON_WEIGHT_SUFFIX.exec(key)
  if (!C && weighted) C = iconExport(weighted[1] + '16') || iconExport(weighted[1] + '14') || iconExport(weighted[1])
  if (!C) {
    const base = sized ? sized[1] : (weighted ? weighted[1] : key)
    for (const k of Object.keys(ui).filter((k) => k.indexOf(base) === 0 && k.length > base.length).sort((a, b) => a.length - b.length)) {
      C = iconExport(k)
      if (C) break
    }
  }
  if (!C && typeof console !== 'undefined' && console.warn) {
    console.warn('[workspace-plus] primitives icon unavailable: ' + key)
  }
  iconCache.set(key, C || null)
  return C || null
}

    /** Render a primitives icon by name; unknown names degrade to null, never crash. */
export const icon = (name: string, size?: number): any => {
  const C = resolveIcon(name)
  return C ? E(C, { size: size || 16 }) : null
}

/** Props of the embedded Lucide glyphs (px size, optional class hook). */
export interface GlyphProps {
  size?: number
  className?: string
}

    /**
     * Pin glyph, embedded from Lucide "pin" (v0.545.0, ISC license,
     * https://lucide.dev) because the dsh primitives set ships no pin. Same
     * outline language as the ic_ds family: stroke=currentColor, 24 viewBox
     * rendered at 14~16px so the visual weight matches IconClockOutline16.
     */
export const PinIcon16 = ({ size = 14, className }: GlyphProps) => E('svg', {
  width: size, height: size, className: className || undefined, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': 'true', focusable: 'false',
},
  E('path', { d: 'M12 17v5' }),
  E('path', { d: 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z' }),
)

    /**
     * View-mode glyphs, embedded from Lucide (v0.545.0, ISC license,
     * https://lucide.dev): the header button previews the shape of the ACTIVE
     * view — a branching tree for the projects view, a calendar for the time
     * view — same stroke conventions as PinIcon16.
     */
export const lucideSvg = (size: number, className: string | undefined, children: any[]): any => E('svg', {
  width: size, height: size, className: className || undefined, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': 'true', focusable: 'false',
}, ...children)

export const ListTreeIcon16 = ({ size = 14, className }: GlyphProps) => lucideSvg(size, className, [
  E('path', { d: 'M8 5h13' }),
  E('path', { d: 'M13 12h8' }),
  E('path', { d: 'M13 19h8' }),
  E('path', { d: 'M3 10a2 2 0 0 0 2 2h3' }),
  E('path', { d: 'M3 5v12a2 2 0 0 0 2 2h3' }),
])

export const ListIcon16 = ({ size = 14, className }: GlyphProps) => lucideSvg(size, className, [
  E('path', { key: 'lines', d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }),
])

export const CalendarDaysIcon16 = ({ size = 14, className }: GlyphProps) => lucideSvg(size, className, [
  E('path', { d: 'M8 2v4' }),
  E('path', { d: 'M16 2v4' }),
  E('rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }),
  E('path', { d: 'M3 10h18' }),
  E('path', { d: 'M8 14h.01' }),
  E('path', { d: 'M12 14h.01' }),
  E('path', { d: 'M16 14h.01' }),
  E('path', { d: 'M8 18h.01' }),
  E('path', { d: 'M12 18h.01' }),
  E('path', { d: 'M16 18h.01' }),
])
