/** Context menu: the per-kind item model, the pick handler and the rendered panel. */

import { ARCHIVED_FILTERS, VIEW_MODES } from '../core/view.js'
import { E } from '../platform.js'
import { PinIcon16, icon } from '../icons.js'
import { messageOf } from '../host.js'

export function createMenu(input) {
  const {
    actions, archiveSession, archivedFilter, assignSessionSection, assignWorkspaceGroup, automaticSort, copySessionText, ctx, deleteAvailable, deleting, fail, forkSession, items, keyOf, openDirectory, pinnedSet, refreshPage, renameSession, restoreSession, setCtx, setCtxSubmenu, setCustomize, setDialog, setDrag, setFlowOpen, setFlowParent, storeFolders, t, timeDirection, timeSorted, unarchiveSession, viewMode
  } = input

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


  return { ctxItems, handleCtxPick }
}
