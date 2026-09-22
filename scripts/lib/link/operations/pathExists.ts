import { promises as fs } from 'node:fs'

export const pathExists = async (targetPath: string) => {
  try {
    await fs.lstat(targetPath)
    return true
  } catch {
    return false
  }
}
