import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CommandRunner } from '../../exec/types/CommandRunner'
import { collectDriftedUnits } from './collectDriftedUnits'
import { reloadServiceUnit } from './reloadServiceUnit'
import type { ServicesApplyResult } from './types/ServicesApplyResult'
import type { ServicesManifest } from './types/ServicesManifest'
import type { ServicesPaths } from './types/ServicesPaths'
import type { ServicesState } from './types/ServicesState'

/**
 * Writes every drifted unit file, then loads it in its init system. Undeclared
 * units are never removed: the planner emits only create and update, so the
 * hand-written LaunchAgents stay untouched until they are declared.
 */
export const apply = async ({
  manifest,
  paths,
  state,
  uid,
  run,
}: {
  manifest: ServicesManifest
  paths: ServicesPaths
  state: ServicesState
  uid: number
  run: CommandRunner
}): Promise<ServicesApplyResult> => {
  const result: ServicesApplyResult = { written: [], reloaded: [], failed: [] }
  const drifted = collectDriftedUnits({
    manifest,
    platform: paths.platform,
    state,
  })

  if (drifted.length === 0) {
    return result
  }

  await mkdir(paths.directory, { recursive: true })

  for (const unit of drifted) {
    await writeFile(join(paths.directory, unit.file), unit.contents)
    result.written.push(unit.file)
  }

  if (paths.platform === 'systemd') {
    const reloaded = await run(['systemctl', '--user', 'daemon-reload'])

    if (!reloaded.ok) {
      result.failed.push(`daemon-reload: ${reloaded.output}`)
    }
  }

  for (const unit of drifted) {
    const error = await reloadServiceUnit({
      platform: paths.platform,
      unitPath: join(paths.directory, unit.file),
      unitFile: unit.file,
      uid,
      hasTimer: unit.hasTimer,
      run,
    })

    if (error === undefined) {
      result.reloaded.push(unit.file)
    } else {
      result.failed.push(`${unit.file}: ${error}`)
    }
  }

  return result
}
