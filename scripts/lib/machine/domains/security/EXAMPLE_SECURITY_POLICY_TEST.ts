import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parseSecurityManifest } from './parseSecurityManifest'

void test('public security examples require explicit operator opt-in for exceptions', async () => {
  const parsed = parseSecurityManifest(
    JSON.parse(
      await readFile(
        new URL(
          '../../../../../examples/machine/security.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ) as unknown,
  )

  assert.equal(parsed.ok, true)
  assert.equal(parsed.manifest.claude.skipDangerousModePermissionPrompt, false)
  assert.equal(parsed.manifest.claude.remoteControlAtStartup, false)
})
