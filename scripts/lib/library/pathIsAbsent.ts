import { lstat } from 'node:fs/promises'

export const pathIsAbsent = async (path: string) =>
  (await lstat(path).catch(() => undefined)) === undefined
