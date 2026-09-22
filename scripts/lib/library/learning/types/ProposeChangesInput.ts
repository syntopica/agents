import type { CurationManifest } from '../../types/CurationManifest'
import type { Procedure } from './Procedure'

export interface ProposeChangesInput {
  procedures: Procedure[]
  keyIndex: Record<string, string>
  manifest: CurationManifest
  invocations: Record<string, number>
  target: string
}
