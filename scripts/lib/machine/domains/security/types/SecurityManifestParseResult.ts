import type { SecurityManifest } from './SecurityManifest'

export type SecurityManifestParseResult =
  { ok: true; manifest: SecurityManifest } | { ok: false; errors: string[] }
