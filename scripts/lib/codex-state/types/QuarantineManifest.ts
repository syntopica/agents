import type { QuarantineEntry } from './QuarantineEntry'

export interface QuarantineManifest {
  version: 1
  entries: QuarantineEntry[]
}
