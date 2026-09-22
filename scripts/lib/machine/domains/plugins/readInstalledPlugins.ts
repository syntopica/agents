import { readJsonRecord } from './readJsonRecord'
import { toInstalledPlugin } from './toInstalledPlugin'
import type { InstalledPlugin } from './types/InstalledPlugin'

export const readInstalledPlugins = async (
  path: string,
): Promise<InstalledPlugin[]> => {
  const parsed = await readJsonRecord(path)
  const plugins = parsed['plugins']

  if (typeof plugins !== 'object' || plugins === null) {
    return []
  }

  return Object.entries(plugins as Record<string, unknown>)
    .flatMap(([id, entries]) =>
      (Array.isArray(entries) ? entries : [entries]).map((entry) =>
        toInstalledPlugin(id, entry),
      ),
    )
    .filter((plugin): plugin is InstalledPlugin => plugin !== undefined)
    .sort((left, right) => left.installPath.localeCompare(right.installPath))
}
