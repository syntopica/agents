import { promises as fs } from 'node:fs'
import { join, relative } from 'node:path'

export const listRulePaths = async (rulesRoot: string) => {
  const paths: string[] = []

  const walk = async (dir: string, depth: number) => {
    if (depth > 4) {
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

      if (entry.name.endsWith('.mdc') || entry.name.endsWith('.md')) {
        paths.push(relative(rulesRoot, path))
      }
    }
  }

  await walk(rulesRoot, 0)

  return paths.toSorted((left, right) => left.localeCompare(right))
}
