import path from 'node:path'
import { findIde } from '../operations/findIde'
import type { RuleTarget } from '../types/RuleTarget'
import { HOME } from './HOME'
import { ROOT } from './ROOT'

export const IDE_RULE_TARGETS: RuleTarget[] = [
  {
    ide: findIde('cursor'),
    cleanup: {
      dir: path.join(HOME, '.cursor', 'rules'),
      prefix: 'busirocket-',
    },
    links: [
      {
        source: path.join(ROOT, 'dist', 'global', '.cursor', 'rules'),
        target: path.join(HOME, '.cursor', 'rules', 'rocket-agents'),
        method: 'symlink',
      },
    ],
  },
  {
    ide: findIde('claude'),
    // NOTE: ~/.claude/CLAUDE.md is intentionally NOT linked. It is a hand-maintained
    // lean always-on file (atomic-file rule, commit hygiene, memory convention).
    // Claude Code loads ~/.claude/rules/** natively; the rules below carry `paths:`
    // frontmatter (from each source .mdc `globs:`) so they load lazily, only when
    // matching files are opened. Linking the generated index here would clobber the
    // lean file and re-introduce eager context.
    links: [
      {
        source: path.join(ROOT, 'dist', 'global', '.claude', 'rules'),
        target: path.join(HOME, '.claude', 'rules', 'rocket-agents'),
        method: 'symlink',
      },
    ],
  },
  {
    ide: findIde('codex'),
    links: [
      {
        source: path.join(
          ROOT,
          'dist',
          'global',
          'codex',
          'rules',
          'default.rules',
        ),
        target: path.join(HOME, '.codex', 'rules', 'default.rules'),
        method: 'copy',
      },
    ],
  },
  {
    ide: findIde('antigravity'),
    links: [
      {
        source: path.join(ROOT, 'dist', 'markdown', 'GEMINI.md'),
        target: path.join(HOME, '.gemini', 'GEMINI.md'),
        method: 'copy',
      },
      {
        source: path.join(ROOT, 'dist', 'global', '.agent', 'rules'),
        target: path.join(HOME, '.gemini', '.agent', 'rules'),
        method: 'copy',
      },
      {
        source: path.join(ROOT, 'dist', 'global', '.agent', 'workflows'),
        target: path.join(HOME, '.gemini', '.agent', 'workflows'),
        method: 'copy',
      },
    ],
  },
  {
    ide: findIde('windsurf'),
    links: [
      {
        source: path.join(ROOT, 'src', 'core', 'windsurf-global-rules.md'),
        target: path.join(
          HOME,
          '.codeium',
          'windsurf',
          'memories',
          'global_rules.md',
        ),
        method: 'copy',
      },
    ],
  },
]
