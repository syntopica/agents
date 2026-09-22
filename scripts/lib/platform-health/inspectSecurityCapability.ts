import { readFile } from 'node:fs/promises'
import { hasSafeClaudePolicy } from './hasSafeClaudePolicy'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectSecurityCapability = async (
  settingsPaths: string[] | undefined,
): Promise<CapabilityHealth> => {
  if (settingsPaths === undefined) {
    return {
      capability: 'security',
      status: 'unsupported',
      summary: 'no security adapter',
      findings: [],
    }
  }

  const findings: string[] = []
  for (const settingsPath of settingsPaths) {
    try {
      const settings = JSON.parse(
        await readFile(settingsPath, 'utf8'),
      ) as Record<string, unknown>
      if (!hasSafeClaudePolicy(settings)) findings.push(settingsPath)
    } catch {
      findings.push(settingsPath)
    }
  }

  return findings.length === 0
    ? {
        capability: 'security',
        status: 'healthy',
        summary: 'owned Claude security policy is applied',
        findings: [],
      }
    : {
        capability: 'security',
        status: 'failed',
        summary: 'owned Claude security policy is missing or invalid',
        findings,
      }
}
