/** Persisted view store (folders, sections, prefs, styling, pins). Hydration replaces state wholesale, so every action tolerates missing keys. */

import { storeKit } from './platform.ts'
import { normPath } from './core/text.ts'
import { VIEW_MODES, ARCHIVED_FILTERS } from './core/view.ts'
import type { ArchivedFilter, SortOrder, TimeDirection, ViewMode } from './core/view.ts'

/** A user-created workspace group / session section. */
export interface WorkspaceGroup {
  id: string
  name: string
}

/**
 * A stored custom style: the dialog's committed object shape, or a legacy plain
 * colour string from pre-0.9 state (the row renderer tolerates both).
 */
export interface StoredStyling {
  color?: string
  glow?: number
  weight?: string
  shadow?: string
  icon?: string
  [key: string]: unknown
}

/** Persisted on/off and view preferences (unknown keys from older versions tolerated). */
export interface ViewPrefs {
  showTabs?: boolean
  statusDots?: boolean
  compactChains?: boolean
  statusPulse?: boolean
  viewMode?: ViewMode | string
  timeDirection?: TimeDirection | string
  sortOrder?: SortOrder | string
  archivedFilter?: ArchivedFilter | string
  [key: string]: unknown
}

/** The whole persisted view state (every key optional: hydration replaces it wholesale). */
export interface ViewState {
  folders?: string[]
  workspaceGroups?: WorkspaceGroup[]
  workspaceGroupById?: Record<string, string>
  sessionSectionById?: Record<string, string>
  expanded?: Record<string, boolean>
  sessionsExpanded?: Record<string, boolean>
  sessionGroups?: Record<string, boolean>
  prefs?: ViewPrefs
  styling?: Record<string, StoredStyling | string | null>
  pinned?: string[]
}

/** The store handle the shell's store kit returns; `actions` are the names below. */
export interface ViewStore {
  useStore: <T>(selector: (state: ViewState) => T) => T
  actions: Record<string, (...args: any[]) => any>
}

