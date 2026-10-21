import { findCodexHookRegistrationIssues } from '../lib/hooks/findCodexHookRegistrationIssues'
import { readCodexHooksSnapshot } from '../lib/hooks/readCodexHooksSnapshot'
import { CANONICAL_HOOKS_DIR } from '../lib/link/constants/CANONICAL_HOOKS_DIR'

export const main = async () => {
  const cwd = process.cwd()
  const snapshot = await readCodexHooksSnapshot(cwd)
  const issues = findCodexHookRegistrationIssues(
    snapshot,
    cwd,
    CANONICAL_HOOKS_DIR,
  )
  console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2))
  if (issues.length > 0) process.exitCode = 1
}
