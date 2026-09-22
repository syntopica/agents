import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCurationManifest } from './parseCurationManifest'

void test('a minimal adopted entry parses', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { 'frontend-design': { state: 'adopted' } },
  })
  assert.ok(result.ok)
})

void test('an unknown state is rejected and named', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'maybe' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('maybe')))
})

void test('a forked entry without a patch is rejected', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'forked', upstreamHash: 'abc' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('patch')))
})

void test('a forked entry without an upstream hash is rejected', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'forked', patch: 'patches/x.patch' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('upstreamHash')))
})

void test('an extracted entry must name what absorbed it', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'extracted' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('extractedInto')))
})

void test('a parked entry must carry a reason', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'parked' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('reason')))
})

void test('a manifest without a version is rejected', () => {
  assert.ok(!parseCurationManifest({ entries: {} }).ok)
})

void test('a manifest that is not an object is rejected', () => {
  assert.ok(!parseCurationManifest('nope').ok)
  assert.ok(!parseCurationManifest(null).ok)
})

void test('every offending entry is reported, not just the first', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { a: { state: 'parked' }, b: { state: 'extracted' } },
  })
  assert.ok(!result.ok)
  assert.equal(result.errors.length, 2)
})
