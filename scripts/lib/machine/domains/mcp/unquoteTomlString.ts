export const unquoteTomlString = (raw: string) => {
  const trimmed = raw.trim()

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\\\', '\\')
  }

  return trimmed
}
