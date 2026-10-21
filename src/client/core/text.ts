/** Pure text/path helpers. No React, no DOM, no platform access — unit-tested directly. */

/** Join the truthy entries of a className list. */
export const cls = (...xs: Array<string | false | null | undefined>): string => xs.filter(Boolean).join(' ')

/** Last path segment of a "/"- or "\\"-separated path. */
export const basename = (p: string | null | undefined): string => {
  if (!p) return ''
  const s = String(p).replace(/[\\/]+$/, '')
  const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'))
  return i === -1 ? s : s.slice(i + 1)
}

/**
 * Plain-text splitting with the URL tail kept opaque: a bare "/" split
 * shreds URLs ("https:" → empty → host → path...), so from the first
 * "://" onward the tail is ONE leaf; text before the marker splits
 * normally at the last "/" before it. This is the FALLBACK guard —
 * freshly generated titles get their whole "/"-bearing title wrapped in
 * quotes by the quote-on-land effect (see BetterBrowser), which is the
 * primary mechanism.
 */
export const splitPlainSegs = (text: string | null | undefined): string[] => {
  const s = String(text || '')
  const schemeAt = s.indexOf('://')
  if (schemeAt === -1) return s.split('/').map(x => x.trim()).filter(Boolean)
  const cut = s.lastIndexOf('/', schemeAt)
  const segs = (cut === -1 ? '' : s.slice(0, cut)).split('/').map(x => x.trim()).filter(Boolean)
  const tail = s.slice(cut + 1).trim()
  if (tail !== '') segs.push(tail)
  return segs
}

/**
 * Title → hierarchy segments, QUOTE-AWARE: a PAIRED “…” (or "…") span is
 * verbatim — slashes inside quotes never split, the quotes stay part of
 * the leaf. Text outside paired spans splits through splitPlainSegs
 * (URL-tail opaque). A LONE quote character — an opener with no matching
 * closer, or a closer without an opener — is an ORDINARY character and
 * splits normally around it (0.9.1 swallowed the tail after an
 * unterminated opener; the user wants lone quotes as plain text).
 * Grouping is a pure projection, so previously shredded titles re-flow
 * on reload.
 */
export const splitTitleSegs = (title: string | null | undefined): string[] => {
  const s = String(title || '')
  if (!/["“]/.test(s)) return splitPlainSegs(s)
  const out: string[] = []
  let plain = ''
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === '"' || ch === '“') {
      const close = ch === '“' ? '”' : '"'
      const j = s.indexOf(close, i + 1)
      if (j === -1) { // lone opener: ordinary character, keep scanning
        plain += ch
        i += 1
        continue
      }
      for (const seg of splitPlainSegs(plain)) out.push(seg)
      plain = ''
      const end = j + 1
      const quoted = s.slice(i, end).trim()
      if (quoted !== '') out.push(quoted)
      i = end
      continue
    }
    plain += ch
    i += 1
  }
  for (const seg of splitPlainSegs(plain)) out.push(seg)
  return out
}

/** Canonical folder path: title segments joined with "/". */
export const normPath = (p: string | null | undefined): string => splitTitleSegs(p).join('/')
