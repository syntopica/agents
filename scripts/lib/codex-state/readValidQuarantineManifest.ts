import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseQuarantineManifest } from './parseQuarantineManifest'
import type { QuarantineManifest } from './types/QuarantineManifest'

export const readValidQuarantineManifest = async (
  snapshotDir: string,
): Promise<QuarantineManifest | undefined> => {
  try {
    const raw = JSON.parse(
      await readFile(join(snapshotDir, 'quarantine-manifest.json'), 'utf8'),
    ) as unknown
    return parseQuarantineManifest(raw)
  } catch {
    return undefined
  }
}
