import { homedir } from 'node:os'
import { resolvePluginCacheRoots } from '../lib/machine/cli/resolvePluginCacheRoots'
import { resolvePluginReferenceFiles } from '../lib/machine/cli/resolvePluginReferenceFiles'
import { resolvePluginsPaths } from '../lib/machine/cli/resolvePluginsPaths'
import { findOrphanCacheDirectories } from '../lib/machine/domains/plugins/findOrphanCacheDirectories'
import { findStaleCacheEntries } from '../lib/machine/domains/plugins/findStaleCacheEntries'
import { read } from '../lib/machine/domains/plugins/read'
import { readCacheEntries } from '../lib/machine/domains/plugins/readCacheEntries'
import { readSettingsReferencedCachePaths } from '../lib/machine/domains/plugins/readSettingsReferencedCachePaths'
import { resolveInstalledPaths } from '../lib/machine/domains/plugins/resolveInstalledPaths'
import { toDeclaredPluginsManifest } from '../lib/machine/domains/plugins/toDeclaredPluginsManifest'
import { toManifest } from '../lib/machine/domains/plugins/toManifest'
import { formatPluginsCapture } from '../lib/machine/report/formatters/formatPluginsCapture'

export const main = async () => {
  const home = homedir()
  const paths = resolvePluginsPaths(home, process.env)
  const state = await read(paths)
  const entries = await readCacheEntries({
    cacheDir: paths.cache,
    marketplaces: state.marketplaces,
  })

  const referencedPaths = [
    ...(await resolveInstalledPaths(state.installed)),
    ...(await readSettingsReferencedCachePaths({
      settingsFiles: resolvePluginReferenceFiles(home, process.env),
      cacheDirs: await resolvePluginCacheRoots(home, process.env),
    })),
  ]

  const capture = {
    manifest: toManifest(state),
    cache: {
      entries: entries.length,
      stale: findStaleCacheEntries({ entries, referencedPaths }),
      orphanDirectories: await findOrphanCacheDirectories({
        cacheDir: paths.cache,
        marketplaces: state.marketplaces,
      }),
    },
  }

  if (process.argv.includes('--manifest')) {
    console.log(
      JSON.stringify(toDeclaredPluginsManifest(capture.manifest), null, 2),
    )
    return
  }

  console.log(formatPluginsCapture(capture, process.argv.includes('--json')))
}
