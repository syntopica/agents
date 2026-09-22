import { readFile } from 'node:fs/promises'
import { escapeRegExpSource } from './escapeRegExpSource'
import { toRealPath } from './toRealPath'

/**
 * Cache directories a settings file points into. A `statusLine` command, a
 * hook, or any other setting can name a plugin's cache path directly, and such
 * a path is live even though no installed plugin resolves to it - which is why
 * a version inside a known marketplace cannot be pruned on the installed set
 * alone. Both cache roots are searched, real and symlinked, because a sizable
 * share of plugins can be recorded through the secondary profile's directory.
 */
export const readSettingsReferencedCachePaths = async ({
  settingsFiles,
  cacheDirs,
}: {
  settingsFiles: string[]
  cacheDirs: string[]
}): Promise<string[]> => {
  const found = new Set<string>()

  for (const file of settingsFiles) {
    const contents = await readFile(file, 'utf8').catch(() => undefined)
    if (contents === undefined) continue

    for (const cacheDir of cacheDirs) {
      // marketplace/plugin/version, the three levels readCacheEntries walks.
      const pattern = new RegExp(
        `${escapeRegExpSource(cacheDir)}(?:/[^"'\\s:/]+){3}`,
        'gu',
      )
      for (const [match] of contents.matchAll(pattern))
        found.add(await toRealPath(match))
    }
  }

  return [...found].sort((left, right) => left.localeCompare(right))
}
