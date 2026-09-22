import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createRecordingRunner } from '../../exec/fixtures/createRecordingRunner'
import { apply } from './apply'
import { createServiceDefinition } from './fixtures/createServiceDefinition'
import { createServicesManifest } from './fixtures/createServicesManifest'
import { read } from './read'
import { renderServiceUnits } from './renderServiceUnits'

void test('launchd apply writes the plist and bootstraps it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { calls, run } = createRecordingRunner()

  const result = await apply({
    manifest: createServicesManifest(),
    paths: { platform: 'launchd', directory },
    state: {},
    uid: 501,
    run,
  })

  assert.deepEqual(result.written, ['com.cristian.library-loop.plist'])
  assert.deepEqual(result.reloaded, ['com.cristian.library-loop.plist'])
  assert.deepEqual(result.failed, [])

  const plistPath = join(directory, 'com.cristian.library-loop.plist')
  const [unit] = renderServiceUnits({
    service: createServiceDefinition(),
    platform: 'launchd',
  })
  assert.equal(await readFile(plistPath, 'utf8'), unit?.contents)

  assert.deepEqual(
    calls.map(({ argv }) => argv),
    [
      ['launchctl', 'bootout', 'gui/501', plistPath],
      ['launchctl', 'bootstrap', 'gui/501', plistPath],
    ],
  )
})

void test('a converged unit triggers no write and no reload', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { calls, run } = createRecordingRunner()
  const [unit] = renderServiceUnits({
    service: createServiceDefinition(),
    platform: 'launchd',
  })

  const result = await apply({
    manifest: createServicesManifest(),
    paths: { platform: 'launchd', directory },
    state: unit === undefined ? {} : { [unit.file]: unit.contents },
    uid: 501,
    run,
  })

  assert.deepEqual(result.written, [])
  assert.deepEqual(calls, [])
  assert.deepEqual(await readdir(directory), [])
})

void test('a tolerated bootout failure still bootstraps and reports success', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { calls, run } = createRecordingRunner(['bootout'])

  const result = await apply({
    manifest: createServicesManifest(),
    paths: { platform: 'launchd', directory },
    state: {},
    uid: 501,
    run,
  })

  assert.deepEqual(result.failed, [])
  assert.deepEqual(result.reloaded, ['com.cristian.library-loop.plist'])
  assert.equal(calls.length, 2)
})

void test('a failed bootstrap is reported and the unit is not counted as reloaded', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { run } = createRecordingRunner(['bootstrap'])

  const result = await apply({
    manifest: createServicesManifest(),
    paths: { platform: 'launchd', directory },
    state: {},
    uid: 501,
    run,
  })

  assert.deepEqual(result.written, ['com.cristian.library-loop.plist'])
  assert.deepEqual(result.reloaded, [])
  assert.equal(result.failed.length, 1)
})

void test('systemd apply reloads the daemon once and enables the timer, not the service', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { calls, run } = createRecordingRunner()

  const result = await apply({
    manifest: createServicesManifest(),
    paths: { platform: 'systemd', directory },
    state: {},
    uid: 1000,
    run,
  })

  assert.deepEqual(result.written, [
    'com.cristian.library-loop.service',
    'com.cristian.library-loop.timer',
  ])
  assert.deepEqual(
    calls.map(({ argv }) => argv),
    [
      ['systemctl', '--user', 'daemon-reload'],
      [
        'systemctl',
        '--user',
        'enable',
        '--now',
        'com.cristian.library-loop.timer',
      ],
    ],
  )
})

void test('the written state round-trips through read', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'services-apply-'))
  const { run } = createRecordingRunner()
  const paths = { platform: 'launchd' as const, directory }

  await apply({
    manifest: createServicesManifest(),
    paths,
    state: {},
    uid: 501,
    run,
  })

  const again = await apply({
    manifest: createServicesManifest(),
    paths,
    state: await read(paths),
    uid: 501,
    run,
  })

  assert.deepEqual(again.written, [])
})
