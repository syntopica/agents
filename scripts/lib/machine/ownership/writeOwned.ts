import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import type { OwnedRecord } from './OwnedRecord'

export const writeOwned = async (path: string, record: OwnedRecord) => {
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, `${JSON.stringify(record, null, 2)}\n`)
}
