import { toReloadCommands } from './toReloadCommands'
import type { ReloadServiceUnitInput } from './types/ReloadServiceUnitInput'

/**
 * Runs the init-system commands that load one unit. Returns the failure output
 * of the first intolerable command, or undefined when the unit is loaded.
 */
export const reloadServiceUnit = async ({
  platform,
  unitPath,
  unitFile,
  uid,
  hasTimer,
  run,
}: ReloadServiceUnitInput): Promise<string | undefined> => {
  for (const command of toReloadCommands({
    platform,
    unitPath,
    unitFile,
    uid,
    hasTimer,
  })) {
    const outcome = await run(command.argv)

    if (!outcome.ok && !command.tolerateFailure) {
      return outcome.output
    }
  }

  return undefined
}
