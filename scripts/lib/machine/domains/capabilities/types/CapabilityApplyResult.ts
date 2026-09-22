import type { applyCapabilityLinks } from '../applyCapabilityLinks'
import type { CapabilityTarget } from './CapabilityTarget'

export interface CapabilityApplyResult {
  target: CapabilityTarget
  result: Awaited<ReturnType<typeof applyCapabilityLinks>>
}
