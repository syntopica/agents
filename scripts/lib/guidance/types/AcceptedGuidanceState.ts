import type { GuidanceInputHash } from './GuidanceInputHash'

export interface AcceptedGuidanceState {
  runId: string
  acceptedAt: string
  inputHashes: GuidanceInputHash[]
  outputHashes: {
    shared: string
    claudeOverlay: string
    codexOverlay: string
    claudeDocument: string
    codexDocument: string
  }
}
