import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const findExistingPath = async (
  candidate: string,
  home: string,
): Promise<string | undefined> => {
  let resolved = candidate
  if (candidate === '$HOME') resolved = home
  else if (candidate.startsWith('$HOME/'))
    resolved = join(home, candidate.slice(6))
  const exists = await fs
    .access(resolved)
    .then(() => true)
    .catch(() => false)

  return exists ? resolved : undefined
}
