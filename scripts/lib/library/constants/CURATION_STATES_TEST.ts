import assert from 'node:assert/strict'
import test from 'node:test'
import { CURATION_STATES } from './CURATION_STATES'

void test('the four states are closed and ordered from most to least engaged', () => {
  assert.deepEqual(CURATION_STATES, [
    'adopted',
    'forked',
    'extracted',
    'parked',
  ])
})

void test('only adopted and forked are fanned out', () => {
  const fannedOut = CURATION_STATES.filter(
    (state) => state === 'adopted' || state === 'forked',
  )
  assert.deepEqual(fannedOut, ['adopted', 'forked'])
})
