import { join } from 'node:path'
import type { GuidanceTargetsOptions } from './types/GuidanceTargetsOptions'

export const guidanceTargets = (options: GuidanceTargetsOptions) => ({
  'canonical/shared.md': join(options.canonicalDir, 'shared.md'),
  'canonical/claude-overlay.md': join(
    options.canonicalDir,
    'claude-overlay.md',
  ),
  'canonical/codex-overlay.md': join(options.canonicalDir, 'codex-overlay.md'),
  'live/claude/CLAUDE.md': join(options.home, '.claude', 'CLAUDE.md'),
  'live/codex/AGENTS.md': join(options.home, '.codex', 'AGENTS.md'),
  'state/accepted.json': join(options.stateDir, 'accepted.json'),
})
