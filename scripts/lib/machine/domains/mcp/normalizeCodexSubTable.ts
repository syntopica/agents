import { unquoteTomlString } from './unquoteTomlString'

export const normalizeCodexSubTable = (
  record: Record<string, string>,
  table: string,
) => {
  const normalized: Record<string, string> = {}
  const prefix = `${table}.`

  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(prefix)) {
      normalized[key.slice(prefix.length)] = unquoteTomlString(value)
    }
  }

  return Object.keys(normalized).length === 0 ? undefined : normalized
}
