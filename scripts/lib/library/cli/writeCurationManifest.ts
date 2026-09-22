import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { CurationManifest } from '../types/CurationManifest'

export const writeCurationManifest = async (
  libraryDir: string,
  manifest: CurationManifest,
) => {
  await fs.writeFile(
    join(libraryDir, 'curation.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
}
