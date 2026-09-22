import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseSessionArchiveManifest } from './parseSessionArchiveManifest'
import type { SessionArchiveManifest } from './types/SessionArchiveManifest'

export const readSessionArchiveManifest = async (
  runDir: string,
): Promise<SessionArchiveManifest | undefined> => {
  try {
    const parsed = JSON.parse(
      await readFile(join(runDir, 'manifest.json'), 'utf8'),
    ) as unknown
    return parseSessionArchiveManifest(parsed)
  } catch {
    return undefined
  }
}
