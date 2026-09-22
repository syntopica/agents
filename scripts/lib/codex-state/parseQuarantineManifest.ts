import { isSafeRelativePath } from './isSafeRelativePath'
import type { QuarantineManifest } from './types/QuarantineManifest'

export const parseQuarantineManifest = (
  raw: unknown,
): QuarantineManifest | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined
  const manifest = raw as Record<string, unknown>
  if (manifest['version'] !== 1 || !Array.isArray(manifest['entries']))
    return undefined
  for (const rawEntry of manifest['entries']) {
    if (typeof rawEntry !== 'object' || rawEntry === null) return undefined
    const entry = rawEntry as Record<string, unknown>
    if (
      typeof entry['originalRelativePath'] !== 'string' ||
      !isSafeRelativePath(entry['originalRelativePath']) ||
      typeof entry['destinationRelativePath'] !== 'string' ||
      !isSafeRelativePath(entry['destinationRelativePath']) ||
      typeof entry['bytes'] !== 'number' ||
      typeof entry['sha256'] !== 'string' ||
      !/^[a-f\d]{64}$/.test(entry['sha256']) ||
      typeof entry['mode'] !== 'number'
    ) {
      return undefined
    }
  }
  return raw as QuarantineManifest
}
