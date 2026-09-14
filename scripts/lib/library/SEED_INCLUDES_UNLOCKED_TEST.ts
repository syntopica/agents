import assert from 'node:assert/strict'
import test from 'node:test'
import { LOCK_FIXTURE } from './fixtures/LOCK_FIXTURE'
import { seedManifestFromLock } from './seedManifestFromLock'

void test('a bundle on disk but absent from the lock is still described', () => {
  const manifest = seedManifestFromLock(LOCK_FIXTURE, [], ['ckm-ui-styling'])
  const entry = manifest.entries['ckm-ui-styling']
  assert.ok(entry)
  assert.equal(entry.state, 'parked')
  assert.match(entry.reason ?? '', /no recorded provenance/i)
})

void test('an authored bundle absent from the lock is adopted, not parked', () => {
  const manifest = seedManifestFromLock(LOCK_FIXTURE, ['core'], ['core'])
  assert.equal(manifest.entries['core']?.state, 'adopted')
})

void test('a bundle present in both the lock and on disk keeps its provenance', () => {
  const manifest = seedManifestFromLock(LOCK_FIXTURE, [], ['algorithmic-art'])
  assert.equal(manifest.entries['algorithmic-art']?.source, 'anthropics/skills')
})

void test('the seeded manifest still parses', async () => {
  const { parseCurationManifest } = await import('./parseCurationManifest')
  assert.ok(
    parseCurationManifest(
      seedManifestFromLock(LOCK_FIXTURE, ['core'], ['core', 'x']),
    ).ok,
  )
})
