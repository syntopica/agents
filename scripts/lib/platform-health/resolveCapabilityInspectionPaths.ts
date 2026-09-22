import { join } from 'node:path'
import { CANONICAL_HOOKS_DIR } from '../link/constants/CANONICAL_HOOKS_DIR'
import { CANONICAL_SKILLS_DIR } from '../link/constants/CANONICAL_SKILLS_DIR'
import { IDE_REGISTRY } from '../link/constants/IDE_REGISTRY'
import { IDE_RULE_TARGETS } from '../link/constants/IDE_RULE_TARGETS'
import { resolveSecondaryProfileDir } from '../machine/instance/resolveSecondaryProfileDir'
import type { CapabilityInspectionPaths } from './types/CapabilityInspectionPaths'

export const resolveCapabilityInspectionPaths = (
  registryId: string,
  home: string,
  env: NodeJS.ProcessEnv,
): CapabilityInspectionPaths => {
  const ide = IDE_REGISTRY.find(({ id }) => id === registryId)
  const ruleId = registryId === 'gemini-cli' ? 'antigravity' : registryId
  const ruleTarget = IDE_RULE_TARGETS.find(
    ({ ide: target }) => target.id === ruleId,
  )
  const canonicalSkillReaders = new Set([
    'codex',
    'cursor',
    'gemini-cli',
    'trae',
    'windsurf',
  ])
  const skillsDir = canonicalSkillReaders.has(registryId)
    ? CANONICAL_SKILLS_DIR
    : ide?.skillsDir
  const mcpConfigs: Record<string, string> = {
    claude: join(home, '.claude.json'),
    codex: join(home, '.codex', 'config.toml'),
    'gemini-cli': join(home, '.gemini', 'settings.json'),
    antigravity: join(home, '.gemini', 'settings.json'),
    cursor: join(home, '.cursor', 'mcp.json'),
  }
  const hookPaths =
    registryId === 'claude' || registryId === 'codex'
      ? [
          join(CANONICAL_HOOKS_DIR, 'session-start-brp-reminder.sh'),
          join(CANONICAL_HOOKS_DIR, 'stop-verification-gate.sh'),
          join(CANONICAL_HOOKS_DIR, 'user-prompt-skill-router.sh'),
        ]
      : undefined

  return {
    ...(skillsDir === undefined ? {} : { skillsDir }),
    ...(ruleTarget === undefined
      ? {}
      : { rulePaths: ruleTarget.links.map(({ target }) => target) }),
    ...(hookPaths === undefined ? {} : { hookPaths }),
    ...(registryId === 'claude'
      ? { pluginSettingsPath: join(home, '.claude', 'settings.json') }
      : {}),
    ...(mcpConfigs[registryId] === undefined
      ? {}
      : { mcpConfigPath: mcpConfigs[registryId] }),
    ...(registryId === 'claude'
      ? {
          securitySettingsPaths: [
            join(home, '.claude', 'settings.json'),
            join(home, resolveSecondaryProfileDir(env), 'settings.json'),
          ],
        }
      : {}),
  }
}
