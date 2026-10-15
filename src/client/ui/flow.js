/** The add-workspace flow: directory pick, destination section picker and parent-group path picker. */

import { React, E, ui } from '../platform.js'
import { cls, basename, splitTitleSegs, normPath } from '../core/text.js'
import { messageOf } from '../host.js'
import { zh } from '../i18n/zh.js'
import { icon } from '../icons.js'
import { BTN, PickerList, StyleNode } from '../ui/base.js'


/**
 * Render crash insurance: dsh boots all-or-nothing (one failed entry
 * fails the whole web boot) and React unmounts the root on an uncaught
 * render error — so our registrations render behind this boundary and a
 * bug degrades to "region renders nothing", never a blank application.
 */


/**
 * The add-workspace picking interaction: native directory pick, then a
 * small parent-group popup, then create + rename with the chosen prefix.
 * Works as a directoryFlow occupant (owner conversation props) and as the
 * browser's directly composed flow (same props, owner state lives above).
 */
export function BetterFlow(props) {
  const { open, busy, onPicked, onCancel, onError, createWorkspace, renameWorkspace, pickDirectory, useWorkspaces, useStore, t } = props
  const initialParent = props.initialParent || ''
  const actions = props.actions
  const [phase, setPhase] = React.useState('idle') // idle | picking | picked | submitting
  const [pickedPath, setPickedPath] = React.useState('')
  const [parentInput, setParentInput] = React.useState('')
  // Destination state. The 分区 (section) is CLICKED out of the store's
  // section list — the field used to be a native <datalist>, whose popup
  // the browser renders outside the dialog: it needed typing before it
  // showed anything and covered the footer buttons. The name-path group
  // keeps its free-text semantics and now suggests the same way.
  const [sectionPick, setSectionPick] = React.useState(null) // null | { id, name } | { name, isNew: true }
  const [sectionOpen, setSectionOpen] = React.useState(false)
  const [sectionNewOpen, setSectionNewOpen] = React.useState(false)
  const [sectionDraft, setSectionDraft] = React.useState('')
  const [sectionError, setSectionError] = React.useState('')
  const [pathOpen, setPathOpen] = React.useState(false)
  const sectionBoxRef = React.useRef(null)
  const pathBoxRef = React.useRef(null)
  // Anchors the fixed dropdown panels are positioned against.
  const sectionTriggerRef = React.useRef(null)
  const pathAnchorRef = React.useRef(null)
  // All hooks run before any early return: the flow unmounts its dialog
  // while closed, but its hook sequence must stay stable.
  const snapshotItems = typeof useWorkspaces === 'function' ? useWorkspaces(s => s.items) : []
  const storeFolders = typeof useStore === 'function' ? (useStore(s => s.folders) || []) : []
  const storedSections = typeof useStore === 'function' ? (useStore(s => s.workspaceGroups) || []) : []
  const sections = React.useMemo(() => (
    Array.isArray(storedSections)
      ? storedSections.slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh'))
      : []
  ), [storedSections])
  // Sections are written through the view store's actions; without that
  // seat (a host that mounts this flow alone) the field is hidden rather
  // than shown dead.
  const canAssignSection = !!(actions && typeof actions.assignWorkspaceGroup === 'function')

  React.useEffect(() => {
    if (!open) {
      setPhase('idle')
      setPickedPath('')
      setParentInput('')
      setSectionPick(null)
      setSectionOpen(false)
      setSectionNewOpen(false)
      setSectionDraft('')
      setSectionError('')
      setPathOpen(false)
      return
    }
    let alive = true
    setPhase('picking')
    Promise.resolve()
      .then(() => pickDirectory())
      .then((path) => {
        if (!alive) return
        if (!path) { onCancel(); return }
        setPickedPath(String(path))
        setParentInput(initialParent)
        setPhase('picked')
      })
      .catch((reason) => {
        if (!alive) return
        setPhase('idle')
        onError(messageOf(reason))
      })
    return () => { alive = false }
  }, [open])

  // One document-level pointerdown closes whichever picker is open; both
  // lists live INSIDE their field box, so a row click never closes first.
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      const node = event.target
      if (!(node instanceof Node)) return
      if (sectionBoxRef.current && sectionBoxRef.current.contains(node)) return
      if (pathBoxRef.current && pathBoxRef.current.contains(node)) return
      setSectionOpen(false)
      setPathOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (!open || (phase !== 'picked' && phase !== 'submitting')) return null

  const folderOptions = (() => {
    const set = new Set(storeFolders)
    for (const w of snapshotItems || []) {
      const segs = splitTitleSegs(w.title)
      for (let i = 1; i < segs.length; i++) set.add(segs.slice(0, i).join('/'))
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh'))
  })()

  const submitting = phase === 'submitting' || busy === true
  const previewTitle = (() => {
    const prefix = normPath(parentInput)
    const base = basename(pickedPath)
    return prefix !== '' ? prefix + '/' + base : base
  })()
  const typedPath = normPath(parentInput)
  const pathFilter = parentInput.trim().toLocaleLowerCase()
  const visibleFolders = (pathFilter === ''
    ? folderOptions
    : folderOptions.filter(option => option.toLocaleLowerCase().indexOf(pathFilter) !== -1)).slice(0, 60)
  const canCreatePath = typedPath !== '' && folderOptions.indexOf(typedPath) === -1

  /** Escape inside a picker closes that list, never the dialog behind it. */
  const consumeEscape = (event, close) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    close()
  }

  /**
   * Arrow keys are the affordance a native select had: on a trigger/caret
   * they open the list (or step into its first row), and inside a list they
   * walk its rows. Text inputs keep their own caret keys.
   */
  const openListKeys = (event, isOpen, open) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    if (isOpen) {
      const box = event.currentTarget.closest('.bw-field')
      const row = box ? box.querySelector('button.bw-picker-row:not(:disabled)') : null
      if (row) row.focus()
      return
    }
    open()
  }

  /** Walk the rows of the list that owns the keyboard. */
  const walkListKeys = (event) => {
    if (event.target && event.target.tagName === 'INPUT') return
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(event.key) === -1) return
    const rows = event.currentTarget.querySelectorAll('button.bw-picker-row:not(:disabled)')
    if (rows.length === 0) return
    event.preventDefault()
    const current = Array.prototype.indexOf.call(rows, event.target)
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? rows.length - 1
        : current === -1 ? (event.key === 'ArrowDown' ? 0 : rows.length - 1)
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
    rows[next].focus()
  }

  /** One selectable row of either picker; a checked row carries the glyph. */
  const pickerRow = (key, label, active, onPick, glyph) => E('button', {
    key, type: 'button', role: 'option', 'aria-selected': active === true, disabled: submitting,
    className: cls('bw-picker-row', active && 'bw-picker-row-on'),
    onClick: onPick,
  },
    E('span', { className: 'bw-picker-check', 'aria-hidden': true }, active ? icon('IconCheckOutline14', 12) : (glyph || null)),
    E('span', { className: 'bw-picker-row-label' }, label),
  )

  /**
   * A section typed here is only a PENDING pick: it is created together
   * with the workspace on 创建, so cancelling the dialog never leaves an
   * empty section behind.
   */
  const commitNewSection = () => {
    const name = sectionDraft.trim()
    if (name === '') { setSectionError(t('flow.section.empty')); return }
    if (sections.some(group => String(group.name || '').toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setSectionError(t('flow.section.exists'))
      return
    }
    setSectionPick({ name, isNew: true })
    setSectionNewOpen(false)
    setSectionDraft('')
    setSectionError('')
    setSectionOpen(false)
  }

  const confirm = () => {
    if (phase === 'submitting') return
    const prefix = normPath(parentInput)
    const base = basename(pickedPath)
    const fullTitle = prefix !== '' ? prefix + '/' + base : base
    const section = canAssignSection ? sectionPick : null
    setPhase('submitting')
    Promise.resolve()
      .then(() => createWorkspace({ path: pickedPath }))
      .then(async (workspace) => {
        try {
          await renameWorkspace(workspace.workspaceId, fullTitle)
        } catch (renameError) {
          onError(messageOf(renameError))
          onCancel()
          return
        }
        try {
          if (prefix !== '' && actions && typeof actions.addFolder === 'function') actions.addFolder(prefix)
          // The section write lands after the host workspace exists; the
          // tree places the row by section id, so this IS the "add to
          // section" the dialog offers.
          if (section) {
            if (section.isNew) {
              const groupId = crypto.randomUUID()
              actions.createWorkspaceGroup(groupId, section.name, workspace.workspaceId)
              actions.setExpanded('workspace-group:' + groupId, true)
            } else {
              actions.assignWorkspaceGroup(workspace.workspaceId, section.id)
              actions.setExpanded('workspace-group:' + section.id, true)
            }
          }
        } catch (assignError) {
          // The workspace exists by now; a failed destination write must
          // surface without pretending the creation itself failed.
          onError(messageOf(assignError))
        }
        onCancel()
      })
      .catch((reason) => {
        onError(messageOf(reason))
        onCancel()
      })
  }

  const body = E('div', { className: 'bw-modal-body' },
    E('div', { className: 'bw-field' },
      t('flow.picked'),
      E('div', { className: 'bw-path-echo' }, pickedPath),
    ),
    canAssignSection ? E('div', {
      className: 'bw-field',
      ref: sectionBoxRef,
      // Escape belongs to the OPEN LIST, wherever the keyboard sits inside
      // this field (trigger, list, inline name input) — the dialog's own
      // Escape must not fire while a list is open.
      onKeyDown: (event) => { if (sectionOpen) consumeEscape(event, () => setSectionOpen(false)) },
    },
      t('flow.section'),
      E('div', { className: 'bw-picker' },
        E('button', {
          type: 'button', className: 'bw-picker-trigger', disabled: submitting, ref: sectionTriggerRef,
          'aria-haspopup': 'listbox', 'aria-expanded': sectionOpen,
          onClick: () => {
            setSectionOpen(v => !v)
            setSectionNewOpen(false)
            setSectionDraft('')
            setSectionError('')
            setPathOpen(false)
          },
          onKeyDown: (event) => openListKeys(event, sectionOpen, () => setSectionOpen(true)),
        },
          E('span', { className: cls('bw-picker-value', sectionPick === null && 'bw-picker-value-muted') },
            sectionPick === null ? t('flow.section.none') : sectionPick.name),
          E('span', { className: 'bw-picker-caret', 'aria-hidden': true }, icon('IconChevronDownOutline14', 12)),
        ),
        sectionOpen ? E(PickerList, {
          anchorRef: sectionTriggerRef, label: t('flow.section'), onKeyDown: walkListKeys,
        },
          pickerRow('section:none', t('flow.section.none'), sectionPick === null,
            () => { setSectionPick(null); setSectionOpen(false) }),
          sections.length > 0
            ? E('div', { key: 'section:heading', className: 'bw-picker-heading' }, t('flow.section.heading'))
            : null,
          sections.map(group => pickerRow('section:' + group.id, group.name,
            sectionPick !== null && sectionPick.id === group.id,
            () => { setSectionPick({ id: group.id, name: group.name }); setSectionOpen(false) })),
          sectionNewOpen
            ? E('div', { key: 'section:new-row', className: 'bw-picker-new' },
              E('input', {
                className: 'bw-input', value: sectionDraft, placeholder: t('flow.section.name'),
                disabled: submitting, autoFocus: true,
                onChange: (event) => { setSectionDraft(event.target.value); setSectionError('') },
                onKeyDown: (event) => {
                  if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); commitNewSection(); return }
                  consumeEscape(event, () => { setSectionNewOpen(false); setSectionDraft(''); setSectionError('') })
                },
              }),
              E('button', {
                type: 'button', className: 'bw-btn bw-btn-primary bw-btn-sm',
                disabled: submitting, onClick: commitNewSection,
              }, t('confirm')),
            )
            : pickerRow('section:new', t('flow.section.new'), sectionPick !== null && sectionPick.isNew === true,
              () => { setSectionNewOpen(true); setSectionDraft('') }, icon('IconPlusOutline14', 12)),
          sectionError !== '' ? E('div', { key: 'section:error', className: 'bw-picker-error' }, sectionError) : null,
        ) : null,
      ),
      E('div', { className: 'bw-hint' }, t('flow.section.hint')),
    ) : null,
    E('div', {
      className: 'bw-field',
      ref: pathBoxRef,
      // Escape belongs to the OPEN LIST, wherever the keyboard sits inside
      // this field; with no list open it stays the dialog's own Escape.
      onKeyDown: (event) => { if (pathOpen) consumeEscape(event, () => setPathOpen(false)) },
    },
      t('flow.parent'),
      E('div', { className: 'bw-picker' },
        E('div', { className: 'bw-field-row', ref: pathAnchorRef },
          E('input', {
            className: 'bw-input',
            value: parentInput,
            autoFocus: true,
            placeholder: 'web/frontend',
            disabled: submitting,
            onChange: (event) => { setParentInput(event.target.value); setPathOpen(true) },
            // Suggestions open when the field is actually used (typing, a
            // click, or the caret) — an autofocus must not grow the dialog.
            onPointerDown: () => setPathOpen(true),
            onKeyDown: (event) => { if (event.key === 'Enter') { event.preventDefault(); confirm() } },
          }),
          E('button', {
            type: 'button', className: 'bw-field-caret', disabled: submitting,
            'aria-label': t('flow.parent'), 'aria-expanded': pathOpen,
            onClick: () => { setPathOpen(v => !v); setSectionOpen(false) },
            onKeyDown: (event) => openListKeys(event, pathOpen, () => { setPathOpen(true); setSectionOpen(false) }),
          }, icon('IconChevronDownOutline14', 12)),
        ),
        pathOpen ? E(PickerList, {
          anchorRef: pathAnchorRef, label: t('flow.parent'), preferAbove: true, onKeyDown: walkListKeys,
        },
          pickerRow('path:root', t('flow.parent.root'), typedPath === '',
            () => { setParentInput(''); setPathOpen(false) }),
          folderOptions.length > 0
            ? E('div', { key: 'path:heading', className: 'bw-picker-heading' }, t('flow.parent.heading'))
            : null,
          visibleFolders.map(option => pickerRow('path:' + option, option, typedPath === option,
            () => { setParentInput(option); setPathOpen(false) })),
          canCreatePath
            ? pickerRow('path:new', t('flow.parent.new', { path: typedPath }), false,
              () => setPathOpen(false), icon('IconPlusOutline14', 12))
            : null,
          folderOptions.length === 0 && !canCreatePath
            ? E('div', { key: 'path:empty', className: 'bw-picker-empty' }, t('flow.parent.empty'))
            : null,
        ) : null,
      ),
      E('div', { className: 'bw-hint' }, t('flow.parentHint')),
    ),
    E('div', { className: 'bw-preview-line' },
      sectionPick !== null && canAssignSection
        ? t('flow.preview.section', { title: previewTitle, name: sectionPick.name })
        : t('flow.preview', { title: previewTitle }),
    ),
  )
  const footer = E('div', { className: 'bw-modal-actions' },
    E(BTN, { variant: 'outline', onClick: onCancel, disabled: submitting }, t('cancel')),
    E(BTN, { variant: 'primary', onClick: confirm, disabled: submitting }, submitting ? t('flow.creating') : t('create')),
  )
  return E(ui.Modal, { open: true, onClose: () => { if (!submitting) onCancel() }, closeLabel: t('close'), title: t('flow.title'), footer }, body, StyleNode())
}
