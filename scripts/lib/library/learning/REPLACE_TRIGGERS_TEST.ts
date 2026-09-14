import assert from 'node:assert/strict'
import test from 'node:test'
import { STALE_TRIGGER_MANIFEST as stale } from './fixtures/STALE_TRIGGER_MANIFEST'
import { replaceTriggersInManifest } from './replaceTriggersInManifest'

void test('a fresh scan replaces stale triggers instead of accumulating them', () => {
  const next = replaceTriggersInManifest(
    stale,
    { 'frontend-design': ['arregla el design del layout'] },
    { 'frontend-design': 'frontend-design' },
    8,
  )
  assert.deepEqual(next.entries['frontend-design']?.triggers, [
    'arregla el design del layout',
  ])
})

void test('a skill the scan no longer attributes loses its triggers entirely', () => {
  const next = replaceTriggersInManifest(stale, {}, {}, 8)
  assert.equal(next.entries['core/brp-docs']?.triggers, undefined)
})

void test('entries that never had triggers are left byte-identical', () => {
  const next = replaceTriggersInManifest(stale, {}, {}, 8)
  assert.deepEqual(next.entries['untouched'], { state: 'parked', reason: 'x' })
})

void test('the cap applies on replacement too', () => {
  const next = replaceTriggersInManifest(
    stale,
    { 'frontend-design': ['a', 'b', 'c'] },
    { 'frontend-design': 'frontend-design' },
    2,
  )
  assert.equal(next.entries['frontend-design']?.triggers?.length, 2)
})
