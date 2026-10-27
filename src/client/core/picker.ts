/** Pure probes for the host directory-picker capability behind the add-workspace flow. */

/**
 * Whether a native directory-pick rejection says the host only serves the
 * in-app `browse` interaction.
 *
 * DSH's directory-picker seam refuses a verb its composition cannot serve and
 * reports the served kind in a stable wire message:
 * `directoryPicker.pick needs the native capability; the composed picker serves "browse"`.
 * `uiWorkspace.pickDirectory()` wraps that message in a plain Error, so the
 * flow matches the two stable fragments rather than probing every host version
 * for a capability API the wire does not expose yet.
 */
export const isBrowseOnlyPicker = (reason: unknown): boolean => {
  const message = reason instanceof Error ? reason.message : String(reason)
  return /needs the native capability/i.test(message) && /serves\s+["']?browse["']?/i.test(message)
}

/**
 * Operator-facing text for a browse primitive failure. The workspace client
 * throws `DirectoryBrowseError`, whose `rpcError.message` is the Host's
 * business message; anything else falls back to the error's own message.
 */
export const browseFailureText = (reason: unknown): string => {
  if (reason !== null && typeof reason === 'object' && 'rpcError' in reason) {
    const rpcError = (reason as { rpcError?: unknown }).rpcError
    if (rpcError !== null && typeof rpcError === 'object' && 'message' in rpcError) {
      const message = (rpcError as { message?: unknown }).message
      if (typeof message === 'string' && message !== '') return message
    }
  }
  return reason instanceof Error ? reason.message : String(reason)
}
