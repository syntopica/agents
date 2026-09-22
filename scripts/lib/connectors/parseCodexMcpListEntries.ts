export const parseCodexMcpListEntries = (
  output: string,
): Map<string, boolean | undefined> | undefined => {
  try {
    const parsed = JSON.parse(output) as unknown
    if (!Array.isArray(parsed)) return undefined
    const entries = new Map<string, boolean | undefined>()
    for (const value of parsed) {
      if (typeof value !== 'object' || value === null || Array.isArray(value))
        continue
      const entry = value as Record<string, unknown>
      if (typeof entry['name'] === 'string' && entry['name'].length > 0) {
        entries.set(
          entry['name'],
          typeof entry['enabled'] === 'boolean' ? entry['enabled'] : undefined,
        )
      }
    }
    return entries
  } catch {
    return undefined
  }
}
