import type { GuidancePolicy } from './GuidancePolicy'
import type { GuidanceSources } from './GuidanceSources'

export interface ResolveGuidanceFastPathOptions {
  sources: GuidanceSources
  policy: GuidancePolicy
  acceptPublished: boolean
}
