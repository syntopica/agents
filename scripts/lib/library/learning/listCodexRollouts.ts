import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listCodexRollouts = async (root: string) => {
  const files: string[] = []

  const walk = async (dir: string, depth: number) => {
    if (depth > 5) {
      return
    }

    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const path = join(dir, entry.name)

      if (entry.isDirectory()) {
        await walk(path, depth + 1)
        continue
      }

      if (entry.name.endsWith('.jsonl')) {
        files.push(path)
      }
    }
  }

  await walk(root, 0)

  return files
}
