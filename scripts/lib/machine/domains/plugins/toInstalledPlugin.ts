import type { InstalledPlugin } from './types/InstalledPlugin'

export const toInstalledPlugin = (
  id: string,
  entry: unknown,
): InstalledPlugin | undefined => {
  if (typeof entry !== 'object' || entry === null) {
    return undefined
  }

  const record = entry as Record<string, unknown>
  const installPath =
    typeof record['installPath'] === 'string' ? record['installPath'] : ''

  if (installPath === '') {
    return undefined
  }

  return {
    id,
    scope: typeof record['scope'] === 'string' ? record['scope'] : 'unknown',
    version:
      typeof record['version'] === 'string' ? record['version'] : 'unknown',
    installPath,
    ...(typeof record['gitCommitSha'] === 'string'
      ? { gitCommitSha: record['gitCommitSha'] }
      : {}),
  }
}
