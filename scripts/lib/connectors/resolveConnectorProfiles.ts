import type { ConnectorProfile } from './types/ConnectorProfile'

export const resolveConnectorProfiles = (
  requested: string | undefined,
): ConnectorProfile[] => {
  if (requested === 'personal' || requested === 'claude-personal')
    return ['claude-personal']
  if (requested === 'secondary' || requested === 'claude-secondary')
    return ['claude-secondary']
  if (requested === 'codex') return ['codex']
  return ['claude-personal', 'claude-secondary', 'codex']
}
