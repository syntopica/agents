import { delimiter, join } from 'node:path'

export const createManagedAgentCliEnvironment = (
  home: string,
  env: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => ({
  ...env,
  PATH: [join(home, '.local', 'bin'), env['PATH']]
    .filter(Boolean)
    .join(delimiter),
})