export const createViewStore = (): ViewStore => storeKit.defineStore({
  init: (): ViewState => ({ folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {}, expanded: {}, sessionsExpanded: {}, sessionGroups: {}, prefs: { showTabs: true, newTabOnClick: true, statusDots: true, compactChains: true, viewMode: 'projects', timeDirection: 'latest', sortOrder: 'manual', archivedFilter: 'hide' }, styling: {}, pinned: [] }),
  // NOTE: hydration REPLACES the state with the persisted whole value —
  // init defaults never merge. Every action must tolerate a missing key
  // (states persisted by older plugin versions lack sessionGroups), and
  // every selector read takes a fallback.
  persist: 'dsh.betterWorkspace.view.v1',
  actions: {
    setExpanded: (d: ViewState, key: string, value: boolean) => { if (!d.expanded) d.expanded = {}; d.expanded[key] = value },
    setSessionsExpanded: (d: ViewState, key: string, value: boolean) => { if (!d.sessionsExpanded) d.sessionsExpanded = {}; d.sessionsExpanded[key] = value },
    setSessionGroupExpanded: (d: ViewState, key: string, value: boolean) => { if (!d.sessionGroups) d.sessionGroups = {}; d.sessionGroups[key] = value },
    setPref: (d: ViewState, key: string, value: unknown) => { if (!d.prefs) d.prefs = {}; d.prefs[key] = value },
    setStyling: (d: ViewState, key: string, value: StoredStyling | string | null) => {
      if (!d.styling) d.styling = {}
      if (value === null) delete d.styling[key]
      else d.styling[key] = value
    },
    createWorkspaceGroup: (d: ViewState, id: string, name: string, workspaceId?: string) => {
      if (!Array.isArray(d.workspaceGroups)) d.workspaceGroups = []
      if (d.workspaceGroups.some(group => group.id === id)) return
      d.workspaceGroups.push({ id, name })
      if (workspaceId) {
        if (!d.workspaceGroupById) d.workspaceGroupById = {}
        d.workspaceGroupById[workspaceId] = id
      }
    },
    assignWorkspaceGroup: (d: ViewState, workspaceId: string, groupId: string | null) => {
      if (groupId && !(d.workspaceGroups || []).some(group => group.id === groupId)) return
      if (!d.workspaceGroupById) d.workspaceGroupById = {}
      if (groupId) d.workspaceGroupById[workspaceId] = groupId
      else delete d.workspaceGroupById[workspaceId]
    },
    assignSessionSection: (d: ViewState, sessionId: string, groupId: string | null) => {
      if (groupId && !(d.workspaceGroups || []).some(group => group.id === groupId)) return
      if (!d.sessionSectionById) d.sessionSectionById = {}
      if (groupId === null) delete d.sessionSectionById[sessionId]
      else d.sessionSectionById[sessionId] = groupId
    },
    renameWorkspaceGroup: (d: ViewState, id: string, name: string) => {
      const group = (d.workspaceGroups || []).find(group => group.id === id)
      if (group) group.name = name
    },
    deleteWorkspaceGroup: (d: ViewState, id: string) => {
      d.workspaceGroups = (d.workspaceGroups || []).filter(group => group.id !== id)
      for (const [workspaceId, groupId] of Object.entries(d.workspaceGroupById || {})) {
        if (groupId === id) delete d.workspaceGroupById![workspaceId]
      }
      for (const [sessionId, groupId] of Object.entries(d.sessionSectionById || {})) {
        if (groupId === id) delete d.sessionSectionById![sessionId]
      }
      if (d.expanded) delete d.expanded['workspace-group:' + id]
    },
    setViewMode: (d: ViewState, mode: ViewMode | string) => {
      if (!d.prefs) d.prefs = {}
      d.prefs.viewMode = (VIEW_MODES as readonly string[]).includes(mode) ? mode : 'projects'
    },
    setTimeDirection: (d: ViewState, dir: TimeDirection | string) => {
      if (!d.prefs) d.prefs = {}
      d.prefs.timeDirection = dir === 'oldest' ? 'oldest' : 'latest'
    },
    setSortOrder: (d: ViewState, order: SortOrder | string) => {
      if (!d.prefs) d.prefs = {}
      d.prefs.sortOrder = order === 'latest' ? 'latest' : 'manual'
    },
    setArchivedFilter: (d: ViewState, filter: ArchivedFilter | string) => {
      if (!d.prefs) d.prefs = {}
      d.prefs.archivedFilter = (ARCHIVED_FILTERS as readonly string[]).includes(filter) ? filter : 'hide'
    },
    // Pin order IS the visual order: most recent unshift first. Removing
    // keeps the rest of the order intact. Session ids are stable host ids.
    togglePin: (d: ViewState, id: string) => {
      if (!Array.isArray(d.pinned)) d.pinned = []
      const key = String(id)
      if (d.pinned.includes(key)) d.pinned = d.pinned.filter(p => p !== key)
      else d.pinned = [key].concat(d.pinned)
    },
    addFolder: (d: ViewState, path: string) => {
      if (!Array.isArray(d.folders)) d.folders = []
      const p = normPath(path)
      if (p !== '' && !d.folders.includes(p)) d.folders.push(p)
    },
    removeFolder: (d: ViewState, path: string) => {
      if (!Array.isArray(d.folders)) d.folders = []
      d.folders = d.folders.filter(f => f !== path)
    },
    renameFolder: (d: ViewState, oldPath: string, newPath: string) => {
      if (!Array.isArray(d.folders)) d.folders = []
      const oo = oldPath + '/'
      const nn = newPath + '/'
      const next = d.folders.map(f => (f === oldPath ? newPath : (f.startsWith(oo) ? nn + f.slice(oo.length) : f)))
      d.folders = Array.from(new Set(next))
    },
  },
}) as ViewStore
