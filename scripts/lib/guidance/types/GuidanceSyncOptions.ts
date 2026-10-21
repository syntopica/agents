export interface GuidanceSyncOptions {
  home: string
  canonicalDir: string
  stateDir: string
  dryRun?: boolean
  acceptPublished?: boolean
  rulesInventoryPath?: string
  proposalOutput?: string
  applyProposal?: string
  proposalSha256?: string
}
