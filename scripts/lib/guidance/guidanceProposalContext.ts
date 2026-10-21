import { join, resolve } from 'node:path'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'

export const guidanceProposalContext = (
  options: GuidanceSyncOptions,
): Record<string, string> => ({
  home: resolve(options.home),
  canonicalDir: resolve(options.canonicalDir),
  stateDir: resolve(options.stateDir),
  rulesInventoryPath: resolve(
    options.rulesInventoryPath ??
      join(process.cwd(), 'dist', 'markdown', 'CLAUDE.md'),
  ),
})
