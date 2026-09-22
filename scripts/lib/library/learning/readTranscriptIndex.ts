import { promises as fs } from 'node:fs'

export const readTranscriptIndex = async (
  path: string,
): Promise<Record<string, number>> => {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8')) as Record<string, number>
  } catch {
    return {}
  }
}
