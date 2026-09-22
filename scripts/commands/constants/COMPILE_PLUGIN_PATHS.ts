import path from 'node:path'

export const COMPILE_PLUGIN_PATHS = {
  CLAUDE_PLUGIN_ROOT: path.join(process.cwd(), 'dist', 'plugins', 'claude'),
  CLAUDE_PLUGIN_MANIFEST_DIR: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    '.claude-plugin',
  ),
  CLAUDE_PLUGIN_MANIFEST_PATH: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    '.claude-plugin',
    'plugin.json',
  ),
  CLAUDE_PLUGIN_MARKETPLACE_PATH: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    '.claude-plugin',
    'marketplace.json',
  ),
  CLAUDE_PLUGIN_SKILLS_DIR: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    'skills',
  ),
  CLAUDE_PLUGIN_AGENTS_DIR: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    'agents',
  ),
  CLAUDE_PLUGIN_HOOKS_DIR: path.join(
    process.cwd(),
    'dist',
    'plugins',
    'claude',
    'hooks',
  ),
  PACKAGE_JSON_PATH: path.join(process.cwd(), 'package.json'),
} as const
