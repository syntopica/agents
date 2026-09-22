export const collectPlatformProbeErrors = (
  registryId: string,
  raw: unknown,
  errors: string[],
): void => {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${registryId}: probe must be an object`)
    return
  }

  const probe = raw as Record<string, unknown>
  const fields = ['commands', 'appPaths', 'configPaths'] as const
  let values = 0

  for (const field of fields) {
    const fieldValue = probe[field]
    if (fieldValue === undefined && field !== 'configPaths') continue

    if (
      !Array.isArray(fieldValue) ||
      fieldValue.some((value) => typeof value !== 'string')
    ) {
      errors.push(`${registryId}: probe.${field} must be a string array`)
      continue
    }

    values += fieldValue.length
  }

  if (values === 0)
    errors.push(
      `${registryId}: probe must declare at least one path or command`,
    )
}
