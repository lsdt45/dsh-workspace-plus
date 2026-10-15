/** core/tree.js — virtual folder projection, chain compression and counting. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSessionTree, countSessionTree, collectSessionRows, findSessionGroup, buildTree, buildWorkspaceList, countWorkspaces, materializeChain, compressTree } from '../src/client/core/tree.js'

const ws = (title, extra = {}) => ({ workspaceId: 'id:' + title, title, path: '/p/' + title, sessionIds: [], ...extra })

test('buildTree nests on "/" and derives each leaf', () => {
  const tree = buildTree([ws('web/frontend/app'), ws('solo')], [], undefined)
  assert.deepEqual(tree.workspaces.map((row) => row.leaf), ['solo'])
  assert.deepEqual(tree.folders.map((folder) => folder.name), ['web'])
  const frontend = tree.folders[0].folders[0]
  assert.equal(frontend.name, 'frontend')
  assert.equal(frontend.workspaces[0].leaf, 'app')
  assert.equal(frontend.workspaces[0].folderPath, 'web/frontend')
  assert.equal(frontend.workspaces[0].title, 'web/frontend/app', 'the full title is never rewritten')
})

test('buildTree materializes explicit empty folders', () => {
  const tree = buildTree([], ['web/test'], undefined)
  assert.deepEqual(tree.folders.map((folder) => folder.name), ['web'])
  assert.deepEqual(tree.folders[0].folders.map((folder) => folder.name), ['test'])
  assert.deepEqual(tree.folders[0].folders[0].workspaces, [])
  assert.equal(countWorkspaces(tree), 0)
})

test('buildTree falls back to the directory basename for a separator-only title', () => {
  const tree = buildTree([ws('   ', { path: '/p/real-name' })], [], undefined)
  assert.deepEqual(tree.workspaces.map((row) => row.leaf), ['real-name'])
})

test('buildTree orders folders by name (manual) and by recency (latest)', () => {
  const items = [ws('b/x'), ws('a/y')]
  const manual = buildTree(items, [], undefined)
  assert.deepEqual(manual.folders.map((folder) => folder.name), ['a', 'b'])
  const recency = new Map([['id:b/x', 10], ['id:a/y', 1]])
  const latest = buildTree(items, [], recency)
  assert.deepEqual(latest.folders.map((folder) => folder.name), ['b', 'a'])
})

test('buildWorkspaceList flattens and keeps the full title as the label', () => {
  const list = buildWorkspaceList([ws('web/a'), ws('b')], undefined)
  assert.deepEqual(list.folders, [])
  assert.deepEqual(list.workspaces.map((row) => row.leaf), ['web/a', 'b'])
  assert.deepEqual(list.workspaces.map((row) => row.title), ['web/a', 'b'])
})

test('buildSessionTree groups session rows inside one workspace', () => {
  const rows = [
    { id: '1', title: 'a/b', updatedAt: 5 },
    { id: '2', title: 'plain', updatedAt: 1 },
  ]
  const tree = buildSessionTree(rows, 'manual')
  assert.deepEqual(tree.sessions.map((row) => row.leaf), ['plain'])
  assert.equal(tree.groups[0].name, 'a')
  assert.deepEqual(tree.groups[0].sessions.map((row) => row.leaf), ['b'])
  assert.equal(countSessionTree(tree), 2)
  assert.deepEqual(collectSessionRows(tree).map((row) => row.id), ['2', '1'])
  assert.equal(findSessionGroup(tree, 'a').name, 'a')
  assert.equal(findSessionGroup(tree, 'nope'), null)
})

test('compressTree merges a single-child chain into one workspace row', () => {
  const tree = buildTree([ws('a/b/c/W')], [], undefined)
  const chain = compressTree(tree.folders[0])
  const display = materializeChain(chain)
  assert.equal(display.kind, 'ws')
  assert.equal(display.workspace.leaf, 'a/b/c/W')
  assert.equal(display.path, 'a/b/c', 'expansion identity keeps the deepest path')
  assert.equal(countWorkspaces(display), 1)
})

test('compressTree keeps chain labels RELATIVE to the first populated ancestor', () => {
  const tree = buildTree([ws('a/X'), ws('a/b/c/W')], [], undefined)
  const folderA = tree.folders[0]
  assert.equal(materializeChain(compressTree(folderA)).kind, 'folder')
  const display = compressTree(folderA)
  assert.deepEqual(display.workspaces.map((row) => row.leaf), ['X'])
  assert.equal(display.folders[0].workspace.leaf, 'b/c/W')
})
