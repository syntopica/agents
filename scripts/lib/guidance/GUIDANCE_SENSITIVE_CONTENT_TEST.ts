import assert from 'node:assert/strict'
import test from 'node:test'
import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'

void test('Codex OAuth tokens and JSON credential fields are rejected', () => {
  const jwt = `eyJ${'a'.repeat(12)}.${'b'.repeat(12)}.${'c'.repeat(12)}`
  for (const value of [
    jwt,
    `Bearer ${'oauth'.repeat(8)}`,
    JSON.stringify({ access_token: jwt }),
    JSON.stringify({ id_token: jwt }),
    JSON.stringify({ refresh_token: 'refresh-token-material' }),
  ])
    assert.equal(containsSensitiveGuidanceContent(value), true)
})

void test('ordinary guidance about credential handling remains valid', () => {
  assert.equal(
    containsSensitiveGuidanceContent(
      'Never print credential values. Inspect authentication metadata only.',
    ),
    false,
  )
})

void test('the 1Password product name is not a password label', () => {
  assert.equal(
    containsSensitiveGuidanceContent(
      'Never store one outside 1Password: a key goes into the vault.',
    ),
    false,
  )
  assert.equal(containsSensitiveGuidanceContent('password: hunter2'), true)
  assert.equal(containsSensitiveGuidanceContent('db_password=hunter2'), true)
})
