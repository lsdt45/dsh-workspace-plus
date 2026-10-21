/** Persisted view store (folders, sections, prefs, styling, pins). Hydration replaces state wholesale, so every action tolerates missing keys. */

import { storeKit } from './platform.js'
import { normPath } from './core/text.js'
import { VIEW_MODES, ARCHIVED_FILTERS } from './core/view.js'

export const createViewStore = () => storeKit.defineStore({
  init: () => ({ folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {}, expanded: {}, sessionsExpanded: {}, sessionGroups: {}, prefs: { showTabs: true, statusDots: true, compactChains: true, viewMode: 'projects', timeDirection: 'latest', sortOrder: 'manual', archivedFilter: 'hide' }, styling: {}, pinned: [] }),
  // NOTE: hydration REPLACES the state with the persisted whole value —
  // init defaults never merge. Every action must tolerate a missing key
  // (states persisted by older plugin versions lack sessionGroups), and
  // every selector read takes a fallback.
  persist: 'dsh.betterWorkspace.view.v1',
  actions: {
    setExpanded: (d, key, value) => { if (!d.expanded) d.expanded = {}; d.expanded[key] = value },
    setSessionsExpanded: (d, key, value) => { if (!d.sessionsExpanded) d.sessionsExpanded = {}; d.sessionsExpanded[key] = value },
    setSessionGroupExpanded: (d, key, value) => { if (!d.sessionGroups) d.sessionGroups = {}; d.sessionGroups[key] = value },
    setPref: (d, key, value) => { if (!d.prefs) d.prefs = {}; d.prefs[key] = value },
    setStyling: (d, key, value) => { if (!d.styling) d.styling = {}; if (value === null) delete d.styling[key]; else d.styling[key] = value },
    createWorkspaceGroup: (d, id, name, workspaceId) => {
      if (!Array.isArray(d.workspaceGroups)) d.workspaceGroups = []
      if (d.workspaceGroups.some(group => group.id === id)) return
      d.workspaceGroups.push({ id, name })
      if (workspaceId) {
        if (!d.workspaceGroupById) d.workspaceGroupById = {}
        d.workspaceGroupById[workspaceId] = id
      }
    },
    assignWorkspaceGroup: (d, workspaceId, groupId) => {
      if (groupId && !(d.workspaceGroups || []).some(group => group.id === groupId)) return
      if (!d.workspaceGroupById) d.workspaceGroupById = {}
      if (groupId) d.workspaceGroupById[workspaceId] = groupId
      else delete d.workspaceGroupById[workspaceId]
    },
    assignSessionSection: (d, sessionId, groupId) => {
      if (groupId && !(d.workspaceGroups || []).some(group => group.id === groupId)) return
      if (!d.sessionSectionById) d.sessionSectionById = {}
      if (groupId === null) delete d.sessionSectionById[sessionId]
      else d.sessionSectionById[sessionId] = groupId
    },
    renameWorkspaceGroup: (d, id, name) => {
      const group = (d.workspaceGroups || []).find(group => group.id === id)
      if (group) group.name = name
    },
    deleteWorkspaceGroup: (d, id) => {
      d.workspaceGroups = (d.workspaceGroups || []).filter(group => group.id !== id)
      for (const [workspaceId, groupId] of Object.entries(d.workspaceGroupById || {})) {
        if (groupId === id) delete d.workspaceGroupById[workspaceId]
      }
      for (const [sessionId, groupId] of Object.entries(d.sessionSectionById || {})) {
        if (groupId === id) delete d.sessionSectionById[sessionId]
      }
      if (d.expanded) delete d.expanded['workspace-group:' + id]
    },
    setViewMode: (d, mode) => { if (!d.prefs) d.prefs = {}; d.prefs.viewMode = VIEW_MODES.includes(mode) ? mode : 'projects' },
    setTimeDirection: (d, dir) => { if (!d.prefs) d.prefs = {}; d.prefs.timeDirection = dir === 'oldest' ? 'oldest' : 'latest' },
    setSortOrder: (d, order) => { if (!d.prefs) d.prefs = {}; d.prefs.sortOrder = order === 'latest' ? 'latest' : 'manual' },
    setArchivedFilter: (d, filter) => { if (!d.prefs) d.prefs = {}; d.prefs.archivedFilter = ARCHIVED_FILTERS.includes(filter) ? filter : 'hide' },
    // Pin order IS the visual order: most recent unshift first. Removing
    // keeps the rest of the order intact. Session ids are stable host ids.
    togglePin: (d, id) => {
      if (!Array.isArray(d.pinned)) d.pinned = []
      const key = String(id)
      if (d.pinned.includes(key)) d.pinned = d.pinned.filter(p => p !== key)
      else d.pinned = [key].concat(d.pinned)
    },
    addFolder: (d, path) => {
      if (!Array.isArray(d.folders)) d.folders = []
      const p = normPath(path)
      if (p !== '' && !d.folders.includes(p)) d.folders.push(p)
    },
    removeFolder: (d, path) => {
      if (!Array.isArray(d.folders)) d.folders = []
      d.folders = d.folders.filter(f => f !== path)
    },
    renameFolder: (d, oldPath, newPath) => {
      if (!Array.isArray(d.folders)) d.folders = []
      const oo = oldPath + '/'
      const nn = newPath + '/'
      const next = d.folders.map(f => (f === oldPath ? newPath : (f.startsWith(oo) ? nn + f.slice(oo.length) : f)))
      d.folders = Array.from(new Set(next))
    },
  },
})
