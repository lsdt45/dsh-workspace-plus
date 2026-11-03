/**
 * React binding for the git branch cache (see git-branch.ts).
 *
 * Kept to useState/useEffect on purpose: the render smoke test stubs the React
 * namespace with exactly useState/useRef/useEffect/useLayoutEffect, and a row
 * must render there. The hook reads the cache during render (a pure map lookup)
 * and asks for the directory's branch from an effect — never while rendering.
 */

import { React } from '../platform.ts'
import { branchCache } from '../git-branch.ts'

/**
 * Current git branch of one project directory, '' while unknown (or when the
 * directory is not a git work tree / the host route is unavailable).
 *
 * @param cwd - absolute project directory, or null/undefined when the caller has
 * none (a row without a tooltip passes null so it neither subscribes nor asks).
 */
export function useGitBranch(cwd: string | null | undefined): string {
  const path = typeof cwd === 'string' ? cwd.trim() : ''
  const [branch, setBranch] = React.useState(() => (path === '' ? '' : branchCache.branchOf(path)))
  React.useEffect(() => {
    if (path === '') {
      setBranch((previous: string) => (previous === '' ? previous : ''))
      return undefined
    }
    const read = () => {
      const next = branchCache.branchOf(path)
      setBranch((previous: string) => (previous === next ? previous : next))
    }
    // Adopt an answer the cache already has (another row fetched it) before the
    // subscription starts, so the first paint of a new subscriber is current.
    read()
    const unsubscribe = branchCache.subscribe(read)
    // A bubble may open before this directory was ever asked about; the cache
    // batches and throttles the request itself.
    branchCache.ensure([path])
    return unsubscribe
  }, [path])
  return branch
}
