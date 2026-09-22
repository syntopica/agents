import { readFile } from 'node:fs/promises'

export const readJsonRecord = async (
  path: string,
): Promise<Record<string, unknown>> => {
  try {
    const contents = await readFile(path, 'utf8')

    if (contents.trim() === '') {
      return {}
    }

    const parsed: unknown = JSON.parse(contents)

    return typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
