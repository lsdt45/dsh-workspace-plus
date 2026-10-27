/** Dialog host and the rendered sidebar frame: narrow rail, header, search, tree and menus. */

import { BTN, ConfirmDialog, StyleNode, TextDialog } from '../ui/base.ts'
import { BetterFlow } from '../ui/flow.ts'
import { CalendarDaysIcon16, ListIcon16, ListTreeIcon16, icon } from '../icons.ts'
import { CustomizeDialog } from '../customize.ts'
import { E, ui } from '../platform.ts'
import { cls } from '../core/text.ts'
import type { ViewMode } from '../core/view.ts'
import type { WorkspaceGroup } from '../store.ts'
import type { CtxItem } from './menu.ts'

/**
 * Everything the sidebar frame receives from BetterBrowser. Host-injected
 * actions, state and setters stay untyped (the shell's contracts are
 * feature-probed); plugin-local state and view preferences carry real types.
 */
export interface LayoutInput {
  actions: any
  bodyRows: any
  createWorkspace: any
  ctx: any
  ctxItems: () => CtxItem[]
  ctxSubmenu: any
  customize: any
  deleting: boolean
  deletingRef: { current: boolean }
  dialog: any
  errorText: string | null
  expandSidebar: any
  fail: any
  flowOpen: boolean
  flowParent: string
  handleCtxPick: (id: string) => void
  items: any
  notice: string | null
  ownMenuRoot: any
  openSearch: () => void
  pickDirectory: any
  listDirectory?: any
  createDirectory?: any
  renameWorkspace: any
  sessionSectionOf: any
  setCtx: any
  setCtxSubmenu: any
  setCustomize: any
  setDialog: any
  setErrorText: any
  setFlowOpen: any
  setFlowParent: any
  styleEntry: any
  submitFolderDelete: any
  submitFolderNew: any
  submitFolderRename: any
  submitSessionDelete: any
  submitSessionGroupRename: any
  submitSessionRename: any
  submitWorkspaceDelete: any
  submitWorkspaceGroup: any
  submitWorkspaceRename: any
  t: any
  useStore: any
  useWorkspaces: any
  viewMode: ViewMode
  wide: boolean | undefined
  workspaceGroupOf: any
  workspaceGroups: ReadonlyArray<WorkspaceGroup>
  workspaceIndexOf: any
}

