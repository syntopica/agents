import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { sha256Text } from './sha256Text'

export const createGuidanceSnapshot = async (options: {
  snapshotDir: string
  targets: Record<string, string>
}): Promise<void> => {
  const syncPath = async (path: string): Promise<void> => {
    const handle = await open(path, 'r')
    try {
      await handle.sync()
    } finally {
      await handle.close()
    }
  }
  await mkdir(join(options.snapshotDir, 'files'), {
    recursive: true,
    mode: 0o700,
  })
  const entries: {
    key: string
    target: string
    existed: boolean
    storage: string
    sha256?: string
    mode?: number
  }[] = []
  for (const [index, [key, target]] of Object.entries(
    options.targets,
  ).entries()) {
    const storage = `${String(index)}.md`
    try {
      const info = await lstat(target)
      if (!info.isFile())
        throw new Error(
          `refusing to snapshot non-regular guidance target: ${target}`,
        )
      const contents = await readFile(target)
      await writeFile(join(options.snapshotDir, 'files', storage), contents, {
        mode: 0o600,
        flag: 'wx',
      })
      await syncPath(join(options.snapshotDir, 'files', storage))
      await chmod(join(options.snapshotDir, 'files', storage), 0o400)
      entries.push({
        key,
        target,
        existed: true,
        storage,
        sha256: sha256Text(contents.toString('utf8')),
        mode: info.mode & 0o777,
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        entries.push({ key, target, existed: false, storage })
      else throw error
    }
  }
  await writeFile(
    join(options.snapshotDir, 'manifest.json'),
    `${JSON.stringify({ version: 1, entries }, null, 2)}\n`,
    { mode: 0o600, flag: 'wx' },
  )
  await syncPath(join(options.snapshotDir, 'manifest.json'))
  await syncPath(join(options.snapshotDir, 'files'))
  await syncPath(options.snapshotDir)
  await syncPath(dirname(options.snapshotDir))
  await chmod(join(options.snapshotDir, 'manifest.json'), 0o400)
}
