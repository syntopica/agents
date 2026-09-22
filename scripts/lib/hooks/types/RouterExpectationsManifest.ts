import type { RouterExpectation } from './RouterExpectation'

export interface RouterExpectationsManifest {
  version: 1
  phraseCount: number
  sourceAssociationCount: number
  expectations: RouterExpectation[]
}
