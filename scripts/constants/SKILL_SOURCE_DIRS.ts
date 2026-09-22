import { INSTANCE_SKILLS_DIR } from './INSTANCE_SKILLS_DIR'
import { SRC_SKILLS_DIR } from './SRC_SKILLS_DIR'

/**
 * Every root a source skill can come from, engine first. Order matters only
 * for error messages: a name defined in both roots is rejected rather than
 * resolved, because silently shadowing an engine skill with a private one is
 * how a machine stops matching its own repository.
 */
export const SKILL_SOURCE_DIRS =
  INSTANCE_SKILLS_DIR === undefined
    ? [SRC_SKILLS_DIR]
    : [SRC_SKILLS_DIR, INSTANCE_SKILLS_DIR]
