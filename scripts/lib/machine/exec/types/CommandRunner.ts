import type { CommandResult } from './CommandResult'

/**
 * Executes one external command. Injected into apply paths so tests can run
 * them against a recording stub instead of mutating the real machine.
 */
export type CommandRunner = (
  argv: string[],
  env?: Record<string, string>,
) => Promise<CommandResult>
