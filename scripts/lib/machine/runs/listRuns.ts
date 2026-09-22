import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listRuns = async (rootDir: string) => {
  let names: string[]
  try {
    names = await fs.readdir(rootDir)
  } catch {
    return []
  }

  const runs: { runId: string; complete: boolean }[] = []

  for (const runId of names.toSorted((left, right) =>
    left.localeCompare(right),
  )) {
    const complete = await fs
      .access(join(rootDir, runId, 'complete'))
      .then(() => true)
      .catch(() => false)

    runs.push({ runId, complete })
  }

  return runs
}
