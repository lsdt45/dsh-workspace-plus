/** Settings surface: the plugin-page card body and the Plugins-tab accordion card. */

import { E } from './platform.js'
import { cls } from './core/text.js'
import { VIEW_MODES, ARCHIVED_FILTERS, viewStateOf } from './core/view.js'
import { StyleNode } from './ui/base.js'


/* ------------------------- settings page ------------------------- */

export function BetterWorkspaceSettings({ useStore, actions, t }) {
  const prefs = useStore ? (useStore(s => s.prefs) || {}) : {}
  const compactChains = prefs.compactChains !== false
  const statusPulse = prefs.statusPulse !== false
  const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefs)
  const choices = (label, options, selected, onPick, disabled = false) => E('div', { className: 'bw-setting-row', style: { marginTop: 10 } },
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
  return E('div', { className: 'bw-settings' },
    StyleNode(),
    E('div', { className: 'bw-setting-row' },
      E('div', { className: 'bw-setting-label' }, t('settings.compactChains')),
      E('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': compactChains,
        'aria-label': t('settings.compactChains'),
        className: cls('bw-switch', compactChains && 'bw-switch-on'),
        onClick: () => { actions.setPref('compactChains', !compactChains) },
      }, E('span', { className: 'bw-switch-thumb' })),
    ),
    E('div', { className: 'bw-hint' }, t('settings.compactChains.hint')),
    E('div', { className: 'bw-setting-row', style: { marginTop: 10 } },
      E('div', { className: 'bw-setting-label' }, t('settings.statusPulse')),
      E('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': statusPulse,
        'aria-label': t('settings.statusPulse'),
        className: cls('bw-switch', statusPulse && 'bw-switch-on'),
        onClick: () => { actions.setPref('statusPulse', !statusPulse) },
      }, E('span', { className: 'bw-switch-thumb' })),
    ),
    E('div', { className: 'bw-hint' }, t('settings.statusPulse.hint')),
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
export function BetterWorkspaceBundleConfig({ view, useStore, actions, t }) {
  if (view !== 'page') return null
  return E('div', { className: 'bw-plugin-config' }, E(BetterWorkspaceSettings, { useStore, actions, t }))
}
