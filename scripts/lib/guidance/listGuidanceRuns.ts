import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const listGuidanceRuns = async (runsDir: string): Promise<string[]> => {
  try {
    const entries = await readdir(runsDir, { withFileTypes: true })
    const complete: string[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      try {
        await access(join(runsDir, entry.name, 'complete'))
        complete.push(entry.name)
      } catch {
        /* Incomplete runs are not rollback candidates. */
      }
    }
    return complete.toSorted((left, right) => left.localeCompare(right))
  } catch {
    return []
  }
}
