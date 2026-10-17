/**
 * Architecture guard — keeps the module boundaries real while the client half is
 * split. Cheap static checks over src/client/** that catch the two failure modes
 * a bundle hides: a module reaching for platform handles it does not own, and a
 * cross-module reference that forgot its import (the bundle still builds, then
 * throws ReferenceError in the browser).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'

const CLIENT_DIR = new URL('../src/client/', import.meta.url)
const QUOTE = String.fromCharCode(39)
const DQUOTE = String.fromCharCode(34)
const BACKTICK = String.fromCharCode(96)

function moduleFiles(dir = CLIENT_DIR, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
    if (entry.isDirectory()) moduleFiles(url, out)
    else if (entry.name.endsWith('.js')) out.push(url)
  }
  return out
}

const files = moduleFiles()
const sources = new Map(files.map((url) => [url.pathname, readFileSync(url, 'utf8')]))
const nameOf = (path) => path.split('/src/client/')[1]

/** Blank string literals on one line; comments are dropped before scanning. */
function blankStrings(line) {
  let out = ''
  let quote = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote !== null) {
      if (ch === '\\') { out += '  '; i += 1; continue }
      if (ch === quote) { quote = null }
      out += ' '
      continue
    }
    if (ch === QUOTE || ch === DQUOTE || ch === BACKTICK) { quote = ch; out += ' '; continue }
    out += ch
  }
  return out
}

/**
 * Rules check code, not prose: comment-only lines are dropped first (their
 * apostrophes would otherwise desynchronize the string scanner), then string
 * literals are blanked so dictionary/CSS text cannot look like a reference.
 */
function codeOf(source) {
  return source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      return trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')
    })
    .map(blankStrings)
    .join('\n')
}

const code = new Map([...sources].map(([path, source]) => [path, codeOf(source)]))

/** Names a module exposes to the rest of the bundle. */
function exportsOf(path, source) {
  const names = [...source.matchAll(/^export\s+(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1])
  if (nameOf(path) === 'index.js') {
    // The entry owns the factory scope AND the component scope: a browser module
    // leaning on a name from either one is exactly the leak this rule exists for
    // (component-scope names must be injected through the module's input object).
    for (const match of source.matchAll(/^ {4,6}(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) names.push(match[1])
    for (const match of source.matchAll(/^ {4,6}const\s*[\[{]([^}\]]*)[\}\]]/gm)) {
      for (const part of match[1].split(',')) {
        const name = part.split(':').pop().trim().replace(/^\[\.\.\./, '').replace(/=.*$/, '').trim()
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.push(name)
      }
    }
  }
  return names
}
function importsOf(source) {
  const names = []
  for (const match of source.matchAll(/^import\s*\{([^}]*)\}/gm)) {
    for (const name of match[1].split(',')) if (name.trim() !== '') names.push(name.trim())
  }
  // Factory inputs: every browser module receives its dependencies as one object
  // and destructures what it needs, which counts as a local declaration.
  for (const match of source.matchAll(/^\s*const\s*\{([^}]*)\}\s*=\s*input\b/gm)) {
    for (const name of match[1].split(',')) if (name.trim() !== '') names.push(name.trim())
  }
  return names
}

const exportedBy = new Map()
for (const [path, source] of sources) exportedBy.set(path, new Set(exportsOf(path, source)))

test('only the bundle entry and the platform boundary talk to the loader', () => {
  for (const [path, source] of sources) {
    const name = nameOf(path)
    if (name !== 'index.js') {
      assert.ok(!code.get(path).includes('__ModuleLoader__'), name + ' must not touch window.__ModuleLoader__')
    }
    if (name === 'index.js' || name === 'platform.js') continue
    assert.ok(!code.get(path).includes('hostRequire('), name + ' must not request platform modules directly')
  }
})

test('core, i18n, styles and host stay free of platform handles', () => {
  // Platform handles are owned by the entry and injected downward; a free
  // reference to one is a browser ReferenceError waiting to happen.
  const platformFree = /^(core\/|i18n\/|styles\.js$|host\.js$)/
  const forbidden = [['E(', /\bE\(/], ['ui.', /\bui\./], ['React', /\bReact\b/], ['storeKit', /\bstoreKit\b/], ['NS', /\bNS\b/]]
  for (const [path, source] of sources) {
    const name = nameOf(path)
    if (!platformFree.test(name)) continue
    for (const [label, pattern] of forbidden) {
      assert.ok(!pattern.test(code.get(path)), name + ' must not reference ' + label)
    }
  }
})

test('cross-module references are imported', () => {
  const problems = []
  for (const [path, source] of sources) {
    const name = nameOf(path)
    if (name === 'index.js') continue // the entry imports every module it uses
    const body = code.get(path)
    // Own declarations at ANY indent plus every parameter name: a binding or
  // parameter of this module is never a cross-module reference.
  const local = [...source.matchAll(/^\s*(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1])
  for (const match of source.matchAll(/\(([^()]*)\)/g)) {
    for (const name of match[1].matchAll(/[A-Za-z_$][\w$]*/g)) local.push(name[0])
  }
  for (const match of source.matchAll(/(?:const|let|var)\s*[\[{]([^}\]]*)[\}\]]/g)) {
    for (const part of match[1].split(',')) {
      const name = part.split(':').pop().trim().replace(/^\[\.\.\./, '').replace(/=.*$/, '').trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name)) local.push(name)
    }
  }
  const own = new Set([...exportedBy.get(path), ...importsOf(source), ...local])
    for (const [otherPath, names] of exportedBy) {
      if (otherPath === path) continue
      for (const exported of names) {
        if (own.has(exported)) continue
        // A member access (row.icon) and an object key (icon:) are not references.
        // A SPREAD is: the dots of a member access must follow an identifier,
        // `)`, `]` or `?` — so `...workspaceGroups` (dots after a separator) is
        // still a reference. Skipping every dot-preceded hit hid exactly the
        // 0.2.1 regression where the layout factory lost one input and threw
        // ReferenceError the moment its context submenu rendered.
        const hits = [...body.matchAll(new RegExp('\\b' + exported + '\\b', 'g'))].filter((match) => {
          const before = body.slice(0, match.index)
          if (/(?:[A-Za-z_$][\w$]*|\)|\]|\?)\.+$/.test(before)) return false
          return !/^\s*:/.test(body.slice(match.index + exported.length))
        })
        if (hits.length > 0) {
          problems.push(name + ' uses ' + exported + ' (from ' + nameOf(otherPath) + ') without importing it')
        }
      }
    }
  }
  assert.deepEqual([...new Set(problems)], [])
})

test('the bundle entry is the only file that calls the loader', () => {
  const entry = sources.get([...sources.keys()].find((path) => nameOf(path) === 'index.js'))
  assert.equal((entry.match(/window\.__ModuleLoader__\.load\(/g) || []).length, 1)
})
