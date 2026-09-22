import assert from 'node:assert/strict'
import test from 'node:test'
import { connectorExitCode } from './connectorExitCode'

void test('a degraded required connector fails the doctor while an optional one does not', () => {
  assert.equal(
    connectorExitCode([
      {
        id: 'memstore',
        profile: 'codex',
        status: 'degraded',
        criticality: 'required',
        boundary: 'client',
        summary: 'connector enabled status is unrecognized',
      },
    ]),
    1,
  )
  assert.equal(
    connectorExitCode([
      {
        id: 'hosted-example',
        profile: 'claude-personal',
        status: 'degraded',
        criticality: 'optional',
        boundary: 'hosted-connector',
        summary: 'connector status is unrecognized',
      },
    ]),
    0,
  )
})
