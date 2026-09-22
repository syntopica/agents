import { GLOBAL_INSTRUCTIONS } from './GLOBAL_INSTRUCTIONS'

export const CLAUDE_HEADER_INTRO = [
  '## Tiers',
  '',
  '- Tier 0: this file (index-only).',
  '- Tier 1/2: full rules in `.claude/rules/` (loaded on demand).',
  '',
  '## How to use (bootstrap)',
  '',
  '- Use `@rules/<path>.mdc` references (or your local tag conventions) to load full rule content on demand.',
  '- Full rule content is synced to `.claude/rules/` and also exists in the project rule sources.',
  '- Keep this file lean: it is always loaded and impacts performance.',
  '',
  ...GLOBAL_INSTRUCTIONS,
].join('\n')
