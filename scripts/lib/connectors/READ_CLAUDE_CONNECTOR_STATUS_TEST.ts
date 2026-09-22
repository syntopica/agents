import assert from 'node:assert/strict'
import test from 'node:test'
import { readClaudeConnectorStatus } from './readClaudeConnectorStatus'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

export const definitions: ConnectorDefinition[] = [
  {
    id: 'healthy',
    match: 'healthy',
    profiles: ['claude-personal'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  },
  {
    id: 'oauth',
    match: 'oauth',
    profiles: ['claude-personal'],
    ownership: 'account',
    probe: 'native-cli',
    criticality: 'required',
  },
  {
    id: 'hosted-example',
    match: 'claude.ai Example',
    profiles: ['claude-personal'],
    ownership: 'account',
    probe: 'native-cli',
    criticality: 'optional',
  },
  {
    id: 'gateway-example',
    match: 'gateway-example',
    boundary: 'access-gateway',
    profiles: ['claude-personal'],
    ownership: 'account',
    probe: 'native-cli',
    criticality: 'required',
  },
  {
    id: 'disabled',
    match: 'disabled',
    profiles: ['claude-personal'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  },
  {
    id: 'duplicate',
    match: 'plugin:duplicate:',
    profiles: ['claude-personal'],
    ownership: 'account',
    probe: 'claude-cli-prefix',
    criticality: 'required',
  },
]

void test('Claude connector output is reduced to safe status categories', () => {
  const results = readClaudeConnectorStatus(
    [
      'healthy: command - ✔ Connected',
      'oauth: https://example.test - ! Needs authentication',
      'claude.ai Example: https://example.test - ✘ Failed to connect — HTTP 503: private body',
      'gateway-example: https://example.test - ✘ Failed to connect — CLIENT_HTTP_UNEXPECTED_CONTENT: Unexpected content type: text/html',
      'disabled: command - disabled',
      'plugin:duplicate:one: https://example.test - ✔ Connected',
      'plugin:duplicate:two: https://example.test - ✔ Connected',
    ].join('\n'),
    'claude-personal',
    definitions,
  )
  assert.deepEqual(
    results.map(({ id, status }) => [id, status]),
    [
      ['healthy', 'healthy'],
      ['oauth', 'auth-required'],
      ['hosted-example', 'failed'],
      ['gateway-example', 'failed'],
      ['disabled', 'disabled'],
      ['duplicate', 'healthy'],
    ],
  )
  assert.equal(JSON.stringify(results).includes('private body'), false)
  assert.equal(
    results.find(({ id }) => id === 'gateway-example')?.boundary,
    'access-gateway',
  )
})

void test('missing expected connectors are failed', () => {
  const results = readClaudeConnectorStatus('', 'claude-personal', definitions)
  assert.ok(results.every(({ status }) => status === 'failed'))
})
