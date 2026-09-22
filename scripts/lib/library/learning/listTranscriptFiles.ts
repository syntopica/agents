import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listTranscriptFiles = async (root: string) => {
  const files: string[] = []

  let entries: string[]
  try {
    entries = await fs.readdir(root)
  } catch {
    return files
  }

  for (const entry of entries) {
    const dir = join(root, entry)
    let inner: string[]
    try {
      inner = await fs.readdir(dir)
    } catch {
      continue
    }

    for (const name of inner) {
      if (name.endsWith('.jsonl')) {
        files.push(join(dir, name))
      }
    }
  }

  return files
}
