/** In-app directory picker for hosts whose composed directory picker is `browse`. */

import { React, E, ui } from '../platform.ts'
import { cls } from '../core/text.ts'
import { browseFailureText } from '../core/picker.ts'
import { icon } from '../icons.ts'
import { BTN, StyleNode } from './base.ts'

/** One child directory row returned by the host browse backend. */
export interface DirectoryEntry {
  name: string
  path: string
  hidden: boolean
}

/** One ancestor crumb in a listing. */
export interface DirectoryCrumb {
  name: string
  path: string
  hidden?: boolean
}

/** One directory level returned by `uiWorkspace.listDirectory`. */
export interface DirectoryListing {
  path: string
  home: string
  entries: DirectoryEntry[]
  crumbs: DirectoryCrumb[]
  truncated?: boolean
}

interface DirectoryBrowserProps {
  listDirectory: (path?: string, signal?: any) => Promise<DirectoryListing>
  createDirectory?: (path: string, name: string) => Promise<string>
  onPicked: (path: string) => void
  onCancel: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * The add-workspace fallback for a host that serves the in-app `browse`
 * interaction instead of an OS chooser: one directory level at a time, a
 * crumb trail for going back, and an explicit "pick this folder" action.
 * It is deliberately small — the shell's native chooser remains the first
 * choice; this only covers hosts where `directoryPicker.pick` is refused.
 */
export function DirectoryBrowser(props: DirectoryBrowserProps) {
  const { listDirectory, createDirectory, onPicked, onCancel, t } = props
  const [listing, setListing] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [showHidden, setShowHidden] = React.useState(false)
  const [folderDraft, setFolderDraft] = React.useState(null)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState('')
  const requestSeq = React.useRef(0)
  const alive = React.useRef(true)
  // The level the last navigation asked for: a failed jump must retry THAT
  // level, not the still-rendered previous listing.
  const targetPath = React.useRef(undefined)

  const navigate = (path?: string) => {
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    targetPath.current = path
    setLoading(true)
    setError('')
    setFolderDraft(null)
    setCreateError('')
    listDirectory(path).then((next) => {
      if (!alive.current || seq !== requestSeq.current) return
      setListing(next)
      setLoading(false)
    }, (reason) => {
      if (!alive.current || seq !== requestSeq.current) return
      setLoading(false)
      setError(browseFailureText(reason))
    })
  }

  React.useEffect(() => {
    alive.current = true
    navigate(undefined)
    return () => {
      alive.current = false
      requestSeq.current += 1
    }
  }, [])

  const currentPath = listing === null ? '' : listing.path
  const homePath = listing === null ? '' : listing.home
  const crumbs: DirectoryCrumb[] = listing === null || !Array.isArray(listing.crumbs) ? [] : listing.crumbs
  const homeIndex = listing === null ? -1 : crumbs.findIndex((crumb: DirectoryCrumb) => crumb.path === homePath)
  const shownCrumbs: DirectoryCrumb[] = listing === null
    ? []
    : homeIndex === -1
      ? crumbs
      : [{ name: t('browse.home'), path: homePath, hidden: false }, ...crumbs.slice(homeIndex + 1)]
  const entries: DirectoryEntry[] = listing === null || !Array.isArray(listing.entries)
    ? []
    : listing.entries.filter((entry: DirectoryEntry) => showHidden || !entry.hidden)

  const cancelFolder = () => {
    if (creating) return
    setFolderDraft(null)
    setCreateError('')
  }

  const createFolder = () => {
    if (folderDraft === null || listing === null || typeof createDirectory !== 'function' || creating) return
    const name = folderDraft.trim()
    if (name === '') {
      setCreateError(t('browse.folderEmpty'))
      return
    }
    setCreating(true)
    setCreateError('')
    createDirectory(listing.path, name).then((created) => {
      if (!alive.current) return
      setCreating(false)
      setFolderDraft(null)
      navigate(created)
    }, (reason) => {
      if (!alive.current) return
      setCreating(false)
      setCreateError(browseFailureText(reason))
    })
  }

  const body = E('div', { className: 'bw-modal-body bw-browse-body' },
    E('div', { className: 'bw-browse-crumbs', role: 'navigation', 'aria-label': t('browse.title') },
      shownCrumbs.map((crumb: DirectoryCrumb, index: number) => E('span', { key: crumb.path + ':' + index, className: 'bw-browse-crumb-seat' },
        index > 0 ? E('span', { className: 'bw-browse-crumb-sep', 'aria-hidden': true }, '/') : null,
        E('button', {
          type: 'button',
          className: cls('bw-browse-crumb', index === shownCrumbs.length - 1 && 'bw-browse-crumb-current'),
          disabled: loading,
          onClick: () => navigate(crumb.path),
        }, crumb.name),
      )),
    ),
    E('div', { className: 'bw-path-echo', title: currentPath }, currentPath),
    error !== '' ? E('div', { className: 'bw-browse-error', role: 'alert' },
      E('div', { className: 'bw-error-text' }, error),
      E('div', { className: 'bw-browse-error-actions' },
        E(BTN, { variant: 'outline', className: 'bw-btn-sm', onClick: () => navigate(targetPath.current) }, t('browse.retry')),
      ),
    ) : null,
    E('div', { className: 'bw-browse-list', role: 'list' },
      loading ? E('div', { className: 'bw-hint' }, t('browse.loading')) : null,
      !loading && error === '' && entries.length === 0 ? E('div', { className: 'bw-hint' }, t('browse.empty')) : null,
      !loading && error === '' ? entries.map((entry: DirectoryEntry) => E('div', { key: entry.path, className: 'bw-browse-row-seat', role: 'listitem' },
        E('button', {
          type: 'button',
          className: 'bw-picker-row bw-browse-row',
          disabled: loading,
          onClick: () => navigate(entry.path),
        },
          E('span', { className: 'bw-picker-check' }, icon('IconFolderClose16', 14)),
          E('span', { className: 'bw-picker-row-label' }, entry.name),
          E('span', { className: 'bw-browse-row-arrow', 'aria-hidden': true }, icon('IconChevronRightOutline14', 12)),
        ),
      )) : null,
    ),
    listing !== null && listing.truncated === true ? E('div', { className: 'bw-hint' }, t('browse.truncated')) : null,
    E('div', { className: 'bw-browse-tools' },
      typeof createDirectory === 'function'
        ? E(BTN, {
          variant: 'outline',
          className: 'bw-btn-sm',
          disabled: loading || creating,
          onClick: () => { setFolderDraft(''); setCreateError('') },
        }, t('browse.newFolder'))
        : null,
      E('button', {
        type: 'button',
        className: cls('bw-browse-hidden', showHidden && 'bw-browse-hidden-on'),
        'aria-pressed': showHidden,
        onClick: () => setShowHidden((value: boolean) => !value),
      }, t('browse.showHidden')),
      E('span', { className: 'bw-browse-spacer' }),
      E('span', { className: 'bw-hint' }, t('browse.pickHint')),
    ),
    folderDraft !== null ? E('div', { className: 'bw-browse-new' },
      E('input', {
        className: 'bw-input',
        value: folderDraft,
        autoFocus: true,
        placeholder: t('browse.folderName'),
        disabled: creating,
        onChange: (event: any) => { setFolderDraft(event.target.value); setCreateError('') },
        onKeyDown: (event: any) => {
          if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); createFolder() }
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelFolder() }
        },
      }),
      E(BTN, { variant: 'primary', className: 'bw-btn-sm', disabled: creating || folderDraft.trim() === '', onClick: createFolder }, creating ? t('browse.creating') : t('browse.create')),
      E(BTN, { variant: 'outline', className: 'bw-btn-sm', disabled: creating, onClick: cancelFolder }, t('cancel')),
    ) : null,
    createError !== '' ? E('div', { className: 'bw-browse-error', role: 'alert' }, E('div', { className: 'bw-error-text' }, createError)) : null,
  )

  const footer = E('div', { className: 'bw-modal-actions' },
    E(BTN, { variant: 'outline', onClick: onCancel, disabled: creating }, t('cancel')),
    E(BTN, {
      variant: 'primary',
      onClick: () => { if (currentPath !== '') onPicked(currentPath) },
      disabled: loading || creating || error !== '' || currentPath === '',
    }, t('browse.open')),
  )

  return E(ui.Modal, {
    open: true,
    onClose: () => { if (!creating) onCancel() },
    closeLabel: t('close'),
    title: t('browse.title'),
    footer,
  }, body, StyleNode())
}
