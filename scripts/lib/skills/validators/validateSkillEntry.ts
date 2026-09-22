export const validateSkillEntry = (
  skillName: string,
  entry: unknown,
  errors: string[],
) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`Manifest entry '${skillName}' must be an object.`)
    return
  }

  const typedEntry = entry as { rules?: unknown }

  if (!Array.isArray(typedEntry.rules)) {
    errors.push(`Manifest entry '${skillName}' must include a 'rules' array.`)
    return
  }

  if (typedEntry.rules.length === 0) {
    errors.push(`Manifest entry '${skillName}' must have at least one rule.`)
    return
  }

  const seen = new Set<string>()

  for (const rule of typedEntry.rules) {
    if (typeof rule !== 'string' || rule.trim().length === 0) {
      errors.push(
        `Manifest entry '${skillName}' contains an empty rule reference.`,
      )
      continue
    }

    if (!rule.startsWith('@rules/')) {
      errors.push(
        `Manifest entry '${skillName}' contains non @rules reference: ${rule}`,
      )
    }

    if (seen.has(rule)) {
      errors.push(
        `Manifest entry '${skillName}' contains duplicate rule reference: ${rule}`,
      )
    }
    seen.add(rule)
  }
}
