import { findCommandOnPath } from './findCommandOnPath'
import { findExistingPath } from './findExistingPath'
import type { PlatformDefinition } from './types/PlatformDefinition'
import type { PlatformRuntimeState } from './types/PlatformRuntimeState'
import type { ProbeResult } from './types/ProbeResult'

export const detectPlatformRuntime = async (
  platform: PlatformDefinition,
  options: { env: NodeJS.ProcessEnv; home: string },
): Promise<PlatformRuntimeState> => {
  const commands = await Promise.all(
    (platform.probe.commands ?? []).map(
      async (candidate): Promise<ProbeResult> => {
        const resolvedPath = await findCommandOnPath(
          candidate,
          options.env['PATH'],
        )
        return {
          kind: 'command',
          candidate,
          found: resolvedPath !== undefined,
          ...(resolvedPath === undefined ? {} : { resolvedPath }),
        }
      },
    ),
  )
  const apps = await Promise.all(
    (platform.probe.appPaths ?? []).map(
      async (candidate): Promise<ProbeResult> => {
        const resolvedPath = await findExistingPath(candidate, options.home)
        return {
          kind: 'app',
          candidate,
          found: resolvedPath !== undefined,
          ...(resolvedPath === undefined ? {} : { resolvedPath }),
        }
      },
    ),
  )
  const configs = await Promise.all(
    platform.probe.configPaths.map(async (candidate): Promise<ProbeResult> => {
      const resolvedPath = await findExistingPath(candidate, options.home)
      return {
        kind: 'config',
        candidate,
        found: resolvedPath !== undefined,
        ...(resolvedPath === undefined ? {} : { resolvedPath }),
      }
    }),
  )
  const probes = [...commands, ...apps, ...configs]
  const runtimeFound = probes.some(
    ({ found, kind }) => found && (kind === 'command' || kind === 'app'),
  )
  const configFound = probes.some(
    ({ found, kind }) => found && kind === 'config',
  )
  let lifecycle: PlatformRuntimeState['lifecycle'] = 'unavailable'
  if (runtimeFound) lifecycle = 'active'
  else if (configFound) lifecycle = 'provisioned'

  return {
    registryId: platform.registryId,
    lifecycle,
    probes,
  }
}
