export const extractRepositoryUrl = (
  pkg: Record<string, unknown>,
): string | undefined => {
  const repo = pkg['repository']
  if (typeof repo === 'string') return repo
  if (repo && typeof repo === 'object' && 'url' in repo) {
    const url = (repo as { url?: unknown }).url
    return typeof url === 'string' ? url : undefined
  }
  return undefined
}
