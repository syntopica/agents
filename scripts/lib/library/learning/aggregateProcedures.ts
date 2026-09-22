import type { Procedure } from './types/Procedure'

export const aggregateProcedures = (
  classified: { procedure: string; project?: string }[],
  minRequests: number,
): Procedure[] => {
  const tally: Record<string, { requests: number; projects: Set<string> }> = {}

  for (const item of classified) {
    const name = item.procedure.trim().toLowerCase()

    if (name === '') {
      continue
    }

    const entry = (tally[name] ??= { requests: 0, projects: new Set() })
    entry.requests += 1
    entry.projects.add(item.project ?? 'unknown')
  }

  return Object.entries(tally)
    .filter(([, value]) => value.requests >= minRequests)
    .map(([name, value]) => ({
      name,
      requests: value.requests,
      projects: value.projects.size,
    }))
    .toSorted((left, right) => right.requests - left.requests)
}
