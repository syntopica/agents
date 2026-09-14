import assert from 'node:assert/strict'
import test from 'node:test'
import { createServiceDefinition } from './fixtures/createServiceDefinition'
import { parseServicesManifest } from './parseServicesManifest'

void test('a well formed manifest parses', () => {
  const result = parseServicesManifest({
    version: 1,
    services: [createServiceDefinition()],
  })

  assert.equal(result.ok, true)
})

void test('an absolute home path is rejected, which is the portability defect this schema exists for', () => {
  const result = parseServicesManifest({
    version: 1,
    services: [
      createServiceDefinition({
        workingDirectory: '/Users/cristiandeluxe/p/agents',
      }),
    ],
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.services[0].workingDirectory must be a path relative to the home directory',
  ])
})

void test('a shell home token is rejected too, so one description renders on both platforms', () => {
  const result = parseServicesManifest({
    version: 1,
    services: [createServiceDefinition({ workingDirectory: '$HOME/p/agents' })],
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.services[0].workingDirectory must be a path relative to the home directory',
  ])
})

void test('an out of range schedule is rejected', () => {
  const result = parseServicesManifest({
    version: 1,
    services: [
      createServiceDefinition({
        schedule: { weekday: 7, hour: 24, minute: 30 },
      }),
    ],
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.services[0].schedule.hour must be an integer between 0 and 23',
    'manifest.services[0].schedule.weekday must be an integer between 0 and 6',
  ])
})

void test('an unknown top-level key is rejected rather than ignored', () => {
  const result = parseServicesManifest({
    version: 1,
    services: [],
    reload: true,
  })

  assert.deepEqual(!result.ok && result.errors, [
    'manifest.reload is not supported',
  ])
})

void test('a non-object manifest is rejected', () => {
  assert.deepEqual(parseServicesManifest([]), {
    ok: false,
    errors: ['manifest must be an object'],
  })
})

void test('an interval schedule is accepted', () => {
  const parsed = parseServicesManifest({
    version: 1,
    services: [
      {
        name: 'com.example.poller',
        workingDirectory: 'p/agents',
        command: 'npx tsx scripts/bin/run-library-loop.ts --if-due 7',
        schedule: { intervalSeconds: 21_600 },
      },
    ],
  })

  assert.equal(parsed.ok, true)
})

void test('a schedule that is both an interval and a calendar slot is rejected', () => {
  const parsed = parseServicesManifest({
    version: 1,
    services: [
      {
        name: 'com.example.confused',
        workingDirectory: 'p/agents',
        command: 'true',
        schedule: { intervalSeconds: 60, hour: 6, minute: 30 },
      },
    ],
  })

  assert.equal(parsed.ok, false)
})

void test('a zero or negative interval is rejected', () => {
  const parsed = parseServicesManifest({
    version: 1,
    services: [
      {
        name: 'com.example.zero',
        workingDirectory: 'p/agents',
        command: 'true',
        schedule: { intervalSeconds: 0 },
      },
    ],
  })

  assert.equal(parsed.ok, false)
})
