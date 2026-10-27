/** Capability probe for the directory-picker fallback: keep native failures distinct from browse-only Hosts. */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { browseFailureText, isBrowseOnlyPicker } from '../src/client/core/picker.ts'

const browseOnly = new Error(
  'directory picker failed: directoryPicker.pick needs the native capability; the composed picker serves "browse"',
)

test('the composed-browse refusal is recognized as a fallback signal', () => {
  assert.equal(isBrowseOnlyPicker(browseOnly), true)
  assert.equal(isBrowseOnlyPicker(String(browseOnly)), true)
})

test('native chooser failures stay native failures', () => {
  assert.equal(isBrowseOnlyPicker(new Error('directory picker failed: spawn zenity ENOENT')), false)
  assert.equal(isBrowseOnlyPicker(new Error('directory picker was aborted')), false)
  assert.equal(isBrowseOnlyPicker(new Error('directory picker failed: picker exited with status 1')), false)
})

test('browse failures surface the Host business message', () => {
  const error = Object.assign(new Error('directory browse failed: directory-picker/unreadable: permission denied'), {
    rpcError: { code: 'directory-picker/unreadable', message: 'permission denied' },
  })
  assert.equal(browseFailureText(error), 'permission denied')
  assert.equal(browseFailureText(new Error('plain failure')), 'plain failure')
})
