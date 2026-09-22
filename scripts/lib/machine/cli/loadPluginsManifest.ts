import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parsePluginsManifest } from '../domains/plugins/parsePluginsManifest'
import type { PluginsManifestParseResult } from '../domains/plugins/types/PluginsManifestParseResult'

export const loadPluginsManifest = async (
  instanceDir: string,
): Promise<PluginsManifestParseResult | undefined> => {
  let contents: string

  try {
    contents = await readFile(join(instanceDir, 'plugins.json'), 'utf8')
  } catch {
    return undefined
  }

  try {
    return parsePluginsManifest(JSON.parse(contents) as unknown)
  } catch {
    return {
      ok: false,
      errors: [`plugins.json in ${instanceDir} is not valid JSON`],
    }
  }
}
