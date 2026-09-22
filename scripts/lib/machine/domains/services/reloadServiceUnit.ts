import type { CommandRunner } from '../../exec/types/CommandRunner'
import { toReloadCommands } from './toReloadCommands'
import type { ServicesPlatform } from './types/ServicesPlatform'

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
}: {
  platform: ServicesPlatform
  unitPath: string
  unitFile: string
  uid: number
  hasTimer: boolean
  run: CommandRunner
}): Promise<string | undefined> => {
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
