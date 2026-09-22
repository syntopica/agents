import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { runPatchCommand } from './runPatchCommand'
import type { CurationEntry } from './types/CurationEntry'
import type { PatchOutcome } from './types/PatchOutcome'

export const reapplyPatch = async (
  skill: string,
  entry: CurationEntry,
  libraryDir: string,
  currentHash: string | undefined,
): Promise<PatchOutcome> => {
  if (entry.patch === undefined) {
    return { kind: 'missing-patch', skill, path: '(none declared)' }
  }

  const patchPath = join(libraryDir, entry.patch)
  const exists = await fs
    .access(patchPath)
    .then(() => true)
    .catch(() => false)

  if (!exists) {
    return { kind: 'missing-patch', skill, path: patchPath }
  }

  if (currentHash !== undefined && currentHash === entry.upstreamHash) {
    return { kind: 'already-current', skill }
  }

  const check = await runPatchCommand(
    ['apply', '--check', patchPath],
    libraryDir,
  )

  if (check.code !== 0) {
    return {
      kind: 'conflict',
      skill,
      detail: check.stderr.trim().split('\n')[0] ?? 'apply --check failed',
    }
  }

  const applied = await runPatchCommand(['apply', patchPath], libraryDir)

  if (applied.code !== 0) {
    return {
      kind: 'conflict',
      skill,
      detail: applied.stderr.trim().split('\n')[0] ?? 'apply failed',
    }
  }

  return { kind: 'applied', skill }
}
