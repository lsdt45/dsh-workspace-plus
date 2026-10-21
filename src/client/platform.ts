/**
 * The single platform boundary of the browser half.
 *
 * DSH hands a client bundle its platform modules through the loader factory's
 * require (react, @deepseek-ai/dsh-client-store,
 * @deepseek-ai/dsh-client-ui-primitives — the dsh-client-web seed table). The
 * entry calls installPlatform exactly once with that require; every other module
 * imports the handles from here, so "who may touch platform modules" stays a
 * one-file question (tests/architecture.test.ts enforces it).
 *
 * The bindings are live: modules importing them see the installed values even
 * though installation happens when the factory runs. Nothing here may run at
 * module-evaluation time — only function bodies read the handles.
 *
 * None of the seeded modules ship type declarations to plugins, so the handles
 * are intentionally opaque (the one documented `any` boundary of the client
 * half): components still type their own props, but calls into the shell's
 * runtime stay unchecked.
 */

/** React namespace as seeded by the shell (untyped for plugins). */
export type PlatformReact = any

/** A hyperscript element factory: React.createElement. */
export type ElementFactory = (type: any, props?: any, ...children: any[]) => any

/** The seeded store kit (`defineStore`). */
export type StoreKit = any

/** The seeded UI primitives (`Button`, `Modal`, `StateDot`, …). */
export type UiPrimitives = any

/** Locale namespace this plugin's dictionary is registered under. */
export const NS = 'betterWorkspace'

/** React namespace, installed by {@link installPlatform}. */
export let React: PlatformReact = null

/** `React.createElement`, installed by {@link installPlatform}. */
export let E: ElementFactory = null as unknown as ElementFactory

/** The shell's UI primitives module. */
export let ui: UiPrimitives = null

/** The shell's store kit. */
export let storeKit: StoreKit = null

/** Install the loader-provided platform modules; called by the bundle entry. */
export function installPlatform(hostRequire: (id: string) => any): void {
  React = hostRequire('react')
  E = React.createElement
  ui = hostRequire('@deepseek-ai/dsh-client-ui-primitives')
  storeKit = hostRequire('@deepseek-ai/dsh-client-store')
}
