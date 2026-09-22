import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readQuarantineManifest } from './readQuarantineManifest'
import type { QuarantineEntry } from './types/QuarantineEntry'
import type { QuarantineManifest } from './types/QuarantineManifest'

export const appendQuarantineManifest = async (
  snapshotDir: string,
  entries: QuarantineEntry[],
): Promise<void> => {
  const path = join(snapshotDir, 'quarantine-manifest.json')
  const current = await readQuarantineManifest(path)
  const manifest: QuarantineManifest = {
    version: 1,
    entries: [...current.entries, ...entries],
  }
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  })
}
