import type { CommandRunner } from '../../exec/types/CommandRunner'
import { toPluginCommand } from './toPluginCommand'
import type { PluginChange } from './types/PluginChange'
import type { PluginsApplyResult } from './types/PluginsApplyResult'
import type { PluginsPaths } from './types/PluginsPaths'

/**
 * Changes run sequentially: the plugin tree is shared between profiles and is
 * strictly single-writer, so concurrent CLI invocations would clobber
 * installed_plugins.json.
 */
export const apply = async ({
  changes,
  paths,
  run,
}: {
  changes: PluginChange[]
  paths: PluginsPaths
  run: CommandRunner
}): Promise<PluginsApplyResult> => {
  const result: PluginsApplyResult = { applied: [], manual: [], failed: [] }

  for (const change of changes) {
    const command = toPluginCommand(change, paths)

    if (command === undefined) {
      result.manual.push(change)
      continue
    }

    const outcome = await run(command.argv, command.env)

    if (outcome.ok) {
      result.applied.push(change)
    } else {
      result.failed.push({ change, error: outcome.output })
    }
  }

  return result
}
