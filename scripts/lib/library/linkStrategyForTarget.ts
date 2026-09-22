import { IDE_REGISTRY } from '../link/constants/IDE_REGISTRY'
import type { SkillTarget } from './types/SkillTarget'

/**
 * How a target takes its skills. Antigravity copies rather than symlinks: it
 * reads `~/.gemini/config/skills` without following links, so a symlinked
 * skill is invisible to it. The registry is the single declaration of that,
 * and anything it does not mark stays on the symlink path.
 */
export const linkStrategyForTarget = (target: SkillTarget) =>
  IDE_REGISTRY.find(({ id }) => id === target)?.linkStrategy === 'copy'
    ? 'copy'
    : 'symlink'
