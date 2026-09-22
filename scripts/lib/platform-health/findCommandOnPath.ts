import { constants, promises as fs } from 'node:fs'
import { delimiter, join } from 'node:path'

export const findCommandOnPath = async (
  command: string,
  pathValue: string | undefined,
): Promise<string | undefined> => {
  if (
    pathValue === undefined ||
    command.includes('/') ||
    command.includes('\\')
  )
    return undefined

  for (const directory of pathValue.split(delimiter)) {
    if (directory.length === 0) continue
    const candidate = join(directory, command)
    const executable = await fs
      .access(candidate, constants.X_OK)
      .then(() => true)
      .catch(() => false)
    if (executable) return candidate
  }

  return undefined
}
