import type { PlatformManifest } from './PlatformManifest'

export type PlatformManifestParseResult =
  { ok: true; manifest: PlatformManifest } | { ok: false; errors: string[] }
