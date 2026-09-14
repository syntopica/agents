export const collectCodexSecurityErrors = (
  raw: unknown,
  errors: string[],
): void => {
  if (typeof raw !== 'object' || raw === null) {
    errors.push('manifest.codex must be an object')
    return
  }
  const policy = raw as Record<string, unknown>
  for (const key of Object.keys(policy)) {
    if (key !== 'forcedLoginMethod')
      errors.push(`manifest.codex.${key} is not supported`)
  }
  if (policy['forcedLoginMethod'] !== 'chatgpt') {
    errors.push('manifest.codex.forcedLoginMethod must be chatgpt')
  }
}
