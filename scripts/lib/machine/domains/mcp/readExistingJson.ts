import { promises as fs } from 'node:fs'

export const readExistingJson = async (
  path: string,
): Promise<Record<string, unknown>> => {
  try {
    const contents = await fs.readFile(path, 'utf8')

    if (contents.trim() === '') {
      return {}
    }

    return JSON.parse(contents) as Record<string, unknown>
  } catch {
    return {}
  }
}
