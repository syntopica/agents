import type { CurationManifest } from './CurationManifest'

export type TransitionResult =
  { ok: true; manifest: CurationManifest } | { ok: false; error: string }
