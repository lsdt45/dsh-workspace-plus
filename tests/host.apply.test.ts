/**
 * Host-half smoke test.
 *
 * The host half only registers the session-delete route; every service it needs
 * is reached through ctx.inject/ctx.get, so a profile without them must still
 * load the plugin instead of throwing during boot. This pins that guard, and
 * that a bare context (logger only) is enough to apply.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

const plugin = await import('../src/index.ts')

test('the host half applies on a bare context', () => {
  const ctx = {
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    inject: () => {},
  }
  assert.doesNotThrow(() => (plugin.apply as any)(ctx))
})

test('the host half applies without any context', () => {
  assert.doesNotThrow(() => plugin.apply(undefined))
})

test('the plugin has the name the profile registers', () => {
  assert.equal(plugin.name, 'dsh-workspace-plus')
})
