import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { LockEntry } from '../types/LockEntry'

export const readSkillLock = async (
  libraryDir: string,
): Promise<Record<string, LockEntry>> => {
  try {
    const contents = await fs.readFile(
      join(libraryDir, '.skill-lock.json'),
      'utf8',
    )
    const parsed = JSON.parse(contents) as {
      skills?: Record<string, LockEntry>
    }
    return parsed.skills ?? {}
  } catch {
    return {}
  }
}
