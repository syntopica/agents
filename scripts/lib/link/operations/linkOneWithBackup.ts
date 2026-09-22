import { promises as fs } from 'node:fs'
import { ensureParentDirectory } from './ensureParentDirectory'

export const linkOneWithBackup = async ({
  source,
  target,
}: {
  source: string
  target: string
}) => {
  await ensureParentDirectory(target)
  await fs.access(source)

  const existing = await fs.lstat(target).catch(() => null)

  let backupPath: string | null = null
  if (existing && !existing.isSymbolicLink()) {
    backupPath = `${target}.bak`
    await fs.rm(backupPath, { recursive: true, force: true })
    await fs.rename(target, backupPath)
  } else {
    await fs.rm(target, { recursive: true, force: true })
  }

  await fs.symlink(source, target)

  return {
    target,
    source,
    status: 'linked',
    backupPath,
  }
}
