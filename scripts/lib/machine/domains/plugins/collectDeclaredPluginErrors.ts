export const collectDeclaredPluginErrors = (raw: unknown, errors: string[]) => {
  if (!Array.isArray(raw)) {
    errors.push('manifest.plugins must be an array')
    return
  }

  raw.forEach((entry, index) => {
    const at = `manifest.plugins[${String(index)}]`

    if (typeof entry !== 'object' || entry === null) {
      errors.push(`${at} must be an object`)
      return
    }

    const record = entry as Record<string, unknown>

    if (typeof record['id'] !== 'string' || !record['id'].includes('@')) {
      errors.push(`${at}.id must be a name@marketplace string`)
    }
    if (typeof record['version'] !== 'string' || record['version'] === '') {
      errors.push(`${at}.version must be a non-empty string`)
    }
    if (typeof record['enabled'] !== 'object' || record['enabled'] === null) {
      errors.push(`${at}.enabled must declare a boolean per profile`)
      return
    }

    for (const profile of ['claude-personal', 'claude-secondary']) {
      if (
        typeof (record['enabled'] as Record<string, unknown>)[profile] !==
        'boolean'
      ) {
        errors.push(`${at}.enabled.${profile} must be a boolean`)
      }
    }
  })
}
