import assert from 'node:assert/strict'
import test from 'node:test'
import { applyTransition } from './applyTransition'
import type { CurationManifest } from './types/CurationManifest'

export const NESTED_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    'engineering-skills': {
      state: 'parked',
      reason: 'not judged',
      source: 'alirezarezvani/claude-skills',
      sourceUrl: 'https://github.com/alirezarezvani/claude-skills.git',
      upstreamHash: 'abc123',
    },
  },
}

void test('a nested skill can be adopted without adopting its whole bundle', () => {
  const result = applyTransition(
    NESTED_MANIFEST,
    'engineering-skills/google-workspace-cli',
    'adopted',
    { reason: '17 measured Gmail requests' },
    '2026-08-18',
  )
  assert.ok(result.ok)
  assert.equal(
    result.manifest.entries['engineering-skills/google-workspace-cli']?.state,
    'adopted',
  )
  assert.equal(result.manifest.entries['engineering-skills']?.state, 'parked')
  assert.equal(Object.keys(result.manifest.entries).length, 2)
})

void test("the nested entry inherits its parent's provenance", () => {
  const result = applyTransition(
    NESTED_MANIFEST,
    'engineering-skills/senior-devops',
    'adopted',
    { reason: 'deployment work' },
    '2026-08-18',
  )
  assert.ok(result.ok)
  const entry = result.manifest.entries['engineering-skills/senior-devops']
  assert.ok(entry)
  assert.equal(entry.source, 'alirezarezvani/claude-skills')
  assert.equal(entry.upstreamHash, 'abc123')
})

void test('a nested skill under an unknown bundle is refused', () => {
  const result = applyTransition(
    NESTED_MANIFEST,
    'nope/whatever',
    'adopted',
    {},
    '2026-08-18',
  )
  assert.ok(!result.ok)
  assert.match(result.error, /not in the library/)
})
