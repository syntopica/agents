import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import test from 'node:test'
import { createCodexStdioDoctorFixture } from './fixtures/createCodexStdioDoctorFixture'
import { inspectProfileConnectors } from './inspectProfileConnectors'
import { probeStdioMcp } from './probeStdioMcp'
import { runConnectorDoctor } from './runConnectorDoctor'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

void test('explicit Codex doctor probes an enabled required STDIO server with target overrides', async (t) => {
  const fixture = await createCodexStdioDoctorFixture()
  t.after(() => rm(fixture.directory, { recursive: true, force: true }))
  const result = await runConnectorDoctor({
    parsed: {
      ok: true,
      manifest: { version: 1, connectors: [fixture.definition] },
    },
    parsedMcp: { ok: true, manifest: fixture.manifest },
    requestedProfile: 'codex',
    home: '/test-home',
    env: {},
    inspect: (profile, definitions, home, targets) =>
      inspectProfileConnectors(
        profile,
        definitions,
        home,
        targets,
        () =>
          Promise.resolve(
            JSON.stringify([{ name: 'strict-mcp', enabled: true }]),
          ),
        (command, args, timeoutMs) => {
          assert.equal(timeoutMs, 1_000)
          return probeStdioMcp(command, args, timeoutMs)
        },
      ),
  })

  assert.equal(result.exitCode, 0, JSON.stringify(result.output))
  assert.deepEqual(result.output, {
    ok: true,
    connectors: [
      {
        id: 'strict-mcp',
        profile: 'codex',
        status: 'healthy',
        criticality: 'required',
        boundary: 'client',
        summary: 'server enabled; MCP initialize and tools/list succeeded',
      },
    ],
  })
})

void test('initialize and tools/list failures make the required Codex connector fail', async (t) => {
  for (const failure of ['initialize', 'tools-list'] as const) {
    const fixture = await createCodexStdioDoctorFixture(failure)
    t.after(() => rm(fixture.directory, { recursive: true, force: true }))
    const result = await runConnectorDoctor({
      parsed: {
        ok: true,
        manifest: { version: 1, connectors: [fixture.definition] },
      },
      parsedMcp: { ok: true, manifest: fixture.manifest },
      requestedProfile: 'codex',
      home: '/test-home',
      env: {},
      inspect: (profile, definitions, home, targets) =>
        inspectProfileConnectors(profile, definitions, home, targets, () =>
          Promise.resolve(
            JSON.stringify([{ name: 'strict-mcp', enabled: true }]),
          ),
        ),
    })

    assert.equal(result.exitCode, 1)
    assert.equal(result.output.ok, false)
    assert.match(
      JSON.stringify(result.output),
      /required MCP initialize and tools\/list probe failed/,
    )
  }
})

void test('missing, disabled, and unknown Codex registrations are never probed', async () => {
  const definition: ConnectorDefinition = {
    id: 'strict-mcp',
    match: 'strict-mcp',
    profiles: ['codex'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  }
  const targets = new Map([
    [
      definition.id,
      {
        command: 'secret-command',
        args: ['secret-argument'],
        timeoutMs: 1_000,
      },
    ],
  ])
  for (const listing of [
    [],
    [{ name: 'strict-mcp', enabled: false }],
    [{ name: 'strict-mcp', enabled: 'unknown' }],
  ]) {
    let probeCalls = 0
    const results = await inspectProfileConnectors(
      'codex',
      [definition],
      '/test-home',
      targets,
      () => Promise.resolve(JSON.stringify(listing)),
      () => {
        probeCalls += 1
        return Promise.resolve({
          status: 'healthy',
          boundary: 'client',
          durationMs: 1,
          summary: 'should not run',
        })
      },
    )
    assert.equal(probeCalls, 0)
    assert.notEqual(results[0]?.status, 'healthy')
  }
})

void test('probe failures use fixed output and unresolved MCP inputs exit as configuration errors', async () => {
  const definition: ConnectorDefinition = {
    id: 'strict-mcp',
    match: 'strict-mcp',
    profiles: ['codex'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  }
  const targets = new Map([
    [
      definition.id,
      {
        command: 'secret-command',
        args: ['secret-argument'],
        timeoutMs: 1_000,
      },
    ],
  ])
  const results = await inspectProfileConnectors(
    'codex',
    [definition],
    '/test-home',
    targets,
    () =>
      Promise.resolve(JSON.stringify([{ name: 'strict-mcp', enabled: true }])),
    () =>
      Promise.resolve({
        status: 'failed',
        boundary: 'client',
        durationMs: 1,
        summary:
          'stderr secret-command secret-argument PRIVATE_TOKEN=secret-value',
      }),
  )
  const serialized = JSON.stringify(results)
  assert.equal(results[0]?.status, 'failed')
  assert.equal(serialized.includes('secret-command'), false)
  assert.equal(serialized.includes('secret-argument'), false)
  assert.equal(serialized.includes('PRIVATE_TOKEN'), false)
  assert.equal(serialized.includes('secret-value'), false)

  let inspected = false
  const unresolved = await runConnectorDoctor({
    parsed: { ok: true, manifest: { version: 1, connectors: [definition] } },
    parsedMcp: { ok: true, manifest: { servers: {} } },
    requestedProfile: 'codex',
    home: '/test-home',
    env: { PRIVATE_TOKEN: 'secret-value' },
    inspect: () => {
      inspected = true
      return Promise.resolve([])
    },
  })
  assert.equal(inspected, false)
  assert.equal(unresolved.exitCode, 2)
  assert.equal(
    JSON.stringify(unresolved.output).includes('secret-value'),
    false,
  )

  const unresolvedEnvironment = await runConnectorDoctor({
    parsed: { ok: true, manifest: { version: 1, connectors: [definition] } },
    parsedMcp: {
      ok: true,
      manifest: {
        servers: {
          'strict-mcp': {
            targets: ['codex'],
            transport: 'stdio',
            command: 'secret-command',
            args: ['secret-argument'],
            env: { PRIVATE_TOKEN: { from_env: 'PRIVATE_TOKEN' } },
          },
        },
      },
    },
    requestedProfile: 'codex',
    home: '/test-home',
    env: {},
    inspect: () => Promise.resolve([]),
  })
  const unresolvedSerialized = JSON.stringify(unresolvedEnvironment.output)
  assert.equal(unresolvedEnvironment.exitCode, 2)
  assert.equal(unresolvedSerialized.includes('secret-command'), false)
  assert.equal(unresolvedSerialized.includes('secret-argument'), false)
  assert.equal(unresolvedSerialized.includes('PRIVATE_TOKEN'), false)

  const invalidManifest = await runConnectorDoctor({
    parsed: { ok: true, manifest: { version: 1, connectors: [definition] } },
    parsedMcp: {
      ok: false,
      errors: ['env.PRIVATE_TOKEN contains secret-value'],
    },
    requestedProfile: 'codex',
    home: '/test-home',
    env: {},
    inspect: () => Promise.resolve([]),
  })
  assert.deepEqual(invalidManifest, {
    exitCode: 2,
    output: { ok: false, errors: ['MCP manifest is missing or invalid'] },
  })
})
