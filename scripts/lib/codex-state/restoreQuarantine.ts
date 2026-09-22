import { constants } from 'node:fs'
import { chmod, copyFile, mkdir, stat, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { hashFile } from './hashFile'
import { isCodexActive } from './isCodexActive'
import { pathExists } from './pathExists'
import { readValidQuarantineManifest } from './readValidQuarantineManifest'
import type { QuarantineRestoreResult } from './types/QuarantineRestoreResult'
import type { RestoreQuarantineOptions } from './types/RestoreQuarantineOptions'

export const restoreQuarantine = async (
  options: RestoreQuarantineOptions,
): Promise<QuarantineRestoreResult> => {
  const activity = await isCodexActive(options.codexDir, options.processTable)
  if (activity.active)
    return { status: 'blocked', entries: [], reasons: activity.reasons }
  const manifest = await readValidQuarantineManifest(options.snapshotDir)
  if (manifest === undefined) {
    return {
      status: 'invalid',
      entries: [],
      reasons: ['quarantine manifest is invalid'],
    }
  }
  const collisions: string[] = []
  const verificationErrors: string[] = []
  for (const entry of manifest.entries) {
    const sourcePath = join(options.snapshotDir, entry.destinationRelativePath)
    const destinationPath = join(options.codexDir, entry.originalRelativePath)
    if (await pathExists(destinationPath)) {
      collisions.push(
        `restore destination exists: ${entry.originalRelativePath}`,
      )
    }
    try {
      const sourceStat = await stat(sourcePath)
      if (
        sourceStat.size !== entry.bytes ||
        (await hashFile(sourcePath)) !== entry.sha256
      ) {
        verificationErrors.push(
          `quarantine verification failed: ${entry.destinationRelativePath}`,
        )
      }
    } catch {
      verificationErrors.push(
        `quarantine file is missing: ${entry.destinationRelativePath}`,
      )
    }
  }
  if (collisions.length > 0)
    return { status: 'collision', entries: [], reasons: collisions }
  if (verificationErrors.length > 0) {
    return { status: 'invalid', entries: [], reasons: verificationErrors }
  }
  if (options.dryRun)
    return { status: 'planned', entries: manifest.entries, reasons: [] }

  for (const entry of manifest.entries) {
    const sourcePath = join(options.snapshotDir, entry.destinationRelativePath)
    const destinationPath = join(options.codexDir, entry.originalRelativePath)
    await mkdir(dirname(destinationPath), { recursive: true })
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL)
    await chmod(destinationPath, entry.mode)
    if ((await hashFile(destinationPath)) !== entry.sha256) {
      throw new Error(
        `restored quarantine hash mismatch: ${entry.originalRelativePath}`,
      )
    }
    await unlink(sourcePath)
  }
  return { status: 'restored', entries: manifest.entries, reasons: [] }
}
