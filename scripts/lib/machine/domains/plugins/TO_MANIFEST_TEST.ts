import assert from 'node:assert/strict'
import test from 'node:test'
import { createPluginsState as state } from './fixtures/createPluginsState'
import { toManifest } from './toManifest'

void test('an installed plugin absent from settings is reported undeclared, not disabled', () => {
  const manifest = toManifest(state())

  assert.deepEqual(manifest.plugins[0]?.enablement, {
    'claude-personal': 'undeclared',
    'claude-secondary': 'undeclared',
  })
})

void test('enablement is recorded per profile', () => {
  const manifest = toManifest(
    state({
      enabledByProfile: {
        'claude-personal': { 'alpha@official': true },
        'claude-secondary': { 'alpha@official': false },
      },
    }),
  )

  assert.deepEqual(manifest.plugins[0]?.enablement, {
    'claude-personal': 'enabled',
    'claude-secondary': 'disabled',
  })
})

void test('the marketplace is derived from the plugin id', () => {
  const manifest = toManifest(state())

  assert.equal(manifest.plugins[0]?.marketplace, 'official')
})

void test('plugins are ordered by id so the manifest is stable across captures', () => {
  const manifest = toManifest(
    state({
      installed: [
        {
          id: 'zeta@official',
          scope: 'user',
          version: '2.0.0',
          installPath: '/cache/z',
        },
        {
          id: 'alpha@official',
          scope: 'user',
          version: '1.0.0',
          installPath: '/cache/a',
        },
      ],
    }),
  )

  assert.deepEqual(
    manifest.plugins.map((plugin) => plugin.id),
    ['alpha@official', 'zeta@official'],
  )
})

void test('a plugin without a commit sha omits the key instead of emitting undefined', () => {
  const manifest = toManifest(
    state({
      installed: [
        {
          id: 'alpha@official',
          scope: 'user',
          version: '1.0.0',
          installPath: '/cache/a',
        },
      ],
    }),
  )

  assert.equal('gitCommitSha' in (manifest.plugins[0] ?? {}), false)
})
