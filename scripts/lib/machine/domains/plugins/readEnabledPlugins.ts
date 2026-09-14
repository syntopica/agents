import { readJsonRecord } from './readJsonRecord'

export const readEnabledPlugins = async (
  path: string,
): Promise<Record<string, boolean>> => {
  const parsed = await readJsonRecord(path)
  const enabled = parsed['enabledPlugins']

  if (typeof enabled !== 'object' || enabled === null) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(enabled as Record<string, unknown>).map(([id, value]) => [
      id,
      value === true,
    ]),
  )
}
