import { collectSkillSourceErrors } from './collectSkillSourceErrors'
import type { SkillSourceManifest } from './types/SkillSourceManifest'
import type { SkillSourceManifestParseResult } from './types/SkillSourceManifestParseResult'

export const parseSkillSourceManifest = (
  raw: unknown,
): SkillSourceManifestParseResult => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['skill source manifest must be an object'] }
  }

  const record = raw as Record<string, unknown>
  const errors: string[] = []
  if (record['version'] !== 1)
    errors.push('skill source manifest version must be 1')
  if (!Array.isArray(record['sources']))
    errors.push('skill source manifest needs a sources array')

  const sources = Array.isArray(record['sources']) ? record['sources'] : []
  const ids = new Set<string>()
  for (const [index, value] of sources.entries()) {
    collectSkillSourceErrors(value, index, ids, errors)
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, manifest: raw as SkillSourceManifest }
}
