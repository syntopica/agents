import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSecondaryProfileDir } from './resolveSecondaryProfileDir'

void test('resolveSecondaryProfileDir prefers the declared directory', () => {
  assert.equal(
    resolveSecondaryProfileDir({ CLAUDE_SECONDARY_CONFIG_DIR: '.claude-work' }),
    '.claude-work',
  )
})

void test('resolveSecondaryProfileDir falls back to a name that identifies nobody', () => {
  assert.equal(resolveSecondaryProfileDir({}), '.claude-secondary')
})
