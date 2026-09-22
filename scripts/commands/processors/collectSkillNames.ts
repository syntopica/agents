import path from 'node:path'
import { listFilesRecursive } from '../../lib/fs/operations/listFilesRecursive'

export const collectSkillNames = async (baseDir: string): Promise<string[]> => {
  const allFiles = await listFilesRecursive(baseDir)
  const skillDirsSet = new Set<string>()
  for (const file of allFiles) {
    if (file.endsWith('SKILL.md')) {
      skillDirsSet.add(path.dirname(file))
    }
  }
  return Array.from(skillDirsSet).map((dir) => path.relative(baseDir, dir))
}
