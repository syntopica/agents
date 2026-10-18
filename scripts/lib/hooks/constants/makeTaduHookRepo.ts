import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Create a throwaway repository root holding a backlog file, as the tadu doctor
 * hook needs one before it checks anything.
 *
 * @returns {string} - Absolute path of the new directory.
 */
export const makeTaduHookRepo = (): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tadu-hook-'))
  writeFileSync(path.join(dir, 'TODO.md'), '# TODO\n')
  return dir
}
