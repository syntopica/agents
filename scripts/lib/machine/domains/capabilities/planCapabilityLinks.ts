import { isCapabilityTargetDetected } from './isCapabilityTargetDetected'
import { planCapabilityLink } from './planCapabilityLink'
import type { CapabilityTarget } from './types/CapabilityTarget'

export const planCapabilityLinks = async (target: CapabilityTarget) => {
  if (target.support === 'unsupported') return []
  if (!(await isCapabilityTargetDetected(target))) return []

  const changes: { target: string; operation: 'add' | 'update' }[] = []
  for (const link of target.links) {
    const change = await planCapabilityLink(link)
    if (change !== undefined) changes.push(change)
  }
  return changes
}
