import assert from 'node:assert/strict'
import test from 'node:test'
import { createPluginsManifest } from './fixtures/createPluginsManifest'
import { createPluginsState } from './fixtures/createPluginsState'
import { toPluginsDomainResult } from './toPluginsDomainResult'

void test('an absent manifest skips the domain instead of failing the run', () => {
  const result = toPluginsDomainResult({
    parsed: undefined,
    state: createPluginsState(),
  })

  assert.equal(result.status, 'skipped')
  assert.equal(result.changes, 0)
})

void test('an invalid manifest fails the domain and carries its errors', () => {
  const result = toPluginsDomainResult({
    parsed: { ok: false, errors: ['manifest.version must be 1'] },
    state: createPluginsState(),
  })

  assert.equal(result.status, 'failed')
  assert.deepEqual(result.messages, ['manifest.version must be 1'])
})

void test('a converged machine reports converged', () => {
  const result = toPluginsDomainResult({
    parsed: { ok: true, manifest: createPluginsManifest() },
    state: createPluginsState({
      enabledByProfile: {
        'claude-personal': { 'alpha@official': false },
        'claude-secondary': { 'alpha@official': false },
      },
    }),
  })

  assert.equal(result.status, 'converged')
})

void test('drift is reported as changed with one message per change', () => {
  const result = toPluginsDomainResult({
    parsed: { ok: true, manifest: createPluginsManifest() },
    state: createPluginsState(),
  })

  assert.equal(result.status, 'changed')
  assert.deepEqual(result.messages, [
    'disable alpha@official (claude-personal is undeclared)',
    'disable alpha@official (claude-secondary is undeclared)',
  ])
})
