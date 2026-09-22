import type { SkillSourceManifest } from './SkillSourceManifest'

export type SkillSourceManifestParseResult =
  { ok: true; manifest: SkillSourceManifest } | { ok: false; errors: string[] }
