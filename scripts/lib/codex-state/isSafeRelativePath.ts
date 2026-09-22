import { isAbsolute, normalize, sep } from 'node:path'

export const isSafeRelativePath = (path: string): boolean => {
  const normalized = normalize(path)
  return (
    !isAbsolute(normalized) &&
    normalized !== '..' &&
    !normalized.startsWith(`..${sep}`)
  )
}
