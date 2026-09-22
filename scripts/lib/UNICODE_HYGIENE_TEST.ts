import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { isHiddenUnicode } from './isHiddenUnicode'

/**
 * Fails when any tracked text file carries invisible Unicode (variation
 * selectors or zero-width characters). The repo's text-hygiene rule mandates
 * ASCII, so the scan is strict: no allowlist, emoji included.
 */

void test('no tracked file contains variation selectors or zero-width characters', () => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  )
  const tracked = execFileSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)

  const offenders: string[] = []
  for (const file of tracked) {
    const bytes = readFileSync(path.join(repoRoot, file))
    if (bytes.includes(0)) continue
    for (const char of bytes.toString('utf8')) {
      if (isHiddenUnicode(char.codePointAt(0) ?? 0)) {
        offenders.push(file)
        break
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `hidden Unicode found in: ${offenders.join(', ')}`,
  )
})
