import assert from 'node:assert/strict'
import test from 'node:test'
import { validateLaneSkills } from './validators/validateLaneSkills'

void test('a lane referencing a missing skill fails reachability', () => {
  const errors = validateLaneSkills(
    { debug: ['superpowers:systematic-debugging'] },
    'codex',
    { version: 1, entries: {} },
    [],
  )

  assert.deepEqual(errors, [
    'debug: superpowers:systematic-debugging is unreachable for codex',
  ])
})

void test('a logical skill resolves through its target alias', () => {
  const manifest = {
    version: 1,
    entries: {
      'superpowers:systematic-debugging': {
        state: 'adopted' as const,
        aliases: { codex: 'superpowers-systematic-debugging' },
      },
    },
  }
  const errors = validateLaneSkills(
    { debug: ['superpowers:systematic-debugging'] },
    'codex',
    manifest,
    [
      {
        logicalName: 'superpowers:systematic-debugging',
        curationKey: 'superpowers:systematic-debugging',
        target: 'codex',
        targetName: 'superpowers-systematic-debugging',
      },
    ],
  )

  assert.deepEqual(errors, [])
})

void test('a policy-only lane is explicitly reachable without inventing a skill', () => {
  assert.deepEqual(
    validateLaneSkills(
      { 'environment-ops': 'policy-only' },
      'codex',
      { version: 1, entries: {} },
      [],
    ),
    [],
  )
})
