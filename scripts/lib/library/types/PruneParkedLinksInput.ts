import type { CurationManifest } from './CurationManifest'

export interface PruneParkedLinksInput {
  manifest: CurationManifest
  skillsRoot: string
  linkDir: string
  keep: string[]
  dryRun: boolean
}
