import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import type { SnapshotEntry } from './SnapshotEntry'

export const restoreSnapshot = async ({ runDir }: { runDir: string }) => {
  const raw = await fs.readFile(join(runDir, 'manifest.json'), 'utf8')
  const entries = JSON.parse(raw) as SnapshotEntry[]
  const restored: string[] = []

  for (const entry of entries) {
    if (entry.existed) {
      await fs.rm(entry.path, { recursive: true, force: true })
      await fs.mkdir(dirname(entry.path), { recursive: true })
      if (entry.kind === 'directory') {
        await fs.cp(join(runDir, 'files', entry.encoded), entry.path, {
          recursive: true,
        })
      } else if (entry.kind === 'symlink') {
        await fs.symlink(
          await fs.readFile(join(runDir, 'files', entry.encoded), 'utf8'),
          entry.path,
        )
      } else {
        const contents = await fs.readFile(join(runDir, 'files', entry.encoded))
        await fs.writeFile(entry.path, contents)
      }
    } else {
      await fs.rm(entry.path, { recursive: true, force: true })
    }

    restored.push(entry.path)
  }

  return restored
}
