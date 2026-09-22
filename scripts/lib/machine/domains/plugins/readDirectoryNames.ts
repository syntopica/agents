import { readdir } from 'node:fs/promises'

export const readDirectoryNames = async (path: string): Promise<string[]> => {
  try {
    const entries = await readdir(path, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}
