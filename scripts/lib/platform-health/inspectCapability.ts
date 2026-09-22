import { inspectHookCapability } from './inspectHookCapability'
import { inspectMcpCapability } from './inspectMcpCapability'
import { inspectPluginCapability } from './inspectPluginCapability'
import { inspectRuleCapability } from './inspectRuleCapability'
import { inspectSecurityCapability } from './inspectSecurityCapability'
import { inspectSkillCapability } from './inspectSkillCapability'
import type { CapabilityHealth } from './types/CapabilityHealth'
import type { CapabilityInspectionPaths } from './types/CapabilityInspectionPaths'
import type { PlatformCapability } from './types/PlatformCapability'

export const inspectCapability = async (
  capability: PlatformCapability,
  paths: CapabilityInspectionPaths,
): Promise<CapabilityHealth> => {
  if (capability === 'skills') return inspectSkillCapability(paths.skillsDir)
  if (capability === 'rules') return inspectRuleCapability(paths.rulePaths)
  if (capability === 'hooks') return inspectHookCapability(paths.hookPaths)
  if (capability === 'plugins')
    return inspectPluginCapability(paths.pluginSettingsPath)
  if (capability === 'mcp') return inspectMcpCapability(paths.mcpConfigPath)
  return inspectSecurityCapability(paths.securitySettingsPaths)
}
