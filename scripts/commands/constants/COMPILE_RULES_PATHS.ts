import path from 'node:path'

export const COMPILE_RULES_PATHS = {
  SOURCE_DIR: path.join(process.cwd(), 'src', 'rules'),
  CURSOR_DIR: path.join(process.cwd(), 'dist', 'global', '.cursor', 'rules'),
  CLAUDE_RULES_DIR: path.join(
    process.cwd(),
    'dist',
    'global',
    '.claude',
    'rules',
  ),
  ANTIGRAVITY_DIR: path.join(
    process.cwd(),
    'dist',
    'global',
    '.agent',
    'rules',
  ),
  WINDSURF_DIR: path.join(
    process.cwd(),
    'dist',
    'global',
    '.windsurf',
    'rules',
  ),
  CODEX_RULES_DIR: path.join(process.cwd(), 'dist', 'global', 'codex', 'rules'),
  CODEX_DEFAULT_RULES_PATH: path.join(
    process.cwd(),
    'dist',
    'global',
    'codex',
    'rules',
    'default.rules',
  ),
  CLAUDE_PATH: path.join(process.cwd(), 'dist', 'markdown', 'CLAUDE.md'),
  AGENTS_PATH: path.join(process.cwd(), 'dist', 'markdown', 'AGENTS.md'),
  GEMINI_PATH: path.join(process.cwd(), 'dist', 'markdown', 'GEMINI.md'),
  WINDSURF_PATH: path.join(process.cwd(), 'dist', 'markdown', 'WINDSURF.md'),
  ALL_RULES_PATH: path.join(process.cwd(), 'dist', 'markdown', 'ALL_RULES.md'),
} as const
