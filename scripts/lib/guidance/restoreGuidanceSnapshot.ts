import { chmod, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { sha256Text } from './sha256Text'
import { writeGuidanceAtomically } from './writeGuidanceAtomically'

export const restoreGuidanceSnapshot = async (
  snapshotDir: string,
  expectedTargets: Record<string, string>,
): Promise<void> => {
  const raw = JSON.parse(
    await readFile(join(snapshotDir, 'manifest.json'), 'utf8'),
  ) as {
    version?: unknown
    entries?: unknown
  }
  if (raw.version !== 1 || !Array.isArray(raw.entries))
    throw new Error('guidance snapshot manifest is invalid')
  for (const entry of raw.entries) {
    if (typeof entry !== 'object' || entry === null)
      throw new Error('guidance snapshot entry is invalid')
    const value = entry as Record<string, unknown>
    if (
      typeof value['target'] !== 'string' ||
      typeof value['storage'] !== 'string' ||
      typeof value['existed'] !== 'boolean' ||
      typeof value['key'] !== 'string' ||
      expectedTargets[value['key']] !== value['target']
    )
      throw new Error('guidance snapshot entry is invalid')
    if (!value['existed']) {
      await rm(value['target'], { force: true })
      continue
    }
    if (
      typeof value['sha256'] !== 'string' ||
      typeof value['mode'] !== 'number'
    )
      throw new Error('guidance snapshot entry is invalid')
    const content = await readFile(
      join(snapshotDir, 'files', value['storage']),
      'utf8',
    )
    if (sha256Text(content) !== value['sha256'])
      throw new Error('guidance snapshot hash mismatch')
    await writeGuidanceAtomically(value['target'], content)
    await chmod(value['target'], value['mode'])
    if (sha256Text(await readFile(value['target'], 'utf8')) !== value['sha256'])
      throw new Error('guidance restore target hash mismatch')
  }
}
