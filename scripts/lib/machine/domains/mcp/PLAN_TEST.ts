import assert from 'node:assert/strict'
import test from 'node:test'
import { createClaudeState } from './fixtures/createClaudeState'
import { EMPTY_OWNED } from './fixtures/EMPTY_OWNED'
import { EMPTY_STATE } from './fixtures/EMPTY_STATE'
import { SINGLE_SERVER_MANIFEST } from './fixtures/SINGLE_SERVER_MANIFEST'
import { plan } from './plan'
import type { McpManifest } from './types/McpManifest'

void test('a server missing from the machine is added', () => {
  const changes = plan({
    manifest: SINGLE_SERVER_MANIFEST,
    state: EMPTY_STATE,
    owned: EMPTY_OWNED,
    env: {},
  })
  assert.deepEqual(changes, [
    { target: 'claude-personal', name: 'serena', operation: 'add' },
  ])
})

void test('an identical server produces no change', () => {
  const state = createClaudeState({ serena: { type: 'stdio', command: 'uvx' } })
  const owned = { ...EMPTY_OWNED, 'claude-personal': ['serena'] }

  assert.deepEqual(
    plan({ manifest: SINGLE_SERVER_MANIFEST, state, owned, env: {} }),
    [],
  )
})

void test('object key order does not create a false update', () => {
  const state = createClaudeState({ serena: { command: 'uvx', type: 'stdio' } })
  const owned = { ...EMPTY_OWNED, 'claude-personal': ['serena'] }

  assert.deepEqual(
    plan({ manifest: SINGLE_SERVER_MANIFEST, state, owned, env: {} }),
    [],
  )
})

void test('a differing server is updated', () => {
  const state = createClaudeState({
    serena: { type: 'stdio', command: 'old-command' },
  })
  const owned = { ...EMPTY_OWNED, 'claude-personal': ['serena'] }

  assert.deepEqual(
    plan({ manifest: SINGLE_SERVER_MANIFEST, state, owned, env: {} }),
    [{ target: 'claude-personal', name: 'serena', operation: 'update' }],
  )
})

void test('an owned server dropped from the manifest is removed', () => {
  const state = createClaudeState({
    serena: { type: 'stdio', command: 'uvx' },
    stale: { type: 'stdio' },
  })
  const owned = { ...EMPTY_OWNED, 'claude-personal': ['serena', 'stale'] }

  assert.deepEqual(
    plan({ manifest: SINGLE_SERVER_MANIFEST, state, owned, env: {} }),
    [{ target: 'claude-personal', name: 'stale', operation: 'remove' }],
  )
})

void test('a foreign server is never removed', () => {
  const state = createClaudeState({
    serena: { type: 'stdio', command: 'uvx' },
    someoneElse: { type: 'stdio' },
  })
  const owned = { ...EMPTY_OWNED, 'claude-personal': ['serena'] }

  assert.deepEqual(
    plan({ manifest: SINGLE_SERVER_MANIFEST, state, owned, env: {} }),
    [],
  )
})

void test('a server needing a missing secret is not planned as an add', () => {
  const secretManifest: McpManifest = {
    servers: {
      context7: {
        targets: ['claude-personal'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'ABSENT' } },
      },
    },
  }

  assert.deepEqual(
    plan({
      manifest: secretManifest,
      state: EMPTY_STATE,
      owned: EMPTY_OWNED,
      env: {},
    }),
    [],
  )
})
