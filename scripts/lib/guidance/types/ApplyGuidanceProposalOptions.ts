import type { GuidanceReconciliationOptions } from './GuidanceReconciliationOptions'

export interface ApplyGuidanceProposalOptions extends GuidanceReconciliationOptions {
  inputHashes: Record<string, string>
}
