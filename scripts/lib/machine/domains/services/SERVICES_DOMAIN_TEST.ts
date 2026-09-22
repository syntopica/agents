import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resolveServicesPaths } from '../../cli/resolveServicesPaths'
import { createServiceDefinition } from './fixtures/createServiceDefinition'
import { createServicesManifest } from './fixtures/createServicesManifest'
import { plan } from './plan'
import { read } from './read'
import { renderServiceUnits } from './renderServiceUnits'
import { toServicesDomainResult } from './toServicesDomainResult'

void test('a service with no unit on disk is planned as a creation', () => {
  const manifest = createServicesManifest()
  const changes = plan({ manifest, platform: 'launchd', state: {} })

  assert.deepEqual(changes, [
    {
      operation: 'create',
      name: 'com.cristian.library-loop',
      file: 'com.cristian.library-loop.plist',
    },
  ])
})

void test('a unit whose contents already match the description is converged', () => {
  const manifest = createServicesManifest()
  const [unit] = renderServiceUnits({
    service: createServiceDefinition(),
    platform: 'launchd',
  })
  const state = unit === undefined ? {} : { [unit.file]: unit.contents }

  assert.deepEqual(plan({ manifest, platform: 'launchd', state }), [])
})

void test('a unit that drifted from the description is planned as an update', () => {
  const manifest = createServicesManifest()
  const state = { 'com.cristian.library-loop.plist': '<plist>stale</plist>' }

  assert.equal(
    plan({ manifest, platform: 'launchd', state })[0]?.operation,
    'update',
  )
})

void test('a scheduled service renders both a systemd unit and its timer', () => {
  const manifest = createServicesManifest()
  const changes = plan({ manifest, platform: 'systemd', state: {} })

  assert.deepEqual(
    changes.map((change) => change.file),
    ['com.cristian.library-loop.service', 'com.cristian.library-loop.timer'],
  )
})

void test('reading a directory that does not exist reports no units rather than throwing', async () => {
  const state = await read({
    platform: 'launchd',
    directory: join(tmpdir(), 'machine-services-absent'),
  })

  assert.deepEqual(state, {})
})

void test('reading a directory returns the unit contents keyed by file name', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machine-services-'))
  await writeFile(
    join(directory, 'com.cristian.library-loop.plist'),
    '<plist>on disk</plist>',
  )

  const state = await read({ platform: 'launchd', directory })

  assert.equal(
    state['com.cristian.library-loop.plist'],
    '<plist>on disk</plist>',
  )
})

void test('the domain result reports a missing manifest as skipped, not as a failure', () => {
  const result = toServicesDomainResult({
    parsed: undefined,
    platform: 'launchd',
    state: {},
  })

  assert.equal(result.status, 'skipped')
  assert.equal(result.changes, 0)
})

void test('the domain result surfaces manifest errors as a failure', () => {
  const result = toServicesDomainResult({
    parsed: { ok: false, errors: ['manifest.version must be 1'] },
    platform: 'launchd',
    state: {},
  })

  assert.equal(result.status, 'failed')
  assert.deepEqual(result.messages, ['manifest.version must be 1'])
})

void test('the domain result names the file and the service for each change', () => {
  const manifest = createServicesManifest()
  const result = toServicesDomainResult({
    parsed: { ok: true, manifest },
    platform: 'launchd',
    state: {},
  })

  assert.equal(result.status, 'changed')
  assert.deepEqual(result.messages, [
    'create com.cristian.library-loop.plist for com.cristian.library-loop',
  ])
})

void test('each platform resolves the directory its init system actually reads', () => {
  assert.deepEqual(
    resolveServicesPaths({ home: '/home/user', platform: 'darwin' }),
    {
      platform: 'launchd',
      directory: '/home/user/Library/LaunchAgents',
    },
  )
  assert.deepEqual(
    resolveServicesPaths({ home: '/home/user', platform: 'linux' }),
    {
      platform: 'systemd',
      directory: '/home/user/.config/systemd/user',
    },
  )
})
