import assert from 'node:assert/strict'
import test from 'node:test'
import { MACHINE_STATUS } from './MACHINE_STATUS'

void test('the status enum is closed and ordered from best to worst', () => {
  assert.deepEqual(MACHINE_STATUS, [
    'converged',
    'changed',
    'skipped',
    'needs-secret',
    'failed',
  ])
})

void test('every status is unique', () => {
  assert.equal(new Set(MACHINE_STATUS).size, MACHINE_STATUS.length)
})
