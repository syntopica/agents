import { promises as fs } from 'node:fs'

export const removeSkillEntry = async (fullPath: string): Promise<void> => {
  const stat = await fs.lstat(fullPath)

  if (stat.isSymbolicLink()) {
    await fs.unlink(fullPath)
  } else if (stat.isDirectory()) {
    await fs.rm(fullPath, { recursive: true, force: true })
  } else {
    await fs.unlink(fullPath)
  }
}
