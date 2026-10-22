import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { finalizeReconciliationProcess } from './finalizeReconciliationProcess'

void test('failed group termination closes every owned pipe and hides native details', async () => {
  const stdin = new PassThrough()
  const stdout = new PassThrough()
  const stderr = new PassThrough()
  const child = { stdin, stdout, stderr }
  const nativeFailure = Object.assign(new Error('private fixture path'), {
    code: 'EPERM',
  })
  await assert.rejects(
    finalizeReconciliationProcess(child, Promise.reject(nativeFailure)),
    { message: 'agent process group cleanup could not be confirmed' },
  )
  assert.equal(stdin.destroyed, true)
  assert.equal(stdout.destroyed, true)
  assert.equal(stderr.destroyed, true)
})
