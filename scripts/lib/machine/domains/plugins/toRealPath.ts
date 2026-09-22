import { realpath } from 'node:fs/promises'

export const toRealPath = async (path: string): Promise<string> => {
  try {
    return await realpath(path)
  } catch {
    return path
  }
}
