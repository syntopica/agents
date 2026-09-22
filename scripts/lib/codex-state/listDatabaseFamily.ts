import { access } from 'node:fs/promises'

export const listDatabaseFamily = async (
  databasePath: string,
): Promise<string[]> => {
  const candidates = [
    databasePath,
    `${databasePath}-shm`,
    `${databasePath}-wal`,
  ]
  const existing = await Promise.all(
    candidates.map(async (path) => {
      try {
        await access(path)
        return path
      } catch {
        return undefined
      }
    }),
  )
  return existing
    .filter((path): path is string => path !== undefined)
    .toSorted((left, right) => left.localeCompare(right))
}
