import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ServicesPaths } from './types/ServicesPaths'
import type { ServicesState } from './types/ServicesState'

export const read = async (paths: ServicesPaths): Promise<ServicesState> => {
  let files: string[]

  try {
    files = await readdir(paths.directory)
  } catch {
    return {}
  }

  const entries = await Promise.all(
    files.map(async (file) => {
      try {
        return [
          file,
          await readFile(join(paths.directory, file), 'utf8'),
        ] as const
      } catch {
        return undefined
      }
    }),
  )

  return Object.fromEntries(entries.filter((entry) => entry !== undefined))
}
