import assert from 'node:assert/strict'
import test from 'node:test'
import { readProfileConnectorStatus } from './readProfileConnectorStatus'
import { runConnectorDoctor } from './runConnectorDoctor'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ConnectorProfile } from './types/ConnectorProfile'

void test('the explicit Codex doctor dispatches once and returns required failures in its JSON envelope', async () => {
  const definitions: ConnectorDefinition[] = [
    {
      id: 'memstore',
      match: 'memstore',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
  ]
  const cases = [
    {
      output: JSON.stringify([{ name: 'memstore' }]),
      status: 'failed',
      summary: 'connector enabled status is unrecognized',
    },
    {
      output: JSON.stringify([{ name: 'memstore', enabled: false }]),
      status: 'disabled',
      summary: 'connector disabled',
    },
    {
      output: JSON.stringify([]),
      status: 'failed',
      summary: 'connector is not listed',
    },
  ] as const

  for (const expected of cases) {
    const profiles: ConnectorProfile[] = []
    const result = await runConnectorDoctor({
      parsed: { ok: true, manifest: { version: 1, connectors: definitions } },
      parsedMcp: {
        ok: true,
        manifest: {
          servers: {
            memstore: {
              targets: ['codex'],
              transport: 'stdio',
              command: 'memstore-mcp',
              args: ['--read-only'],
            },
          },
        },
      },
      requestedProfile: 'codex',
      home: '/test-home',
      env: {},
      inspect: (profile, inspectedDefinitions) => {
        profiles.push(profile)
        return Promise.resolve(
          readProfileConnectorStatus(
            expected.output,
            profile,
            inspectedDefinitions,
          ),
        )
      },
    })

    assert.deepEqual(profiles, ['codex'])
    assert.equal(result.exitCode, 1)
    assert.equal(result.output.ok, false)
    assert.deepEqual(result.output, {
      ok: false,
      connectors: [
        {
          id: 'memstore',
          profile: 'codex',
          status: expected.status,
          criticality: 'required',
          boundary: 'client',
          summary: expected.summary,
        },
      ],
    })
  }
})
