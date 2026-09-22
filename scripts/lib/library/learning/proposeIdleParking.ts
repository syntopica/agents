import type { Procedure } from './types/Procedure'
import type { Proposal } from './types/Proposal'

export const proposeIdleParking = (
  fannedOut: string[],
  procedures: Procedure[],
  invocations: Record<string, number>,
): Proposal[] => {
  const wanted = new Set(procedures.map((procedure) => procedure.covers))

  return fannedOut
    .filter((skill) => !wanted.has(skill) && (invocations[skill] ?? 0) === 0)
    .map((skill) => ({
      kind: 'park' as const,
      skill,
      requests: 0,
      why: 'fanned out, never invoked, and no measured procedure points at it',
    }))
}
