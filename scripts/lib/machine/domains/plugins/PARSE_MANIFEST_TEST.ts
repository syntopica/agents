import assert from 'node:assert/strict'
import test from 'node:test'
import { createPluginsManifest } from './fixtures/createPluginsManifest'
import { parsePluginsManifest } from './parsePluginsManifest'

void test('a well formed manifest parses', () => {
  const result = parsePluginsManifest(createPluginsManifest())

  assert.equal(result.ok, true)
})

void test('an unknown top-level key is rejected rather than ignored', () => {
  const result = parsePluginsManifest({
    ...createPluginsManifest(),
    prune: true,
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.prune is not supported',
  ])
})

void test('the manifest version is pinned', () => {
  const result = parsePluginsManifest({
    ...createPluginsManifest(),
    version: 2,
  })

  assert.deepEqual(!result.ok && result.errors, ['manifest.version must be 1'])
})

void test('a plugin id without a marketplace is rejected', () => {
  const result = parsePluginsManifest(
    createPluginsManifest({
      plugins: [
        {
          id: 'alpha',
          version: '1.0.0',
          enabled: { 'claude-personal': true, 'claude-secondary': true },
        },
      ],
    }),
  )

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.plugins[0].id must be a name@marketplace string',
  ])
})

void test('a missing profile in enabled is an error, so state is never implied', () => {
  const result = parsePluginsManifest(
    createPluginsManifest({
      plugins: [
        {
          id: 'alpha@official',
          version: '1.0.0',
          enabled: { 'claude-personal': true } as never,
        },
      ],
    }),
  )

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.plugins[0].enabled.claude-secondary must be a boolean',
  ])
})

void test('errors are reported together and sorted, not one at a time', () => {
  const result = parsePluginsManifest({
    version: 1,
    marketplaces: {},
    plugins: {},
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.marketplaces must be an array',
    'manifest.plugins must be an array',
  ])
})

void test('a non-object manifest is rejected', () => {
  assert.deepEqual(parsePluginsManifest([]), {
    ok: false,
    errors: ['manifest must be an object'],
  })
})
