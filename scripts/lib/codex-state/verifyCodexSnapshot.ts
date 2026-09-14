import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SnapshotVerification } from './types/SnapshotVerification'
import { verifySnapshotEntry } from './verifySnapshotEntry'

export const verifyCodexSnapshot = async (
  snapshotDir: string,
): Promise<SnapshotVerification> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(
      await readFile(join(snapshotDir, 'manifest.json'), 'utf8'),
    ) as unknown
  } catch {
    return { ok: false, errors: ['manifest is missing or invalid'] }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, errors: ['manifest schema is invalid'] }
  }
  const manifest = parsed as Record<string, unknown>
  if (manifest['version'] !== 1 || !Array.isArray(manifest['entries'])) {
    return { ok: false, errors: ['manifest schema is invalid'] }
  }

  const errors: string[] = []
  for (const rawEntry of manifest['entries']) {
    errors.push(...(await verifySnapshotEntry(snapshotDir, rawEntry)))
  }
  return { ok: errors.length === 0, errors }
}
