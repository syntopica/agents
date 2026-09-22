export interface QuarantineEntry {
  originalRelativePath: string
  destinationRelativePath: string
  bytes: number
  sha256: string
  mode: number
}
