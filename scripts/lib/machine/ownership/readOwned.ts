import { promises as fs } from 'node:fs'
import type { OwnedRecord } from './OwnedRecord'

export const readOwned = async (path: string): Promise<OwnedRecord> => {
  try {
    const contents = await fs.readFile(path, 'utf8')
    return JSON.parse(contents) as OwnedRecord
  } catch {
    return {}
  }
}
