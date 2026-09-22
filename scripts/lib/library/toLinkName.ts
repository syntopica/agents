export const toLinkName = (entryKey: string) => {
  const parts = entryKey.split('/')
  return parts[parts.length - 1] ?? entryKey
}
