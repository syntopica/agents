import { accessSync, constants } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'

export const resolveAgentCliExecutable = (
  name: 'claude' | 'codex',
  home: string,
  env: NodeJS.ProcessEnv = process.env,
  isExecutable: (path: string) => boolean = (path) => {
    try {
      accessSync(path, constants.X_OK)
      return true
    } catch {
      return false
    }
  },
): string => {
  const candidates = [
    join(home, '.local', 'bin', name),
    ...(env['PATH'] ?? '')
      .split(delimiter)
      .filter((directory) => isAbsolute(directory))
      .map((directory) => join(directory, name)),
  ]
  return candidates.find(isExecutable) ?? name
}
