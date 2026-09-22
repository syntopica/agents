import { applyCapabilityLinks } from './applyCapabilityLinks'
import type { CapabilityApplyResult } from './types/CapabilityApplyResult'
import type { CapabilityTarget } from './types/CapabilityTarget'

/**
 * Applies each target in turn, or nothing at all when this run does not
 * converge the capabilities domain. Sequential on purpose: the targets share
 * the global agent directories a link lands in.
 */
export const applySelectedCapabilityLinks = async ({
  targets,
  selected,
}: {
  targets: CapabilityTarget[]
  selected: boolean
}): Promise<CapabilityApplyResult[]> => {
  const results: CapabilityApplyResult[] = []
  if (!selected) return results

  for (const target of targets) {
    results.push({ target, result: await applyCapabilityLinks(target) })
  }

  return results
}
