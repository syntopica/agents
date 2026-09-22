import { readJsonRecord } from './readJsonRecord'
import { toMarketplaceSource } from './toMarketplaceSource'
import type { PluginMarketplaceEntry } from './types/PluginMarketplaceEntry'

export const readMarketplaces = async (
  path: string,
): Promise<PluginMarketplaceEntry[]> => {
  const parsed = await readJsonRecord(path)

  return Object.entries(parsed)
    .filter(([, value]) => typeof value === 'object' && value !== null)
    .map(([name, value]) => ({
      name,
      source: toMarketplaceSource((value as Record<string, unknown>)['source']),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}
