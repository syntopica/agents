import { promises as fs } from 'node:fs'
import path from 'node:path'

export const copyDirRecursive = async (src: string, dest: string) => {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath)
      continue
    }

    await fs.copyFile(srcPath, destPath)
  }
}
