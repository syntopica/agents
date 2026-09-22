import assert from 'node:assert/strict'
import test from 'node:test'
import { readCodexConnectorStatus } from './readCodexConnectorStatus'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

void test('Codex list output distinguishes enabled, disabled, and missing servers without details', () => {
  const definitions: ConnectorDefinition[] = [
    {
      id: 'codegraph',
      match: 'codegraph',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
    {
      id: 'context7',
      match: 'context7',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
    {
      id: 'memstore',
      match: 'memstore',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
  ]
  const results = readCodexConnectorStatus(
    JSON.stringify([
      {
        name: 'codegraph',
        enabled: true,
        transport: {
          type: 'stdio',
          command: 'codegraph',
          args: ['serve', '--mcp'],
        },
      },
      {
        name: 'context7',
        enabled: false,
        transport: {
          type: 'stdio',
          command: 'secret-command',
          env: { TOKEN: 'secret-value' },
        },
      },
    ]),
    definitions,
  )

  assert.deepEqual(
    results.map(({ id, status }) => [id, status]),
    [
      ['codegraph', 'healthy'],
      ['context7', 'disabled'],
      ['memstore', 'failed'],
    ],
  )
  assert.equal(JSON.stringify(results).includes('secret-command'), false)
  assert.equal(JSON.stringify(results).includes('secret-value'), false)
})

void test('an invalid Codex list marks every expected connector as failed without echoing output', () => {
  const results = readCodexConnectorStatus('not json: secret-value', [
    {
      id: 'memstore',
      match: 'memstore',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
  ])
  assert.ok(results.every(({ status }) => status === 'failed'))
  assert.equal(JSON.stringify(results).includes('secret-value'), false)
})

void test('an unrecognized required enabled state fails without echoing details', () => {
  const results = readCodexConnectorStatus(
    JSON.stringify([
      {
        name: 'memstore',
        enabled: 'unknown',
        transport: {
          command: 'secret-command',
          env: { TOKEN: 'secret-value' },
        },
      },
    ]),
    [
      {
        id: 'memstore',
        match: 'memstore',
        profiles: ['codex'],
        ownership: 'machine',
        probe: 'native-cli',
        criticality: 'required',
      },
    ],
  )
  assert.equal(results[0]?.status, 'failed')
  assert.equal(JSON.stringify(results).includes('secret-command'), false)
  assert.equal(JSON.stringify(results).includes('secret-value'), false)
})
