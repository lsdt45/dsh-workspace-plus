/** core/text.js — title splitting is the plugin's founding rule; lock its edge cases. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cls, basename, splitPlainSegs, splitTitleSegs, normPath } from '../src/client/core/text.ts'

test('cls joins truthy class names', () => {
  assert.equal(cls('a', false, undefined, null, '', 'b'), 'a b')
  assert.equal(cls(), '')
})

test('basename keeps the last segment and tolerates separators', () => {
  assert.equal(basename('/a/b/c.txt'), 'c.txt')
  assert.equal(basename('/a/b/'), 'b')
  assert.equal(basename('C:\\\\Users\\\\me\\\\proj'), 'proj')
  assert.equal(basename(''), '')
})

test('splitPlainSegs keeps a URL tail opaque', () => {
  assert.deepEqual(splitPlainSegs('web/前端'), ['web', '前端'])
  assert.deepEqual(splitPlainSegs('https://a/b/c'), ['https://a/b/c'])
  // No separator BEFORE the scheme: the whole string stays one opaque leaf.
  assert.deepEqual(splitPlainSegs('见 https://a/b 的说明'), ['见 https://a/b 的说明'])
  // With one, the prefix splits normally and the URL tail stays intact.
  assert.deepEqual(splitPlainSegs('x/见 https://a/b 的说明'), ['x', '见 https://a/b 的说明'])
  assert.deepEqual(splitPlainSegs('  a //  b '), ['a', 'b'])
})

test('splitTitleSegs treats a PAIRED quote span as verbatim', () => {
  assert.deepEqual(splitTitleSegs('“a/b”/c'), ['“a/b”', 'c'])
  assert.deepEqual(splitTitleSegs('"a/b"/c'), ['"a/b"', 'c'])
  assert.deepEqual(splitTitleSegs('x/“y/z”'), ['x', '“y/z”'])
})

test('splitTitleSegs treats a LONE quote as an ordinary character', () => {
  assert.deepEqual(splitTitleSegs('it"s/a'), ['it"s', 'a'])
  assert.deepEqual(splitTitleSegs('a/“b'), ['a', '“b'])
})

test('normPath normalizes whitespace around separators', () => {
  assert.equal(normPath('  web /  frontend '), 'web/frontend')
  assert.equal(normPath('web'), 'web')
})