export function createLayout(input: LayoutInput) {
  const {
    actions, bodyRows, createWorkspace, ctx, ctxItems, ctxSubmenu, customize, deleting, deletingRef, dialog, errorText, expandSidebar, fail, flowOpen, flowParent, handleCtxPick, items, notice, openSearch, ownMenuRoot, pickDirectory, listDirectory, createDirectory, renameWorkspace, sessionSectionOf, setCtx, setCtxSubmenu, setCustomize, setDialog, setErrorText, setFlowOpen, setFlowParent, styleEntry, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename, t, useStore, useWorkspaces, viewMode, wide, workspaceGroupOf, workspaceGroups, workspaceIndexOf
  } = input

/* --------------------------- dialogs --------------------------- */
// TextDialog / ConfirmDialog are module-level components: a per-render
// inline definition would remount on every parent tick and drop input.

/* ---------------------------- render --------------------------- */



  /** The sidebar frame for this render. */
  function render() {
  if (!wide) {
    return E('div', { className: 'bw-rail' },
      StyleNode(),
      E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.search'), onClick: () => { expandSidebar(); openSearch() } }, icon('IconSearchOutline16', 18)),
      E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.add'), onClick: () => { expandSidebar(); setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16', 18)),
    )
  }

  const dialogElement = (() => {
    if (dialog === null) return null
    if (dialog.kind === 'wgroup-new' || dialog.kind === 'wgroup-rename') return E(TextDialog, {
      key: dialog.kind, title: t(dialog.kind === 'wgroup-new' ? 'wgroup.new.title' : 'wgroup.rename'),
      hint: t('wgroup.hint'), initial: dialog.name || '',
      onConfirm: (name: string) => submitWorkspaceGroup(dialog, name), onClose: () => setDialog(null), t,
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
      onConfirm: (v: string) => submitWorkspaceRename(dialog.workspace, v),
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
      onConfirm: (v: string) => submitSessionRename(dialog.session, v),
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
      onConfirm: (v: string) => submitSessionGroupRename(dialog.target, v),
      onClose: () => setDialog(null),
      t,
    })
    if (dialog.kind === 'folder-new') return E(TextDialog, {
      key: 'folder-new',
      title: t('folder.new.title'),
      hint: t('folder.new.hint'),
      initial: dialog.parentPath ? dialog.parentPath + '/' : '',
      onConfirm: (v: string) => submitFolderNew(dialog.parentPath || '', v),
      onClose: () => setDialog(null),
      t,
    })
    if (dialog.kind === 'folder-rename') return E(TextDialog, {
      key: 'folder-rename',
      title: t('folder.rename.title'),
      hint: t('folder.rename.hint'),
      initial: dialog.path,
      onConfirm: (v: string) => submitFolderRename(dialog.path, v),
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
  const renderCtxItem = (item: CtxItem, index: number) => {
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
      onMouseEnter: (event: any) => { if (item.submenu) openSectionMenu(event); else if (!item.groupChoice) setCtxSubmenu(null) },
      onKeyDown: (event: any) => { if (item.submenu && event.key === 'ArrowRight') { event.preventDefault(); openSectionMenu(event) } },
      onClick: (event: any) => { if (item.submenu) openSectionMenu(event); else handleCtxPick(item.id as string) },
    }, leading, E('span', { className: 'bw-menu-label' }, item.label), item.submenu ? icon('IconChevronRightOutline14', 14) : null, item.shortcut ? E('span', { className: 'bw-menu-shortcut' }, item.shortcut) : null)
  }
  const openSectionMenu = (event: any) => {
    const rect = event.currentTarget.getBoundingClientRect()
    let x = rect.right + 4
    if (x + 280 > window.innerWidth - 8) x = rect.left - 284
    setCtxSubmenu({ x: Math.max(8, x), y: rect.top })
  }
  const sectionMenuItems = (): CtxItem[] => {
    if (!ctx || (ctx.kind !== 'workspace' && ctx.kind !== 'session')) return []
    const isSession = ctx.kind === 'session'
    let currentGroup = workspaceGroupOf(ctx.payload.workspaceId)
    let followsWorkspace = false
    if (isSession) {
      currentGroup = sessionSectionOf(ctx.payload.id)
      followsWorkspace = currentGroup === null && workspaceIndexOf.has(ctx.payload.id)
      if (currentGroup === null && !followsWorkspace) currentGroup = ''
    }
    const choice = (group: WorkspaceGroup): CtxItem => ({
      id: (isSession ? 'assign-session-section:' : 'assign-workspace-group:') + group.id, label: group.name, groupChoice: true,
      role: 'menuitemradio', checked: currentGroup === group.id,
      leading: currentGroup === group.id ? icon('IconCheckOutline16', 14) : null,
    })
    const items: CtxItem[] = [
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
      E('button', {
        type: 'button', className: 'bw-icon-btn', 'aria-label': t('view.label'), title: t('view.label'),
        'aria-haspopup': 'menu', 'aria-expanded': ctx !== null && ctx.kind === 'view',
        onClick: (e: any) => { e.preventDefault(); setCtx({ kind: 'view', payload: {}, x: e.clientX, y: e.clientY }) },
      }, viewGlyph()),
      E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('search.label'), title: t('search.label'), onClick: () => openSearch() }, icon('IconSearchOutline16')),
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
      listDirectory,
      createDirectory,
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
      onContextMenu: (e: any) => e.preventDefault(),
      onKeyDown: (event: any) => { if (event.key === 'Escape') { setCtx(null); setCtxSubmenu(null) } },
    },
      E('div', {
        className: 'bw-ctx-menu',
        role: 'menu', 'aria-label': ctx.kind === 'view' ? t('view.label') : undefined,
        style: { left: Math.max(8, Math.min(ctx.x, window.innerWidth - 250)), top: Math.max(8, Math.min(ctx.y, window.innerHeight - menuHeight)) },
        onMouseDown: (e: any) => e.stopPropagation(),
        onContextMenu: (e: any) => e.preventDefault(),
      },
        ctxItems().map(renderCtxItem),
      ),
      (ctx.kind === 'workspace' || ctx.kind === 'session') && ctxSubmenu ? E('div', {
        className: 'bw-ctx-menu bw-ctx-submenu', role: 'menu', 'aria-label': t('wgroup.menu'),
        style: { left: ctxSubmenu.x, top: Math.max(8, Math.min(ctxSubmenu.y, window.innerHeight - (sectionMenuItems().length * 28 + 12))) },
        onMouseDown: (event: any) => event.stopPropagation(), onContextMenu: (event: any) => event.preventDefault(),
      }, sectionMenuItems().map(renderCtxItem)) : null,
    ) : null,
    E(CustomizeDialog, {
      open: customize !== null,
      kind: customize ? customize.kind : undefined,
      initial: customize ? styleEntry(customize.entryKey) : undefined,
      onChange: (style: any) => { if (customize) actions.setStyling(customize.entryKey, style) },
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

  return { render }
}
