import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseConnectorManifest } from './parseConnectorManifest'

export const loadConnectorManifest = async (instanceDir: string) => {
  try {
    return parseConnectorManifest(
      JSON.parse(
        await readFile(join(instanceDir, 'connectors.json'), 'utf8'),
      ) as unknown,
    )
  } catch {
    return {
      ok: false as const,
      errors: ['connectors.json is missing or invalid JSON'],
    }
  }
}
