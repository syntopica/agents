import { promises as fs } from 'node:fs'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectRuleCapability = async (
  paths: string[] | undefined,
): Promise<CapabilityHealth> => {
  if (paths === undefined) {
    return {
      capability: 'rules',
      status: 'unsupported',
      summary: 'no rules adapter',
      findings: [],
    }
  }

  const missing: string[] = []
  for (const path of paths) {
    const readable = await fs
      .access(path)
      .then(() => true)
      .catch(() => false)
    if (!readable) missing.push(path)
  }

  return {
    capability: 'rules',
    status: missing.length === 0 ? 'healthy' : 'failed',
    summary: `${String(paths.length - missing.length)} of ${String(paths.length)} rule targets readable`,
    findings: missing,
  }
}
