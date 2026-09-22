import type { PluginsCapture } from '../../domains/plugins/types/PluginsCapture'

export const formatPluginsCapture = (
  capture: PluginsCapture,
  asJson: boolean,
) => {
  if (asJson) {
    return JSON.stringify(capture, null, 2)
  }

  const { manifest, cache } = capture
  const lines = [
    `marketplaces ${String(manifest.marketplaces.length)} plugins ${String(manifest.plugins.length)}`,
  ]

  for (const marketplace of manifest.marketplaces) {
    lines.push(`  ${marketplace.name.padEnd(28)} ${marketplace.source}`)
  }

  for (const plugin of manifest.plugins) {
    const personal = plugin.enablement['claude-personal']
    const secondary = plugin.enablement['claude-secondary']
    lines.push(
      `  ${plugin.id.padEnd(44)} ${plugin.version.padEnd(10)} personal=${personal} secondary=${secondary}`,
    )
  }

  lines.push(
    `cache entries ${String(cache.entries)} stale ${String(cache.stale.length)} orphan ${String(cache.orphanDirectories.length)}`,
  )

  if (cache.stale.length > 0) {
    // Report only, and deliberately never an action: nothing here proves a
    // version is unused, because a project-scoped settings file inside any
    // repository can name it and those cannot be enumerated. Apply prunes
    // orphan marketplace directories, never a version.
    lines.push('  (stale = unreferenced by anything this tool can see)')
  }

  for (const entry of cache.stale) {
    lines.push(`  stale  ${entry.marketplace}/${entry.plugin}/${entry.version}`)
  }

  for (const directory of cache.orphanDirectories) {
    lines.push(`  orphan ${directory}`)
  }

  return lines.join('\n')
}
