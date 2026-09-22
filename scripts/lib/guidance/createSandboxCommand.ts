import { existsSync } from 'node:fs'
import { pathContainsPath } from './pathContainsPath'

export const createSandboxCommand = (options: {
  platform: NodeJS.Platform
  scratchDir: string
  readDenyRoot?: string
  readAllowPaths?: string[]
  command: string
  args: string[]
  pathExists?: (path: string) => boolean
}): { executable: string; args: string[] } => {
  if (options.platform === 'darwin') {
    const readDenyRoot = options.readDenyRoot
    if (
      readDenyRoot !== undefined &&
      options.readAllowPaths?.some((path) =>
        pathContainsPath(path, readDenyRoot),
      ) === true
    )
      throw new Error(
        'agent read allowlist cannot contain the denied home root',
      )
    const denyRead =
      readDenyRoot === undefined
        ? ''
        : ` (deny file-read-data (subpath "${readDenyRoot.replaceAll('"', '\\"')}"))`
    const allowedReadPaths = [
      options.command,
      ...(options.readAllowPaths ?? []),
    ]
      .map(
        (path) =>
          ` (allow file-read-data (literal "${path.replaceAll('"', '\\"')}") (subpath "${path.replaceAll('"', '\\"')}"))`,
      )
      .join('')
    const profile = `(version 1) (allow default) (deny file-write*) (allow file-write* (subpath "${options.scratchDir}"))${denyRead}${allowedReadPaths}`
    return {
      executable: '/usr/bin/sandbox-exec',
      args: ['-p', profile, options.command, ...options.args],
    }
  }
  if (options.platform === 'linux') {
    if (options.readDenyRoot !== undefined)
      throw new Error('required Linux home read isolation is unavailable')
    if (!(options.pathExists ?? existsSync)('/usr/bin/bwrap'))
      throw new Error('required Linux sandbox runtime bwrap is unavailable')
    return {
      executable: '/usr/bin/bwrap',
      args: [
        '--die-with-parent',
        '--ro-bind',
        '/',
        '/',
        '--bind',
        options.scratchDir,
        options.scratchDir,
        '--chdir',
        '/',
        options.command,
        ...options.args,
      ],
    }
  }
  throw new Error(`unsupported sandbox platform: ${options.platform}`)
}
