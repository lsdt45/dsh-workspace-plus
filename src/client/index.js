/**
 * dsh-workspace-plus — browser half, bundle entry (plain JavaScript, no build step
 * for the README's install path; this file is bundled into src/client.js).
 *
 * SOURCE, NOT THE SHIPPED ARTIFACT: `src/client.js` is generated from this file
 * and its siblings under `src/client/` by `scripts/build-client.mjs` (esbuild).
 * Never edit the artifact; run `npm run build` after editing here. The DSH
 * platform accepts exactly one client bundle per package
 * (`exports["./client"]`, flat module graph — see
 * @deepseek-ai/dsh-client-modules), which is why the sources are bundled instead
 * of being served as separate files.
 *
 * Three registrations:
 *  1. `sidebar.workspaces` (priority -1): replaces the shipped workspace
 *     browser with a hierarchy tree derived from "/" inside workspace titles.
 *  2. `conversation.hero.workspace.directoryFlow`: the add-workspace picking
 *     interaction for the conversation empty-state menu — native directory
 *     pick, then a parent-group popup, then create + rename with the prefix.
 *  3. `sidebar.workspaces.directoryFlow`: the same interaction for the
 *     shipped sidebar browser (fills only when that hole is declared, i.e.
 *     whenever this plugin's own browser is not the occupying entry).
 *
 * The single `hostRequire` below is the loader's factory `require`: every
 * request is a dsh client baseline module (see
 * @deepseek-ai/dsh-client-web seed.ts): react, @deepseek-ai/dsh-client-store,
 * @deepseek-ai/dsh-client-ui-primitives. The name avoids esbuild's CommonJS
 * `require` handling during bundling.
 */
import { installPlatform, React, E, ui, NS, storeKit } from './platform.js'
import { zh } from './i18n/zh.js'
import { en } from './i18n/en.js'
import { cls, basename, splitPlainSegs, splitTitleSegs, normPath } from './core/text.js'
import { bucketOf, BUCKET_ORDER, timeLabel } from './core/time.js'
import { VIEW_MODES, ARCHIVED_FILTERS, viewStateOf, sessionVisible, orderRows, pendingKindOf, sessionTitleOf, hasActiveScheduleOf, subagentRunningCounts } from './core/view.js'
import { buildSessionTree, countSessionTree, collectSessionRows, findSessionGroup, buildTree, buildWorkspaceList, countWorkspaces, materializeChain, compressTree } from './core/tree.js'
import { messageOf, SESSION_DELETE_ROUTE, checkSessionDelete, deleteSessionRecord, writeClipboardText, openSessionDirectory } from './host.js'
import { createViewStore } from './store.js'
import { icon, iconExport, resolveIcon, PinIcon16, lucideSvg, ListTreeIcon16, ListIcon16, CalendarDaysIcon16 } from './icons.js'
import { BTN, TextDialog, ConfirmDialog, createQuietBoundary, PickerList, renderWsTag, StyleNode } from './ui/base.js'

