/** User actions behind dialogs and menus: rename, create, delete, section moves, clipboard and delete. */

import { buildSessionTree, collectSessionRows, countWorkspaces, findSessionGroup } from '../core/tree.js'
import { messageOf, writeClipboardText } from '../host.js'
import { normPath, splitTitleSegs } from '../core/text.js'
import { ui } from '../platform.js'

export function createActions(input) {
  const {
    actions, deleteAvailable, deleteSession, deleteWorkspace, deletingRef, items, list, pinnedList, refreshSessions, renameByUser, renameWorkspace, sessionsOf, setDeleting, setDialog, setErrorText, setNotice, storeFolders, t, tree, workspaceGroupIds, workspaceGroupOf, workspaceGroups, workspaceIndexOf
  } = input

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


  return { assignSessionSection, assignWorkspaceGroup, copySessionText, findTreeNode, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename }
}
