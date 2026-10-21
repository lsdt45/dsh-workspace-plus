/** Shared UI primitives: buttons, dialogs, the quiet error boundary and the anchored picker list. */

import { E, ui, React } from '../platform.ts'
import { cls } from '../core/text.ts'
import { CSS_TEXT } from '../styles.ts'

/** Props accepted by {@link BTN} (shell button or plain fallback). */
interface ButtonProps {
  variant?: 'primary' | 'outline'
  className?: string
  disabled?: boolean
  onClick?: (event: any) => void
  children?: any
}

export const BTN = (props: ButtonProps) => (
  ui.Button
    ? E(ui.Button, props)
    : E('button', { type: 'button', className: cls('bw-btn', props.variant === 'primary' && 'bw-btn-primary', props.className), onClick: props.onClick, disabled: props.disabled }, props.children)
)

/** Props of {@link TextDialog}. */
interface TextDialogProps {
  title?: string
  hint?: string | null
  initial?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onClose: () => void
  t: (key: string) => string
}

export function TextDialog({ title, hint, initial, confirmLabel, onConfirm, onClose, t }: TextDialogProps) {
  const [value, setValue] = React.useState(initial)
  const inputRef = React.useRef(null)
  React.useEffect(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [])
  const commit = () => onConfirm(value)
  return E(ui.Modal, {
    open: true,
    onClose,
    closeLabel: t('close'),
    title,
    footer: E('div', { className: 'bw-modal-actions' },
      E(BTN, { variant: 'outline', onClick: onClose }, t('cancel')),
      E(BTN, { variant: 'primary', onClick: commit }, confirmLabel || t('confirm')),
    ),
  },
    E('div', { className: 'bw-modal-body' },
      E('div', { className: 'bw-field' },
        E('input', {
          ref: inputRef,
          className: 'bw-input',
          value,
          onChange: (e: any) => setValue(e.target.value),
          onKeyDown: (e: any) => { if (e.key === 'Enter') commit() },
        }),
        hint ? E('div', { className: 'bw-hint' }, hint) : null,
      ),
    ),
    StyleNode(),
  )
}

/** Props of {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  title?: string
  body?: any
  onConfirm: () => void
  onClose: () => void
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  t: (key: string) => string
}

export function ConfirmDialog({ title, body, onConfirm, onClose, confirmLabel, danger, busy, t }: ConfirmDialogProps) {
  return E(ui.Modal, {
    open: true,
    onClose,
    closeLabel: t('close'),
    title,
    footer: E('div', { className: 'bw-modal-actions' },
      E(BTN, { variant: 'outline', onClick: onClose, disabled: busy }, t('cancel')),
      E(BTN, { variant: 'primary', className: danger ? 'bw-confirm-danger' : undefined, onClick: onConfirm, disabled: busy }, confirmLabel || t('confirm')),
    ),
  }, E('div', { className: 'bw-modal-body' }, E('div', { className: 'bw-hint' }, body)), StyleNode())
}

/** Props of the quiet boundary: the region it degrades. */
interface BoundaryProps {
  children?: any
}

/** State of the quiet boundary: whether the region already failed. */
interface BoundaryState {
  failed: boolean
}

/**
 * Error boundary factory: the class heritage evaluates when it is DEFINED, so it
 * must be created after the entry installs the platform handles (a module-level
 * `class extends React.Component` would run before installPlatform and throw).
 */
export function createQuietBoundary() {
  return class Boundary extends React.Component {
    constructor(props: BoundaryProps) {
      super(props)
      this.state = { failed: false }
    }
    static getDerivedStateFromError(): BoundaryState {
      return { failed: true }
    }
    componentDidCatch(error: unknown, info: unknown) {
      console.error('[dsh-workspace-plus] render error (region degraded to empty)', error, info)
    }
    render() {
      return this.state.failed ? null : this.props.children
    }
  }
}

