import { MANIFEST_PATH } from '../constants/MANIFEST_PATH'

export const validateManifestReferences = (
  manifest: { skills: Record<string, { rules?: string[] }> },
  validRuleRefs: Set<string>,
  skillNames: Set<string>,
) => {
  const errors = []
  const manifestSkillNames = new Set(Object.keys(manifest.skills))

  for (const skillName of skillNames) {
    if (!manifestSkillNames.has(skillName)) {
      errors.push(`Skill '${skillName}' is missing in ${MANIFEST_PATH}`)
    }
  }

  for (const manifestSkillName of manifestSkillNames) {
    if (!skillNames.has(manifestSkillName)) {
      errors.push(
        `Manifest entry '${manifestSkillName}' has no matching skill directory`,
      )
    }

    const rules = manifest.skills[manifestSkillName]?.rules ?? []
    for (const rule of rules) {
      if (!validRuleRefs.has(rule)) {
        errors.push(
          `Manifest entry '${manifestSkillName}' references missing rule: ${rule}`,
        )
      }
    }
  }

  return errors
}
