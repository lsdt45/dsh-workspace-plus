/** Host-half calls made from the browser: the plugin-owned delete route, directory open, clipboard. */

/** The host delete route's success envelope. */
export interface DeleteSessionResult {
  ok: true
  removed: true
  detached: boolean
  warnings: string[]
  [key: string]: unknown
}

/** The host route's error envelope (the client lifts `detail`/`phase` into messages). */
interface HostErrorEnvelope {
  error?: string
  detail?: string
  phase?: string | null
  [key: string]: unknown
}

export const messageOf = (reason: unknown): string => (reason instanceof Error ? reason.message : String(reason))

    // DSH exposes archive, but no permanent-delete RPC: this plugin's own host
    // half owns the delete route (stop the agent, detach the live session, then
    // remove only a verified session directory). No third-party plugin needed.
export const SESSION_DELETE_ROUTE = '/dsh-workspace-plus/delete-session'

export const checkSessionDelete = async (): Promise<boolean> => {
  const response = await fetch(SESSION_DELETE_ROUTE, { method: 'GET' })
  if (response.status !== 405) return false
  const result = await response.json() as HostErrorEnvelope
  return result.error === 'method-not-allowed'
}

export const deleteSessionRecord = async (sessionId: string): Promise<DeleteSessionResult> => {
  const response = await fetch(SESSION_DELETE_ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  // The host reports the failing step (phase) and the reason (detail);
  // surface those instead of a bare status code.
  const result = await response.json().catch(() => null) as (HostErrorEnvelope & Partial<DeleteSessionResult>) | null
  if (!response.ok) {
    throw new Error((result && (result.detail || result.error)) || ('HTTP ' + response.status))
  }
  if (!result || result.ok !== true || result.removed !== true) {
    throw new Error((result && (result.detail || result.error)) || 'not-confirmed')
  }
  return result as DeleteSessionResult
}

export const writeClipboardText = async (
  text: string,
  writeClipboard?: ((value: string) => unknown) | null,
): Promise<unknown> => {
  // ui.writeClipboard is injected (the host primitives are entry-owned), so a
  // profile without it still falls back to the browser clipboard API.
  if (typeof writeClipboard === 'function') return writeClipboard(text)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text)
    return true
  }
  return false
}

export const openSessionDirectory = async (path: string): Promise<void> => {
  const response = await fetch('/api/session/openWorkspacePath', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: crypto.randomUUID(), method: 'session/openWorkspacePath', payload: { args: { request: { path } } } }),
  })
  if (!response.ok) throw new Error('Open directory failed (HTTP ' + response.status + ')')
  const envelope = await response.json() as { result?: { ok?: boolean; value?: { opened?: boolean }; error?: { message?: string } | string } }
  const result = envelope.result
  if (!result || result.ok !== true || !result.value || result.value.opened !== true) {
    throw new Error(result && result.error ? ((typeof result.error === 'object' ? result.error.message : result.error) || messageOf(result.error)) : 'Open directory was not confirmed')
  }
}
