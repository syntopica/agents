import { validateSkillEntry } from './validateSkillEntry'

export const validateSkillRulesManifestShape = (
  manifest: Record<string, unknown>,
) => {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof manifest !== 'object') {
    return { errors: ['Manifest must be a JSON object.'], warnings }
  }

  if (!Number.isInteger(manifest['version'])) {
    errors.push("Manifest field 'version' must be an integer.")
  }

  if (
    !manifest['skills'] ||
    typeof manifest['skills'] !== 'object' ||
    Array.isArray(manifest['skills'])
  ) {
    errors.push("Manifest field 'skills' must be an object map.")
    return { errors, warnings }
  }

  for (const [skillName, entry] of Object.entries(
    manifest['skills'] as Record<string, unknown>,
  )) {
    validateSkillEntry(skillName, entry, errors)
  }

  return { errors, warnings }
}
