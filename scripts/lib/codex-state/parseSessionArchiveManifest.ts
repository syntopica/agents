import { isSafeRelativePath } from './isSafeRelativePath'
import type { SessionArchiveManifest } from './types/SessionArchiveManifest'

export const parseSessionArchiveManifest = (
  raw: unknown,
): SessionArchiveManifest | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined
  const manifest = raw as Record<string, unknown>
  if (
    manifest['version'] !== 1 ||
    typeof manifest['createdAt'] !== 'string' ||
    !Array.isArray(manifest['entries'])
  ) {
    return undefined
  }
  for (const rawEntry of manifest['entries']) {
    if (typeof rawEntry !== 'object' || rawEntry === null) return undefined
    const entry = rawEntry as Record<string, unknown>
    if (
      typeof entry['relativePath'] !== 'string' ||
      !isSafeRelativePath(entry['relativePath']) ||
      typeof entry['bytes'] !== 'number' ||
      entry['bytes'] < 0 ||
      typeof entry['sha256'] !== 'string' ||
      !/^[a-f\d]{64}$/.test(entry['sha256']) ||
      typeof entry['mode'] !== 'number'
    ) {
      return undefined
    }
  }
  return raw as SessionArchiveManifest
}
