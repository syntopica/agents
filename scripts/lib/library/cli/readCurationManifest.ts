import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { parseCurationManifest } from '../parseCurationManifest'
import type { ManifestParseResult } from '../types/ManifestParseResult'

export const readCurationManifest = async (
  libraryDir: string,
): Promise<ManifestParseResult> => {
  let contents: string

  try {
    contents = await fs.readFile(join(libraryDir, 'curation.json'), 'utf8')
  } catch {
    return {
      ok: false,
      errors: [`no curation.json under ${libraryDir}; run library:seed first`],
    }
  }

  try {
    return parseCurationManifest(JSON.parse(contents) as unknown)
  } catch {
    return {
      ok: false,
      errors: [`curation.json under ${libraryDir} is not valid JSON`],
    }
  }
}
