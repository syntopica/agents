export const toMarketplaceSource = (source: unknown): string => {
  if (typeof source !== 'object' || source === null) {
    return 'unknown'
  }

  const record = source as Record<string, unknown>
  const kind =
    typeof record['source'] === 'string' ? record['source'] : 'unknown'

  if (typeof record['repo'] === 'string') {
    return `${kind}:${record['repo']}`
  }
  if (typeof record['url'] === 'string') {
    return `${kind}:${record['url']}`
  }
  if (typeof record['path'] === 'string') {
    return `${kind}:${record['path']}`
  }

  return kind
}
