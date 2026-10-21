import { existsSync } from 'node:fs'
import path from 'node:path'
import { findCodexHookRegistrationIssues } from './findCodexHookRegistrationIssues'
import { readCodexHooksSnapshot } from './readCodexHooksSnapshot'

export const inspectInstalledCodexHooks = async (
  codexHome: string,
  hooksDirectory: string,
  cwd: string,
): Promise<string[]> => {
  if (!existsSync(path.join(codexHome, 'config.toml'))) return []
  const snapshot = await readCodexHooksSnapshot(cwd)
  return findCodexHookRegistrationIssues(snapshot, cwd, hooksDirectory)
}
