import type { CommandRunner } from '../types/CommandRunner'

/**
 * A CommandRunner that records invocations instead of executing them, so apply
 * paths can be tested without mutating the machine. `fails` marks the argv
 * positions (matched on the second word) that should report failure.
 */
export const createRecordingRunner = (fails: string[] = []) => {
  const calls: { argv: string[]; env?: Record<string, string> }[] = []

  const run: CommandRunner = (argv, env) => {
    calls.push({ argv, ...(env === undefined ? {} : { env }) })
    const failing = argv.some((word) => fails.includes(word))

    return Promise.resolve({
      ok: !failing,
      output: failing ? 'command failed' : '',
    })
  }

  return { calls, run }
}
