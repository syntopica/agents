import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { parseSecurityManifest } from './parseSecurityManifest'

void test('the tracked security manifest preserves explicit profile boundaries', async () => {
  const raw = JSON.parse(
    await readFile(
      join(import.meta.dirname, 'fixtures', 'securityManifestExample.json'),
      'utf8',
    ),
  ) as unknown

  const parsed = parseSecurityManifest(raw)

  assert.equal(parsed.ok, true)
})

void test('remote control requires a documented exception reason', () => {
  const parsed = parseSecurityManifest({
    version: 1,
    claude: {
      profiles: ['claude-personal', 'claude-secondary'],
      defaultMode: 'auto',
      skipDangerousModePermissionPrompt: true,
      remoteControlAtStartup: true,
    },
    codex: { forcedLoginMethod: 'chatgpt' },
  })

  assert.equal(parsed.ok, false)
  assert.equal(
    parsed.errors.some((error) => error.includes('ExceptionReason')),
    true,
  )
})

void test('credential-shaped fields and values are rejected without echoing values', () => {
  const credential = 'sk-example123456789'
  const parsed = parseSecurityManifest({
    version: 1,
    claude: {
      profiles: ['claude-personal', 'claude-secondary'],
      defaultMode: 'auto',
      skipDangerousModePermissionPrompt: true,
      remoteControlAtStartup: false,
      apiKey: credential,
    },
    codex: { forcedLoginMethod: 'chatgpt', note: credential },
  })

  assert.equal(parsed.ok, false)
  assert.equal(JSON.stringify(parsed).includes(credential), false)
  assert.equal(
    parsed.errors.some((error) => error.includes('credential-shaped field')),
    true,
  )
  assert.equal(
    parsed.errors.some((error) => error.includes('credential literal')),
    true,
  )
})
