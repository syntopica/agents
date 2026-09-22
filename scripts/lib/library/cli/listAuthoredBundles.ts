import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listAuthoredBundles = async (libraryDir: string) => {
  const authored: string[] = []

  for (const name of ['core', 'orchestrator']) {
    try {
      await fs.access(join(libraryDir, 'skills', name))
      authored.push(name)
    } catch {
      continue
    }
  }

  return authored
}
