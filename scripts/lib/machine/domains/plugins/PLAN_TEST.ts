import assert from 'node:assert/strict'
import test from 'node:test'
import { createPluginsManifest } from './fixtures/createPluginsManifest'
import { createPluginsState } from './fixtures/createPluginsState'
import { plan } from './plan'

void test('a converged machine plans no change', () => {
  const changes = plan({
    manifest: createPluginsManifest(),
    state: createPluginsState({
      enabledByProfile: {
        'claude-personal': { 'alpha@official': false },
        'claude-secondary': { 'alpha@official': false },
      },
    }),
  })

  assert.deepEqual(changes, [])
})

void test('an undeclared installed plugin is planned for removal', () => {
  const changes = plan({
    manifest: createPluginsManifest({ plugins: [] }),
    state: createPluginsState(),
  })

  assert.deepEqual(changes, [
    { operation: 'remove', id: 'alpha@official', detail: '1.0.0' },
  ])
})

void test('a declared plugin that is not installed is planned for install', () => {
  const changes = plan({
    manifest: createPluginsManifest(),
    state: createPluginsState({ installed: [] }),
  })

  assert.deepEqual(changes, [
    { operation: 'install', id: 'alpha@official', detail: '1.0.0' },
  ])
})

void test('a version drift is planned as a pin with both versions named', () => {
  const changes = plan({
    manifest: createPluginsManifest({
      plugins: [
        {
          id: 'alpha@official',
          version: '2.0.0',
          enabled: { 'claude-personal': false, 'claude-secondary': false },
        },
      ],
    }),
    state: createPluginsState({
      enabledByProfile: {
        'claude-personal': { 'alpha@official': false },
        'claude-secondary': { 'alpha@official': false },
      },
    }),
  })

  assert.deepEqual(changes, [
    { operation: 'pin', id: 'alpha@official', detail: '1.0.0 -> 2.0.0' },
  ])
})

void test('an undeclared enablement is planned per profile and names the current state', () => {
  const changes = plan({
    manifest: createPluginsManifest(),
    state: createPluginsState(),
  })

  assert.deepEqual(changes, [
    {
      operation: 'disable',
      id: 'alpha@official',
      detail: 'claude-personal is undeclared',
      profile: 'claude-personal',
    },
    {
      operation: 'disable',
      id: 'alpha@official',
      detail: 'claude-secondary is undeclared',
      profile: 'claude-secondary',
    },
  ])
})
