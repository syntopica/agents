import { constants, promises as fs } from 'node:fs'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectHookCapability = async (
  paths: string[] | undefined,
): Promise<CapabilityHealth> => {
  if (paths === undefined) {
    return {
      capability: 'hooks',
      status: 'unsupported',
      summary: 'no hooks adapter',
      findings: [],
    }
  }

  const unavailable: string[] = []
  for (const path of paths) {
    const executable = await fs
      .access(path, constants.X_OK)
      .then(() => true)
      .catch(() => false)
    if (!executable) unavailable.push(path)
  }

  return {
    capability: 'hooks',
    status: unavailable.length === 0 ? 'healthy' : 'failed',
    summary: `${String(paths.length - unavailable.length)} of ${String(paths.length)} hooks executable`,
    findings: unavailable,
  }
}
