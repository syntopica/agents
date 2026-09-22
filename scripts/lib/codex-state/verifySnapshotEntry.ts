import { stat } from 'node:fs/promises'
import { isAbsolute, join, normalize, sep } from 'node:path'
import { hashFile } from './hashFile'

export const verifySnapshotEntry = async (
  snapshotDir: string,
  rawEntry: unknown,
): Promise<string[]> => {
  if (typeof rawEntry !== 'object' || rawEntry === null)
    return ['manifest entry is invalid']
  const entry = rawEntry as Record<string, unknown>
  if (
    typeof entry['relativePath'] !== 'string' ||
    typeof entry['bytes'] !== 'number' ||
    typeof entry['sha256'] !== 'string'
  ) {
    return ['manifest entry is invalid']
  }

  const normalized = normalize(entry['relativePath'])
  if (
    isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith(`..${sep}`)
  ) {
    return [`${entry['relativePath']}: unsafe relative path`]
  }
  try {
    const errors: string[] = []
    const path = join(snapshotDir, 'files', normalized)
    const fileStat = await stat(path)
    if (fileStat.size !== entry['bytes'])
      errors.push(`${entry['relativePath']}: byte count mismatch`)
    if ((await hashFile(path)) !== entry['sha256'])
      errors.push(`${entry['relativePath']}: hash mismatch`)
    return errors
  } catch {
    return [`${entry['relativePath']}: snapshot file is missing or unreadable`]
  }
}
