import { mkdir, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join, normalize, relative, sep } from 'node:path'
import { hashFile } from './hashFile'
import { moveFileToQuarantine } from './moveFileToQuarantine'
import { pathExists } from './pathExists'
import type { QuarantineEntry } from './types/QuarantineEntry'
import type { QuarantineFileOptions } from './types/QuarantineFileOptions'

export const quarantineFile = async (
  options: QuarantineFileOptions,
): Promise<QuarantineEntry> => {
  const originalRelativePath = normalize(
    relative(options.codexDir, options.sourcePath),
  )
  if (
    isAbsolute(originalRelativePath) ||
    originalRelativePath === '..' ||
    originalRelativePath.startsWith(`..${sep}`)
  ) {
    throw new Error('quarantine source is outside the Codex directory')
  }
  const destinationRelativePath = join('quarantine', originalRelativePath)
  const destinationPath = join(options.snapshotDir, destinationRelativePath)
  if (await pathExists(destinationPath)) {
    throw new Error(
      `quarantine destination already exists: ${destinationRelativePath}`,
    )
  }

  const sourceStat = await stat(options.sourcePath)
  const sourceHash = await hashFile(options.sourcePath)
  await mkdir(dirname(destinationPath), { recursive: true, mode: 0o700 })
  await moveFileToQuarantine(options.sourcePath, destinationPath, sourceHash)
  if ((await hashFile(destinationPath)) !== sourceHash) {
    throw new Error(
      `quarantine move verification failed: ${originalRelativePath}`,
    )
  }
  return {
    originalRelativePath,
    destinationRelativePath,
    bytes: sourceStat.size,
    sha256: sourceHash,
    mode: sourceStat.mode & 0o777,
  }
}
