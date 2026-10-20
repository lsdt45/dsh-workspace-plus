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
// subagents > completed reminder; idle rows show no dot at all. A session the
// user is looking at is read by definition: its completion reminder is
// suppressed, or the row would advertise "unread" for the conversation on
// screen. `current` is the row's own flag, so every caller that knows which
// session is on screen (the sidebar row, the collapse relay) passes it down.
export const sessionStateOf = (row, current) => {
  if (!row) return null
  if (row.pending === 'approval' || row.pending === 'plan-review' || row.pending === 'question') return 'warning'
  if (row.running || row.subagents > 0) return 'ongoing'
  if (row.completed && current !== true) return 'done'
  return null
}


/**
 * Status breathing light (preference-controlled, default ON): status dots
 * hidden by a collapse bubble outward to the nearest visible container
 * row. Workspace/folder rows breathe on their icon (drop-shadow glow in
 * the status color; a hidden/no icon falls back to the official StateDot);
 * session-group rows carry a breathing StateDot in front of the label.
 * Warning amber and done green mirror the official dots; RUNNING is
 * deliberately not the official blue — the plugin draws that dot itself in
 * orange (see StatusDot), so "running" can never be read as the amber
 * "waiting for you" dot it sits next to. The glow always matches the lamp it
 * relays, whichever component draws that lamp.
 */
export const PULSE_RANK = { warning: 3, ongoing: 2, done: 1 }

export const PULSE_COLORS = { warning: '#d29922', ongoing: '#ff9f45', done: '#3fb950' }

export const pulseRank = (state) => (state ? (PULSE_RANK[state] || 0) : 0)


export function PulseGlow({ state, children }) {
  return E('span', {
    className: 'bw-pulse',
    style: { '--bw-pulse-color': PULSE_COLORS[state] || PULSE_COLORS.ongoing },
  }, children)
}


/**
 * Status-dot diameter: every state draws this size, so the three dots read as
 * one family and a row never shifts when its session changes state.
 */
export const STATUS_DOT_SIZE = 6


/**
 * The one status dot all three states render.
 *
 * The plugin draws it instead of delegating to the official ui.StateDot: that
 * component paints its own dot at a fixed 4px inside whatever box it is handed
 * (a box of 6 and a box of 8 both render 4px — measured in the running app), so
 * the unread/approval dots could never be matched to the running dot's size.
 * Drawing all three keeps the diameters identical, and the colours come from
 * PULSE_COLORS — the same table the breathing glow reads — so a dot and its
 * glow can never drift apart. The host component itself stays untouched, so
 * every other plugin keeps its own indicators.
 */
export function StatusDot({ state, size = STATUS_DOT_SIZE, label }) {
  return E('span', {
    className: 'bw-state-dot',
    role: label ? 'img' : undefined,
    'aria-label': label,
    style: { width: size, height: size, background: PULSE_COLORS[state] },
  })
}


// RUNNING deliberately stays on the session row itself (its orange dot
// breathes there) and does NOT bubble outward — the user found the ongoing
// relay noisy. Only pending-amber and done-green propagate.
export const relayStateOf = (row, current) => {
  const s = sessionStateOf(row, current)
  return s === 'ongoing' ? null : s
}


export function SessionRow({ node, depth, current, onOpen, onContextMenu, now, dropHalf, dragEvents, custStyle, breathing, pinned, onTogglePin, onUnarchive, workspaceTag, tagOnHover, tooltip, t }) {
  const state = sessionStateOf(node, current)
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
    // The event carries Shift, which the browser turns into "open a new tab".
    onClick: (event) => onOpen(node.id, event),
    onContextMenu: onContextMenu,
    role: 'treeitem',
    'aria-current': current || undefined,
    ...(dragEvents || {}),
  },
    pinned ? E('span', { className: 'bw-pin-mark' }, E(PinIcon16, null)) : null,
    E('span', { className: 'bw-row-icon', title: status ? status.title : undefined },
      status
        ? (state === 'ongoing'
          // Running is the orange dot and the only state that breathes, ON the
          // session row only (never relays); the settings toggle covers this
          // breathing too.
          ? (breathing
            ? E(PulseGlow, { state: 'ongoing' }, E(StatusDot, { state: 'ongoing', label: status.title }))
            : E(StatusDot, { state: 'ongoing', label: status.title }))
          : E(StatusDot, { state: status.state, label: status.title }))
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
    // status relays through the same breathing dot as the rows inside it.
    pulse ? E(PulseGlow, { state: pulse }, E(StatusDot, { state: pulse })) : null,
    E('span', { className: 'bw-row-label' }, name),
    count > 0 ? E('span', { className: 'bw-row-count' }, String(count)) : null,
  )
}
