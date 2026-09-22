import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SessionArchiveManifest } from './types/SessionArchiveManifest'

export const writeSessionArchiveManifest = async (
  runDir: string,
  manifest: SessionArchiveManifest,
): Promise<void> => {
  await writeFile(
    join(runDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    {
      mode: 0o600,
    },
  )
}
