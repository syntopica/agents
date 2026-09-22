export const toPluginMarketplace = (id: string): string => {
  const separator = id.lastIndexOf('@')

  return separator === -1 ? 'unknown' : id.slice(separator + 1)
}
