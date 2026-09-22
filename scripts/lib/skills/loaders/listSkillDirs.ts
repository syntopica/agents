import path from 'node:path'
import { listFilesRecursive } from '../../fs/operations/listFilesRecursive'

export const listSkillDirs = async (baseDir: string) => {
  const files = await listFilesRecursive(baseDir)
  const dirs = new Set<string>()

  for (const file of files) {
    if (path.basename(file) === 'SKILL.md') {
      dirs.add(path.dirname(file))
    }
  }

  return Array.from(dirs).sort((a: string, b: string) => a.localeCompare(b))
}
