import { GLOBAL_INSTRUCTIONS } from './GLOBAL_INSTRUCTIONS'

export const GEMINI_HEADER_INTRO = [
  '## Index-only',
  '',
  'This file lists rule references only. Content is not inlined.',
  'Use `@.agent/rules/*.md` and `@.agent/workflows/*.md` to load synced Antigravity content.',
  'If your IDE does not resolve these references, ensure rules are synced to `~/.gemini/.agent/`.',
  '',
  ...GLOBAL_INSTRUCTIONS,
].join('\n')
