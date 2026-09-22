import { constants } from 'node:fs'
import { chmod, copyFile, mkdir, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { hashFile } from './hashFile'
import { isCodexActive } from './isCodexActive'
import { pathExists } from './pathExists'
import { readSessionArchiveManifest } from './readSessionArchiveManifest'
import type { RestoreSessionArchiveOptions } from './types/RestoreSessionArchiveOptions'
import type { SessionArchiveResult } from './types/SessionArchiveResult'
import { verifySessionArchive } from './verifySessionArchive'

export const restoreSessionArchive = async (
  options: RestoreSessionArchiveOptions,
): Promise<SessionArchiveResult> => {
  const activity = await isCodexActive(
    dirname(options.sessionsDir),
    options.processTable,
  )
  if (activity.active) {
    return {
      status: 'blocked',
      runDir: options.runDir,
      entries: [],
      reasons: activity.reasons,
    }
  }
  const manifest = await readSessionArchiveManifest(options.runDir)
  if (manifest === undefined) {
    return {
      status: 'invalid',
      runDir: options.runDir,
      entries: [],
      reasons: ['archive manifest is missing or invalid'],
    }
  }
  const collisions = []
  for (const entry of manifest.entries) {
    if (await pathExists(join(options.sessionsDir, entry.relativePath))) {
      collisions.push(`restore destination exists: ${entry.relativePath}`)
    }
  }
  if (collisions.length > 0) {
    return {
      status: 'collision',
      runDir: options.runDir,
      entries: [],
      reasons: collisions,
    }
  }
  const verificationErrors = await verifySessionArchive(
    options.runDir,
    manifest,
  )
  if (verificationErrors.length > 0) {
    return {
      status: 'invalid',
      runDir: options.runDir,
      entries: [],
      reasons: verificationErrors,
    }
  }
  if (options.dryRun) {
    return {
      status: 'planned',
      runDir: options.runDir,
      entries: manifest.entries,
      reasons: [],
    }
  }

  for (const entry of manifest.entries) {
    const sourcePath = join(options.runDir, entry.relativePath)
    const destinationPath = join(options.sessionsDir, entry.relativePath)
    await mkdir(dirname(destinationPath), { recursive: true })
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL)
    await chmod(destinationPath, entry.mode)
    if ((await hashFile(destinationPath)) !== entry.sha256) {
      throw new Error(`restore copy verification failed: ${entry.relativePath}`)
    }
    await unlink(sourcePath)
  }
  return {
    status: 'restored',
    runDir: options.runDir,
    entries: manifest.entries,
    reasons: [],
  }
}
