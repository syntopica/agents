export const collectConnectorDefinitionErrors = (
  value: unknown,
  index: number,
  ids: Set<string>,
): string[] => {
  const path = `connectors[${String(index)}]`
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [`${path} must be an object`]
  }
  const connector = value as Record<string, unknown>
  const errors: string[] = []
  const profiles = new Set(['claude-personal', 'claude-secondary', 'codex'])
  const ownershipKinds = new Set(['machine', 'account'])
  const probeKinds = new Set(['native-cli', 'claude-cli-prefix', 'http-mcp'])
  const criticalities = new Set(['required', 'optional'])
  const boundaries = new Set(['client', 'hosted-connector', 'access-gateway'])

  if (typeof connector['id'] !== 'string' || connector['id'].length === 0) {
    errors.push(`${path}.id must be a non-empty string`)
  } else if (ids.has(connector['id'])) {
    errors.push(`${path}.id duplicates ${connector['id']}`)
  } else {
    ids.add(connector['id'])
  }
  if (
    typeof connector['match'] !== 'string' ||
    connector['match'].length === 0
  ) {
    errors.push(`${path}.match must be a non-empty string`)
  }
  if (
    !Array.isArray(connector['profiles']) ||
    connector['profiles'].length === 0 ||
    connector['profiles'].some(
      (profile) => typeof profile !== 'string' || !profiles.has(profile),
    )
  ) {
    errors.push(`${path}.profiles contains an unknown or missing profile`)
  }
  if (
    typeof connector['ownership'] !== 'string' ||
    !ownershipKinds.has(connector['ownership'])
  ) {
    errors.push(`${path}.ownership is invalid`)
  }
  if (
    typeof connector['probe'] !== 'string' ||
    !probeKinds.has(connector['probe'])
  ) {
    errors.push(`${path}.probe is invalid`)
  }
  if (
    typeof connector['criticality'] !== 'string' ||
    !criticalities.has(connector['criticality'])
  ) {
    errors.push(`${path}.criticality is invalid`)
  }
  if (
    connector['boundary'] !== undefined &&
    (typeof connector['boundary'] !== 'string' ||
      !boundaries.has(connector['boundary']))
  ) {
    errors.push(`${path}.boundary is invalid`)
  }
  if (
    typeof connector['endpoint'] === 'string' &&
    /[?&](?:token|api[_-]?key|access[_-]?token|authorization)=/i.test(
      connector['endpoint'],
    )
  ) {
    errors.push(`${path}.endpoint contains a credential query parameter`)
  }
  return errors
}
