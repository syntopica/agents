import assert from 'node:assert/strict'
import test from 'node:test'
import { LOCK_FIXTURE } from './fixtures/LOCK_FIXTURE'
import { seedManifestFromLock } from './seedManifestFromLock'

void test('a vendored skill is seeded as parked with a stated reason', () => {
  const entry = seedManifestFromLock(LOCK_FIXTURE, []).entries[
    'algorithmic-art'
  ]
  assert.ok(entry)
  assert.equal(entry.state, 'parked')
  assert.match(entry.reason ?? '', /not yet judged/i)
})

void test('provenance is carried across verbatim', () => {
  const entry = seedManifestFromLock(LOCK_FIXTURE, []).entries[
    'algorithmic-art'
  ]
  assert.ok(entry)
  assert.equal(entry.source, 'anthropics/skills')
  assert.equal(entry.upstreamHash, '4aef6bcad51d058ec32b1acb9da436851863e56e')
  assert.equal(entry.skillPath, 'skills/algorithmic-art/SKILL.md')
})

void test('our own bundles are seeded adopted, not parked', () => {
  const manifest = seedManifestFromLock({ core: { source: '' } }, ['core'])
  assert.equal(manifest.entries['core']?.state, 'adopted')
})

void test('a seeded manifest passes its own parser', async () => {
  const { parseCurationManifest } = await import('./parseCurationManifest')
  assert.ok(
    parseCurationManifest(seedManifestFromLock(LOCK_FIXTURE, ['core'])).ok,
  )
})

void test('the manifest is versioned', () => {
  assert.equal(seedManifestFromLock(LOCK_FIXTURE, []).version, 1)
})
