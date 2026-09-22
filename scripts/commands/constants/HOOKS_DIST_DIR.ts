import path from 'node:path'

/** Built hook artifacts emitted by plugins:compile. */
export const HOOKS_DIST_DIR = path.join(
  process.cwd(),
  'dist',
  'plugins',
  'claude',
  'hooks',
)
