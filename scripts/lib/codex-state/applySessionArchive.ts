import { constants } from 'node:fs'
import { chmod, copyFile, mkdir, stat, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { hashFile } from './hashFile'
import { isCodexActive } from './isCodexActive'
import { pathExists } from './pathExists'
import type { ArchivePlan } from './types/ArchivePlan'
import type { SessionArchiveManifest } from './types/SessionArchiveManifest'
import type { SessionArchiveManifestEntry } from './types/SessionArchiveManifestEntry'
import type { SessionArchiveResult } from './types/SessionArchiveResult'
import { writeSessionArchiveManifest } from './writeSessionArchiveManifest'

export const applySessionArchive = async (
  plan: ArchivePlan,
  archiveRoot: string,
  runId: string,
  processTable?: string,
): Promise<SessionArchiveResult> => {
  const runDir = join(archiveRoot, runId)
  const activity = await isCodexActive(dirname(plan.sessionsDir), processTable)
  if (activity.active) {
    return { status: 'blocked', runDir, entries: [], reasons: activity.reasons }
  }
  await mkdir(archiveRoot, { recursive: true, mode: 0o700 })
  await mkdir(runDir, { mode: 0o700 })
  const manifest: SessionArchiveManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    entries: [],
  }
  await writeSessionArchiveManifest(runDir, manifest)

  for (const planned of plan.entries) {
    const destinationPath = join(runDir, planned.relativePath)
    if (await pathExists(destinationPath)) {
      return {
        status: 'collision',
        runDir,
        entries: manifest.entries,
        reasons: [`archive destination exists: ${planned.relativePath}`],
      }
    }
    const sourceStat = await stat(planned.sourcePath)
    if (sourceStat.size !== planned.bytes) {
      throw new Error(
        `session changed after archive planning: ${planned.relativePath}`,
      )
    }
    const sourceHash = await hashFile(planned.sourcePath)
    await mkdir(dirname(destinationPath), { recursive: true, mode: 0o700 })
    await copyFile(planned.sourcePath, destinationPath, constants.COPYFILE_EXCL)
    if ((await hashFile(destinationPath)) !== sourceHash) {
      throw new Error(
        `archive copy verification failed: ${planned.relativePath}`,
      )
    }
    await chmod(destinationPath, sourceStat.mode & 0o777)
    const entry: SessionArchiveManifestEntry = {
      relativePath: planned.relativePath,
      bytes: sourceStat.size,
      sha256: sourceHash,
      mode: sourceStat.mode & 0o777,
    }
    manifest.entries.push(entry)
    await writeSessionArchiveManifest(runDir, manifest)
    await unlink(planned.sourcePath)
  }
  return { status: 'archived', runDir, entries: manifest.entries, reasons: [] }
}
