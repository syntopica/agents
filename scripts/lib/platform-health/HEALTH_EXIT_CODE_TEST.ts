import assert from 'node:assert/strict'
import test from 'node:test'
import { createPlatformHealth } from './fixtures/createPlatformHealth'
import { healthExitCode } from './healthExitCode'

void test('unavailable optional platforms do not fail the doctor', () => {
  assert.equal(
    healthExitCode(
      [createPlatformHealth('unavailable', 'not-applicable')],
      true,
    ),
    0,
  )
})

void test('an active failed capability fails the doctor', () => {
  assert.equal(
    healthExitCode([createPlatformHealth('active', 'failed')], true),
    1,
  )
})

void test('required authentication on an active capability fails the doctor', () => {
  assert.equal(
    healthExitCode([createPlatformHealth('active', 'auth-required')], true),
    1,
  )
})

void test('a malformed manifest uses the invocation error code', () => {
  assert.equal(healthExitCode([], false), 2)
})
