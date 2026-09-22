import type { CommandRunner } from '../../exec/types/CommandRunner'
import type { DomainResult } from '../../types/DomainResult'
import { apply } from './apply'
import { plan } from './plan'
import { pruneOrphanCacheDirectories } from './pruneOrphanCacheDirectories'
import { read } from './read'
import { toPluginsApplyStatus } from './toPluginsApplyStatus'
import type { PluginsManifestParseResult } from './types/PluginsManifestParseResult'
import type { PluginsPaths } from './types/PluginsPaths'

/**
 * Converges the plugin tree and reports the domain result. A missing manifest
 * is skipped rather than failed: the values live in the private dotfiles repo,
 * so a public checkout legitimately has none.
 */
export const runPluginsApply = async ({
  parsed,
  paths,
  prune,
  run,
}: {
  parsed: PluginsManifestParseResult | undefined
  paths: PluginsPaths
  prune: boolean
  run: CommandRunner
}): Promise<DomainResult> => {
  if (parsed === undefined) {
    return {
      domain: 'plugins',
      status: 'skipped',
      changes: 0,
      messages: ['no plugins.json in the instance directory'],
    }
  }

  if (!parsed.ok) {
    return {
      domain: 'plugins',
      status: 'failed',
      changes: 0,
      messages: parsed.errors,
    }
  }

  const state = await read(paths)
  const result = await apply({
    changes: plan({ manifest: parsed.manifest, state }),
    paths,
    run,
  })
  const pruned = prune
    ? await pruneOrphanCacheDirectories({
        cacheDir: paths.cache,
        marketplaces: state.marketplaces,
      })
    : []

  return {
    domain: 'plugins',
    status: toPluginsApplyStatus({ result, pruned: pruned.length }),
    changes: result.applied.length + pruned.length,
    messages: [
      ...result.applied.map(
        (change) => `${change.operation} ${change.id} (${change.detail})`,
      ),
      ...result.manual.map(
        (change) =>
          `manual: ${change.operation} ${change.id} (${change.detail})`,
      ),
      ...result.failed.map(
        ({ change, error }) => `failed ${change.id}: ${error}`,
      ),
      ...(pruned.length === 0
        ? []
        : [`pruned ${String(pruned.length)} orphan cache directories`]),
    ],
  }
}
