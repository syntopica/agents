import assert from 'node:assert/strict'
import test from 'node:test'
import { createValidPlatformManifest } from './fixtures/createValidPlatformManifest'
import { parsePlatformManifest } from './parsePlatformManifest'

void test('a manifest covering every registered platform parses', () => {
  assert.equal(parsePlatformManifest(createValidPlatformManifest()).ok, true)
})

void test('an unknown registry id is rejected', () => {
  const manifest = createValidPlatformManifest()
  const platform = manifest.platforms[0]
  assert.ok(platform)
  manifest.platforms[0] = { ...platform, registryId: 'unknown-agent' }
  const result = parsePlatformManifest(manifest)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /unknown-agent/)
})

void test('a duplicate registry id is rejected', () => {
  const manifest = createValidPlatformManifest()
  const platform = manifest.platforms[0]
  assert.ok(platform)
  manifest.platforms.push(structuredClone(platform))
  const result = parsePlatformManifest(manifest)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /duplicate/)
})

void test('an empty probe is rejected', () => {
  const manifest = createValidPlatformManifest()
  const platform = manifest.platforms[0]
  assert.ok(platform)
  manifest.platforms[0] = { ...platform, probe: { configPaths: [] } }
  const result = parsePlatformManifest(manifest)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /probe/)
})

void test('an unknown capability is rejected', () => {
  const manifest = createValidPlatformManifest()
  const platform = manifest.platforms[0]
  assert.ok(platform)
  manifest.platforms[0] = { ...platform, capabilities: ['telepathy'] }
  const result = parsePlatformManifest(manifest)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /telepathy/)
})

void test('a missing registered platform is rejected', () => {
  const manifest = createValidPlatformManifest()
  const missing = manifest.platforms.pop()
  const result = parsePlatformManifest(manifest)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), new RegExp(missing?.registryId ?? ''))
})
