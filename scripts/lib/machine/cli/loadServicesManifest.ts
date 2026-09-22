import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseServicesManifest } from '../domains/services/parseServicesManifest'
import type { ServicesManifestParseResult } from '../domains/services/types/ServicesManifestParseResult'

export const loadServicesManifest = async (
  instanceDir: string,
): Promise<ServicesManifestParseResult | undefined> => {
  let contents: string

  try {
    contents = await readFile(join(instanceDir, 'services.json'), 'utf8')
  } catch {
    return undefined
  }

  try {
    return parseServicesManifest(JSON.parse(contents) as unknown)
  } catch {
    return {
      ok: false,
      errors: [`services.json in ${instanceDir} is not valid JSON`],
    }
  }
}
