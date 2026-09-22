import assert from 'node:assert/strict'
import test from 'node:test'
import { readProfileConnectorStatus } from './readProfileConnectorStatus'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

void test('profile inspection dispatches Codex doctor output to the Codex parser', () => {
  const definitions: ConnectorDefinition[] = [
    {
      id: 'memstore',
      match: 'memstore',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
    {
      id: 'claude-only',
      match: 'claude-only',
      profiles: ['claude-personal'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
  ]

  assert.deepEqual(
    readProfileConnectorStatus(
      JSON.stringify([{ name: 'memstore', enabled: true }]),
      'codex',
      definitions,
    ),
    [
      {
        id: 'memstore',
        profile: 'codex',
        status: 'healthy',
        criticality: 'required',
        boundary: 'client',
        summary: 'server enabled',
      },
    ],
  )
})
