import { promises as fs } from 'node:fs'
import path from 'node:path'

export const ensureParentDirectory = async (targetPath: string) => {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
}
