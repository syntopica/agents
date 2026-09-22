import type { CurationManifest } from './CurationManifest'

export type ManifestParseResult =
  { ok: true; manifest: CurationManifest } | { ok: false; errors: string[] }
