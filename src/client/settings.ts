/** Settings surface: the plugin-page card body and the Plugins-tab accordion card. */

import { E } from './platform.ts'
import { cls } from './core/text.ts'
import { VIEW_MODES, ARCHIVED_FILTERS, viewStateOf } from './core/view.ts'
import { StyleNode } from './ui/base.ts'
import type { ViewPrefs } from './core/view.ts'
import type { Translate } from './core/time.ts'


/** Selector hook injected for the plugin store; this surface reads only `prefs`. */
export type SettingsUseStore = <T>(selector: (state: { prefs?: ViewPrefs }) => T) => T

/** Store actions the settings controls dispatch. */
export interface SettingsActions {
  setPref: (key: string, value: unknown) => void
  setViewMode: (mode: string) => void
  setSortOrder: (order: string) => void
  setTimeDirection: (dir: string) => void
  setArchivedFilter: (filter: string) => void
}

/** Props of the settings page body (store handle, actions, translator). */
export interface BetterWorkspaceSettingsProps {
  useStore?: SettingsUseStore | null
  actions: SettingsActions
  t: Translate
}


/* ------------------------- settings page ------------------------- */

export function BetterWorkspaceSettings({ useStore, actions, t }: BetterWorkspaceSettingsProps) {
  const prefs: ViewPrefs = useStore ? (useStore(s => s.prefs) || {}) : {}
  const compactChains = prefs.compactChains !== false
  const statusPulse = prefs.statusPulse !== false
  const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefs)
  const choices = (label: string, options: ReadonlyArray<readonly string[]>, selected: string, onPick: (value: string) => void, disabled = false) => E('div', { className: 'bw-setting-row', style: { marginTop: 10 } },
    E('div', { className: 'bw-setting-label' }, t(label)),
    E('div', { className: 'bw-seg', role: 'radiogroup', 'aria-label': t(label) },
      options.map(([value, key]) => E('button', {
        key: value, type: 'button', role: 'radio',
        disabled,
        'aria-checked': selected === value,
        className: cls('bw-seg-btn', selected === value && 'bw-seg-btn-active'),
        onClick: () => onPick(value),
      }, t(key))),
    ),
  )
  // Every on/off preference is one switch + hint pair; the first two are the
  // "restore the host-native UI" escape hatches (tab strip, plugin-drawn dots).
  const switches: Array<[string, boolean]> = [
    ['showTabs', prefs.showTabs !== false],
    // The click gesture: on (default) a sidebar click opens a new tab, off it
    // replaces the current one. Shift always means the other gesture.
    ['newTabOnClick', prefs.newTabOnClick !== false],
    ['statusDots', prefs.statusDots !== false],
    ['compactChains', compactChains],
    ['statusPulse', statusPulse],
  ]
  const switchRow = ([key, value]: [string, boolean], index: number) => [
    E('div', { className: 'bw-setting-row', key: 'row-' + key, style: index === 0 ? undefined : { marginTop: 10 } },
      E('div', { className: 'bw-setting-label' }, t('settings.' + key)),
      E('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': value,
        'aria-label': t('settings.' + key),
        className: cls('bw-switch', value && 'bw-switch-on'),
        onClick: () => { actions.setPref(key, !value) },
      }, E('span', { className: 'bw-switch-thumb' })),
    ),
    E('div', { className: 'bw-hint', key: 'hint-' + key }, t('settings.' + key + '.hint')),
  ]
  return E('div', { className: 'bw-settings' },
    StyleNode(),
    ...switches.flatMap(switchRow),
    choices('view.grouping', VIEW_MODES.map(mode => [mode, 'view.' + mode]), viewMode, mode => actions.setViewMode(mode)),
    choices('view.sort', [['manual', 'view.sort.manual'], ['latest', 'view.sort.latest']], viewMode === 'time' ? 'latest' : sortOrder, order => actions.setSortOrder(order), viewMode === 'time'),
    viewMode === 'time'
      ? choices('view.time.direction', [['latest', 'view.time.latest'], ['oldest', 'view.time.oldest']], timeDirection, dir => actions.setTimeDirection(dir))
      : null,
    viewMode === 'time' ? E('div', { className: 'bw-hint' }, t('view.time.hint')) : null,
    viewMode === 'flat' ? E('div', { className: 'bw-hint' }, t('view.flat.hint')) : null,
    choices('view.filter', ARCHIVED_FILTERS.map(filter => [filter, 'view.filter.' + filter]), archivedFilter, filter => actions.setArchivedFilter(filter)),
    E('div', { className: 'bw-hint' }, t('view.hint')),
  )
}


/* ---------- settings → plugins page: this bundle's configuration ---------- */

/** Props of the Plugins-page card: `summary` (row one-liner) or `page` (the body). */
export interface BetterWorkspaceBundleConfigProps extends BetterWorkspaceSettingsProps {
  view?: string
}

/**
 * The body of the plugin's page in Settings → Plugins.
 *
 * The shell dispatches `plugins.bundle.config` by the bundle's package name and
 * asks for two views: `summary` (the one-liner beside the row) and `page` (the
 * body between the bundle's description and its rows). Only the page needs UI;
 * the row already carries the plugin's own name and description.
 *
 * The controls write the plugin's browser-side store — the same preferences the
 * sidebar reads — so a change here is live immediately.
 */
export function BetterWorkspaceBundleConfig({ view, useStore, actions, t }: BetterWorkspaceBundleConfigProps) {
  if (view !== 'page') return null
  return E('div', { className: 'bw-plugin-config' }, E(BetterWorkspaceSettings, { useStore, actions, t }))
}
