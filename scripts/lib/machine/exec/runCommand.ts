import { execFile } from 'node:child_process'
import type { CommandRunner } from './types/CommandRunner'

export const runCommand: CommandRunner = (argv, env) =>
  new Promise((resolve) => {
    const [command, ...args] = argv

    if (command === undefined) {
      resolve({ ok: false, output: 'empty command' })
      return
    }

    execFile(
      command,
      args,
      { env: { ...process.env, ...env }, timeout: 300_000 },
      (error, stdout, stderr) => {
        resolve({
          ok: error === null,
          output: [stdout, stderr, error?.message]
            .filter(Boolean)
            .join('\n')
            .trim(),
        })
      },
    )
  })
