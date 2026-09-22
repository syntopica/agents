export const buildSkillKeyIndex = (
  manifestKeys: string[],
  onDisk: string[],
) => {
  const index: Record<string, string> = {}
  const keys = new Set(manifestKeys)

  for (const path of onDisk) {
    const parts = path.split('/')
    const skill = parts[parts.length - 1]

    if (skill === undefined) {
      continue
    }

    if (keys.has(path)) {
      index[skill] = path
      continue
    }

    const bundle = parts[0]

    if (
      bundle !== undefined &&
      keys.has(bundle) &&
      index[skill] === undefined
    ) {
      index[skill] = bundle
    }
  }

  for (const key of manifestKeys) {
    if (!key.includes('/')) {
      index[key] ??= key
    }
  }

  return index
}
