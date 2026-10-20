import type { CurationManifest } from './CurationManifest'

export interface MergeSeedIntoManifestResult {
  manifest: CurationManifest
  added: string[]
}
