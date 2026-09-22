import { promises as fs } from 'node:fs'

export const ensureDir = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true })
}