/**
 * Dropdown panel shared by both destination pickers.
 *
 * It renders as a FIXED popover anchored to its control. Two reasons:
 * an in-flow list grew the whole dialog every time it opened, and the
 * modal card carries `overflow: hidden`, which would crop a merely
 * absolute panel. Fixed positioning escapes both — no portal, which a
 * client plugin cannot open (react-dom is not a seeded module).
 * The panel flips above its anchor when the viewport bottom is too close.
 */
const PICKER_LIST_MAX = 168

/** Props of {@link PickerList}. */
interface PickerListProps {
  anchorRef: { current: HTMLElement | null }
  label?: string
  preferAbove?: boolean
  onKeyDown?: (event: any) => void
  children?: any
}

/** The fixed popover geometry the list measures for itself. */
interface PickerBox {
  left: number
  top: number
  width: number
  maxHeight: number
}

export function PickerList({ anchorRef, label, preferAbove = false, onKeyDown, children }: PickerListProps) {
  const listRef = React.useRef(null)
  const [box, setBox] = React.useState(null)
  const place = () => {
    const anchor = anchorRef.current
    const list = listRef.current
    if (!anchor || !list) return
    const rect = anchor.getBoundingClientRect()
    const gap = 4
    const margin = 8
    const content = Math.min(list.scrollHeight, PICKER_LIST_MAX)
    const spaceBelow = window.innerHeight - rect.bottom - margin - gap
    const spaceAbove = rect.top - margin - gap
    const fitsBelow = spaceBelow >= content
    const fitsAbove = spaceAbove >= content
    // Both fit: honour the control's preference (the LAST field opens up so
    // the panel never sits on the footer buttons). Only one fits: use it.
    // Neither: take the roomier side.
    const below = fitsBelow && fitsAbove ? !preferAbove : fitsBelow ? true : fitsAbove ? false : spaceBelow >= spaceAbove
    const maxHeight = Math.max(72, Math.min(content, below ? spaceBelow : spaceAbove))
    const height = Math.min(content, maxHeight)
    const next = {
      left: Math.round(rect.left),
      top: Math.round(below ? rect.bottom + gap : rect.top - gap - height),
      width: Math.round(rect.width),
      maxHeight: Math.round(maxHeight),
    }
    setBox((prev: PickerBox | null) => (prev !== null && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.maxHeight === next.maxHeight ? prev : next))
  }
  // Runs after every render: filtering the rows changes the panel height,
  // and `setBox` keeps its identity while the geometry is unchanged.
  React.useLayoutEffect(() => { place() })
  React.useEffect(() => {
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [])
  return E('div', {
    ref: listRef,
    className: 'bw-picker-list',
    role: 'listbox',
    'aria-label': label,
    // First paint stays invisible until the anchor is measured (the layout
    // effect runs before paint, so nothing flickers).
    style: box === null
      ? { position: 'fixed', left: 0, top: 0, width: 240, maxHeight: PICKER_LIST_MAX, visibility: 'hidden' }
      : { position: 'fixed', left: box.left, top: box.top, width: box.width, maxHeight: box.maxHeight },
    onKeyDown,
  }, children)
}

    /**
     * Project badge for a session row (time-view hover tag / pinned-tray tag).
     *
     * The label is GENERATED CONTENT (`data-tag` + the `.bw-pinned-ws-tag::after`
     * rule in the stylesheet), never a text child:
     * A third-party session context-menu plugin classifies a [role=treeitem] row
     * as a WORKSPACE row as soon as any leaf span/button/div inside it trims to a
     * workspace title, and a real text child made every
     * tagged session row open the workspace menu (new session / rename
     * workspace / …) instead of this plugin's session menu. Keep the text in a
     * data attribute; `title` carries the native tooltip.
     */
export const renderWsTag = (workspaceTag: string, tagOnHover?: boolean) => E('span', {
  className: cls('bw-pinned-ws-tag', tagOnHover && 'bw-ws-tag-hover'),
  title: workspaceTag,
  'data-tag': workspaceTag,
})

export const StyleNode = () => E('style', null, CSS_TEXT)
