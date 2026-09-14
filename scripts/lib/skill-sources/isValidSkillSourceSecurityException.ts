export const isValidSkillSourceSecurityException = (
  value: unknown,
  skills: string[],
): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false
  const exception = value as Record<string, unknown>
  return (
    typeof exception['skill'] === 'string' &&
    skills.includes(exception['skill']) &&
    typeof exception['ruleId'] === 'string' &&
    typeof exception['file'] === 'string' &&
    typeof exception['line'] === 'number' &&
    Number.isInteger(exception['line']) &&
    exception['line'] >= 1 &&
    typeof exception['reason'] === 'string' &&
    exception['reason'].trim().length >= 20
  )
}
