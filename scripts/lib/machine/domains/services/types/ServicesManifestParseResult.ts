import type { ServicesManifest } from './ServicesManifest'

export type ServicesManifestParseResult =
  { ok: true; manifest: ServicesManifest } | { ok: false; errors: string[] }
