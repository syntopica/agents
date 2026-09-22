import { spawn } from 'node:child_process'
import { toProfileEnv } from './toProfileEnv'

/**
 * Each profile gets an explicitly built environment. The personal probe used to
 * simply omit the `CLAUDE_CONFIG_DIR` override, which meant it inherited one
 * from the launching session: run from a secondary session, the doctor listed
 * the secondary profile's servers and reported them as claude-personal's, so personal-only
 * connectors read as missing.
 */
export const runClaudeMcpList = (
  profile: 'claude-personal' | 'claude-secondary',
  home: string,
  executable = 'claude',
): Promise<string> =>
  new Promise((resolve, reject) => {
    const env = toProfileEnv(profile, home, process.env)
    const child = spawn(executable, ['mcp', 'list'], { env, shell: false })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-65_536)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-65_536)
    })
    child.on('error', reject)
    child.on('close', () => {
      resolve(output)
    })
  })
