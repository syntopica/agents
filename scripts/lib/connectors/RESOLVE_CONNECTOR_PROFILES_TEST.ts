import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveConnectorProfiles } from './resolveConnectorProfiles'

void test('the default connector doctor profiles include both Claude profiles and Codex', () => {
  assert.deepEqual(resolveConnectorProfiles(undefined), [
    'claude-personal',
    'claude-secondary',
    'codex',
  ])
})

void test('the Codex connector doctor profile can be selected explicitly', () => {
  assert.deepEqual(resolveConnectorProfiles('codex'), ['codex'])
})
