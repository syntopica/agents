import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Write a stand-in tadu that prints fixed output and exits with a fixed status.
 *
 * @param {number} exit - Exit status of the fake.
 * @param {string} stdout - Text it prints; must not contain a single quote.
 * @returns {string} - Absolute path of the executable.
 */
export const makeFakeTadu = (exit: number, stdout: string): string => {
  const bin = path.join(mkdtempSync(path.join(tmpdir(), 'tadu-bin-')), 'tadu')
  writeFileSync(
    bin,
    `#!/bin/sh\nprintf '%s' '${stdout}'\nexit ${String(exit)}\n`,
  )
  chmodSync(bin, 0o755)
  return bin
}
