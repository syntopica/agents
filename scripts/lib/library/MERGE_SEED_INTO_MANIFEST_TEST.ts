import assert from 'node:assert/strict'
import test from 'node:test'
import { EXISTING_MANIFEST } from './fixtures/EXISTING_MANIFEST'
import { SEEDED_MANIFEST } from './fixtures/SEEDED_MANIFEST'
import { mergeSeedIntoManifest } from './mergeSeedIntoManifest'

void test('a decision already made is never overwritten by a reseed', () => {
  const { manifest } = mergeSeedIntoManifest(EXISTING_MANIFEST, SEEDED_MANIFEST)
  assert.ok(manifest.entries['promoted'])
  assert.equal(manifest.entries['promoted'].state, 'adopted')
  assert.equal(manifest.entries['promoted'].reason, 'measured demand')
})

void test('an entry the manifest did not know about is added', () => {
  const { manifest, added } = mergeSeedIntoManifest(
    EXISTING_MANIFEST,
    SEEDED_MANIFEST,
  )
  assert.equal(manifest.entries['fresh']?.state, 'parked')
  assert.deepEqual(added, ['fresh'])
})

void test('nothing new means nothing added', () => {
  const { added } = mergeSeedIntoManifest(EXISTING_MANIFEST, {
    version: 1,
    entries: {},
  })
  assert.deepEqual(added, [])
})