window.__ModuleLoader__.load({
  id: 'dsh-workspace-plus',
  factory: (hostRequire) => {
    installPlatform(hostRequire)
    // Defined after the install: a class heritage expression evaluates when the
    // class is defined, so a module-level boundary class would see a null React.
    const QuietBoundary = createQuietBoundary()

    // Shared by both controls; persisted hydration replaces defaults wholesale.
    // Legacy sortMode selected a view, so the new independent key is sortOrder.

    // Subagent children stay in their parent catalog; only the current blank
    // is visible. Archive filtering is identical in all views and search.

    /**
     * Active-schedule marker, mirroring the official tree's
     * hasActiveSchedule(): the list projection carries one entry per active
     * Schedule record, and a non-empty projection is the badge's only gate.
     * Defensive shapes (missing/mis-typed projection) degrade to false.
     */

    /**
     * Running subagent descendants per session (light lineage walk over
     * parent links) — a parent row keeps its "ongoing" ring while a spawned
     * subagent is still working. The client SessionSummary exposes the
     * parent as parentId (the session controller maps parentSessionId to
     * parentId on the wire); the old parentSessionId spelling is kept as a
     * fallback for profiles serving the pre-rename shape.
     */

    /**
     * Session nesting inside one workspace: same "/" convention as workspace
     * titles. Groups are virtual (projection of names). Rows keep the Host
     * workspace.sessionIds (manual) order — drag-to-reorder must be visible.
     */

    /**
     * Build the folder tree. Folders are virtual: they exist where workspace
     * titles contain "/", plus the explicit empty folders the user created.
     * Returns { path, name, folders, workspaces } with workspaces carrying
     * their leaf display name.
     */

    // Preserve title and folderPath: changing the view must never rename a
    // workspace, including when a drag reorders the flat workspace list.

    /**
     * VS Code-style single-child chain compression (preference-controlled):
     * a folder level holding exactly ONE child and nothing else merges into a
     * single display row; a chain ending in one workspace becomes that
     * workspace row with the merged label. Only presentation changes; the
     * underlying workspace/title data is untouched.
     *
     * The merged label is the chain RELATIVE to the first un-compressed
     * ancestor (VS Code explorer behaviour): a chain a/b/c holding only
     * workspace W shows "a/b/c/W" at the root, but the same chain nested
     * inside a populated folder "a" shows "b/c/W". Labels are therefore
     * assembled from RELATIVE segments (segs + pure leaf name) and only
     * materialised into a display node at the chain's top — the pre-0.8 code
     * prefixed each recursion level with the FULL node.path, so nested chains
     * rendered duplicated prefixes like "1/2/1/2/3/A".
     */

    /* ============================== styles ============================ */

    /* ========================== view store =========================== */

    /* ============================ flow dialog ========================= */

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
    function BetterFlow(props) {
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

    /* ============================== rows ============================== */

    /** Folder glyph variants from the primitives family (solid / outline / hidden). */
    /** Custom icon value → glyph: legacy slots (solid/outline/none) or any primitives icon name. */
    const iconOf = (mode, expanded) => {
      if (!mode || mode === 'none') return null
      if (mode === 'solid') return icon(expanded ? 'IconFolderOpen16' : 'IconFolderClose16')
      if (mode === 'outline') return icon('IconFolderOpenOutline16')
      return icon(mode)
    }

    const colorToRgb = (hex) => {
      if (!hex) return null
      const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
      if (!m) return null
      const v = parseInt(m[1], 16)
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    }
    const rgbToHex = (r, g, b) => '#' + [r, g, b]
      .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')

    function FolderRow({ node, depth, expanded, onToggle, onContextMenu, dropInto, dragEvents, custStyle, iconMode, pulse, t }) {
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

    function WorkspaceGroupRow({ group, expanded, onToggle, onContextMenu, dropInto, dragEvents }) {
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

    function WorkspaceRow({ workspace, depth, count, sessionsOpen, onToggle, onStart, onContextMenu, currentInside, dropHalf, dragEvents, custStyle, iconMode, pulse, pinCount, t }) {
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
    const sessionStateOf = (row) => {
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
    const PULSE_RANK = { warning: 3, ongoing: 2, done: 1 }
    const PULSE_COLORS = { warning: '#d29922', ongoing: '#5b8def', done: '#3fb950' }
    const pulseRank = (state) => (state ? (PULSE_RANK[state] || 0) : 0)

    function PulseGlow({ state, children }) {
      return E('span', {
        className: 'bw-pulse',
        style: { '--bw-pulse-color': PULSE_COLORS[state] || PULSE_COLORS.ongoing },
      }, children)
    }

    // RUNNING deliberately stays on the session row itself (its official ring
    // breathes blue there) and does NOT bubble outward — the user found the
    // ongoing relay noisy. Only pending-amber and done-green propagate.
    const relayStateOf = (row) => {
      const s = sessionStateOf(row)
      return s === 'ongoing' ? null : s
    }

    function SessionRow({ node, depth, current, onOpen, onContextMenu, now, dropHalf, dragEvents, custStyle, breathing, pinned, onTogglePin, onUnarchive, workspaceTag, tagOnHover, tooltip, t }) {
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
      const nativeTitle = hasHoverLabel && typeof ui.Tooltip !== 'function'
        ? hoverLabel()
        : undefined
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
        title: nativeTitle,
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
      )
      // The official primitives Tooltip replaces the native title when the
      // runtime ships it: same bubble as every dsh surface, anchored UNDER
      // the session row (side bottom centers it on the row and the built-in
      // viewport fit slides it back inside the edges).
      if (hasHoverLabel && typeof ui.Tooltip === 'function') {
        return E(ui.Tooltip, { label: hoverLabel, side: 'bottom', delayMs: 300, maxWidth: 320 }, row)
      }
      return row
    }

    /**
     * Session sub-group inside a workspace (same "/" convention on session
     * titles). Deliberately NOT styled like a workspace folder — no folder
     * icon, tertiary color — so a session level never reads as a workspace.
     */
    function SessionGroupRow({ name, depth, expanded, count, onToggle, onContextMenu, dropInto, dragEvents, custStyle, pulse, t }) {
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

    /* --------------------- customization dialog ----------------------- */

    const SWATCHES = ['', '#5b8def', '#3fb950', '#d29922', '#f85149', '#a371f7', '#39c5cf', '#ec6cb9', '#ff9f45', '#6e7681']
    const GLOW_MAX = 14
    const ICON_CHOICES = [
      'solid', 'outline', 'none',
      'IconProjectAddOutline16', 'IconBranchOutline16', 'IconArchiveOutline20', 'IconCodeOutline16',
      'IconDataOutline16', 'IconGoalOutline16', 'IconGlobeOutline14', 'IconInspectOutline12',
      'IconCopyOutline16', 'IconLinkOutline16', 'IconListPenOutline16', 'IconChecklistOutline14',
      'IconBrowseOutline16', 'IconDownloadOutline16', 'IconContextInjectionOutline16',
      'IconCordisPluginOutline14', 'IconApiOutline14', 'IconAgentPresetOutline16', 'IconEnhanceOutline16',
      'IconSkillOutline16', 'IconSparkle16', 'IconNewChatOutline16',
      'IconCheckOutline14', 'IconCheckOutline16', 'IconChevronDownOutline14', 'IconChevronLeftOutline14',
      'IconChevronRightOutline14', 'IconChevronUpOutline14', 'IconCloseOutline16', 'IconDarkOutline16',
      'IconEditOutline16', 'IconEllipsisOutline16', 'IconFolderClose16', 'IconFolderOpen16',
      'IconFolderOpenOutline16', 'IconFullscreenOutline16', 'IconLightOutline16', 'IconLinkOutline14',
      'IconLoadingOutline16', 'IconPanelLeftOutline16', 'IconPaperclipOutline16', 'IconPersonalizationOutline16',
      'IconPlayOutline16', 'IconPauseOutline16', 'IconPlusOutline16', 'IconQuestionOutline14',
      'IconQueueOutline14', 'IconRefreshOutline14', 'IconRefreshOutline16', 'IconRightUpOutline14',
      'IconSearchOutline16', 'IconSendOutline14', 'IconSendOutline16', 'IconSettingsOutline14',
      'IconSettingsOutline16', 'IconShareOutline16', 'IconStopFill16', 'IconThinkOutline14',
      'IconThinkOutline16', 'IconTrashOutline16', 'IconUserOutline16', 'IconWarningOutline16',
      'IconLikeOutline16', 'IconDislikeOutline16', 'IconFollowsystemOutline16',
      'IconAlarmClockOutline16', 'IconClockOutline16', 'IconDatabaseOutline16',
    ]

    /**
     * Per-row appearance: color swatches (+ native picker), glow intensity,
     * folder-glyph mode. Committing the defaults clears the entry; Reset
     * removes it entirely.
     */
    function CustomizeDialog({ open, initial, kind, onChange, onReset, onClose, t }) {
      // Icons render only for workspace / workspace-folder rows. Session rows
      // already carry the official status dot (pending/running/done) in the
      // leading slot, and session sub-group rows have no icon either — so the
      // icon grid is offered only where it actually displays.
      const allowIcon = kind === 'folder' || kind === 'workspace'
      const [color, setColor] = React.useState('')
      const [glow, setGlow] = React.useState(0)
      const [iconMode, setIconMode] = React.useState('solid')
      const [weight, setWeight] = React.useState(0)
      const [shadow, setShadow] = React.useState(false)
      React.useEffect(() => {
        if (!open) return
        setColor(initial && initial.color ? initial.color : '')
        setGlow(initial && initial.glow ? Number(initial.glow) || 0 : 0)
        setIconMode(initial && initial.icon ? initial.icon : 'solid')
        setWeight(initial && initial.weight ? Number(initial.weight) || 0 : 0)
        setShadow(initial && initial.shadow === true)
      }, [open, initial])
      if (!open) return null
      const commit = () => {
        const empty = allowIcon
          ? (color === '' && glow === 0 && iconMode === 'solid' && weight === 0 && !shadow)
          : (color === '' && glow === 0 && weight === 0 && !shadow)
        const style = empty
          ? null
          : { color, glow, weight: weight > 0 ? weight : undefined, shadow: shadow || undefined, ...(allowIcon ? { icon: iconMode } : {}) }
        onChange(style)
        onClose()
      }
      const channels = colorToRgb(color)
      const setChannel = (index, raw) => {
        const n = Math.max(0, Math.min(255, parseInt(raw, 10) || 0))
        const base = channels || [0, 0, 0]
        const next = base.slice()
        next[index] = n
        setColor(rgbToHex(next[0], next[1], next[2]))
      }
      const previewShadows = []
      if (glow > 0 && color) previewShadows.push('0 0 ' + glow + 'px ' + color)
      if (shadow) previewShadows.push('1px 1px 2px rgba(0,0,0,.85)')
      return E(ui.Modal, {
        open: true,
        onClose,
        closeLabel: t('close'),
        title: t('custom.title'),
        footer: E('div', { className: 'bw-modal-actions' },
          E(BTN, { variant: 'outline', onClick: () => { onReset(); onClose() } }, t('custom.reset')),
          E(BTN, { variant: 'primary', onClick: commit }, t('custom.done')),
        ),
      },
        E('div', { className: 'bw-modal-body' },
          E('div', { className: 'bw-field' },
            t('custom.color'),
            E('div', { className: 'bw-dialog-input-row' },
              SWATCHES.map((swatch) => E('button', {
                key: swatch || 'none',
                type: 'button',
                className: cls('bw-swatch', color === swatch && 'bw-swatch-active'),
                style: swatch === '' ? undefined : { background: swatch },
                'aria-label': swatch === '' ? t('custom.reset') : swatch,
                onClick: () => setColor(swatch),
              })),
              E('input', {
                type: 'color',
                className: 'bw-color-input',
                value: color || '#5b8def',
                onChange: (e) => setColor(e.target.value),
              }),
            ),
            E('div', { className: 'bw-rgb-row' },
              ['R', 'G', 'B'].map((label, index) => E('label', { key: label, className: 'bw-rgb-label' },
                label,
                E('input', {
                  type: 'number',
                  className: 'bw-rgb-input',
                  min: 0,
                  max: 255,
                  value: channels ? channels[index] : '',
                  placeholder: '—',
                  onChange: (e) => setChannel(index, e.target.value),
                }),
              )),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.glow'),
            E('div', { className: 'bw-glow-row' },
              E('input', {
                type: 'range',
                className: 'bw-slider',
                min: 0,
                max: GLOW_MAX,
                step: 1,
                value: glow,
                'aria-label': t('custom.glow'),
                onChange: (e) => setGlow(Number(e.target.value)),
              }),
              E('span', { className: 'bw-glow-value' }, glow === 0 ? t('custom.none') : glow + 'px'),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.weight'),
            E('div', { className: 'bw-seg' },
              [400, 500, 600, 700].map((wt) => E('button', {
                key: String(wt),
                type: 'button',
                className: cls('bw-seg-btn', weight === wt && 'bw-seg-btn-active'),
                onClick: () => setWeight(wt),
              }, wt === 400 ? t('custom.weight.regular') : wt === 500 ? t('custom.weight.medium') : wt === 600 ? t('custom.weight.semibold') : t('custom.weight.bold'))),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.shadow'),
            E('div', { className: 'bw-seg' },
              E('button', { type: 'button', className: cls('bw-seg-btn', !shadow && 'bw-seg-btn-active'), onClick: () => setShadow(false) }, t('custom.none')),
              E('button', { type: 'button', className: cls('bw-seg-btn', shadow && 'bw-seg-btn-active'), onClick: () => setShadow(true) }, t('settings.on')),
            ),
          ),
          allowIcon ? E('div', { className: 'bw-field' },
            t('custom.icon'),
            E('div', { className: 'bw-icon-grid' },
              ICON_CHOICES.map((mode) => E('button', {
                key: mode,
                type: 'button',
                className: cls('bw-icon-cell', iconMode === mode && 'bw-icon-cell-active'),
                title: mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
                'aria-label': mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
                onClick: () => setIconMode(mode),
              }, mode === 'none' ? E('span', { className: 'bw-icon-none' }) : iconOf(mode, false))),
            ),
          ) : null,
          E('div', { className: 'bw-field' },
            t('custom.preview'),
            E('div', {
              className: 'bw-preview',
              style: {
                color: color || undefined,
                fontWeight: weight > 0 ? weight : undefined,
                textShadow: previewShadows.length > 0 ? previewShadows.join(',') : undefined,
              },
            },
              allowIcon ? E('span', { className: 'bw-preview-icon' }, iconOf(iconMode, true)) : null,
              E('span', { className: 'bw-preview-label' }, t('custom.preview.sample')),
            ),
          ),
        ),
        StyleNode(),
      )
    }

    /* ------------------------- settings page ------------------------- */

    function BetterWorkspaceSettings({ useStore, actions, t }) {
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

    function BetterWorkspacePluginCard({ useStore, actions, t }) {
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

    /* ============================= browser ============================ */

    function BetterBrowser(props) {
      const {
        wide, expandSidebar,
        useSessions, useSessionPendingInteraction, useWorkspaces,
        useStore, actions,
        startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace,
        archiveSession, unarchiveSession, createWorkspace, pickDirectory, insertWorkspaceBefore, insertSessionBefore,
        deleteSession, checkSessionDelete: checkDelete, openDirectory, refreshSessions, refreshPage,
        t,
      } = props

      if (typeof useWorkspaces !== 'function' || typeof useSessions !== 'function') {
        console.error('[dsh-workspace-plus] standard snapshot hooks missing; browser renders nothing')
        return null
      }

      const items = useWorkspaces(s => s.items)
      const phase = useWorkspaces(s => s.phase)
      const archivedSessionIds = useWorkspaces(s => s.archivedSessionIds) || []
      const list = useSessions(s => s)
      const pending = useSessionPendingInteraction ? useSessionPendingInteraction(s => s) : null
      const storeFolders = useStore ? (useStore(s => s.folders) || []) : []
      const workspaceGroups = useStore ? (useStore(s => s.workspaceGroups) || []) : []
      const workspaceGroupById = useStore ? (useStore(s => s.workspaceGroupById) || {}) : {}
      const sessionSectionById = useStore ? (useStore(s => s.sessionSectionById) || {}) : {}
      const workspaceGroupIds = new Set(workspaceGroups.map(group => group.id))
      const workspaceGroupOf = id => workspaceGroupIds.has(workspaceGroupById[id]) ? workspaceGroupById[id] : ''
      // null follows the host workspace; '' explicitly lives under Projects.
      const sessionSectionOf = id => {
        if (!Object.prototype.hasOwnProperty.call(sessionSectionById, id)) return null
        const groupId = sessionSectionById[id]
        if (groupId === '' || workspaceGroupIds.has(groupId)) return groupId
        return null
      }
      const expandedMap = useStore ? (useStore(s => s.expanded) || {}) : {}
      const sessionsExpandedMap = useStore ? (useStore(s => s.sessionsExpanded) || {}) : {}
      const sessionGroupsMap = useStore ? (useStore(s => s.sessionGroups) || {}) : {}
      const prefsMap = useStore ? (useStore(s => s.prefs) || {}) : {}
      const stylingMap = useStore ? (useStore(s => s.styling) || {}) : {}
      const compactChains = prefsMap.compactChains !== false
      const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefsMap)
      const timeSorted = viewMode === 'time'
      const automaticSort = timeSorted || sortOrder === 'latest'
      const groupedView = viewMode === 'projects' || viewMode === 'workspaces'
      const pinnedList = useStore ? (useStore(s => s.pinned) || []) : []
      const statusPulse = prefsMap.statusPulse !== false
      const archivedSet = new Set(archivedSessionIds)
      const subCounts = React.useMemo(() => subagentRunningCounts(list ? list.byId : {}), [list ? list.byId : null])
      // Pinned membership set + workspace lookup for the global pinned tray.
      const pinnedSet = new Set(pinnedList.map(String).filter(id => !archivedSet.has(id)))
      const workspaceTitleOf = (workspaceId) => {
        const workspace = (items || []).find(w => w.workspaceId === workspaceId)
        if (!workspace) return ''
        const segs = splitTitleSegs(workspace.title)
        return segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || '')
      }

      const [query, setQuery] = React.useState('')
      const [searchOpen, setSearchOpen] = React.useState(false)
      const [flowOpen, setFlowOpen] = React.useState(false)
      const [flowParent, setFlowParent] = React.useState('') // parent path prefill for the add-workspace flow (context menu entry)
      const [dialog, setDialog] = React.useState(null) // { kind, ... }
      const [ctx, setCtx] = React.useState(null) // context menu { kind, payload, x, y }
      const [ctxSubmenu, setCtxSubmenu] = React.useState(null)
      const [customize, setCustomize] = React.useState(null) // { kind, entryKey, name }
      const [errorText, setErrorText] = React.useState(null)
      const [drag, setDrag] = React.useState(null) // { kind: 'workspace'|'session', source, over } | null
      const [deleteAvailable, setDeleteAvailable] = React.useState(typeof deleteSession === 'function' && !checkDelete)
      const [deleting, setDeleting] = React.useState(false)
      const deletingRef = React.useRef(false)
      const [notice, setNotice] = React.useState(null)
      const ownMenuRoot = React.useRef(null)
      React.useEffect(() => {
        // The installed context-menu plugin listens at document capture. Mark
        // our rows handled at window capture, then let React open their menu.
        const ownContextMenu = event => {
          if (!event.target || typeof event.target.closest !== 'function') return
          const row = event.target.closest('[data-bw-context]')
          if (row && ownMenuRoot.current && ownMenuRoot.current.contains(row)) event.preventDefault()
        }
        window.addEventListener('contextmenu', ownContextMenu, true)
        return () => window.removeEventListener('contextmenu', ownContextMenu, true)
      }, [])
      React.useEffect(() => {
        if (!ctx || ctx.kind !== 'session' || typeof checkDelete !== 'function') return
        let alive = true
        Promise.resolve().then(checkDelete).then(available => { if (alive) setDeleteAvailable(available === true) }).catch(() => { if (alive) setDeleteAvailable(false) })
        return () => { alive = false }
      }, [ctx, checkDelete])
      React.useEffect(() => {
        if (!notice) return
        const timer = setTimeout(() => setNotice(null), 2500)
        return () => clearTimeout(timer)
      }, [notice])
      // Workspace drags arm their state one frame LATE (see workspaceDragEvents):
      // arming synchronously re-renders during the dragstart dispatch, the chain
      // expansion inserts rows above the drag source, the cursor leaves the
      // source element, and Chromium cancels the whole gesture. dragEnd clears
      // the timer so a same-tick cancel never leaves a ghost drag behind.
      const wsDragArmTimer = React.useRef(null)
      // Quote-on-land eligibility sets (mount-scoped):
      // - blankSeen: ids observed BLANK in any snapshot. A blank row is a
      //   freshly created New Session, so ONLY these may ever receive an
      //   automatic quote. A titled row missing from blankSeen — rows that
      //   stream into the store after mount, fork children (born titled),
      //   rows hidden by load-time filtering — predates this mount or was
      //   named deliberately, and is NEVER touched. (0.9.1 keyed "fresh" off
      //   the first snapshot instead, so late-arriving OLD sessions were
      //   misquoted; blank is the only trustworthy birth mark.)
      // - humanTouched: ids renamed through THIS component's user actions
      //   (rename dialog, drag into a group, group prefix rewrite). A
      //   user-written "/" is a deliberate grouping; a user-written quote
      //   pair is the verbatim escape. The host pins user titles (a later
      //   automatic name is superseded), so the mark is final.
      // - autoStable: id → { title, since } for freshly landed automatic
      //   titles waiting out the stabilization window below.
      const blankSeenRef = React.useRef(null)
      const humanTouchedRef = React.useRef(null)
      const autoStableRef = React.useRef(null)
      const stableTimerRef = React.useRef(null)
      const [stableTick, setStableTick] = React.useState(0)
      // The wire cannot tell the deterministic fallback title (first user
      // message echo, "/"-prone) from the async LLM name that replaces it
      // seconds later — SessionSummary carries no source field. So a landed
      // "/"-bearing title is quoted only after it survives 20s unchanged;
      // any rename resets the window, and the common slash-free LLM name
      // simply releases the session untouched. Only the "new session
      // auto-title stayed slashy" case gets wrapped.
      const TITLE_STABLE_MS = 20000

      // User-driven renames funnel through here: mark first so the
      // quote-on-land effect never second-guesses a deliberate title.
      const renameByUser = (sessionId, title) => {
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        humanTouchedRef.current.add(String(sessionId))
        if (autoStableRef.current) autoStableRef.current.delete(String(sessionId))
        return renameSession(sessionId, title)
      }

      React.useEffect(() => {
        if (!list || !list.byId || typeof renameSession !== 'function') return
        if (blankSeenRef.current === null) blankSeenRef.current = new Set()
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        if (autoStableRef.current === null) autoStableRef.current = new Map()
        const blankSeen = blankSeenRef.current
        const touched = humanTouchedRef.current
        const stable = autoStableRef.current
        const now = Date.now()
        const fixes = []
        let deadline = Infinity
        for (const id of Object.keys(list.byId)) {
          const summary = list.byId[id]
          if (!summary) continue
          if (summary.blank) { blankSeen.add(id); stable.delete(id); continue }
          if (!blankSeen.has(id) || touched.has(id)) { stable.delete(id); continue }
          const text = String(summary.title || '')
          if (text.trim() === '' || text.includes('“') || text.includes('"') || !text.includes('/')) {
            stable.delete(id) // quoted already, or the LLM name arrived slash-free: done
            continue
          }
          const prev = stable.get(id)
          if (prev && prev.title === text) {
            if (now - prev.since >= TITLE_STABLE_MS) {
              stable.delete(id)
              fixes.push([id, '“' + text + '”'])
            } else {
              deadline = Math.min(deadline, prev.since + TITLE_STABLE_MS)
            }
            continue
          }
          stable.set(id, { title: text, since: now }) // new landing or fallback→LLM rename: reset
          deadline = Math.min(deadline, now + TITLE_STABLE_MS)
        }
        for (const id of Array.from(stable.keys())) {
          if (!list.byId[id]) stable.delete(id) // session vanished (archived/deleted): drop the wait
        }
        if (stableTimerRef.current !== null) { clearTimeout(stableTimerRef.current); stableTimerRef.current = null }
        if (deadline !== Infinity) {
          stableTimerRef.current = setTimeout(() => {
            stableTimerRef.current = null
            setStableTick(t => t + 1) // re-evaluate through the effect, never rename from a stale closure
          }, Math.max(1, deadline - now))
        }
        if (fixes.length === 0) return
        Promise.resolve()
          .then(async () => { for (const [id, next] of fixes) await renameSession(id, next) })
          .catch(() => { /* display-layer fallback keeps the row flat; a later snapshot re-evaluates */ })
      }, [list, stableTick])
      React.useEffect(() => () => {
        if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current)
      }, [])

      /**
       * Stale-pin self-heal: unpin only sessions that were SEEN in list.byId
       * on a previous snapshot and later vanished (hard delete). Progressive
       * hydration never un-sees an id it has not shown yet, so mount-time
       * partial snapshots never strip pins; archived ids remain in byId and
       * keep their pin for the unarchive path.
       */
      const seenIdsRef = React.useRef(null)
      React.useEffect(() => {
        if (!list || !list.byId) return
        if (seenIdsRef.current === null) seenIdsRef.current = new Set()
        const seen = seenIdsRef.current
        const current = new Set(Object.keys(list.byId))
        const pinnedNow = new Set((Array.isArray(pinnedList) ? pinnedList : []).map(String))
        if (pinnedNow.size > 0) {
          for (const id of Array.from(seen)) {
            if (!current.has(id) && pinnedNow.has(id)) actions.togglePin(id)
          }
        }
        for (const id of current) seen.add(id)
      }, [list, pinnedList])
      const normalizedQuery = query.trim().toLowerCase()
      const now = Date.now()
      React.useEffect(() => {
        if (wsDragArmTimer.current !== null) { clearTimeout(wsDragArmTimer.current); wsDragArmTimer.current = null }
        setDrag(null)
        return () => { if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current) }
      }, [viewMode, sortOrder, archivedFilter, normalizedQuery])

      const fail = (text) => { setFlowOpen(false); setDialog(null); setNotice(null); setErrorText(String(text || 'unknown error')) }

      const styleEntry = (key) => stylingMap[key] || null
      const rowStyleOf = (key) => {
        const entry = styleEntry(key)
        if (!entry || !entry.color) return null
        const glow = Number(entry.glow) || 0
        const weight = Number(entry.weight) || 0
        const shadow = entry.shadow === true
        const shadows = []
        if (glow > 0) shadows.push('0 0 ' + glow + 'px ' + entry.color)
        if (shadow) shadows.push('1px 1px 2px rgba(0,0,0,.85)')
        return {
          color: entry.color,
          fontWeight: weight > 0 ? weight : undefined,
          textShadow: shadows.length > 0 ? shadows.join(',') : undefined,
        }
      }
      const keyOf = (kind, payload) => {
        if (kind === 'folder') return 'folder:' + payload.path
        if (kind === 'workspace') return 'workspace:' + payload.workspaceId
        if (kind === 'session') return 'session:' + payload.id
        if (kind === 'sgroup') return 'sgroup:' + payload.workspaceId + '|' + payload.path
        return String(kind)
      }

      // accounted: ids bound to some workspace (host membership); their
      // workspace id doubles as tray provenance. All rows build through
      // sessionRowOf so visibility, translations, and derived flags stay
      // identical across the tree, the ungrouped area, and the pinned tray.
      const accounted = new Set()
      const workspaceIndexOf = new Map()
      for (const workspace of items || []) for (const id of workspace.sessionIds || []) { accounted.add(id); workspaceIndexOf.set(id, workspace.workspaceId) }
      const sessionRowOf = (id) => {
        const summary = list && list.byId ? list.byId[id] : undefined
        if (!sessionVisible(summary, list ? list.current : undefined, archivedSet, archivedFilter)) return null
        const workspace = (items || []).find(item => item.workspaceId === workspaceIndexOf.get(id))
        return {
          id,
          cwd: summary.cwd || (workspace && workspace.path) || '',
          title: sessionTitleOf(summary, t),
          leaf: sessionTitleOf(summary, t),
          blank: !!summary.blank,
          archived: archivedSet.has(id),
          running: !!summary.running,
          completed: summary.completed === true,
          hasActiveSchedule: hasActiveScheduleOf(summary),
          subagents: subCounts.get(id) || 0,
          updatedAt: summary.updatedAt || 0,
          pending: pendingKindOf(pending, id),
        }
      }
      const ungrouped = []
      if (list && Array.isArray(list.ids)) {
        for (const id of list.ids) {
          if (accounted.has(id)) continue
          const row = sessionRowOf(id)
          if (row) ungrouped.push(row)
        }
        // Host has no display order for unassigned sessions; recency-desc
        // stays the shipped baseline for every mode (buckets re-sort their
        // own members in the time views).
        ungrouped.sort((a, b) => b.updatedAt - a.updatedAt)
      }
      const sectionedSessions = ((list && list.ids) || []).filter(id => sessionSectionOf(id) !== null).map(sessionRowOf).filter(Boolean)

      // While a workspace drag is active, single-child chains render UNCOMPRESSED:
      // a merged "group/workspace" row hides every folder level of the chain inside
      // its label, and those levels are exactly the drop targets for "move into
      // this group". Suspending the merge for the drag's duration re-exposes each
      // level as a real folder row (folder expansion defaults apply); when the
      // drag ends, the chains merge back. Session drags keep the merged view —
      // their drop targets live inside workspace rows, which compression merges.
      const draggingWorkspace = drag !== null && drag.kind === 'workspace'
      const workspaceRecency = new Map()
      const visibleItems = (items || []).filter(workspace => {
        const rows = (workspace.sessionIds || []).filter(id => sessionSectionOf(id) === null).map(sessionRowOf).filter(Boolean)
        workspaceRecency.set(workspace.workspaceId, rows.reduce((latest, row) => Math.max(latest, row.updatedAt), 0))
        return archivedFilter !== 'only' || rows.length > 0
      })
      const recency = sortOrder === 'latest' ? workspaceRecency : undefined
      const projectItems = visibleItems.filter(workspace => !workspaceGroupOf(workspace.workspaceId))
      const tree = (() => {
        if (viewMode === 'workspaces') return buildWorkspaceList(projectItems, recency)
        const built = buildTree(projectItems, archivedFilter === 'only' ? [] : storeFolders, recency)
        if (!compactChains || draggingWorkspace) return built
        return { ...built, folders: built.folders.map((f) => materializeChain(compressTree(f))), workspaces: built.workspaces }
      })()

      const sessionsOf = (workspace, includeSectioned = false) => {
        const rows = []
        for (const id of workspace.sessionIds || []) {
          if (!includeSectioned && sessionSectionOf(id) !== null) continue
          const row = sessionRowOf(id)
          if (row) rows.push(row)
        }
        return orderRows(rows, sortOrder)
      }

      const searchAgent = (agent) => {
        // Returns a pruned copy of the tree node, or null when nothing matches.
        if (!normalizedQuery) return agent
        if (agent.kind === 'ws') {
          const ws = agent.workspace
          const sessions = sessionsOf(ws)
          const wsHit = ws.leaf.toLowerCase().includes(normalizedQuery) || ws.title.toLowerCase().includes(normalizedQuery)
          if (wsHit || sessions.some(s => s.title.toLowerCase().includes(normalizedQuery))) {
            return { ...agent, node: agent, folders: [], workspaces: [ws] }
          }
          return null
        }
        const folders = []
        for (const folder of agent.folders) {
          const hit = searchAgent(folder)
          if (hit) folders.push(hit)
        }
        const workspaces = []
        for (const workspace of agent.workspaces) {
          const sessions = sessionsOf(workspace)
          const wsHit = workspace.leaf.toLowerCase().includes(normalizedQuery) || workspace.title.toLowerCase().includes(normalizedQuery)
          const matchedSessions = wsHit ? sessions : sessions.filter(s => s.title.toLowerCase().includes(normalizedQuery))
          if (wsHit || matchedSessions.length > 0) workspaces.push({ workspace, matchedSessions })
        }
        if (folders.length === 0 && workspaces.length === 0) return null
        return { node: agent, folders, workspaces }
      }
      const searched = normalizedQuery ? searchAgent(tree) : null
      const searching = normalizedQuery !== ''

      /* --------------------- status breathing relay -------------------- */

      // Highest-priority status across a whole session subtree (groups + rows).
      const nodePulseOf = (sessionNode) => {
        let best = null
        for (const group of sessionNode.groups || []) {
          const s = nodePulseOf(group)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        for (const row of sessionNode.sessions || []) {
          const s = relayStateOf(row)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        return best
      }
      // A COLLAPSED workspace row relays its whole session tree; an open row
      // shows the real dots (deeper collapsed groups relay on their own rows).
      const wsPulseOf = (workspace) => (!statusPulse || searching || sessionsOpenOf(workspace.workspaceId))
        ? null
        : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
      // A collapsed FOLDER hides everything below — including open workspaces —
      // so its aggregation ignores inner expansion states entirely.
      const wsAllPulseOf = (workspace) => (!statusPulse || searching)
        ? null
        : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
      const folderPulseOf = (node) => {
        if (node.kind === 'ws') return wsAllPulseOf(node.workspace)
        let best = null
        for (const child of node.folders) {
          const s = folderPulseOf(child)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        for (const w of node.workspaces) {
          const s = wsAllPulseOf(w)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        return best
      }

      const folderExpanded = (path) => (expandedMap ? expandedMap[path] !== false : true)
      const sessionsOpenOf = (workspaceId) => (sessionsExpandedMap ? sessionsExpandedMap[workspaceId] !== false : true)
      const sessionGroupOpen = (key) => (sessionGroupsMap ? sessionGroupsMap[key] !== false : true)

      const openCtx = (kind, payload, e) => {
        if (e) e.preventDefault()
        setCtxSubmenu(null)
        setCtx({ kind, payload, x: e.clientX, y: e.clientY })
      }

      /* ------------------------- drag & drop -------------------------- */

      React.useEffect(() => {
        if (drag === null) return
        const accept = (event) => {
          event.preventDefault()
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
        }
        const acceptDrop = (event) => { event.preventDefault() }
        document.addEventListener('dragover', accept)
        document.addEventListener('drop', acceptDrop)
        return () => {
          document.removeEventListener('dragover', accept)
          document.removeEventListener('drop', acceptDrop)
        }
      }, [drag === null])

      const rowHalf = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      }
      const dragMatches = (kind) => drag !== null && drag.kind === kind
      const canReorderWorkspaces = !automaticSort && groupedView && typeof insertWorkspaceBefore === 'function'
      const canMoveWorkspaceGroup = groupedView && workspaceGroups.length > 0
      const canDragWorkspace = canReorderWorkspaces || canMoveWorkspaceGroup
      // Session REORDER needs the host insertSessionBefore action; dragging a
      // session onto a sub-group row (a pure rename) stays available without it.
      const canReorderSessions = typeof insertSessionBefore === 'function'

      /* --------------------- workspace drag & drop -------------------- */

      const wsDropHalf = (workspaceId) => {
        if (!dragMatches('workspace') || !canReorderWorkspaces) return null
        const over = drag.over
        return over && over.kind === 'workspace' && over.target === workspaceId ? over.half : null
      }
      const wsDropInto = (path) => dragMatches('workspace') && drag.over && drag.over.kind === 'folder' && drag.over.target === path
      const workspaceDragEvents = (workspace) => ({
        draggable: !searching && canDragWorkspace,
        onDragStart: (event) => {
          if (searching || !canDragWorkspace) return
          event.stopPropagation()
          try {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', workspace.workspaceId)
          } catch { /* drag payload is best-effort */ }
          // Drag identity derives from the RAW title, never the displayed leaf:
          // a compressed single-chain row shows "group/workspace" as its leaf with
          // folderPath '' — carrying that would make move-into / cross-folder
          // drops rebuild titles like "x/group/workspace". The real leaf and
          // folder keep every drop target's rename correct.
          const segs = splitTitleSegs(workspace.title)
          const sourceLeaf = segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || String(workspace.workspaceId))
          const sourceFolder = segs.length > 1 ? segs.slice(0, -1).join('/') : ''
          // Deferred by one frame on purpose (Chromium cancels a just-started
          // drag whose source element is moved out from under the cursor; see
          // wsDragArmTimer above). By the next frame the gesture has settled
          // and the chain expansion is an ordinary mid-drag update.
          if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current)
          wsDragArmTimer.current = setTimeout(() => {
            wsDragArmTimer.current = null
            setDrag({ kind: 'workspace', source: { workspaceId: workspace.workspaceId, leaf: sourceLeaf, folderPath: sourceFolder }, over: null })
          }, 0)
        },
        onDragEnd: () => {
          if (wsDragArmTimer.current !== null) { clearTimeout(wsDragArmTimer.current); wsDragArmTimer.current = null }
          setDrag(null)
        },
        onDragOver: (event) => {
          if (!dragMatches('workspace') || !canDragWorkspace || searching) return
          if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          const half = rowHalf(event)
          setDrag(current => (current && current.over && current.over.kind === 'workspace' && current.over.target === workspace.workspaceId && current.over.half === half)
            ? current
            : (current ? { ...current, over: { kind: 'workspace', target: workspace.workspaceId, half } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('workspace') || !canDragWorkspace || searching) return
          if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return
          event.preventDefault()
          event.stopPropagation()
          const half = drag.over && drag.over.kind === 'workspace' && drag.over.target === workspace.workspaceId ? drag.over.half : rowHalf(event)
          commitWorkspaceDrop(workspace, half)
        },
      })
      const folderDropEvents = (path) => ({
        onDragOver: (event) => {
          if (!dragMatches('workspace') || !canReorderWorkspaces || searching || workspaceGroupOf(drag.source.workspaceId)) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          setDrag(current => (current && current.over && current.over.kind === 'folder' && current.over.target === path)
            ? current
            : (current ? { ...current, over: { kind: 'folder', target: path } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('workspace') || !canReorderWorkspaces || searching || workspaceGroupOf(drag.source.workspaceId)) return
          event.preventDefault()
          event.stopPropagation()
          commitWorkspaceMoveInto(path)
        },
      })
      const nextWorkspaceAfter = (folderPath, workspaceId) => {
        const groupId = workspaceGroupOf(workspaceId)
        if (groupId) {
          const rows = buildWorkspaceList(visibleItems.filter(workspace => workspaceGroupOf(workspace.workspaceId) === groupId), recency).workspaces
          const index = rows.findIndex(workspace => workspace.workspaceId === workspaceId)
          return rows[index + 1] && rows[index + 1].workspaceId
        }
        if (viewMode === 'workspaces') {
          const index = tree.workspaces.findIndex(workspace => workspace.workspaceId === workspaceId)
          return tree.workspaces[index + 1] && tree.workspaces[index + 1].workspaceId
        }
        const node = findTreeNode(tree, folderPath)
        if (!node) return undefined
        const index = node.workspaces.findIndex(w => w.workspaceId === workspaceId)
        return index === -1 ? undefined : (node.workspaces[index + 1] ? node.workspaces[index + 1].workspaceId : undefined)
      }
      const commitWorkspaceDrop = (targetWorkspace, half) => {
        if (!drag || !canDragWorkspace || searching) { setDrag(null); return }
        const source = drag.source
        setDrag(null)
        if (source.workspaceId === targetWorkspace.workspaceId) return
        const sourceGroup = workspaceGroupOf(source.workspaceId)
        const targetGroup = workspaceGroupOf(targetWorkspace.workspaceId)
        const anchor = half === 'after'
          ? nextWorkspaceAfter(targetWorkspace.folderPath || '', targetWorkspace.workspaceId)
          : targetWorkspace.workspaceId
        if (sourceGroup !== targetGroup) assignWorkspaceGroup(source.workspaceId, targetGroup)
        if (!canReorderWorkspaces) return
        const sameFolder = sourceGroup !== targetGroup || !!targetGroup || viewMode === 'workspaces' || (targetWorkspace.folderPath || '') === source.folderPath
        const chain = sameFolder
          ? Promise.resolve()
          : Promise.resolve().then(() => {
            const newTitle = (targetWorkspace.folderPath || '') !== '' ? (targetWorkspace.folderPath || '') + '/' + source.leaf : source.leaf
            return renameWorkspace(source.workspaceId, newTitle)
          })
        chain
          .then(() => (anchor !== undefined ? insertWorkspaceBefore(source.workspaceId, anchor) : insertWorkspaceBefore(source.workspaceId)))
          .catch(fail)
      }
      const commitWorkspaceMoveInto = (folderPath) => {
        if (!drag || !canReorderWorkspaces || searching || viewMode !== 'projects' || workspaceGroupOf(drag.source.workspaceId)) { setDrag(null); return }
        const source = drag.source
        setDrag(null)
        if (source.folderPath === folderPath) return
        const newTitle = folderPath !== '' ? folderPath + '/' + source.leaf : source.leaf
        Promise.resolve()
          .then(() => renameWorkspace(source.workspaceId, newTitle))
          .then(() => insertWorkspaceBefore(source.workspaceId))
          .catch(fail)
      }
      const workspaceGroupDropEvents = groupId => ({
        onDragOver: event => {
          if ((!dragMatches('workspace') && !dragMatches('session')) || !canMoveWorkspaceGroup || searching) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch {}
          setDrag(current => {
            if (!current || (current.over && current.over.kind === 'wgroup' && current.over.target === groupId)) return current
            return { ...current, over: { kind: 'wgroup', target: groupId } }
          })
        },
        onDrop: event => {
          if ((!dragMatches('workspace') && !dragMatches('session')) || !canMoveWorkspaceGroup || searching) return
          event.preventDefault()
          event.stopPropagation()
          if (drag.kind === 'session') assignSessionSection(drag.source.sessionId, groupId)
          else assignWorkspaceGroup(drag.source.workspaceId, groupId)
          setDrag(null)
        },
      })

      /* ---------------------- session drag & drop --------------------- */

      const sessDropHalf = (sessionId) => {
        // Time views and pinned rows never anchor a reorder: their visual
        // position is derived (recency / pin order), not the host manual
        // order, so a committed drop there would silently reorder nothing.
        if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView) return null
        const over = drag.over
        return over && over.kind === 'session' && over.target === sessionId ? over.half : null
      }
      const sgroupDropInto = (workspaceId, path) => !automaticSort && dragMatches('session') && !drag.source.sectioned && drag.source.workspaceId === workspaceId && drag.over && drag.over.kind === 'sgroup' && drag.over.target === path
      // Section moves are local and allow pins and archives. Legacy title
      // grouping and host reorder targets retain their stricter guards.
      const sessionDraggable = session => {
        if (searching || !groupedView || session.blank) return false
        if (workspaceGroups.length > 0) return true
        return !automaticSort && !session.archived && !pinnedSet.has(session.id)
      }
      const sessionDragEvents = (session, workspaceId, sectioned = false) => ({
        draggable: sessionDraggable(session),
        onDragStart: (event) => {
          if (searching || !sessionDraggable(session)) return
          event.stopPropagation()
          try {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', session.id)
          } catch { }
          setDrag({ kind: 'session', source: { sessionId: session.id, workspaceId, sectioned, title: session.title, leaf: session.leaf || session.title }, over: null })
        },
        onDragEnd: () => setDrag(null),
        onDragOver: (event) => {
          // Pinned rows are not reorder anchors (visible position ≠ host
          // order); drop targets stay plain rows only. Belt-and-braces: the
          // source side already refuses to arm for pinned rows.
          if (!dragMatches('session') || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView || searching
            || drag.source.workspaceId !== workspaceId
            || session.archived || archivedSet.has(drag.source.sessionId)
            || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          const half = rowHalf(event)
          setDrag(current => (current && current.over && current.over.kind === 'session' && current.over.target === session.id && current.over.half === half)
            ? current
            : (current ? { ...current, over: { kind: 'session', target: session.id, half } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('session') || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView || searching
            || drag.source.workspaceId !== workspaceId
            || session.archived || archivedSet.has(drag.source.sessionId)
            || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
          event.preventDefault()
          event.stopPropagation()
          const half = drag.over && drag.over.kind === 'session' && drag.over.target === session.id ? drag.over.half : rowHalf(event)
          commitSessionDrop(workspaceId, session.id, half)
        },
      })
      const sgroupDropEvents = (workspaceId, path) => ({
        onDragOver: (event) => {
          if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView || searching
            || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          setDrag(current => (current && current.over && current.over.kind === 'sgroup' && current.over.target === path)
            ? current
            : (current ? { ...current, over: { kind: 'sgroup', target: path } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('session') || drag.source.sectioned || automaticSort || !groupedView || searching
            || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return
          event.preventDefault()
          event.stopPropagation()
          commitSessionMoveInto(workspaceId, path)
        },
      })
      const commitSessionDrop = (workspaceId, targetSessionId, half) => {
        if (!drag) return
        const source = drag.source
        setDrag(null)
        // Same guards as the drop handlers (time views / pinned rows are not
        // reorder surfaces) — a stale drag never commits an invisible move.
        if (!canReorderSessions || automaticSort || !groupedView || searching) return
        if (archivedSet.has(source.sessionId) || archivedSet.has(targetSessionId)) return
        if (pinnedSet.has(source.sessionId) || pinnedSet.has(targetSessionId)) return
        if (source.sessionId === targetSessionId) return
        const workspace = (items || []).find(w => w.workspaceId === workspaceId)
        if (!workspace) return
        const flat = sessionsOf(workspace)
        const index = flat.findIndex(s => s.id === targetSessionId)
        const anchor = half === 'after'
          ? (index === -1 ? undefined : (flat[index + 1] ? flat[index + 1].id : undefined))
          : targetSessionId
        Promise.resolve()
          .then(() => (anchor !== undefined ? insertSessionBefore(workspaceId, source.sessionId, anchor) : insertSessionBefore(workspaceId, source.sessionId)))
          .catch(fail)
      }
      const commitSessionMoveInto = (workspaceId, groupPath) => {
        if (!drag || automaticSort || !groupedView || searching || archivedSet.has(drag.source.sessionId)) { setDrag(null); return }
        const source = drag.source
        setDrag(null)
        const newTitle = groupPath !== '' ? groupPath + '/' + source.leaf : source.leaf
        if (newTitle === source.title) return
        Promise.resolve()
          .then(() => renameByUser(source.sessionId, newTitle))
          .catch(fail)
      }

      /* --------------------------- actions --------------------------- */

      const assignWorkspaceGroup = (workspaceId, groupId) => {
        const workspace = (items || []).find(workspace => workspace.workspaceId === workspaceId)
        if (!workspace) return
        if (groupId && !workspaceGroupIds.has(groupId)) return
        actions.assignWorkspaceGroup(workspaceId, groupId)
        for (const sessionId of workspace.sessionIds || []) actions.assignSessionSection(sessionId, null)
        if (groupId) actions.setExpanded('workspace-group:' + groupId, true)
      }
      const assignSessionSection = (sessionId, groupId) => {
        if (!list || !list.byId || !list.byId[sessionId]) return
        if (groupId && !workspaceGroupIds.has(groupId)) return
        actions.assignSessionSection(sessionId, groupId)
        if (groupId) actions.setExpanded('workspace-group:' + groupId, true)
        if (groupId === null) {
          const workspaceId = workspaceIndexOf.get(sessionId)
          const workspaceGroup = workspaceGroupOf(workspaceId)
          if (workspaceGroup) actions.setExpanded('workspace-group:' + workspaceGroup, true)
          if (workspaceId) actions.setSessionsExpanded(workspaceId, true)
        }
      }
      const submitWorkspaceGroup = (target, rawName) => {
        const name = String(rawName || '').trim()
        if (!name) { setErrorText(t('wgroup.error.empty')); return }
        if (workspaceGroups.some(group => group.id !== target.groupId && group.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
          setErrorText(t('wgroup.error.exists')); return
        }
        if (target.groupId) actions.renameWorkspaceGroup(target.groupId, name)
        else {
          const groupId = crypto.randomUUID()
          const workspaceId = (items || []).some(workspace => workspace.workspaceId === target.workspaceId) ? target.workspaceId : undefined
          actions.createWorkspaceGroup(groupId, name, workspaceId)
          if (workspaceId) {
            const workspace = (items || []).find(workspace => workspace.workspaceId === workspaceId)
            for (const sessionId of workspace.sessionIds || []) actions.assignSessionSection(sessionId, null)
          }
          if (target.sessionId && list && list.byId && list.byId[target.sessionId]) actions.assignSessionSection(target.sessionId, groupId)
          actions.setExpanded('workspace-group:' + groupId, true)
        }
        setDialog(null)
      }

      const submitWorkspaceRename = (workspace, nextTitle) => {
        const title = String(nextTitle || '').trim()
        if (title === '' || title === workspace.title) { setDialog(null); return }
        Promise.resolve()
          .then(() => renameWorkspace(workspace.workspaceId, title))
          .then(() => setDialog(null))
          .catch(fail)
      }

      const submitWorkspaceDelete = (workspace) => {
        Promise.resolve()
          .then(() => deleteWorkspace(workspace.workspaceId))
          .then(() => setDialog(null))
          .catch(fail)
      }

      const submitSessionRename = (session, nextTitle) => {
        const title = String(nextTitle || '').trim()
        if (title === '' || title === session.title) { setDialog(null); return }
        Promise.resolve()
          .then(() => renameByUser(session.id, title))
          .then(() => setDialog(null))
          .catch(fail)
      }
      const submitSessionDelete = async (session) => {
        if (deletingRef.current || !deleteAvailable || typeof deleteSession !== 'function' || session.blank) return
        deletingRef.current = true
        setDeleting(true)
        try {
          const result = await deleteSession(session.id)
          actions.assignSessionSection(session.id, null)
          if (pinnedList.includes(session.id)) actions.togglePin(session.id)
          setDialog(null)
          setNotice(t('session.delete.done'))
          try {
            if (typeof refreshSessions === 'function') await refreshSessions()
          } catch (error) {
            setErrorText(t('session.delete.cleanupWarning') + '\n' + messageOf(error))
          }
          if (result && Array.isArray(result.warnings) && result.warnings.length > 0) setErrorText(t('session.delete.cleanupWarning'))
        } catch (error) {
          fail(t('session.delete.failed', { reason: messageOf(error) }))
        } finally {
          deletingRef.current = false
          setDeleting(false)
        }
      }
      const copySessionText = async (text, successKey) => {
        try {
          if (!await writeClipboardText(text, ui.writeClipboard)) throw new Error(t('copy.failed'))
          setNotice(t(successKey))
        } catch (error) { fail(messageOf(error)) }
      }

      /** Rename one session sub-group: rewrite the title prefix of every member. */
      const submitSessionGroupRename = (target, rawName) => {
        const name = normPath(rawName)
        if (name === '') { setErrorText(t('folder.error.empty')); return }
        if (name === target.name) { setDialog(null); return }
        const workspace = (items || []).find(w => w.workspaceId === target.workspaceId)
        if (!workspace) { setDialog(null); return }
        const node = findSessionGroup(buildSessionTree(sessionsOf(workspace)), target.path)
        if (!node) { setDialog(null); return }
        const parentPath = target.path.includes('/') ? target.path.slice(0, target.path.lastIndexOf('/')) : ''
        const nextPath = parentPath !== '' ? parentPath + '/' + name : name
        const affected = collectSessionRows(node)
        Promise.resolve()
          .then(async () => {
            for (const row of affected) {
              if (row.blank) continue
              const nextTitle = nextPath + row.title.slice(target.path.length)
              await renameByUser(row.id, nextTitle)
            }
          })
          .then(() => setDialog(null))
          .catch(fail)
      }

      const findTreeNode = (node, path) => {
        if (node.path === path) return node
        for (const folder of node.folders) {
          const hit = findTreeNode(folder, path)
          if (hit) return hit
        }
        return null
      }

      const submitFolderNew = (parentPath, rawPath) => {
        const parent = normPath(parentPath)
        const sub = normPath(rawPath)
        if (sub === '') { setErrorText(t('folder.error.empty')); return }
        const p = parent !== '' ? parent + '/' + sub : sub
        // Existence check covers explicit folders AND every folder derived
        // from workspace titles, so "already exists" means either kind.
        const derived = new Set()
        for (const w of items || []) {
          const segs = splitTitleSegs(w.title)
          for (let i = 1; i < segs.length; i++) derived.add(segs.slice(0, i).join('/'))
        }
        if (storeFolders.includes(p) || derived.has(p)) { setErrorText(t('folder.error.exists')); return }
        actions.addFolder(p)
        setDialog(null)
      }

      const submitFolderRename = (oldPath, rawPath) => {
        const newPath = normPath(rawPath)
        if (newPath === '') { setErrorText(t('folder.error.empty')); return }
        if (newPath === oldPath) { setDialog(null); return }
        const node = findTreeNode(tree, oldPath)
        const hasChildren = node ? countWorkspaces(node) > 0 : false
        const prefix = oldPath + '/'
        const affected = hasChildren
          ? (items || []).filter(w => !workspaceGroupOf(w.workspaceId) && String(w.title || '').startsWith(prefix))
          : []
        Promise.resolve()
          .then(async () => {
            for (const w of affected) {
              const nextTitle = newPath + String(w.title).slice(oldPath.length)
              await renameWorkspace(w.workspaceId, nextTitle)
            }
          })
          .then(() => { actions.renameFolder(oldPath, newPath); setDialog(null) })
          .catch(fail)
      }

      const submitFolderDelete = (path) => {
        const node = findTreeNode(tree, path)
        if (node && countWorkspaces(node) > 0) { setErrorText(t('folder.error.notEmpty')); return }
        actions.removeFolder(path)
        setDialog(null)
      }

      /* ---------------------------- rows ----------------------------- */

      /**
       * Session list of ONE workspace in the projects view: pinned rows are
       * hidden (tray-only display — unpinning restores them) and the rest
       * render as the "/" title grouping tree in manual or recency order.
       * Search expands matching groups; pins remain tray-only. The time view never
       * routes here — the global timeline in the bodyRows assembly replaces
       * the workspace scaffolding entirely.
       */
      const matchesSession = (row) => {
        if (!searching) return true
        const workspaceId = workspaceIndexOf.get(row.id)
        const workspace = (items || []).find(item => item.workspaceId === workspaceId)
        const sectionId = sessionSectionOf(row.id)
        const groupId = sectionId === null ? workspaceGroupOf(workspaceId) : sectionId
        const group = workspaceGroups.find(group => group.id === groupId)
        return (row.title + ' ' + (workspace ? workspace.title : '') + ' ' + (group ? group.name : '')).toLowerCase().includes(normalizedQuery)
      }
      const renderSessionTree = (workspace, depth) => {
        // Folder semantics: a closed workspace shows no sessions at all (the
        // list keeps its count badge); an open one shows the full session tree.
        if (!searching && !sessionsOpenOf(workspace.workspaceId)) return []
        const rows = sessionsOf(workspace)
        if (rows.length === 0) return []
        const unpinned = rows.filter(r => !pinnedSet.has(r.id))
        if (unpinned.length === 0) return []
        return renderSessionNode(buildSessionTree(unpinned, sortOrder), workspace.workspaceId, depth)
      }

      /** Recency buckets over un-pinned rows; empty buckets stay hidden. */
      const renderTimeBuckets = (rows, workspaceId, depth) => {
        const buckets = new Map()
        for (const key of BUCKET_ORDER) buckets.set(key, [])
        for (const r of rows) buckets.get(bucketOf(r.updatedAt, now)).push(r)
        const direction = timeDirection === 'oldest' ? 1 : -1
        const prefix = workspaceId || 'timeline'
        const out = []
        const bucketKeys = timeDirection === 'oldest' ? BUCKET_ORDER.slice().reverse() : BUCKET_ORDER
        for (const key of bucketKeys) {
          const bucketRows = buckets.get(key)
          if (bucketRows.length === 0) continue
          out.push(E('div', { key: 'bucket-' + prefix + '-' + key, className: 'bw-bucket-header' }, t('bucket.' + key)))
          const sorted = bucketRows.slice().sort((a, b) => direction * (a.updatedAt - b.updatedAt))
          // Rows render without a workspace context: no drag surfaces here
          // (the timeline is a derived view, not a reorder surface). The
          // relative time is the tail label by default; the workspace tag
          // reveals on hover and the native tooltip carries the full title,
          // project and absolute timestamp.
          for (const s of sorted) out.push(renderSessionRow(s, depth, null, { workspaceTag: s.workspaceTag, tagOnHover: true, tooltip: true }))
        }
        return out
      }
      const searchSessionNode = (node) => {
        const groups = []
        for (const group of node.groups) {
          const hit = searchSessionNode(group)
          if (hit) groups.push(hit)
        }
        const sessions = node.sessions.filter(matchesSession)
        if (groups.length === 0 && sessions.length === 0) return null
        return { path: node.path, name: node.name, groups, sessions }
      }
      const renderSessionNode = (node, workspaceId, depth) => {
        const view = searching ? searchSessionNode(node) : node
        if (!view) return []
        const out = []
        for (const group of view.groups) {
          const key = workspaceId + '|' + group.path
          const open = searching || sessionGroupOpen(key)
          out.push(E(SessionGroupRow, {
            key: 'sg-' + key,
            name: group.name,
            depth,
            expanded: open,
            pulse: (statusPulse && !open) ? nodePulseOf(group) : null,
            count: countSessionTree(group),
            onToggle: () => { if (!searching) actions.setSessionGroupExpanded(key, !open) },
            onContextMenu: (e) => openCtx('sgroup', { workspaceId, path: group.path, name: group.name }, e),
            dropInto: sgroupDropInto(workspaceId, group.path),
            dragEvents: sgroupDropEvents(workspaceId, group.path),
            custStyle: rowStyleOf('sgroup:' + workspaceId + '|' + group.path),
            t,
          }))
          if (open) out.push(...renderSessionNode(group, workspaceId, depth + 1))
        }
        for (const s of view.sessions) out.push(renderSessionRow(s, depth, workspaceId))
        return out
      }

      /**
       * One session row anywhere it renders. opts: { pinned, inTray, workspaceTag }.
       * Pin membership marks the row automatically (pinned badge + tinted
       * backdrop) wherever it appears; inTray disables drag (tray rows are
       * projections, not reorder anchors) and keys the row apart from its
       * in-workspace sibling. Pin button hidden when the store lacks the
       * action (older host wiring).
       */
      const restoreSession = (id) => {
        if (typeof unarchiveSession !== 'function') return
        Promise.resolve().then(() => unarchiveSession(id)).catch(fail)
      }
      const renderSessionRow = (session, depth, workspaceId, opts) => {
        const o = opts || {}
        const pinned = o.pinned === true || pinnedSet.has(session.id)
        const togglePin = typeof actions.togglePin === 'function' ? (id) => actions.togglePin(id) : undefined
        const inTray = o.inTray === true
        return E(SessionRow, {
          key: String(session.id) + (inTray ? '-tray' : ''),
          node: session,
          depth,
          current: list && list.current === session.id,
          now,
          onOpen: (id) => { if (session.archived) setErrorText(t('session.archivedHint')); else open(id) },
          onContextMenu: (e) => openCtx('session', session, e),
          dropHalf: workspaceId && !pinned && !o.sectioned ? sessDropHalf(session.id) : null,
          dragEvents: sessionDraggable(session) && (canMoveWorkspaceGroup || (workspaceId && !o.sectioned)) ? sessionDragEvents(session, workspaceId, o.sectioned === true) : undefined,
          custStyle: rowStyleOf('session:' + session.id),
          breathing: statusPulse,
          pinned,
          onTogglePin: session.archived ? undefined : togglePin,
          onUnarchive: typeof unarchiveSession === 'function' ? restoreSession : undefined,
          workspaceTag: o.workspaceTag,
          tagOnHover: o.tagOnHover === true,
          tooltip: o.tooltip === true,
          t,
        })
      }

      const renderWorkspaceEntry = (entry, depth, pulse) => {
        const { workspace } = entry
        const wsRows = sessionsOf(workspace)
        const count = countSessionTree(buildSessionTree(wsRows))
        const pinCount = wsRows.reduce((n, s) => n + (pinnedSet.has(s.id) ? 1 : 0), 0)
        const rows = [E(WorkspaceRow, {
          key: 'ws-' + workspace.workspaceId,
          workspace,
          depth,
          count,
          pinCount,
          sessionsOpen: searching ? true : sessionsOpenOf(workspace.workspaceId),
          currentInside: !!(list && list.current && (workspace.sessionIds || []).includes(list.current)),
          onToggle: () => { if (!searching) actions.setSessionsExpanded(workspace.workspaceId, !sessionsOpenOf(workspace.workspaceId)) },
          // Starting a session force-expands the workspace row: the user must
          // SEE the new session appear, even if the row was collapsed.
          onStart: () => { actions.setSessionsExpanded(workspace.workspaceId, true); startSession(workspace.workspaceId) },
          onContextMenu: (e) => openCtx('workspace', workspace, e),
          dropHalf: wsDropHalf(workspace.workspaceId),
          dragEvents: workspaceDragEvents(workspace),
          custStyle: rowStyleOf('workspace:' + workspace.workspaceId),
          iconMode: (styleEntry('workspace:' + workspace.workspaceId) || {}).icon || 'solid',
          pulse,
          t,
        })]
        rows.push(...renderSessionTree(workspace, depth + 1))
        return rows
      }

      const renderPlainFolder = (node, depth) => {
        if (node.kind === 'ws') return renderWorkspaceEntry({ workspace: node.workspace }, depth, wsPulseOf(node.workspace))
        const expanded = searching || folderExpanded(node.path)
        const rows = [E(FolderRow, {
          key: 'f-' + node.path,
          node,
          depth,
          expanded,
          onToggle: () => { if (!searching) actions.setExpanded(node.path, !expanded) },
          onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
          dropInto: wsDropInto(node.path),
          dragEvents: folderDropEvents(node.path),
          custStyle: rowStyleOf('folder:' + node.path),
          iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
          pulse: expanded ? null : folderPulseOf(node),
          t,
        })]
        if (expanded) {
          for (const child of node.folders) rows.push(...renderPlainFolder(child, depth + 1))
          for (const workspace of node.workspaces) rows.push(...renderWorkspaceEntry({ workspace }, depth + 1, wsPulseOf(workspace)))
        }
        return rows
      }
      const renderSearchedFolder = (hit, depth) => {
        if (hit.kind === 'ws') return renderWorkspaceEntry({ workspace: hit.workspace }, depth)
        const node = hit.node
        const rows = [E(FolderRow, {
          key: 'f-' + node.path,
          node,
          depth,
          expanded: true,
          onToggle: () => {},
          onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
          dropInto: false,
          dragEvents: undefined,
          custStyle: rowStyleOf('folder:' + node.path),
          iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
          t,
        })]
        for (const child of hit.folders) rows.push(...renderSearchedFolder(child, depth + 1))
        for (const entry of hit.workspaces) rows.push(...renderWorkspaceEntry(entry, depth + 1))
        return rows
      }

      /**
       * Global pinned tray at the top of the tree: header row (pin glyph +
       * count) plus one session row per pin, tagged with its workspace leaf
       * name so the cross-workspace context stays readable. Rows open the
       * session directly (open() handles cross-workspace switching).
       */
      const renderPinnedSection = (rows) => E('div', { key: 'pinned-section', className: 'bw-pinned-section' },
        E('div', { className: 'bw-pinned-header' },
          E('span', { className: 'bw-pin-mark' }, E(PinIcon16, { size: 11 })),
          E('span', null, t('pinned.header')),
          E('span', { className: 'bw-row-count' }, String(rows.length)),
        ),
        rows.map((s) => renderSessionRow(s, 0, workspaceIndexOf.get(s.id) || undefined, { pinned: true, inTray: true, workspaceTag: s.workspaceTag })),
      )

      // Global pinned tray: every pinned session that is visible right now,
      // across workspaces and ungrouped, in pin-recency order (store order).
      // Archived pins stay stored and appear as ordinary archive rows. During
      // search the tray filters like any other row.
      const pinnedTray = []
      if (Array.isArray(pinnedList) && pinnedList.length > 0 && list) {
        for (const rawId of pinnedList) {
          const id = String(rawId)
          const row = sessionRowOf(id)
          if (!row || row.archived) continue
          if (!matchesSession(row)) continue
          const wsId = workspaceIndexOf.get(id)
          row.workspaceTag = wsId !== undefined ? workspaceTitleOf(wsId) : ''
          pinnedTray.push(row)
        }
      }

      const sectionRowsOf = groupId => orderRows(sectionedSessions.filter(row => sessionSectionOf(row.id) === groupId && !pinnedSet.has(row.id) && matchesSession(row)), sortOrder)
      const renderSectionedSession = row => renderSessionRow(row, 0, workspaceIndexOf.get(row.id), {
        sectioned: true, workspaceTag: workspaceTitleOf(workspaceIndexOf.get(row.id)), tooltip: true,
      })
      const renderCustomWorkspaceGroups = () => {
        const rows = []
        for (const group of workspaceGroups) {
          const members = visibleItems.filter(workspace => workspaceGroupOf(workspace.workspaceId) === group.id)
          const looseRows = sectionRowsOf(group.id)
          if (archivedFilter === 'only' && members.length === 0 && looseRows.length === 0) continue
          const groupTree = buildWorkspaceList(members, recency)
          const groupMatch = searching && group.name.toLowerCase().includes(normalizedQuery)
          const hit = searching && !groupMatch ? searchAgent(groupTree) : null
          if (searching && !groupMatch && !hit && looseRows.length === 0) continue
          const expanded = searching || expandedMap['workspace-group:' + group.id] !== false
          rows.push(E(WorkspaceGroupRow, {
            key: 'workspace-group-' + group.id, group, expanded,
            onToggle: () => { if (!searching) actions.setExpanded('workspace-group:' + group.id, !expanded) },
            onContextMenu: event => openCtx('wgroup', group, event),
            dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === group.id,
            dragEvents: workspaceGroupDropEvents(group.id),
          }))
          if (expanded) {
            const entries = hit ? hit.workspaces : groupTree.workspaces.map(workspace => ({ workspace }))
            if (!searching || groupMatch || hit) {
              for (const entry of entries) rows.push(...renderWorkspaceEntry(entry, 0, wsPulseOf(entry.workspace)))
            }
            for (const row of looseRows) rows.push(renderSectionedSession(row))
          }
        }
        return rows
      }
      const renderProjectsHeader = () => {
        const looseRows = sectionRowsOf('')
        if (workspaceGroups.length === 0 && looseRows.length === 0) return []
        if (searching && !searched && looseRows.length === 0) return []
        if (archivedFilter === 'only' && projectItems.length === 0 && looseRows.length === 0) return []
        const group = { id: '', name: t('wgroup.projects') }
        return [E(WorkspaceGroupRow, {
          key: 'workspace-group-projects', group,
          onContextMenu: event => openCtx('wgroup', group, event),
          dropInto: drag !== null && drag.over && drag.over.kind === 'wgroup' && drag.over.target === '',
          dragEvents: workspaceGroupDropEvents(''),
        })]
      }
      let bodyRows = []
      if (searching && groupedView) {
        // Grouped search preserves project provenance and expands matches.
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader())
        if (searched) {
          for (const child of searched.folders) bodyRows.push(...renderSearchedFolder(child, 0))
          for (const entry of searched.workspaces) bodyRows.push(...renderWorkspaceEntry(entry, 0))
        }
        for (const row of sectionRowsOf('')) bodyRows.push(renderSectionedSession(row))
      } else if (timeSorted || viewMode === 'flat') {
        // Start from host accounts, not compressed tree nodes: a compressed
        // folder may be a workspace leaf and has no folders/workspaces arrays.
        const timelineRows = []
        const included = new Set()
        const append = (row) => {
          if (included.has(row.id) || pinnedSet.has(row.id) || !matchesSession(row)) return
          included.add(row.id)
          const workspaceId = workspaceIndexOf.get(row.id)
          row.workspaceTag = workspaceId !== undefined ? workspaceTitleOf(workspaceId) : ''
          timelineRows.push(row)
        }
        for (const workspace of items || []) for (const row of sessionsOf(workspace, true)) append(row)
        for (const row of ungrouped) append(row)
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        if (timeSorted) {
          for (const row of renderTimeBuckets(timelineRows, null, 0)) bodyRows.push(row)
        } else {
          for (const row of orderRows(timelineRows, sortOrder)) {
            bodyRows.push(renderSessionRow(row, 0, null, { workspaceTag: row.workspaceTag, tagOnHover: true, tooltip: true }))
          }
        }
      } else {
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader())
        for (const folder of tree.folders) bodyRows.push(...renderPlainFolder(folder, 0))
        for (const workspace of tree.workspaces) bodyRows.push(...renderWorkspaceEntry({ workspace }, 0, wsPulseOf(workspace)))
        for (const row of sectionRowsOf('')) bodyRows.push(renderSectionedSession(row))
        if (ungrouped.length > 0) {
          const plainUn = ungrouped.filter(s => sessionSectionOf(s.id) === null && !pinnedSet.has(s.id) && matchesSession(s))
          if (plainUn.length > 0) {
            bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
          }
          for (const s of plainUn) bodyRows.push(renderSessionRow(s, 0, null))
        }
      }
      if (searching && groupedView) {
        const matchedUngrouped = ungrouped.filter(row => sessionSectionOf(row.id) === null && !pinnedSet.has(row.id) && matchesSession(row))
        if (matchedUngrouped.length > 0) {
          bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
          for (const row of matchedUngrouped) bodyRows.push(renderSessionRow(row, 0, null))
        }
      }
      const isEmpty = bodyRows.length === 0
      if (isEmpty) {
        let emptyText = t('empty.sessions')
        if (searching) emptyText = t('empty.search')
        else if (phase === 'pending') emptyText = '…'
        else if (archivedFilter === 'only') emptyText = t('empty.archived')
        else if (groupedView && visibleItems.length === 0) emptyText = t('empty')
        bodyRows = [E('div', { key: 'empty', className: 'bw-empty' },
          E('div', null, emptyText),
          archivedFilter !== 'show' && phase !== 'pending' ? E(BTN, { variant: 'outline', onClick: () => actions.setArchivedFilter('show') }, t('empty.showAll')) : null,
        )]
      }

      /* ------------------------- context menu ------------------------ */

      const ctxItems = () => {
        if (ctx === null) return []
        if (ctx.kind === 'view') {
          const choice = (id, label, checked, disabled = false) => ({
            id, label: t(label), role: 'menuitemradio', checked, disabled,
            leading: checked ? icon('IconCheckOutline16', 14) : null,
          })
          const items = [{ heading: t('view.grouping') }]
          for (const mode of VIEW_MODES) items.push(choice('view-' + mode, 'view.' + mode, viewMode === mode))
          items.push({ sep: true }, { heading: t('view.sort') })
          items.push(choice('view-sort-manual', 'view.sort.manual', !automaticSort, timeSorted))
          items.push(choice('view-sort-latest', 'view.sort.latest', automaticSort, timeSorted))
          if (timeSorted) {
            for (const dir of ['latest', 'oldest']) items.push(choice('view-dir-' + dir, 'view.time.' + dir, timeDirection === dir))
          }
          items.push({ sep: true }, { heading: t('view.filter') })
          for (const filter of ARCHIVED_FILTERS) items.push(choice('view-filter-' + filter, 'view.filter.' + filter, archivedFilter === filter))
          return items
        }
        if (ctx.kind === 'folder') {
          const items = [
            { id: 'new-subfolder', label: t('menu.newSubfolder') },
            { id: 'new-subworkspace', label: t('menu.newSubWorkspace') },
            { id: 'rename-folder', label: t('menu.renameFolder') },
          ]
          if (storeFolders.includes(ctx.payload.path)) items.push({ id: 'remove-folder', label: t('menu.removeFolder'), danger: true })
          items.push({ sep: true })
          items.push({ id: 'customize', label: t('custom.title') })
          return items
        }
        if (ctx.kind === 'workspace') return [
          { id: 'rename', label: t('menu.rename'), leading: icon('IconEditOutline16', 14) },
          { id: 'group-workspace', label: t('wgroup.menu'), leading: icon('IconFolderOpenOutline16', 14), submenu: true },
          { id: 'delete', label: t('menu.delete'), leading: icon('IconTrashOutline16', 14), danger: true },
          { sep: true },
          { id: 'customize', label: t('custom.title'), leading: icon('IconPersonalizationOutline16', 14) },
        ]
        if (ctx.kind === 'wgroup') {
          const items = [{ id: 'new-workspace-group', label: t('wgroup.new'), leading: icon('IconPlusOutline16', 14) }]
          if (ctx.payload.id) items.push(
            { sep: true },
            { id: 'rename-workspace-group', label: t('wgroup.rename'), leading: icon('IconEditOutline16', 14) },
            { id: 'delete-workspace-group', label: t('wgroup.delete'), leading: icon('IconTrashOutline16', 14), danger: true },
          )
          return items
        }
        if (ctx.kind === 'session') {
          const isPinned = pinnedSet.has(ctx.payload.id)
          const items = []
          if (ctx.payload.archived) items.push({ id: 'unarchive', label: t('menu.unarchive'), leading: icon('IconArchiveOutline20', 14), disabled: typeof unarchiveSession !== 'function' })
          else items.push(
            { id: 'rename', label: t('menu.renameSession'), leading: icon('IconEditOutline16', 14), disabled: typeof renameSession !== 'function' },
            { id: 'archive', label: t('menu.archiveSession'), leading: icon('IconArchiveOutline20', 14), disabled: typeof archiveSession !== 'function' },
          )
          items.push(
            { id: 'group-session', label: t('wgroup.menu'), leading: icon('IconListPenOutline16', 14), submenu: true },
            { id: 'delete-session', label: t('menu.deleteSession'), leading: icon('IconTrashOutline16', 14), danger: true, disabled: !deleteAvailable || ctx.payload.blank || deleting, hint: !deleteAvailable ? t('menu.deleteUnavailable') : undefined },
            { sep: true },
            { id: 'open-directory', label: t('menu.openDirectory'), leading: icon('IconFolderOpenOutline16', 14), disabled: !ctx.payload.cwd || typeof openDirectory !== 'function' },
            { id: 'copy-directory', label: t('menu.copyDirectory'), leading: icon('IconCopyOutline16', 14), disabled: !ctx.payload.cwd },
            { id: 'copy-id', label: t('menu.copySessionId'), leading: icon('IconLinkOutline16', 14) },
          )
          if (!ctx.payload.archived) items.push(
            { sep: true },
            { id: 'fork', label: t('menu.fork'), leading: icon('IconBranchOutline16', 14), disabled: ctx.payload.blank || typeof forkSession !== 'function' },
            { id: 'pin', label: isPinned ? t('menu.unpin') : t('menu.pin'), leading: E(PinIcon16, { size: 14 }) },
          )
          items.push({ sep: true }, { id: 'customize', label: t('custom.title'), leading: icon('IconPersonalizationOutline16', 14) },
            { sep: true }, { id: 'refresh', label: t('menu.refresh'), leading: icon('IconRefreshOutline16', 14), shortcut: 'Ctrl+R', disabled: typeof refreshPage !== 'function' })
          return items
        }
        return [
          { id: 'rename-sgroup', label: t('menu.renameSgroup') },
          { sep: true },
          { id: 'customize', label: t('custom.title') },
        ]
      }
      const handleCtxPick = (id) => {
        const current = ctx
        if (current === null) return
        if (id.startsWith('assign-workspace-group:') && current.kind === 'workspace') {
          assignWorkspaceGroup(current.payload.workspaceId, id.slice('assign-workspace-group:'.length))
          setCtxSubmenu(null)
          setCtx(null)
          return
        }
        if (id.startsWith('assign-session-section:') && current.kind === 'session') {
          assignSessionSection(current.payload.id, id.slice('assign-session-section:'.length))
          setCtxSubmenu(null)
          setCtx(null)
          return
        }
        if (id === 'follow-workspace' && current.kind === 'session') {
          assignSessionSection(current.payload.id, null)
          setCtxSubmenu(null)
          setCtx(null)
          return
        }
        if (id === 'new-workspace-group') {
          setDialog({ kind: 'wgroup-new',
            workspaceId: current.kind === 'workspace' ? current.payload.workspaceId : undefined,
            sessionId: current.kind === 'session' ? current.payload.id : undefined,
          })
          setCtxSubmenu(null)
          setCtx(null)
          return
        }
        setCtxSubmenu(null)
        if (current.kind === 'view' && id.startsWith('view-')) {
          const mode = id.slice('view-'.length)
          if (VIEW_MODES.includes(mode)) actions.setViewMode(mode)
          else if (id.startsWith('view-dir-')) actions.setTimeDirection(id.slice('view-dir-'.length))
          else if (id.startsWith('view-sort-') && !timeSorted) actions.setSortOrder(id.slice('view-sort-'.length))
          else if (id.startsWith('view-filter-')) actions.setArchivedFilter(id.slice('view-filter-'.length))
          setCtx(null)
          setDrag(null)
          return
        }
        if (id === 'customize') {
          const payload = current.payload
          let name = payload.name
          if (current.kind === 'workspace') name = payload.title || payload.leaf
          else if (current.kind === 'session') name = payload.title
          setCustomize({ kind: current.kind, entryKey: keyOf(current.kind, payload), name })
          setCtx(null)
          return
        }
        const { kind, payload } = current
        setCtx(null)
        if (kind === 'folder' && id === 'new-subfolder') setDialog({ kind: 'folder-new', parentPath: payload.path })
        else if (kind === 'folder' && id === 'new-subworkspace') { setFlowParent(payload.path); setFlowOpen(true) }
        else if (kind === 'folder' && id === 'rename-folder') setDialog({ kind: 'folder-rename', path: payload.path })
        else if (kind === 'folder' && id === 'remove-folder') setDialog({ kind: 'folder-delete', path: payload.path })
        else if (kind === 'workspace' && id === 'rename') setDialog({ kind: 'ws-rename', workspace: payload })
        else if (kind === 'workspace' && id === 'delete') setDialog({ kind: 'ws-delete', workspace: payload })
        else if (kind === 'wgroup' && id === 'rename-workspace-group') setDialog({ kind: 'wgroup-rename', groupId: payload.id, name: payload.name })
        else if (kind === 'wgroup' && id === 'delete-workspace-group') setDialog({ kind: 'wgroup-delete', group: payload })
        else if (kind === 'sgroup' && id === 'rename-sgroup') setDialog({ kind: 'sgroup-rename', target: payload })
        else if (kind === 'session' && id === 'pin') actions.togglePin(payload.id)
        else if (kind === 'session' && id === 'rename') setDialog({ kind: 'sess-rename', session: payload })
        else if (kind === 'session' && id === 'fork') { Promise.resolve().then(() => forkSession(payload.id)).catch(error => fail(messageOf(error))) }
        else if (kind === 'session' && id === 'unarchive') restoreSession(payload.id)
        else if (kind === 'session' && id === 'archive') { Promise.resolve().then(() => archiveSession(payload.id)).catch(fail) }
        else if (kind === 'session' && id === 'delete-session' && deleteAvailable && !payload.blank && !deleting) setDialog({ kind: 'sess-delete', session: payload })
        else if (kind === 'session' && id === 'open-directory' && payload.cwd) { Promise.resolve().then(() => openDirectory(payload.cwd)).catch(error => fail(messageOf(error))) }
        else if (kind === 'session' && id === 'copy-directory' && payload.cwd) copySessionText(payload.cwd, 'copy.directory.done')
        else if (kind === 'session' && id === 'copy-id') copySessionText(payload.id, 'copy.sessionId.done')
        else if (kind === 'session' && id === 'refresh' && typeof refreshPage === 'function') refreshPage()
      }

      /* --------------------------- dialogs --------------------------- */
      // TextDialog / ConfirmDialog are module-level components: a per-render
      // inline definition would remount on every parent tick and drop input.

      /* ---------------------------- render --------------------------- */

      if (!wide) {
        return E('div', { className: 'bw-rail' },
          StyleNode(),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.search'), onClick: () => { expandSidebar(); setSearchOpen(true) } }, icon('IconSearchOutline16', 18)),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.add'), onClick: () => { expandSidebar(); setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16', 18)),
        )
      }

      const dialogElement = (() => {
        if (dialog === null) return null
        if (dialog.kind === 'wgroup-new' || dialog.kind === 'wgroup-rename') return E(TextDialog, {
          key: dialog.kind, title: t(dialog.kind === 'wgroup-new' ? 'wgroup.new.title' : 'wgroup.rename'),
          hint: t('wgroup.hint'), initial: dialog.name || '',
          onConfirm: name => submitWorkspaceGroup(dialog, name), onClose: () => setDialog(null), t,
        })
        if (dialog.kind === 'wgroup-delete') return E(ConfirmDialog, {
          key: 'wgroup-delete', title: t('wgroup.delete'), body: t('wgroup.delete.body', { name: dialog.group.name }),
          onConfirm: () => { actions.deleteWorkspaceGroup(dialog.group.id); setDialog(null) },
          onClose: () => setDialog(null), t,
        })
        if (dialog.kind === 'ws-rename') return E(TextDialog, {
          key: 'ws-rename',
          title: t('ws.rename.title'),
          hint: t('ws.rename.hint'),
          initial: dialog.workspace.title || dialog.workspace.leaf,
          onConfirm: (v) => submitWorkspaceRename(dialog.workspace, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'ws-delete') return E(ConfirmDialog, {
          key: 'ws-delete',
          title: t('ws.delete.title'),
          body: t('ws.delete.body', { name: dialog.workspace.title || dialog.workspace.leaf }),
          onConfirm: () => submitWorkspaceDelete(dialog.workspace),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sess-rename') return E(TextDialog, {
          key: 'sess-rename',
          title: t('menu.rename'),
          initial: dialog.session.title,
          onConfirm: (v) => submitSessionRename(dialog.session, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sess-delete') return E(ConfirmDialog, {
          key: 'sess-delete', title: t('session.delete.title'),
          body: t('session.delete.body', { name: dialog.session.title }),
          confirmLabel: t(deleting ? 'session.delete.busy' : 'session.delete.confirm'), danger: true, busy: deleting,
          onConfirm: () => submitSessionDelete(dialog.session),
          onClose: () => { if (!deletingRef.current) setDialog(null) }, t,
        })
        if (dialog.kind === 'sgroup-rename') return E(TextDialog, {
          key: 'sgroup-rename',
          title: t('menu.renameSgroup'),
          hint: t('ws.rename.hint'),
          initial: dialog.target.name,
          onConfirm: (v) => submitSessionGroupRename(dialog.target, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-new') return E(TextDialog, {
          key: 'folder-new',
          title: t('folder.new.title'),
          hint: t('folder.new.hint'),
          initial: dialog.parentPath ? dialog.parentPath + '/' : '',
          onConfirm: (v) => submitFolderNew(dialog.parentPath || '', v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-rename') return E(TextDialog, {
          key: 'folder-rename',
          title: t('folder.rename.title'),
          hint: t('folder.rename.hint'),
          initial: dialog.path,
          onConfirm: (v) => submitFolderRename(dialog.path, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-delete') {
          return E(ConfirmDialog, {
            key: 'folder-delete',
            title: t('menu.removeFolder'),
            body: t('folder.delete.body', { name: dialog.path }),
            onConfirm: () => submitFolderDelete(dialog.path),
            onClose: () => setDialog(null),
            t,
          })
        }
        return null
      })()

      const flowOwner = {
        open: flowOpen,
        busy: false,
        onPicked: () => {},
        onCancel: () => setFlowOpen(false),
        onError: fail,
      }

      const viewGlyph = () => {
        if (viewMode === 'time') return E(CalendarDaysIcon16, { size: 15 })
        if (viewMode === 'flat') return E(ListIcon16, { size: 15 })
        if (viewMode === 'workspaces') return icon('IconFolderClose16', 15)
        return E(ListTreeIcon16, { size: 15 })
      }
      const renderCtxItem = (item, index) => {
        if (item.sep) return E('div', { key: 'sep-' + index, className: 'bw-ctx-sep' })
        if (item.heading) return E('div', { key: 'heading-' + index, className: 'bw-ctx-heading' }, item.heading)
        let checked
        if (item.checked !== undefined) checked = String(item.checked)
        let leading = null
        const iconClass = item.role === 'menuitemradio' ? 'bw-sort-menu-check' : cls('bw-menu-icon', item.id === 'pin' && 'bw-menu-pin')
        if (item.leading !== undefined) leading = E('span', { className: iconClass, 'aria-hidden': true }, item.leading)
        else if (item.leadingIcon) leading = E('span', { className: iconClass, 'aria-hidden': true }, E(item.leadingIcon, { size: 14 }))
        return E('button', {
          key: item.id, type: 'button',
          className: cls('bw-ctx-item', item.danger && 'bw-ctx-danger', item.sub && 'bw-ctx-subitem'),
          role: item.role || 'menuitem', 'aria-checked': checked, disabled: item.disabled === true, title: item.hint,
          'aria-haspopup': item.submenu ? 'menu' : undefined,
          'aria-expanded': item.submenu ? ctxSubmenu !== null : undefined,
          onMouseEnter: event => { if (item.submenu) openSectionMenu(event); else if (!item.groupChoice) setCtxSubmenu(null) },
          onKeyDown: event => { if (item.submenu && event.key === 'ArrowRight') { event.preventDefault(); openSectionMenu(event) } },
          onClick: event => { if (item.submenu) openSectionMenu(event); else handleCtxPick(item.id) },
        }, leading, E('span', { className: 'bw-menu-label' }, item.label), item.submenu ? icon('IconChevronRightOutline14', 14) : null, item.shortcut ? E('span', { className: 'bw-menu-shortcut' }, item.shortcut) : null)
      }
      const openSectionMenu = event => {
        const rect = event.currentTarget.getBoundingClientRect()
        let x = rect.right + 4
        if (x + 280 > window.innerWidth - 8) x = rect.left - 284
        setCtxSubmenu({ x: Math.max(8, x), y: rect.top })
      }
      const sectionMenuItems = () => {
        if (!ctx || (ctx.kind !== 'workspace' && ctx.kind !== 'session')) return []
        const isSession = ctx.kind === 'session'
        let currentGroup = workspaceGroupOf(ctx.payload.workspaceId)
        let followsWorkspace = false
        if (isSession) {
          currentGroup = sessionSectionOf(ctx.payload.id)
          followsWorkspace = currentGroup === null && workspaceIndexOf.has(ctx.payload.id)
          if (currentGroup === null && !followsWorkspace) currentGroup = ''
        }
        const choice = group => ({
          id: (isSession ? 'assign-session-section:' : 'assign-workspace-group:') + group.id, label: group.name, groupChoice: true,
          role: 'menuitemradio', checked: currentGroup === group.id,
          leading: currentGroup === group.id ? icon('IconCheckOutline16', 14) : null,
        })
        const items = [
          ...workspaceGroups.map(choice),
          choice({ id: '', name: t('wgroup.unassigned') }),
        ]
        if (isSession && workspaceIndexOf.has(ctx.payload.id)) items.push({
          id: 'follow-workspace', label: t('wgroup.followWorkspace'), groupChoice: true, role: 'menuitemradio', checked: followsWorkspace,
          leading: followsWorkspace ? icon('IconCheckOutline16', 14) : null,
        })
        items.push({ sep: true }, { id: 'new-workspace-group', label: t('wgroup.new'), groupChoice: true, leading: icon('IconPlusOutline16', 14) })
        return items
      }
      let menuHeight = 240
      if (ctx && ctx.kind === 'view') menuHeight = 450
      else if (ctx && ctx.kind === 'session') menuHeight = 400

      return E('div', { className: 'bw-root', ref: ownMenuRoot },
        StyleNode(),
        E('div', { className: 'bw-header' },
          E('div', { className: 'bw-header-title' }, t('title')),
          (searchOpen || query !== '') ? E('input', {
            className: 'bw-input',
            style: { width: 130, flex: 'none' },
            value: query,
            autoFocus: true,
            placeholder: t('search.placeholder'),
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Escape') { setQuery(''); setSearchOpen(false) } },
            onBlur: () => { if (query === '') setSearchOpen(false) },
          }) : null,
          E('button', {
            type: 'button', className: 'bw-icon-btn', 'aria-label': t('view.label'), title: t('view.label'),
            'aria-haspopup': 'menu', 'aria-expanded': ctx !== null && ctx.kind === 'view',
            onClick: (e) => { e.preventDefault(); setCtx({ kind: 'view', payload: {}, x: e.clientX, y: e.clientY }) },
          }, viewGlyph()),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('search.placeholder'), onClick: () => setSearchOpen(v => !v) }, icon('IconSearchOutline16')),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('add'), onClick: () => { setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16')),
        ),
        E('div', { className: 'bw-tree', role: 'tree', 'aria-label': t('title') }, bodyRows),
        E(BetterFlow, {
          open: flowOpen,
          busy: false,
          initialParent: flowParent,
          onPicked: flowOwner.onPicked,
          onCancel: flowOwner.onCancel,
          onError: flowOwner.onError,
          createWorkspace,
          renameWorkspace,
          pickDirectory,
          useWorkspaces,
          actions,
          useStore,
          t,
        }),
        dialogElement,
        notice ? E('div', { className: 'bw-notice', role: 'status', 'aria-live': 'polite' }, notice) : null,
        ctx !== null ? E('div', {
          className: 'bw-ctx-overlay',
          onMouseDown: () => setCtx(null),
          onContextMenu: (e) => e.preventDefault(),
          onKeyDown: event => { if (event.key === 'Escape') { setCtx(null); setCtxSubmenu(null) } },
        },
          E('div', {
            className: 'bw-ctx-menu',
            role: 'menu', 'aria-label': ctx.kind === 'view' ? t('view.label') : undefined,
            style: { left: Math.max(8, Math.min(ctx.x, window.innerWidth - 250)), top: Math.max(8, Math.min(ctx.y, window.innerHeight - menuHeight)) },
            onMouseDown: (e) => e.stopPropagation(),
            onContextMenu: (e) => e.preventDefault(),
          },
            ctxItems().map(renderCtxItem),
          ),
          (ctx.kind === 'workspace' || ctx.kind === 'session') && ctxSubmenu ? E('div', {
            className: 'bw-ctx-menu bw-ctx-submenu', role: 'menu', 'aria-label': t('wgroup.menu'),
            style: { left: ctxSubmenu.x, top: Math.max(8, Math.min(ctxSubmenu.y, window.innerHeight - (sectionMenuItems().length * 28 + 12))) },
            onMouseDown: event => event.stopPropagation(), onContextMenu: event => event.preventDefault(),
          }, sectionMenuItems().map(renderCtxItem)) : null,
        ) : null,
        E(CustomizeDialog, {
          open: customize !== null,
          kind: customize ? customize.kind : undefined,
          initial: customize ? styleEntry(customize.entryKey) : undefined,
          onChange: (style) => { if (customize) actions.setStyling(customize.entryKey, style) },
          onReset: () => { if (customize) actions.setStyling(customize.entryKey, null) },
          onClose: () => setCustomize(null),
          t,
        }),
        E(ui.Modal, {
          open: errorText !== null,
          onClose: () => setErrorText(null),
          closeLabel: t('close'),
          title: t('error.title'),
          footer: E('div', { className: 'bw-modal-actions' }, E(BTN, { variant: 'primary', onClick: () => setErrorText(null) }, t('close'))),
        }, E('div', { className: 'bw-modal-body' }, E('div', { className: 'bw-error-text', role: 'alert' }, errorText || '')), StyleNode()),
      )
    }

    /* ============================ plugin ============================== */

    const flowSource = (slots, hole) => ({
      getSnapshot: () => {
        try { return slots.entries(hole).length > 0 } catch { return false }
      },
      subscribe: (listener) => {
        try { return slots.subscribe(hole, listener) } catch { return () => {} }
      },
    })

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined || typeof slots.register !== 'function') {
        console.error('[dsh-workspace-plus] slots service unavailable; plugin idle')
        return
      }
      const sessions = ctx.get('sessions')
      const workspaces = ctx.get('workspaces')
      const uiWorkspace = ctx.get('uiWorkspace')
      if (!sessions || !workspaces || !uiWorkspace) {
        console.error('[dsh-workspace-plus] required services missing', {
          sessions: !!sessions, workspaces: !!workspaces, uiWorkspace: !!uiWorkspace,
        })
        return
      }

      if (ctx.locale && typeof ctx.locale.register === 'function') {
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { zh, en })
          } catch (localeError) {
            console.warn('[dsh-workspace-plus] dictionary registration failed', localeError)
            return () => {}
          }
        }, 'better-workspace: dictionaries')
      }

      const searchSessions = async (query, signal) => {
        const result = await sessions.search(query, signal)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session search failed')
        return result.value
      }
      const renameSession = async (sessionId, title) => {
        const binding = sessions.binding(sessionId)
        const session = binding && binding.session
        if (!session) throw new Error('unknown session "' + sessionId + '"')
        const result = await session.rename(title)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session rename failed')
      }
      const openSessionCompat = (sessionId) => {
        // 0.1.7: sessions.open 已移除；官方入口为 uiWorkspace.openSession（旧版 harness 回退保留）
        if (uiWorkspace && typeof uiWorkspace.openSession === 'function') return uiWorkspace.openSession(sessionId)
        if (typeof sessions.open === 'function') return sessions.open(sessionId)
      }
      const forkSession = (sessionId) => {
        return sessions.fork({ sessionId, increaseTitle: true })
          .then((childId) => openSessionCompat(childId))
      }

      const browserInjected = () => ({
        startSession: (workspaceId) => { uiWorkspace.startSession(workspaceId) },
        open: (sessionId) => { openSessionCompat(sessionId) },
        searchSessions,
        searchResultLimit: sessions.searchResultLimit !== undefined ? sessions.searchResultLimit : 20,
        renameSession,
        forkSession,
        deleteSession: deleteSessionRecord,
        checkSessionDelete,
        openDirectory: openSessionDirectory,
        refreshSessions: typeof sessions.refresh === 'function' ? () => sessions.refresh() : undefined,
        refreshPage: () => window.location.reload(),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
        insertWorkspaceBefore: typeof workspaces.insertBefore === 'function'
          ? (workspaceId, beforeWorkspaceId) => workspaces.insertBefore(workspaceId, beforeWorkspaceId)
          : undefined,
        // Official contract exposes session reorder through the WORKSPACES
        // service (see dsh ui-workspace client index.ts); feature-probed so
        // older hosts degrade to "group-move only" instead of a TypeError.
        insertSessionBefore: typeof workspaces.insertSessionBefore === 'function'
          ? (workspaceId, sessionId, beforeSessionId) => workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId)
          : undefined,
        archiveSession: (sessionId) => uiWorkspace.archiveSession(sessionId),
        unarchiveSession: typeof uiWorkspace.unarchiveSession === 'function'
          ? (sessionId) => uiWorkspace.unarchiveSession(sessionId)
          : undefined,
        createWorkspace: (input) => workspaces.create(input),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: {
          directoryFlow: flowSource(slots, 'sidebar.workspaces.directoryFlow'),
        },
      })
      const flowInjected = (hole) => () => ({
        createWorkspace: (input) => workspaces.create(input),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: { directoryFlow: flowSource(slots, hole) },
      })

      // Registration helper: a thrown register (semantics drift, vanishing
      // hole declaration mid-transition) degrades this one seat, never the
      // plugin fiber — the whole web boot is all-or-nothing.
      const guarded = (slotKey, options, component) => () => {
        try {
          return slots.register(options, (props) => E(QuietBoundary, null, E(component, props)))
        } catch (registerError) {
          console.warn('[dsh-workspace-plus] register skipped for ' + slotKey, registerError)
          return undefined
        }
      }

      // One shared store handle: the browser, the settings page and both
      // add-workspace flows must see the same persisted state (expansion,
      // folder list, sections, prefs, styling). Every seat below mounts it at
      // root scope — one handle, one scope — so the renderer hands them ONE
      // instance (resolveStore keys it by handle + scope).
      const viewStore = createViewStore()

      // 1+2. the two directory-flow holes (hero picker, shipped sidebar browser).
      // Since dsh 0.1.2-alpha.1 the shell's own directory picker occupies each
      // hole at priority 0, so shadow at -1 (ascending, lowest renders) exactly
      // like the sidebar.workspaces browser below. The store seat is what lets
      // the dialog offer sections/folders even when the shell hosts the flow
      // (it passes only the hole's owner props, never our browser's).
      slots.inject('conversation.hero.workspace.directoryFlow', guarded(
        'conversation.hero.workspace.directoryFlow',
        { name: 'conversation.hero.workspace.directoryFlow', store: viewStore, inject: flowInjected('conversation.hero.workspace.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))
      slots.inject('sidebar.workspaces.directoryFlow', guarded(
        'sidebar.workspaces.directoryFlow',
        { name: 'sidebar.workspaces.directoryFlow', store: viewStore, inject: flowInjected('sidebar.workspaces.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))

      // Settings → Plugins card only (the tab dispatches the intersection of
      // served namespaces — registered host-side — and settings.plugin.item
      // cards). The old left-nav settings.section entry was removed: the
      // plugins-section card is the single settings surface now.
      slots.inject('settings.plugin.item', guarded(
        'settings.plugin.item',
        {
          name: 'settings.plugin.item',
          key: 'better-workspace',
          locale: NS,
          store: viewStore,
        },
        BetterWorkspacePluginCard,
      ))

      // 3. the browser itself — lowest priority renders, shadowing the shipped entry.
      slots.inject('sidebar.workspaces', guarded(
        'sidebar.workspaces',
        {
          name: 'sidebar.workspaces',
          priority: -1,
          store: viewStore,
          inject: browserInjected,
          locale: NS,
        },
        BetterBrowser,
      ))
    }

    return {
      name: 'dsh-workspace-plus',
      inject: ['slots', 'sessions', 'workspaces', 'locale', 'uiWorkspace'],
      apply,
    }
  },
})
