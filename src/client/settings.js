/** Settings surface: the plugin-page card body and the Plugins-tab accordion card. */

import { React, E } from './platform.js'
import { cls } from './core/text.js'
import { VIEW_MODES, ARCHIVED_FILTERS, viewStateOf } from './core/view.js'
import { resolveIcon } from './icons.js'
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


/* --------- settings → plug-ins card (accordion like official cards) --------- */

export function BetterWorkspacePluginCard({ useStore, actions, t }) {
  const [open, setOpen] = React.useState(false)
  const Chevron = resolveIcon('IconChevronDownOutline14')
  return E('li', { className: cls('bw-plugin-card', open && 'bw-plugin-card-open') },
    E('button', {
      type: 'button',
      className: 'bw-plugin-head',
      'aria-expanded': open,
      'aria-label': (open ? t('settings.collapse') : t('settings.expand')) + ': ' + t('settings.title'),
      onClick: () => setOpen(!open),
    },
      E('span', { className: 'bw-plugin-headtext' },
        E('span', { className: 'bw-plugin-name' }, t('settings.title')),
        E('span', { className: 'bw-plugin-desc' }, t('settings.desc')),
      ),
      Chevron ? E(Chevron, { size: 14, className: cls('bw-plugin-chevron', open && 'bw-plugin-chevron-open') }) : null,
    ),
    open ? E('div', { className: 'bw-plugin-body' },
      E(BetterWorkspaceSettings, { useStore, actions, t }),
    ) : null,
  )
}
