import type { Procedure } from './types/Procedure'

export const parseProceduresFile = (raw: unknown): Procedure[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  const procedures: Procedure[] = []

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      continue
    }

    const record = item as Record<string, unknown>

    if (
      typeof record['name'] !== 'string' ||
      typeof record['requests'] !== 'number'
    ) {
      continue
    }

    procedures.push({
      name: record['name'],
      requests: record['requests'],
      projects: typeof record['projects'] === 'number' ? record['projects'] : 1,
      ...(typeof record['covers'] === 'string'
        ? { covers: record['covers'] }
        : {}),
    })
  }

  return procedures
}
