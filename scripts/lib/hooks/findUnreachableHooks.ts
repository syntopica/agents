import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Find hooks this repo declares that nothing live would ever invoke.
 *
 * A hook can be perfectly correct and still never run: hooks reach Claude Code
 * only through an installed plugin or an entry in settings.json, and neither is
 * implied by the file existing. That gap hid a dead SessionStart hook in this
 * repo indefinitely, so it is now checked.
 *
 * @returns {string[]} - Script basenames declared in hooks.json but not reachable.
 *   Empty when every declared hook is registered, or when no live config exists
 *   to check against (CI).
 */
export const findUnreachableHooks = (): string[] => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const declared = JSON.parse(
    readFileSync(path.join(repoRoot, 'src/hooks/hooks.json'), 'utf8'),
  ) as Record<string, { hooks?: { command?: string }[] }[]>

  const names = new Set<string>()
  for (const entries of Object.values(declared)) {
    for (const entry of entries) {
      for (const hook of entry.hooks ?? []) {
        const command = hook.command
        if (command) names.add(path.basename(command))
      }
    }
  }

  const settingsPath = path.join(
    process.env['HOME'] ?? '',
    '.claude/settings.json',
  )
  if (!existsSync(settingsPath)) return []

  const settingsRaw = readFileSync(settingsPath, 'utf8')
  const settings = JSON.parse(settingsRaw) as {
    enabledPlugins?: Record<string, boolean>
  }

  // Match the plugin by its manifest name. Substring-matching the repo path would
  // be satisfied by any hook registered from a checkout of this repo, which makes
  // the check pass for the very reason it should fail.
  const pluginName = (
    JSON.parse(
      readFileSync(
        path.join(repoRoot, 'dist/plugins/claude/.claude-plugin/plugin.json'),
        'utf8',
      ),
    ) as { name: string }
  ).name

  const pluginEnabled = Object.entries(settings.enabledPlugins ?? {}).some(
    ([key, on]) => on && key.split('@')[0] === pluginName,
  )
  if (pluginEnabled) return []

  // Otherwise each hook must be registered by name somewhere in settings.
  return [...names].filter((name) => !settingsRaw.includes(name))
}
