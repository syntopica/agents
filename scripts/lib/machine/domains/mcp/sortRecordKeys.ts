export const sortRecordKeys = (source: Record<string, unknown>) => {
  const sorted: Record<string, unknown> = {}

  for (const name of Object.keys(source).toSorted((left, right) =>
    left.localeCompare(right),
  )) {
    sorted[name] = source[name]
  }

  return sorted
}
