import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { hashFile } from './hashFile'
import type { SessionArchiveManifest } from './types/SessionArchiveManifest'

export const verifySessionArchive = async (
  runDir: string,
  manifest: SessionArchiveManifest,
): Promise<string[]> => {
  const errors: string[] = []
  for (const entry of manifest.entries) {
    try {
      const sourcePath = join(runDir, entry.relativePath)
      const sourceStat = await stat(sourcePath)
      if (sourceStat.size !== entry.bytes)
        errors.push(`archive byte mismatch: ${entry.relativePath}`)
      if ((await hashFile(sourcePath)) !== entry.sha256) {
        errors.push(`archive hash mismatch: ${entry.relativePath}`)
      }
    } catch {
      errors.push(
        `archive file is missing or unreadable: ${entry.relativePath}`,
      )
    }
  }
  return errors
}
