import type { CurationManifest } from '../types/CurationManifest'
import type { Procedure } from './types/Procedure'
import type { Proposal } from './types/Proposal'

export const proposeForProcedure = (
  procedure: Procedure,
  manifest: CurationManifest,
  fannedOut: string[],
  invocations: Record<string, number>,
): Proposal | undefined => {
  const covers = procedure.covers

  if (covers === undefined) {
    return {
      kind: 'build',
      procedure: procedure.name,
      requests: procedure.requests,
      why: `${String(procedure.requests)} requests across ${String(procedure.projects)} projects and nothing covers it`,
    }
  }

  const entry = manifest.entries[covers]

  if (entry === undefined) {
    return {
      kind: 'build',
      procedure: procedure.name,
      requests: procedure.requests,
      why: `covering skill ${covers} is not in the library`,
    }
  }

  if (!fannedOut.includes(covers)) {
    return {
      kind: 'promote',
      skill: covers,
      procedure: procedure.name,
      requests: procedure.requests,
      why: `covers ${String(procedure.requests)} requests but is ${entry.state}, so nothing can select it`,
    }
  }

  if ((invocations[covers] ?? 0) === 0) {
    return {
      kind: 'fix-trigger',
      skill: covers,
      procedure: procedure.name,
      requests: procedure.requests,
      why: `visible and covering ${String(procedure.requests)} requests, yet never invoked`,
    }
  }

  return undefined
}
