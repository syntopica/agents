import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listSkillBundles = async (libraryDir: string) => {
  try {
    const entries = await fs.readdir(join(libraryDir, 'skills'), {
      withFileTypes: true,
    })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}
