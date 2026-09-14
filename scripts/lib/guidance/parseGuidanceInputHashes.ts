import { isRecord } from './isRecord'
import type { GuidanceInputHash } from './types/GuidanceInputHash'

export const parseGuidanceInputHashes = (
  raw: unknown,
):
  | { ok: true; inputHashes: GuidanceInputHash[] }
  | { ok: false; error: string } => {
  if (!Array.isArray(raw) || raw.length === 0)
    return {
      ok: false,
      error: 'inputHashes must be a non-empty path and sha256 array',
    }
  const inputHashes: GuidanceInputHash[] = []
  for (const value of raw) {
    if (
      !isRecord(value) ||
      Object.keys(value).length !== 2 ||
      !Object.hasOwn(value, 'path') ||
      !Object.hasOwn(value, 'sha256') ||
      typeof value['path'] !== 'string' ||
      value['path'] === '' ||
      typeof value['sha256'] !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(value['sha256'])
    )
      return {
        ok: false,
        error: 'inputHashes must be a non-empty path and sha256 array',
      }
    inputHashes.push({ path: value['path'], sha256: value['sha256'] })
  }
  if (new Set(inputHashes.map(({ path }) => path)).size !== inputHashes.length)
    return { ok: false, error: 'inputHashes must not contain duplicate paths' }
  return {
    ok: true,
    inputHashes: inputHashes.toSorted((left, right) =>
      left.path.localeCompare(right.path),
    ),
  }
}
