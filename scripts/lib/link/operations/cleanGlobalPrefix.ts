import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathExists } from './pathExists'
import { removeSkillEntry } from './removeSkillEntry'

export const cleanGlobalPrefix = async (targetDir: string, prefix: string) => {
  // An empty prefix would match every entry and wipe foreign skills
  // installed by other tools into the same directory.
  if (prefix === '') {
    return []
  }

  const exists = await pathExists(targetDir)
  if (!exists) {
    return []
  }

  const targetStat = await fs.lstat(targetDir)
  if (targetStat.isSymbolicLink()) {
    try {
      await fs.realpath(targetDir)
    } catch {
      await fs.unlink(targetDir)
      return []
    }
  }

  if (!targetStat.isDirectory()) {
    return []
  }

  let entries
  try {
    entries = await fs.readdir(targetDir)
  } catch (error: unknown) {
    const err = error as { code?: string } | null

    if (err?.code === 'ENOENT' || err?.code === 'ENOTDIR') {
      return []
    }
    throw error
  }
  const removed = []

  for (const entry of entries) {
    if (!entry.startsWith(prefix)) {
      continue
    }

    await removeSkillEntry(path.join(targetDir, entry))
    removed.push(entry)
  }

  return removed
}
