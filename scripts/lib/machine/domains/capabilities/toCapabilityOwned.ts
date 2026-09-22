import type { CapabilityApplyResult } from './types/CapabilityApplyResult'

export const toCapabilityOwned = (
  results: CapabilityApplyResult[],
): Record<string, string[]> =>
  Object.fromEntries(
    results
      .filter(({ result }) => result.status === 'supported')
      .map(({ target }) => [
        target.id,
        target.links.map(({ target: path }) => path),
      ]),
  )
