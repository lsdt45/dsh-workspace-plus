/** Tree row components (workspace folder / workspace / session / session group) and their status helpers. */

import { E, ui } from './platform.js'
import { cls } from './core/text.js'
import { timeLabel } from './core/time.js'
import { countWorkspaces } from './core/tree.js'
import { icon, PinIcon16 } from './icons.js'
import { renderWsTag } from './ui/base.js'
import { useHoverTip } from './ui/tooltip.js'


/** Folder glyph variants from the primitives family (solid / outline / hidden). */
/** Custom icon value → glyph: legacy slots (solid/outline/none) or any primitives icon name. */
export const iconOf = (mode, expanded) => {
  if (!mode || mode === 'none') return null
  if (mode === 'solid') return icon(expanded ? 'IconFolderOpen16' : 'IconFolderClose16')
  if (mode === 'outline') return icon('IconFolderOpenOutline16')
  return icon(mode)
}


export const colorToRgb = (hex) => {
  if (!hex) return null
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return null
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export const rgbToHex = (r, g, b) => '#' + [r, g, b]
  .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
  .join('')


export function FolderRow({ node, depth, expanded, onToggle, onContextMenu, dropInto, dragEvents, custStyle, iconMode, pulse, t }) {
  const total = countWorkspaces(node)
  const iconEl = iconOf(iconMode, expanded)
  // Hidden status dots breathe on the icon; with the icon hidden (mode
  // "none" or a missing primitive) the official StateDot stands in.
  const iconChild = pulse
    ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null))
    : iconEl
  return E('div', {
    className: cls('bw-row', dropInto && 'bw-drop-into'),
    'data-bw-context': 'folder',
    style: { paddingLeft: 4 + depth * 12, ...(custStyle || {}), ...(pulse ? { '--bw-pulse-color': PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null) },
    onClick: onToggle,
    onContextMenu: onContextMenu,
    role: 'treeitem',
    'aria-expanded': expanded,
    ...(dragEvents || {}),
  },
    E('span', { className: cls('bw-chevron', expanded && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
    E('span', { className: 'bw-row-icon' }, iconChild),
    // A row that already carries a custom label glow breathes in sync.
    E('span', { className: cls('bw-row-label', pulse && custStyle && custStyle.textShadow && 'bw-pulse-text') }, node.name),
    total > 0 ? E('span', { className: 'bw-row-count' }, String(total)) : null,
  )
}


export function WorkspaceGroupRow({ group, expanded, onToggle, onContextMenu, dropInto, dragEvents }) {
  return E('div', {
    className: cls('bw-workspace-group', dropInto && 'bw-drop-into'),
    'data-bw-context': 'workspace-group',
    role: 'treeitem', 'aria-expanded': group.id ? expanded : undefined, tabIndex: 0,
    onClick: onToggle, onContextMenu,
    onKeyDown: event => {
      if (onToggle && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onToggle() }
    },
    ...(dragEvents || {}),
  },
    E('span', { className: 'bw-row-label' }, group.name),
    group.id ? E('span', { className: cls('bw-workspace-group-chevron', expanded && 'bw-workspace-group-chevron-open'), 'aria-hidden': true }, icon('IconChevronRightOutline14', 14)) : null,
  )
}


export function WorkspaceRow({ workspace, depth, count, sessionsOpen, onToggle, onStart, onContextMenu, currentInside, dropHalf, dragEvents, custStyle, iconMode, pulse, pinCount, t }) {
  const iconEl = iconOf(iconMode, sessionsOpen)
  const iconChild = pulse
    ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null))
    : iconEl
  return E('div', {
    className: cls('bw-row', currentInside && 'bw-row-current', dropHalf === 'before' && 'bw-drop-before', dropHalf === 'after' && 'bw-drop-after'),
    'data-bw-context': 'workspace',
    style: { paddingLeft: 6 + depth * 12, ...(custStyle || {}), ...(pulse ? { '--bw-pulse-color': PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null) },
    onClick: onToggle,
    onContextMenu: onContextMenu,
    role: 'treeitem',
    'aria-expanded': sessionsOpen,
    ...(dragEvents || {}),
  },
    E('span', { className: cls('bw-chevron', sessionsOpen && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
    E('span', { className: 'bw-row-icon' }, iconChild),
    E('span', { className: cls('bw-row-label', pulse && custStyle && custStyle.textShadow && 'bw-pulse-text'), title: workspace.title || workspace.leaf }, workspace.leaf),
    pinCount > 0 ? E('span', { className: 'bw-pin-ind', 'aria-label': t('pinned.header'), title: t('pinned.header') }, E(PinIcon16, { size: 10 }), String(pinCount)) : null,
    count > 0 ? E('span', { className: 'bw-row-count' }, String(count)) : null,
    E('span', { className: 'bw-row-actions', onClick: (e) => e.stopPropagation() },
      E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('session.new'), onClick: (e) => { e.stopPropagation(); onStart() } }, icon('IconPlusOutline16')),
    ),
  )
}


// Official status priority: pending interaction > running > running
// subagents > completed reminder; idle rows show no dot at all.
export const sessionStateOf = (row) => {
  if (!row) return null
  if (row.pending === 'approval' || row.pending === 'plan-review' || row.pending === 'question') return 'warning'
  if (row.running || row.subagents > 0) return 'ongoing'
  if (row.completed) return 'done'
  return null
}


/**
 * Status breathing light (preference-controlled, default ON): status dots
 * hidden by a collapse bubble outward to the nearest visible container
 * row. Workspace/folder rows breathe on their icon (drop-shadow glow in
 * the status color; a hidden/no icon falls back to the official StateDot);
 * session-group rows carry a breathing StateDot in front of the label.
 * Colors mirror the official dots: warning amber > ongoing blue > done
 * green, so the glow always matches the lamp it relays.
 */
export const PULSE_RANK = { warning: 3, ongoing: 2, done: 1 }

export const PULSE_COLORS = { warning: '#d29922', ongoing: '#5b8def', done: '#3fb950' }

export const pulseRank = (state) => (state ? (PULSE_RANK[state] || 0) : 0)


export function PulseGlow({ state, children }) {
  return E('span', {
    className: 'bw-pulse',
    style: { '--bw-pulse-color': PULSE_COLORS[state] || PULSE_COLORS.ongoing },
  }, children)
}


// RUNNING deliberately stays on the session row itself (its official ring
// breathes blue there) and does NOT bubble outward — the user found the
// ongoing relay noisy. Only pending-amber and done-green propagate.
export const relayStateOf = (row) => {
  const s = sessionStateOf(row)
  return s === 'ongoing' ? null : s
}


export function SessionRow({ node, depth, current, onOpen, onContextMenu, now, dropHalf, dragEvents, custStyle, breathing, pinned, onTogglePin, onUnarchive, workspaceTag, tagOnHover, tooltip, t }) {
  const state = sessionStateOf(node)
  const status = state === null ? null : {
    state,
    title: state === 'warning'
      ? t('status.' + (node.pending === 'plan-review' ? 'planReview' : node.pending))
      : state === 'ongoing'
        ? (node.running ? t('status.running') : t('status.subagents', { n: node.subagents }))
        : t('status.completed'),
  }
  // Hover tooltip label: line 1 is the full title, line 2 the project ·
  // absolute timestamp. Built only while the bubble is visible (the
  // primitives resolver). updatedAt 0 contributes no time part; a blank
  // workspace tag drops the meta segment.
  const hasHoverLabel = tooltip === true
  const hoverLabel = hasHoverLabel
    ? () => {
      const meta = [workspaceTag, Number(node.updatedAt) > 0 ? new Date(Number(node.updatedAt)).toLocaleString() : ''].filter(Boolean).join(' · ')
      const title = node.leaf || node.title
      return meta !== '' ? title + '\n' + meta : title
    }
    : null
  // The plugin owns this bubble (see ui/tooltip.js): the host primitives
  // Tooltip withdraws only on the anchor's mouseleave, and a row that re-sorts
  // or scrolls out from under the pointer never gets one — the bubble stayed on
  // screen until that exact row was hovered and left again.
  const tip = useHoverTip({ label: hoverLabel, delayMs: 300, gap: 8, maxWidth: 320 })
  const renderActions = () => {
    let button
    if (node.archived) {
      button = E('button', {
        type: 'button', className: 'bw-icon-btn', disabled: typeof onUnarchive !== 'function',
        'aria-label': t('menu.unarchive'), title: t('menu.unarchive'),
        onClick: (e) => { e.stopPropagation(); if (onUnarchive) onUnarchive(node.id) },
      }, icon('IconArchiveOutline20', 14))
    } else if (typeof onTogglePin === 'function') {
      button = E('button', {
        type: 'button', className: 'bw-icon-btn', 'aria-pressed': pinned ? 'true' : 'false',
        'aria-label': pinned ? t('menu.unpin') : t('menu.pin'), title: pinned ? t('menu.unpin') : t('menu.pin'),
        onClick: (e) => { e.stopPropagation(); onTogglePin(node.id) },
      }, E(PinIcon16, null))
    } else return null
    return E('span', { className: 'bw-row-actions', onClick: (e) => e.stopPropagation() }, button)
  }
  const row = E('div', {
    className: cls('bw-row', 'bw-session-row', node.archived && 'bw-session-row-archived', current && 'bw-row-current', pinned && 'bw-session-row-pinned', workspaceTag && !tagOnHover && 'bw-tray-row', dropHalf === 'before' && 'bw-drop-before', dropHalf === 'after' && 'bw-drop-after'),
    'data-bw-context': 'session',
    ...(hasHoverLabel ? tip.attach : null),
    style: { paddingLeft: 8 + depth * 12, ...(custStyle || {}) },
    onClick: () => onOpen(node.id),
    onContextMenu: onContextMenu,
    role: 'treeitem',
    'aria-current': current || undefined,
    ...(dragEvents || {}),
  },
    pinned ? E('span', { className: 'bw-pin-mark' }, E(PinIcon16, null)) : null,
    E('span', { className: 'bw-row-icon', title: status ? status.title : undefined },
      status && typeof ui.StateDot === 'function'
        ? (state === 'ongoing' && breathing
          // Running breathes blue ON the session row only (never relays);
          // the settings toggle covers this breathing too.
          ? E(PulseGlow, { state: 'ongoing' }, E(ui.StateDot, { state: status.state, size: 10 }))
          : E(ui.StateDot, { state: status.state, size: 10 }))
        : E('span', { className: 'bw-dot' }),
    ),
    E('span', { className: 'bw-row-label' }, node.leaf || node.title),
    node.archived ? E('span', { className: 'bw-archive-mark', role: 'img', 'aria-label': t('session.archived'), title: t('session.archived') }, icon('IconArchiveOutline20', 14)) : null,
    workspaceTag ? renderWsTag(workspaceTag, tagOnHover) : null,
    node.hasActiveSchedule
      ? E('span', { className: 'bw-schedule-badge', role: 'img', 'aria-label': t('schedule.active'), title: t('schedule.active') }, icon('IconAlarmClockOutline16', 14))
      : null,
    E('span', { className: 'bw-row-time' }, timeLabel(node.updatedAt, now, t, ui.relativeTime)),
    renderActions(),
    // Out of flow (position:fixed), so it adds no flex item to the row.
    hasHoverLabel ? tip.bubble : null,
  )
  return row
}


/**
 * Session sub-group inside a workspace (same "/" convention on session
 * titles). Deliberately NOT styled like a workspace folder — no folder
 * icon, tertiary color — so a session level never reads as a workspace.
 */
export function SessionGroupRow({ name, depth, expanded, count, onToggle, onContextMenu, dropInto, dragEvents, custStyle, pulse, t }) {
  return E('div', {
    'data-bw-context': 'session-group',
    className: cls('bw-row', 'bw-sgroup-row', dropInto && 'bw-drop-into'),
    style: { paddingLeft: 10 + depth * 12, ...(custStyle || {}) },
    onClick: onToggle,
    onContextMenu: onContextMenu,
    role: 'treeitem',
    'aria-expanded': expanded,
    ...(dragEvents || {}),
  },
    E('span', { className: cls('bw-chevron', expanded && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
    // Session groups have no icon slot: a collapsed group with hidden
    // status relays through a breathing official StateDot instead.
    pulse ? E(PulseGlow, { state: pulse }, typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null) : null,
    E('span', { className: 'bw-row-label' }, name),
    count > 0 ? E('span', { className: 'bw-row-count' }, String(count)) : null,
  )
}
