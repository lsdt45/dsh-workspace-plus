/**
 * Ambient surface of the DSH web client that this plugin's bundle entry uses.
 *
 * The shell boots a client bundle by calling `window.__ModuleLoader__.load`
 * with one factory; that factory receives the loader's module `require`, whose
 * ids are the seeded platform modules (react, the store kit, the UI
 * primitives — see @deepseek-ai/dsh-client-web seed.ts). None of those modules
 * ship type declarations to third-party plugins, so their values stay opaque
 * at this boundary: platform.ts is the single place that installs them and
 * every other module consumes its handles.
 */

type HostRequire = (id: string) => any

interface DshClientBundleFactoryOptions {
  /** Stable bundle id (the package name). */
  id: string
  /** Runs once, after the shell has seeded the platform modules. */
  factory: (hostRequire: HostRequire) => unknown
}

interface Window {
  __ModuleLoader__: {
    load(options: DshClientBundleFactoryOptions): void
  }
}
