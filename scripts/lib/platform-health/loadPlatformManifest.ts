import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parsePlatformManifest } from './parsePlatformManifest'
import type { PlatformManifestParseResult } from './types/PlatformManifestParseResult'

export const loadPlatformManifest = async (
  instanceDir: string,
): Promise<PlatformManifestParseResult> => {
  try {
    const raw = JSON.parse(
      await readFile(join(instanceDir, 'platforms.json'), 'utf8'),
    ) as unknown
    return parsePlatformManifest(raw)
  } catch {
    return { ok: false, errors: [`no valid platforms.json in ${instanceDir}`] }
  }
}
