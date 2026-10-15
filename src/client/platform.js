/**
 * The single platform boundary of the browser half.
 *
 * DSH hands a client bundle its platform modules through the loader factory's
 * require (react, @deepseek-ai/dsh-client-store,
 * @deepseek-ai/dsh-client-ui-primitives — the dsh-client-web seed table). The
 * entry calls installPlatform exactly once with that require; every other module
 * imports the handles from here, so "who may touch platform modules" stays a
 * one-file question (tests/architecture.test.mjs enforces it).
 *
 * The bindings are live: modules importing them see the installed values even
 * though installation happens when the factory runs. Nothing here may run at
 * module-evaluation time — only function bodies read the handles.
 */
export let React = null
export let E = null
export let ui = null
export let storeKit = null

/** Locale namespace this plugin's dictionary is registered under. */
export const NS = 'betterWorkspace'

/** Install the loader-provided platform modules; called by the bundle entry. */
export function installPlatform(hostRequire) {
  React = hostRequire('react')
  E = React.createElement
  ui = hostRequire('@deepseek-ai/dsh-client-ui-primitives')
  storeKit = hostRequire('@deepseek-ai/dsh-client-store')
}
