import type { GuidanceDocumentContents } from './GuidanceDocumentContents'

export interface ReadGuidanceDocumentsResult {
  contents: GuidanceDocumentContents
  findings: string[]
}
