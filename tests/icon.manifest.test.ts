/**
 * Icon manifest guard — the plugin card in the DSH plugin manager renders
 * `package.json#icon` inside a 48px frame as a 36px image, and silently keeps
 * the default artwork when the field is absent or the file fails to decode
 * (`readPluginMeta` in @deepseek-ai/dsh-app-boot reads the manifest icon and
 * inlines it as a data URL). A missing icon therefore fails invisibly, which
 * is exactly what this test makes loud.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Resolved through fileURLToPath so a checkout path with non-ASCII parts still opens. */
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))

/** Same ceiling the host applies before inlining an icon data URL. */
const MAX_ICON_BYTES = 256 * 1024

test('the manifest declares an icon inside the package', () => {
  assert.equal(typeof manifest.icon, 'string', 'package.json#icon is what the plugin manager renders')
  assert.match(manifest.icon, /^\.\/[\w./-]+\.svg$/, 'a relative .svg path, the format every shipped plugin uses')
  assert.equal(isAbsolute(manifest.icon), false, 'the host rejects absolute icon paths')

  const iconPath = resolve(ROOT, manifest.icon)
  const local = relative(ROOT, iconPath)
  assert.equal(local.startsWith('..' + sep) || local === '..', false, 'the icon must stay inside the package directory')
  assert.equal(statSync(iconPath).isFile(), true, manifest.icon + ' must exist')
})

test('the shipped icon is a self-contained SVG the host can inline', () => {
  const file = resolve(ROOT, manifest.icon)
  const bytes = readFileSync(file)
  assert.ok(bytes.length <= MAX_ICON_BYTES, 'the host refuses icons above 256 KiB')

  const svg = bytes.toString('utf8')
  assert.match(svg, /^<svg[\s>]/, 'must be a bare SVG document')
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'needs the SVG namespace to decode standalone')
  assert.match(svg, /viewBox="0 0 36 36"/, 'the host artwork slot is a 36-unit square')

  // A data URL is opened through <img>, where scripts cannot run; external
  // references would still break the decode offline, so refuse both.
  assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+=/i, 'no script or event handlers')
  assert.doesNotMatch(svg, /(?:href|src|url\()\s*["']?https?:/i, 'no network references')

  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(ids, [...new Set(ids)], 'duplicate gradient ids collide when several icons share a doc')
})

test('the icon ships with the npm package', () => {
  assert.ok(Array.isArray(manifest.files), 'package.json#files narrows what git/tarball installs get')
  assert.ok(manifest.files.includes('icon.svg'), 'an icon left out of files/ is missing after install')
})
