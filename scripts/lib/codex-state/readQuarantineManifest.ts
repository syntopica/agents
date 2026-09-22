import { readFile } from 'node:fs/promises'
import type { QuarantineManifest } from './types/QuarantineManifest'

export const readQuarantineManifest = async (
  path: string,
): Promise<QuarantineManifest> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as QuarantineManifest
  } catch {
    return { version: 1, entries: [] }
  }
}
