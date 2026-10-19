import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { CurationEntry } from './types/CurationEntry'

/**
 * Whether an entry is already installed in the destination under its alias
 * for the target, by its skill source (`skills.json` bootstrap). Such an entry
 * must not be linked a second time under its prefixed curation key: on
 * 2026-10-19 Claude listed every adopted Superpowers skill twice, as
 * `brainstorming` and `superpowers:brainstorming`. Alias metadata alone does
 * not prove the install, so the destination is checked.
 */
export const isInstalledUnderAlias = async (
  entry: CurationEntry | undefined,
  target: string,
  linkDir: string,
): Promise<boolean> => {
  const alias = entry?.aliases?.[target]
  if (alias === undefined) return false
  return access(join(linkDir, alias))
    .then(() => true)
    .catch(() => false)
}
