import { promises as fs } from 'node:fs'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectPluginCapability = async (
  settingsPath: string | undefined,
): Promise<CapabilityHealth> => {
  if (settingsPath === undefined) {
    return {
      capability: 'plugins',
      status: 'unsupported',
      summary: 'no plugins adapter',
      findings: [],
    }
  }

  try {
    const settings = JSON.parse(
      await fs.readFile(settingsPath, 'utf8'),
    ) as Record<string, unknown>
    const enabled = settings['enabledPlugins']
    const count =
      typeof enabled === 'object' && enabled !== null
        ? Object.keys(enabled).length
        : 0
    return {
      capability: 'plugins',
      status: 'healthy',
      summary: `${String(count)} plugin declarations readable`,
      findings: [],
    }
  } catch {
    return {
      capability: 'plugins',
      status: 'failed',
      summary: 'plugin settings are unreadable',
      findings: [settingsPath],
    }
  }
}
